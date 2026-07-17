import RegisterPage from '@app/domains/auth/pages/RegisterPage.vue';
import {familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import {FormField, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, isAxiosError, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded, isAxiosError};
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

        // The real navigation lazy-imports the home route component; await it so the
        // import chain cannot race environment teardown (EnvironmentTeardownError flake).
        await goToRoute.mock.results[0]?.value;
    });

    it('renders a confirmation-mismatch 422 error under the password confirmation input', async () => {
        const mismatchMessage = 'The password confirmation field must match password.';
        mockServer.onPostError('/register', 422, {
            message: mismatchMessage,
            errors: {password_confirmation: [mismatchMessage]},
        });
        const wrapper = mountPage();
        const goToRoute = vi.spyOn(familyRouterService, 'goToRoute');

        // Inputs in template order: invite code, family name, name, email, password, password confirmation
        const htmlInputs = wrapper.findAll('input');
        const values = ['', 'Bricksons', 'Jane', 'jane@example.com', 'secret123', 'secret124'];
        for (const [index, value] of values.entries()) {
            await htmlInputs.at(index)?.setValue(value);
        }

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // The backend keys the mismatch to password_confirmation (same:password rule); the camelKey
        // keyMapper lands it on errors.passwordConfirmation — under the confirmation field, not Password.
        // Label + error live on FormField (ui-inputs), so assert the error binding there, not on the TextInput atom.
        const fields = wrapper.findAllComponents(FormField);
        const confirmationField = fields.find((field) => field.props('label') === 'Password Confirmation');
        expect(confirmationField?.props('error')).toBe(mismatchMessage);
        const passwordField = fields.find((field) => field.props('label') === 'Password');
        expect(passwordField?.props('error')).toBeFalsy(); // no error under Password

        expect(goToRoute).not.toHaveBeenCalled();
    });

    it('renders a real PrimaryButton for submission', () => {
        const wrapper = mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Register');
    });
});
