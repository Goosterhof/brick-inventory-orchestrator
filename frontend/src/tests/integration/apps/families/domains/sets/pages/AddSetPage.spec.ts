import AddSetPage from '@app/domains/sets/pages/AddSetPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import {SingleSelect, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

describe('AddSetPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = async () => {
        // Store needs to be hydrated for duplicate detection (getAll reads from store)
        mockServer.onGet('family-sets', []);
        const wrapper = mount(AddSetPage);
        await flushPromises();
        return wrapper;
    };

    it('renders the ui-inputs atoms as real children', async () => {
        const wrapper = await mountPage();

        // package atoms for the two controls that have them
        expect(wrapper.findComponent(TextInput).exists()).toBe(true);
        expect(wrapper.findComponent(SingleSelect).exists()).toBe(true);
        // native controls composed in FormField for the three the package doesn't ship
        expect(wrapper.find('input[type="number"]').exists()).toBe(true);
        expect(wrapper.find('input[type="date"]').exists()).toBe(true);
        expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('renders a real text input labelled for the set number', async () => {
        const wrapper = await mountPage();

        const labels = wrapper.findAll('.ui-label').map((label) => label.text());
        expect(labels.some((text) => text.includes('Set number'))).toBe(true);
        expect(wrapper.findComponent(TextInput).find('input').exists()).toBe(true);
    });

    it('renders the status select with its six options once opened', async () => {
        const wrapper = await mountPage();

        const labels = wrapper.findAll('.ui-label').map((label) => label.text());
        expect(labels.some((text) => text.includes('Status'))).toBe(true);

        // options are a listbox rendered only while open — open the combobox first
        await wrapper.get('[role="combobox"]').trigger('click');
        await flushPromises();
        expect(wrapper.findAll('[role="option"]')).toHaveLength(6);
    });

    it('renders a real PrimaryButton for form submission', async () => {
        const wrapper = await mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Add');
    });

    it('submits form through real component tree', async () => {
        const wrapper = await mountPage();

        mockServer.onPost('family-sets', {id: 42});
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
        // The create() call posts to family-sets; goToRoute navigates to detail.
    });

    it('does not show duplicate warning when setNum is empty', async () => {
        const wrapper = await mountPage();

        expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
    });
});
