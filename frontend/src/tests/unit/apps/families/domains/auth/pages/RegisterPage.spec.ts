import RegisterPage from '@app/domains/auth/pages/RegisterPage.vue';
import {FormField, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices, createMockUiInputs} =
    await vi.hoisted(() => import('../../../../../../helpers'));

const {mockRegister, mockGoToRoute, currentRouteRef} = vi.hoisted(() => ({
    mockRegister: vi.fn<() => Promise<void>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
    currentRouteRef: {value: {query: {}}},
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@script-development/ui-inputs', () => createMockUiInputs());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyAuthService: {register: mockRegister},
        familyRouterService: {goToRoute: mockGoToRoute, currentRouteRef},
    }),
);

// atom-at-call-site: unstub the package pair so slots + inputs render; the fields
// render in a stable DOM order (inviteCode, familyName, name, email, password,
// passwordConfirmation), so we index rather than look up by label prop.
const renderPage = () => shallowMount(RegisterPage, {global: {stubs: {FormField: false, TextInput: false}}});

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentRouteRef.value = {query: {}};
    });

    it('should render all form fields', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        expect(wrapper.findAllComponents(FormField)).toHaveLength(6);
        const labels = wrapper.findAll('.ui-label').map((label) => label.text().replace(/\*$/, ''));
        expect(labels).toStrictEqual([
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
        const wrapper = renderPage();

        // Assert — invite code is the first field and is not marked required
        const fields = wrapper.findAllComponents(FormField);
        expect(fields[0]?.props('required')).toBe(false);
    });

    it('should render email field with email type', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — email is the 4th input (index 3)
        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs[3]?.props('type')).toBe('email');
    });

    it('should render password fields with password type', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        const passwordInputs = wrapper.findAllComponents(TextInput).filter((i) => i.props('type') === 'password');
        expect(passwordInputs).toHaveLength(2);
    });

    it('should have all fields required except invite code', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — required polarity replaces the old `optional` prop
        const fields = wrapper.findAllComponents(FormField);
        expect(fields.map((f) => f.props('required'))).toStrictEqual([false, true, true, true, true, true]);
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('auth.register');
    });

    it('should call authService.register on form submit with invite code', async () => {
        // Arrange
        const wrapper = renderPage();

        const inputs = wrapper.findAllComponents(TextInput);
        inputs[0]?.vm.$emit('update:modelValue', 'ABC123');
        inputs[1]?.vm.$emit('update:modelValue', 'Smith');
        inputs[2]?.vm.$emit('update:modelValue', 'John');
        inputs[3]?.vm.$emit('update:modelValue', 'john@example.com');
        inputs[4]?.vm.$emit('update:modelValue', 'password123');
        inputs[5]?.vm.$emit('update:modelValue', 'password123');
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
        const wrapper = renderPage();

        const inputs = wrapper.findAllComponents(TextInput);
        inputs[1]?.vm.$emit('update:modelValue', 'Smith');
        inputs[2]?.vm.$emit('update:modelValue', 'John');
        inputs[3]?.vm.$emit('update:modelValue', 'john@example.com');
        inputs[4]?.vm.$emit('update:modelValue', 'password123');
        inputs[5]?.vm.$emit('update:modelValue', 'password123');
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
        const wrapper = renderPage();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalled();
    });

    it('should render link to login page', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        const paragraph = wrapper.find('p');
        expect(paragraph.text()).toContain('auth.alreadyHaveAccount');
        expect(paragraph.text()).toContain('auth.logIn');
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        expect(wrapper.find('h1').text()).toBe('auth.createAccount');
    });

    describe('invite-code query param', () => {
        it('should pre-fill the inviteCode field from ?invite={code}', () => {
            // Arrange
            currentRouteRef.value = {query: {invite: 'BRICK-ABCD'}};

            // Act
            const wrapper = renderPage();

            // Assert
            const inputs = wrapper.findAllComponents(TextInput);
            expect(inputs[0]?.props('modelValue')).toBe('BRICK-ABCD');
        });

        it('should leave the inviteCode field empty when no query is present', () => {
            // Arrange — beforeEach already resets currentRouteRef to {query: {}}
            // Act
            const wrapper = renderPage();

            // Assert
            const inputs = wrapper.findAllComponents(TextInput);
            expect(inputs[0]?.props('modelValue')).toBe('');
        });

        it('should leave the inviteCode field empty when the query is array-shaped', () => {
            // Arrange — Vue Router emits string[] for ?invite=A&invite=B
            currentRouteRef.value = {query: {invite: ['A', 'B']}};

            // Act
            const wrapper = renderPage();

            // Assert
            const inputs = wrapper.findAllComponents(TextInput);
            expect(inputs[0]?.props('modelValue')).toBe('');
        });
    });
});
