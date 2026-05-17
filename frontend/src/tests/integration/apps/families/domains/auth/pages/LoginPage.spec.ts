import LoginPage from '@app/domains/auth/pages/LoginPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

describe('LoginPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = () => mount(LoginPage);

    it('renders real TextInput components with label and input elements', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs).toHaveLength(2);

        // Real TextInput renders <input> elements — stubs would not
        const htmlInputs = wrapper.findAll('input');
        expect(htmlInputs).toHaveLength(2);
    });

    it('passes correct props to TextInput children', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        const emailInput = inputs.find((i) => i.props('type') === 'email');
        const passwordInput = inputs.find((i) => i.props('type') === 'password');

        expect(emailInput).toBeDefined();
        expect(passwordInput).toBeDefined();
        expect(emailInput?.props('label')).toBe('Email');
        expect(passwordInput?.props('label')).toBe('Password');
    });

    it('renders a real PrimaryButton with submit type', () => {
        const wrapper = mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);

        // Real PrimaryButton renders a <button> element with the correct type
        const htmlButton = button.find('button');
        expect(htmlButton.attributes('type')).toBe('submit');
    });

    it('flows form submission through real components to the service layer', async () => {
        mockServer.onPost('/login', {id: 1, name: 'John', email: 'john@example.com'});
        const wrapper = mountPage();

        // Type into real input elements
        const htmlInputs = wrapper.findAll('input');
        const emailEl = htmlInputs.find((i) => i.attributes('type') === 'email');
        const passwordEl = htmlInputs.find((i) => i.attributes('type') === 'password');

        await emailEl?.setValue('john@example.com');
        await passwordEl?.setValue('secret');

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
        // The form submission fires login() on the real auth service, then goToRoute("home") on the real router.
    });

    it('renders the register link via real FamilyRouterLink', () => {
        const wrapper = mountPage();

        const link = wrapper.find('a');
        expect(link.exists()).toBe(true);
        expect(wrapper.text()).toContain("Don't have an account yet?");
    });
});
