import RegisterPage from '@app/domains/auth/pages/RegisterPage.vue';
import {familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

describe('RegisterPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = () => mount(RegisterPage);

    it('renders six real TextInput components for all registration fields', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs).toHaveLength(6);

        const htmlInputs = wrapper.findAll('input');
        expect(htmlInputs).toHaveLength(6);
    });

    it('passes correct labels to each TextInput', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        const labels = inputs.map((i) => i.props('label'));
        expect(labels).toStrictEqual([
            'Invite Code',
            'Family Name',
            'Name',
            'Email',
            'Password',
            'Password Confirmation',
        ]);
    });

    it('marks invite code as optional, all others as required', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        const optionals = inputs.map((i) => i.props('optional'));
        expect(optionals).toStrictEqual([true, false, false, false, false, false]);
    });

    it('renders password fields with password type', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        const types = inputs.map((i) => i.props('type'));
        expect(types).toStrictEqual(['text', 'text', 'text', 'email', 'password', 'password']);
    });

    it('flows form submission through real components', async () => {
        mockServer.onPost('/register', {id: 1, name: 'Jane', email: 'jane@example.com'});
        const wrapper = mountPage();
        const goToRoute = vi.spyOn(familyRouterService, 'goToRoute');

        // Inputs in template order: invite code, family name, name, email, password, password confirmation
        const htmlInputs = wrapper.findAll('input');
        const values = ['CODE-123', 'Bricksons', 'Jane', 'jane@example.com', 'secret', 'secret'];
        for (const [index, value] of values.entries()) {
            await htmlInputs.at(index)?.setValue(value);
        }

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // The form submission fires register() on the real auth service — the multiword camelCase
        // fields must hit the wire as snake_case (ADR-0029) — then goToRoute("home") on the real router.
        const registerCalls = mockServer.callsTo('POST', '/register');
        expect(registerCalls).toHaveLength(1);
        expect(registerCalls[0]?.body).toStrictEqual({
            invite_code: 'CODE-123',
            family_name: 'Bricksons',
            name: 'Jane',
            email: 'jane@example.com',
            password: 'secret',
            password_confirmation: 'secret',
        });
        expect(goToRoute).toHaveBeenCalledWith('home');
    });

    it('renders a real PrimaryButton for submission', () => {
        const wrapper = mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Register');
    });
});
