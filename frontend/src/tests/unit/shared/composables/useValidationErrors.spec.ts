import type {AxiosResponseError, HttpService, ResponseErrorMiddlewareFunc} from '@script-development/fs-http';
import type {AxiosError} from 'axios';
import type {Mock} from 'vitest';

import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {defineComponent} from 'vue';

const createMockHttpService = () => {
    const unregister = vi.fn<() => void>();

    return {
        httpService: {
            registerResponseErrorMiddleware: vi.fn<(fn: ResponseErrorMiddlewareFunc) => () => void>(() => unregister),
        } as unknown as HttpService,
        unregister,
    };
};

const createAxiosError = (status: number, data?: AxiosResponseError): AxiosError<AxiosResponseError> =>
    ({
        isAxiosError: true,
        response: {status, data, statusText: '', headers: {}, config: {} as never},
        config: {} as never,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Error',
    }) as AxiosError<AxiosResponseError>;

describe('useValidationErrors', () => {
    it('should return errors ref and clearErrors function', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        // Act
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;

        // Assert
        expect(vm.errors).toBeDefined();
        expect(vm.clearErrors).toBeInstanceOf(Function);

        wrapper.unmount();
    });

    it('should register error middleware on httpService', () => {
        // Arrange
        const {httpService} = createMockHttpService();

        // Act
        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        // Assert
        expect(httpService.registerResponseErrorMiddleware).toHaveBeenCalledOnce();

        wrapper.unmount();
    });

    it('should unregister middleware on unmount', () => {
        // Arrange
        const {httpService, unregister} = createMockHttpService();
        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        // Act
        wrapper.unmount();

        // Assert
        expect(unregister).toHaveBeenCalledOnce();
    });

    it('should populate errors when 422 response is received', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(422, {
            message: 'Validation failed',
            errors: {name: ['Name is required'], email: ['Email is invalid']},
        });

        // Act
        capturedMiddleware?.(error);

        // Assert
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({name: 'Name is required', email: 'Email is invalid'});

        wrapper.unmount();
    });

    it('should convert snake_case field names to camelCase', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(422, {
            errors: {
                first_name: ['First name is required'],
                last_name: ['Last name is required'],
                email_address: ['Invalid email'],
            },
        });

        // Act
        capturedMiddleware?.(error);

        // Assert
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({
            firstName: 'First name is required',
            lastName: 'Last name is required',
            emailAddress: 'Invalid email',
        });

        wrapper.unmount();
    });

    it('should take only the first error message for each field', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(422, {
            errors: {name: ['Name is required', 'Name must be at least 3 characters']},
        });

        // Act
        capturedMiddleware?.(error);

        // Assert
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({name: 'Name is required'});

        wrapper.unmount();
    });

    it('should not populate errors for non-422 responses', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(500, {message: 'Server error'});

        // Act
        capturedMiddleware?.(error);

        // Assert
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({});

        wrapper.unmount();
    });

    it('should clear errors when clearErrors is called', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(422, {errors: {name: ['Name is required']}});
        capturedMiddleware?.(error);

        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({name: 'Name is required'});

        // Act
        vm.clearErrors();

        // Assert
        expect(vm.errors).toStrictEqual({});

        wrapper.unmount();
    });

    it('should handle empty errors object gracefully', () => {
        // Arrange
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const error = createAxiosError(422, {message: 'Validation failed'});

        // Act
        capturedMiddleware?.(error);

        // Assert
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({});

        wrapper.unmount();
    });
});
