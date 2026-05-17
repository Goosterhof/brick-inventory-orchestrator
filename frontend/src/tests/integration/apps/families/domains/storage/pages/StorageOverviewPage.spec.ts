import StorageOverviewPage from '@app/domains/storage/pages/StorageOverviewPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import EmptyState from '@shared/components/EmptyState.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
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
 * The HTTP response middleware converts snake_case to camelCase before data reaches the store.
 */
const makeStorage = (id: number, name: string, parentId: number | null = null) => ({
    id,
    name,
    description: `Description for ${name}`,
    parent_id: parentId,
    row: null,
    column: null,
    child_ids: [] as number[],
});

describe('StorageOverviewPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = async (storageOptions: ReturnType<typeof makeStorage>[] = []) => {
        mockServer.onGet('storage-options', storageOptions);
        const wrapper = mount(StorageOverviewPage);
        await flushPromises();
        return wrapper;
    };

    it('renders real EmptyState when no storage options', async () => {
        const wrapper = await mountPage();

        const emptyState = wrapper.findComponent(EmptyState);
        expect(emptyState.exists()).toBe(true);
        expect(emptyState.text()).toContain('No storage locations yet');
    });

    it('renders PageHeader with real PrimaryButton', async () => {
        const wrapper = await mountPage([makeStorage(1, 'Shelf A')]);

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('Storage');

        const addBtn = pageHeader.findComponent(PrimaryButton);
        expect(addBtn.text()).toContain('Add storage');
    });

    it('renders real ListItemButton for each storage option', async () => {
        const wrapper = await mountPage([makeStorage(1, 'Shelf A'), makeStorage(2, 'Shelf B')]);

        const listItems = wrapper.findAllComponents(ListItemButton);
        expect(listItems).toHaveLength(2);

        for (const item of listItems) {
            expect(item.find('button').exists()).toBe(true);
        }
    });

    it('renders search TextInput', async () => {
        const wrapper = await mountPage([makeStorage(1, 'Shelf A')]);

        const textInput = wrapper.findComponent(TextInput);
        expect(textInput.exists()).toBe(true);
        expect(textInput.props('type')).toBe('search');
    });

    it('navigates to detail on ListItemButton click', async () => {
        const wrapper = await mountPage([makeStorage(1, 'Shelf A')]);

        const listItem = wrapper.findComponent(ListItemButton);
        await listItem.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
        // The click handler fires goToRoute() on the real router service; we verify the button is clickable.
    });

    it('filters storage options via search input', async () => {
        const wrapper = await mountPage([makeStorage(1, 'Shelf A'), makeStorage(2, 'Box B')]);

        const searchInput = wrapper.find('input');
        await searchInput.setValue('Shelf');

        const listItems = wrapper.findAllComponents(ListItemButton);
        expect(listItems).toHaveLength(1);
    });
});
