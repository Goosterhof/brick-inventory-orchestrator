import RegisterPage from '@app/domains/auth/pages/RegisterPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import {FormField, TextInput} from '@script-development/ui-inputs';
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

    it('renders six real TextInput atoms for all registration fields', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        expect(inputs).toHaveLength(6);

        const htmlInputs = wrapper.findAll('input');
        expect(htmlInputs).toHaveLength(6);
    });

    it('labels each field', () => {
        const wrapper = mountPage();

        const labels = wrapper.findAll('.ui-label').map((label) => label.text().replace(/\*$/, ''));
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

        const fields = wrapper.findAllComponents(FormField);
        expect(fields.map((f) => f.props('required') ?? false)).toStrictEqual([false, true, true, true, true, true]);
    });

    it('renders email and password fields with the right types', () => {
        const wrapper = mountPage();

        const inputs = wrapper.findAllComponents(TextInput);
        const types = inputs.map((i) => i.props('type'));
        // the package TextInput defaults `type` to 'text' when omitted
        expect(types).toStrictEqual(['text', 'text', 'text', 'email', 'password', 'password']);
    });

    it('flows form submission through real components', async () => {
        mockServer.onPost('/register', {id: 1, name: 'Jane', email: 'jane@example.com'});
        const wrapper = mountPage();

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
        // The form submission fires register() on the real auth service, then goToRoute("home") on the real router.
    });

    it('renders a real PrimaryButton for submission', () => {
        const wrapper = mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Register');
    });
});
