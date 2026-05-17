import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import {familyAuthService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

/**
 * Snake_case fixtures — matching real API response format.
 * toCamelCaseTyped() converts these to camelCase before they reach the component.
 */
const headMember = {id: 1, name: 'Alice', email: 'alice@test.com', is_head: true};
const regularMember = {id: 2, name: 'Bob', email: 'bob@test.com', is_head: false};

describe('SettingsPage — integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        // Log the user in so familyAuthService.userId() works
        mockServer.onPost('/login', {id: 1, name: 'Alice', email: 'alice@test.com'});
        await familyAuthService.login({email: 'alice@test.com', password: 'secret'});
    });

    const mountWithMembers = async (members = [headMember, regularMember]) => {
        mockServer.onGet('/family/members', members);
        // Invite code endpoint — 404 means no active code (caught by page)
        // No route registered = rejection = simulates 404
        const wrapper = mount(SettingsPage);
        await flushPromises();
        return wrapper;
    };

    it('renders PageHeader with real h1 element', async () => {
        const wrapper = await mountWithMembers();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('Settings');
    });

    it('renders members with real BadgeLabel for family head', async () => {
        const wrapper = await mountWithMembers();

        const badges = wrapper.findAllComponents(BadgeLabel);
        const headBadge = badges.find((b) => b.text().includes('Head'));
        expect(headBadge).toBeDefined();
        expect(headBadge?.props('variant')).toBe('highlight');
    });

    it('renders real DangerButton for removing non-head members', async () => {
        const wrapper = await mountWithMembers();

        const dangerButtons = wrapper.findAllComponents(DangerButton);
        const removeBtn = dangerButtons.find((b) => b.text().includes('Remove'));
        expect(removeBtn).toBeDefined();
        expect(removeBtn?.find('button').exists()).toBe(true);
    });

    it('opens real ConfirmDialog when clicking remove member button', async () => {
        const wrapper = await mountWithMembers();

        const dangerButtons = wrapper.findAllComponents(DangerButton);
        const removeBtn = dangerButtons.find((b) => b.text().includes('Remove'));
        await removeBtn?.find('button').trigger('click');

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props('open')).toBe(true);
        expect(confirmDialog.props('title')).toBe('Remove family member');
    });

    it('renders real TextInput for rebrickable token', async () => {
        const wrapper = await mountWithMembers();

        const inputs = wrapper.findAllComponents(TextInput);
        const tokenInput = inputs.find((i) => i.props('label') === 'Rebrickable user token');
        expect(tokenInput).toBeDefined();
        expect(tokenInput?.find('input').exists()).toBe(true);
    });

    it('renders invite code section with PrimaryButton when user is head', async () => {
        const wrapper = await mountWithMembers();

        const buttons = wrapper.findAllComponents(PrimaryButton);
        const generateBtn = buttons.find((b) => b.text().includes('Generate Invite Code'));
        expect(generateBtn).toBeDefined();
    });

    it('hides invite code section when user is not head', async () => {
        // Log in as non-head user
        mockServer.onPost('/login', {id: 2, name: 'Bob', email: 'bob@test.com'});
        await familyAuthService.login({email: 'bob@test.com', password: 'secret'});

        const wrapper = await mountWithMembers();

        const buttons = wrapper.findAllComponents(PrimaryButton);
        const generateBtn = buttons.find((b) => b.text().includes('Generate Invite Code'));
        expect(generateBtn).toBeUndefined();
    });

    it('renders theme toggle section with real button', async () => {
        const wrapper = await mountWithMembers();

        expect(wrapper.text()).toContain('Appearance');
        const buttons = wrapper.findAll('button');
        const themeBtn = buttons.find((b) => b.text().includes('Light mode') || b.text().includes('Dark mode'));
        expect(themeBtn).toBeDefined();
    });

    it('toggles theme when theme button is clicked', async () => {
        const wrapper = await mountWithMembers();

        const buttons = wrapper.findAll('button');
        const themeBtn = buttons.find((b) => b.text().includes('Light mode') || b.text().includes('Dark mode'));
        const initialText = themeBtn?.text();

        await themeBtn?.trigger('click');
        await flushPromises();

        const updatedButtons = wrapper.findAll('button');
        const updatedThemeBtn = updatedButtons.find(
            (b) => b.text().includes('Light mode') || b.text().includes('Dark mode'),
        );

        // After toggle, the label should have changed
        expect(updatedThemeBtn?.text()).not.toBe(initialText);
    });
});
