import LoginPage from '@app/domains/auth/pages/LoginPage.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {AxiosError} from 'axios';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxiosWithError, createMockFsHelpers, createMockStringTs, createMockFamilyServices} = await vi.hoisted(
    () => import('../../../../../../helpers'),
);

const {mockLogin, mockGoToRoute} = vi.hoisted(() => ({
    mockLogin: vi.fn<() => Promise<void>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({familyAuthService: {login: mockLogin}, familyRouterService: {goToRoute: mockGoToRoute}}),
);

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all form fields', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs).toHaveLength(2);
        expect(inputs[0]?.props('label')).toBe('auth.email');
        expect(inputs[1]?.props('label')).toBe('auth.password');
    });

    it('should render email field with email type', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs[0]?.props('type')).toBe('email');
    });

    it('should render password field with password type', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs[1]?.props('type')).toBe('password');
    });

    it('should have all fields required by default', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        for (const input of inputs) {
            expect(input.props('optional')).toBe(false);
        }
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('auth.logIn');
    });

    it('should call authService.login on form submit', async () => {
        // Arrange
        const wrapper = shallowMount(LoginPage);

        const inputs = wrapper.findAllComponents(TextInput);
        inputs[0]?.vm.$emit('update:modelValue', 'john@example.com');
        inputs[1]?.vm.$emit('update:modelValue', 'password123');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockLogin).toHaveBeenCalledWith({email: 'john@example.com', password: 'password123'});
    });

    it('should navigate to dashboard on successful login', async () => {
        // Arrange
        mockLogin.mockResolvedValue(undefined);
        const wrapper = shallowMount(LoginPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalled();
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        expect(wrapper.find('h1').text()).toBe('auth.logIn');
    });

    it('should not navigate on 422 validation error', async () => {
        // Arrange
        const axiosError = new AxiosError('Validation failed');
        axiosError.response = {status: 422, data: {}, statusText: '', headers: {}, config: {} as never};
        mockLogin.mockRejectedValue(axiosError);
        const wrapper = shallowMount(LoginPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should render link to register page', () => {
        // Arrange & Act
        const wrapper = shallowMount(LoginPage);

        // Assert
        const paragraph = wrapper.find('p');
        expect(paragraph.text()).toContain('auth.noAccountYet');
        expect(paragraph.text()).toContain('auth.register');
    });

    it('should rethrow non-422 errors', async () => {
        // Arrange
        const axiosError = new AxiosError('Server error');
        axiosError.response = {status: 500, data: {}, statusText: '', headers: {}, config: {} as never};
        mockLogin.mockRejectedValue(axiosError);
        const wrapper = shallowMount(LoginPage);

        // Act
        const errorHandler = vi.fn<(err: unknown, instance: unknown, info: string) => void>();
        wrapper.vm.$.appContext.config.errorHandler = errorHandler;
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert - error should be rethrown and caught by Vue's error handler
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0]?.[0]).toBe(axiosError);
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });
});
