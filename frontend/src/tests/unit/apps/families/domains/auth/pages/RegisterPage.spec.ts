import RegisterPage from '@app/domains/auth/pages/RegisterPage.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices} = await vi.hoisted(
    () => import('../../../../../../helpers'),
);

const {mockRegister, mockGoToRoute, currentRouteRef} = vi.hoisted(() => ({
    mockRegister: vi.fn<() => Promise<void>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
    currentRouteRef: {value: {query: {} as Record<string, unknown>}},
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyAuthService: {register: mockRegister},
        familyRouterService: {goToRoute: mockGoToRoute, currentRouteRef},
    }),
);

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentRouteRef.value = {query: {}};
    });

    it('should render all form fields', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs).toHaveLength(6);
        expect(inputs.map((i) => i.props('label'))).toStrictEqual([
            'auth.inviteCode',
            'auth.familyName',
            'auth.name',
            'auth.email',
            'auth.password',
            'auth.passwordConfirmation',
        ]);
    });

    it('should render invite code field as optional', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const inviteCodeInput = wrapper
            .findAllComponents(TextInput)
            .find((i) => i.props('label') === 'auth.inviteCode');
        expect(inviteCodeInput?.props('optional')).toBe(true);
    });

    it('should render email field with email type', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const emailInput = wrapper.findAllComponents(TextInput).find((i) => i.props('label') === 'auth.email');
        expect(emailInput?.props('type')).toBe('email');
    });

    it('should render password fields with password type', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const passwordInputs = wrapper.findAllComponents(TextInput).filter((i) => i.props('type') === 'password');
        expect(passwordInputs).toHaveLength(2);
        expect(passwordInputs.map((i) => i.props('label'))).toStrictEqual([
            'auth.password',
            'auth.passwordConfirmation',
        ]);
    });

    it('should have all fields required except invite code', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const inputs = wrapper.findAllComponents(TextInput);
        const requiredInputs = inputs.filter((i) => i.props('optional') === false);
        const optionalInputs = inputs.filter((i) => i.props('optional') === true);
        expect(requiredInputs).toHaveLength(5);
        expect(optionalInputs).toHaveLength(1);
        expect(optionalInputs.find((i) => i.props('label') === 'auth.inviteCode')).toBeTruthy();
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('auth.register');
    });

    it('should call authService.register on form submit with invite code', async () => {
        // Arrange
        const wrapper = shallowMount(RegisterPage);

        const inputs = wrapper.findAllComponents(TextInput);
        const findInput = (label: string) => inputs.find((i) => i.props('label') === label);
        findInput('auth.inviteCode')?.vm.$emit('update:modelValue', 'ABC123');
        findInput('auth.familyName')?.vm.$emit('update:modelValue', 'Smith');
        findInput('auth.name')?.vm.$emit('update:modelValue', 'John');
        findInput('auth.email')?.vm.$emit('update:modelValue', 'john@example.com');
        findInput('auth.password')?.vm.$emit('update:modelValue', 'password123');
        findInput('auth.passwordConfirmation')?.vm.$emit('update:modelValue', 'password123');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockRegister).toHaveBeenCalledWith({
            inviteCode: 'ABC123',
            familyName: 'Smith',
            name: 'John',
            email: 'john@example.com',
            password: 'password123',
            passwordConfirmation: 'password123',
        });
    });

    it('should send undefined inviteCode when field is empty', async () => {
        // Arrange
        const wrapper = shallowMount(RegisterPage);

        const inputs = wrapper.findAllComponents(TextInput);
        const findInput = (label: string) => inputs.find((i) => i.props('label') === label);
        findInput('auth.familyName')?.vm.$emit('update:modelValue', 'Smith');
        findInput('auth.name')?.vm.$emit('update:modelValue', 'John');
        findInput('auth.email')?.vm.$emit('update:modelValue', 'john@example.com');
        findInput('auth.password')?.vm.$emit('update:modelValue', 'password123');
        findInput('auth.passwordConfirmation')?.vm.$emit('update:modelValue', 'password123');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({inviteCode: undefined}));
    });

    it('should navigate to dashboard on successful registration', async () => {
        // Arrange
        mockRegister.mockResolvedValue(undefined);
        const wrapper = shallowMount(RegisterPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalled();
    });

    it('should render link to login page', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        const paragraph = wrapper.find('p');
        expect(paragraph.text()).toContain('auth.alreadyHaveAccount');
        expect(paragraph.text()).toContain('auth.logIn');
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = shallowMount(RegisterPage);

        // Assert
        expect(wrapper.find('h1').text()).toBe('auth.createAccount');
    });

    describe('invite-code query param', () => {
        it('should pre-fill the inviteCode field from ?invite={code}', () => {
            // Arrange
            currentRouteRef.value = {query: {invite: 'BRICK-ABCD'}};

            // Act
            const wrapper = shallowMount(RegisterPage);

            // Assert
            const inviteCodeInput = wrapper
                .findAllComponents(TextInput)
                .find((i) => i.props('label') === 'auth.inviteCode');
            expect(inviteCodeInput?.props('modelValue')).toBe('BRICK-ABCD');
        });

        it('should leave the inviteCode field empty when no query is present', () => {
            // Arrange — beforeEach already resets currentRouteRef to {query: {}}
            // Act
            const wrapper = shallowMount(RegisterPage);

            // Assert
            const inviteCodeInput = wrapper
                .findAllComponents(TextInput)
                .find((i) => i.props('label') === 'auth.inviteCode');
            expect(inviteCodeInput?.props('modelValue')).toBe('');
        });

        it('should leave the inviteCode field empty when the query is array-shaped', () => {
            // Arrange — Vue Router emits string[] for ?invite=A&invite=B
            currentRouteRef.value = {query: {invite: ['A', 'B']}};

            // Act
            const wrapper = shallowMount(RegisterPage);

            // Assert
            const inviteCodeInput = wrapper
                .findAllComponents(TextInput)
                .find((i) => i.props('label') === 'auth.inviteCode');
            expect(inviteCodeInput?.props('modelValue')).toBe('');
        });
    });
});
