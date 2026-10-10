import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import {familyAuthService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import {FormField} from '@script-development/ui-inputs';
import PageHeader from '@shared/components/PageHeader.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

describe('SettingsPage — integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        mockServer.onPost('/login', {id: 1, name: 'Alice', email: 'alice@test.com'});
        await familyAuthService.login({email: 'alice@test.com', password: 'secret'});
    });

    const mountPage = async () => {
        const wrapper = mount(SettingsPage);
        await flushPromises();
        return wrapper;
    };

    it('renders PageHeader with real h1 element', async () => {
        const wrapper = await mountPage();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('Settings');
    });

    it('renders no family members section and requests no member list (WR-2123)', async () => {
        const wrapper = await mountPage();

        expect(wrapper.text()).not.toContain('Family members');
        expect(mockServer.callsTo('GET', '/family/members')).toHaveLength(0);
    });

    it('renders real TextInput for rebrickable token', async () => {
        const wrapper = await mountPage();

        const tokenField = wrapper
            .findAllComponents(FormField)
            .find((field) => field.props('label') === 'Rebrickable user token');
        expect(tokenField).toBeDefined();
        expect(tokenField?.find('input').exists()).toBe(true);
    });

    it('renders theme toggle section with real button', async () => {
        const wrapper = await mountPage();

        expect(wrapper.text()).toContain('Appearance');
        const buttons = wrapper.findAll('button');
        const themeBtn = buttons.find((b) => b.text().includes('Light mode') || b.text().includes('Dark mode'));
        expect(themeBtn).toBeDefined();
    });

    it('toggles theme when theme button is clicked', async () => {
        const wrapper = await mountPage();

        const buttons = wrapper.findAll('button');
        const themeBtn = buttons.find((b) => b.text().includes('Light mode') || b.text().includes('Dark mode'));
        const initialText = themeBtn?.text();

        await themeBtn?.trigger('click');
        await flushPromises();

        const updatedButtons = wrapper.findAll('button');
        const updatedThemeBtn = updatedButtons.find(
            (b) => b.text().includes('Light mode') || b.text().includes('Dark mode'),
        );

        expect(updatedThemeBtn?.text()).not.toBe(initialText);
    });
});
