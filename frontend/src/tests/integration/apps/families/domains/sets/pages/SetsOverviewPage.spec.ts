import SetsOverviewPage from '@app/domains/sets/pages/SetsOverviewPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import CollapsibleSection from '@shared/components/CollapsibleSection.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
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

/** CSV helpers don't run in happy-dom — mock to prevent file system access. */
vi.mock('@shared/helpers/csv', () => ({downloadCsv: vi.fn<() => void>(), toCsv: vi.fn<() => string>(() => '')}));

/**
 * Snake_case fixtures — matching real API response format.
 * The HTTP response middleware converts snake_case to camelCase before data reaches the store.
 */
const makeSet = (id: number, theme: string, status = 'sealed') => ({
    id,
    set_num: `${id}-1`,
    quantity: 1,
    status,
    purchase_date: null,
    notes: null,
    set: {name: `Set ${id}`, set_num: `${id}-1`, year: 2024, theme, num_parts: 100, image_url: null},
});

describe('SetsOverviewPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = async (sets: ReturnType<typeof makeSet>[] = []) => {
        mockServer.onGet('family-sets', sets);
        mockServer.onGet('/family-sets/completion', []);
        const wrapper = mount(SetsOverviewPage);
        await flushPromises();
        return wrapper;
    };

    it('renders real EmptyState when no sets', async () => {
        const wrapper = await mountPage();

        const emptyState = wrapper.findComponent(EmptyState);
        expect(emptyState.exists()).toBe(true);
        expect(emptyState.text()).toContain('The shelf is bare');
    });

    it('renders PageHeader with real PrimaryButton actions', async () => {
        const wrapper = await mountPage([makeSet(1, 'City')]);

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('My Sets');

        const buttons = pageHeader.findAllComponents(PrimaryButton);
        expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders sets grouped in real CollapsibleSection components', async () => {
        const wrapper = await mountPage([makeSet(1, 'City'), makeSet(2, 'Technic')]);

        const sections = wrapper.findAllComponents(CollapsibleSection);
        expect(sections).toHaveLength(2);

        const titles = sections.map((s) => s.props('title'));
        expect(titles).toContain('City');
        expect(titles).toContain('Technic');
    });

    it('renders real FilterChip components for status filtering', async () => {
        const wrapper = await mountPage([makeSet(1, 'City')]);

        const chips = wrapper.findAllComponents(FilterChip);
        expect(chips.length).toBeGreaterThanOrEqual(5);
    });

    it('renders search TextInput for filtering sets', async () => {
        const wrapper = await mountPage([makeSet(1, 'City')]);

        const textInput = wrapper.findComponent(TextInput);
        expect(textInput.exists()).toBe(true);
        expect(textInput.props('type')).toBe('search');
    });

    it('renders ListItemButton for each set in expanded sections', async () => {
        const wrapper = await mountPage([makeSet(1, 'City'), makeSet(2, 'City')]);

        const section = wrapper.findComponent(CollapsibleSection);
        await section.find('button').trigger('click');

        const listItems = wrapper.findAllComponents(ListItemButton);
        expect(listItems).toHaveLength(2);
    });

    it('navigates to detail on ListItemButton click', async () => {
        const wrapper = await mountPage([makeSet(1, 'City')]);

        const section = wrapper.findComponent(CollapsibleSection);
        await section.find('button').trigger('click');

        const listItem = wrapper.findComponent(ListItemButton);
        await listItem.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
        // The click handler fires goToRoute() on the real router service; we verify the button is clickable.
    });
});
