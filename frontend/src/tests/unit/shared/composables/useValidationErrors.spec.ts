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

    it('should not populate or crash when the axios error has no response', () => {
        // Arrange — network-level errors arrive with no `response` field at all
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const networkError = {
            isAxiosError: true,
            response: undefined,
            config: {} as never,
            toJSON: () => ({}),
            name: 'AxiosError',
            message: 'Network Error',
        } as unknown as AxiosError<AxiosResponseError>;

        // Act + Assert — must not throw on missing response
        expect(() => capturedMiddleware?.(networkError)).not.toThrow();

        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({});

        wrapper.unmount();
    });

    it('should not let a throw in the error-parse body escape and mask the real AxiosError', () => {
        // Arrange — fs-http runs response-error middleware as a synchronous, un-caught loop
        // (`for (const mw of responseErrorMiddleware) mw(error)`). A throw in this body would
        // corrupt the interceptor chain and mask the real AxiosError. The body is wrapped in
        // `guarded(...)` from @script-development/fs-http, which try/catches and never re-throws.
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        // A malformed 422 payload: `errors` is present (passes the guard) but its own enumerable
        // property throws on read, so the real deepCamelKeys traversal inside parseValidationErrors
        // throws — the exact "throw on a malformed error payload" the guard defends against.
        const malformedErrors = {};
        Object.defineProperty(malformedErrors, 'first_name', {
            enumerable: true,
            get() {
                throw new Error('malformed error payload');
            },
        });
        const error = createAxiosError(422, {errors: malformedErrors} as unknown as AxiosResponseError);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        // Act + Assert — the guarded middleware must swallow the throw (never propagate), so the
        // real AxiosError continues down fs-http's `Promise.reject(error)` path intact.
        expect(() => capturedMiddleware?.(error)).not.toThrow();

        // The throw happened mid-parse, before assignment — errors stay empty, and the swallow is
        // loud (guarded's default handler logs), not silent.
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({});
        expect(consoleErrorSpy).toHaveBeenCalledOnce();

        consoleErrorSpy.mockRestore();
        wrapper.unmount();
    });

    it('should not overwrite existing errors when a non-422 response arrives afterwards', () => {
        // Arrange — populate with a real 422, then deliver a non-422 to the same instance
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const validationError = createAxiosError(422, {errors: {name: ['Name is required']}});
        capturedMiddleware?.(validationError);

        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({name: 'Name is required'});

        // Act — deliver a non-422 with a body present (so any & vs | mutation that
        // short-circuits on response.data would re-enter the parse branch)
        const serverError = createAxiosError(500, {message: 'Server error'});
        capturedMiddleware?.(serverError);

        // Assert — the previously-populated 422 errors must remain untouched
        expect(vm.errors).toStrictEqual({name: 'Name is required'});

        wrapper.unmount();
    });

    it('should short-circuit a response-less error cleanly, without a guarded swallow', () => {
        // Arrange — a network-level error has no `response`. `isValidationError` guards this via
        // `error.response?.status`; the optional chain must SHORT-CIRCUIT, not throw-then-get-caught
        // by `guarded`. A non-optional `error.response.status` would throw a TypeError on the missing
        // response, which `guarded` swallows loudly (console.error) — same empty-bag outcome, so only
        // asserting "no throw / errors === {}" cannot tell the two apart. Asserting the swallow never
        // fires is what distinguishes a clean skip from a caught throw.
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        const networkError = {
            isAxiosError: true,
            response: undefined,
            config: {} as never,
            toJSON: () => ({}),
            name: 'AxiosError',
            message: 'Network Error',
        } as unknown as AxiosError<AxiosResponseError>;

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        // Act
        capturedMiddleware?.(networkError);

        // Assert — the guard short-circuited; `guarded`'s error handler was never reached.
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({});

        consoleErrorSpy.mockRestore();
        wrapper.unmount();
    });

    it('should reset existing errors when a later 422 carries no errors object', () => {
        // Arrange — populate the bag with a real 422, then deliver a 422 whose body has NO `errors`
        // key. `parseValidationErrors`' `if (!data.errors) return {}` guard must reset the bag to {}.
        // A mutant that drops that early-return falls into `deepCamelKeys(undefined)` → its
        // `Object.entries(undefined)` throws → `guarded` catches → the stale bag is left in place.
        // Starting from a POPULATED bag (not the initial {}) is what makes that survival observable.
        const {httpService} = createMockHttpService();
        let capturedMiddleware: ResponseErrorMiddlewareFunc | undefined;
        (httpService.registerResponseErrorMiddleware as Mock).mockImplementation((fn: ResponseErrorMiddlewareFunc) => {
            capturedMiddleware = fn;
            return vi.fn<() => void>();
        });

        const wrapper = shallowMount(
            defineComponent({setup: () => useValidationErrors(httpService), template: '<div />'}),
        );

        capturedMiddleware?.(createAxiosError(422, {errors: {name: ['Name is required']}}));
        const vm = wrapper.vm as unknown as ReturnType<typeof useValidationErrors>;
        expect(vm.errors).toStrictEqual({name: 'Name is required'});

        // Act — a second 422, body present but no `errors` key.
        capturedMiddleware?.(createAxiosError(422, {message: 'Validation failed'}));

        // Assert — the bag is reset to {}, not left holding the previous field errors.
        expect(vm.errors).toStrictEqual({});

        wrapper.unmount();
    });
});
