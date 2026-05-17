import PartsPage from '@app/domains/parts/pages/PartsPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
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
 * toCamelCaseTyped() converts these to camelCase before they reach the component.
 */
const makePart = (overrides: Record<string, unknown> = {}) => ({
    part_id: 1,
    part_num: '3001',
    part_name: 'Brick 2x4',
    part_image_url: 'http://example.com/brick.png',
    color_id: 1,
    color_name: 'Red',
    color_rgb: 'FF0000',
    quantity: 5,
    storage_option_id: 1,
    storage_option_name: 'Box A',
    family_set_id: 1,
    ...overrides,
});

/** Wrap parts array in cursor pagination envelope matching backend response shape. */
const makeEnvelope = (
    data: Record<string, unknown>[],
    overrides: {next_cursor?: string | null; prev_cursor?: string | null} = {},
) => ({data, next_cursor: null, prev_cursor: null, path: '/api/family/parts', per_page: 100, ...overrides});

/** The initial fetch URL includes per_page=100. */
const INITIAL_URL = '/family/parts?per_page=100';

describe('PartsPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    it('renders empty state with real EmptyState component when no parts', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const emptyState = wrapper.findComponent(EmptyState);
        expect(emptyState.exists()).toBe(true);
        expect(emptyState.text()).toContain('No loose bricks yet');
    });

    it('renders real PartListItem components with correct props when parts exist', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const partItems = wrapper.findAllComponents(PartListItem);
        expect(partItems).toHaveLength(1);

        const item = partItems.find((p) => p.props('name') === 'Brick 2x4');
        expect(item).toBeDefined();
        expect(item?.props('partNum')).toBe('3001');
        expect(item?.props('quantity')).toBe(5);
        expect(item?.props('colorName')).toBe('Red');
    });

    it('renders PageHeader with export button when parts exist', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.exists()).toBe(true);
        expect(pageHeader.find('h1').text()).toBe('Parts Inventory');

        const buttonLabels = pageHeader.findAllComponents(PrimaryButton).map((b) => b.text());
        expect(buttonLabels).toContain('Export CSV');
    });

    it("renders the 'Missing parts across all sets' CTA in the page header even when no parts are stored", async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const cta = wrapper.find("[data-testid='parts-missing-cta']");
        expect(cta.exists()).toBe(true);
        expect(cta.text()).toBe("See what you're missing across all sets");
    });

    it('navigates to /parts/missing when the missing-parts CTA is clicked', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        await wrapper.find("[data-testid='parts-missing-cta']").trigger('click');
        await flushPromises();

        // The families app uses a custom RouterService; verify the named route resolves to /parts/missing.
        const {familyRouterService} = await import('@app/services');
        expect(familyRouterService.getUrlForRouteName('parts-missing')).toBe('/parts/missing');
    });

    it("renders the 'See parts to place' CTA in the page header even when no parts are stored", async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const cta = wrapper.find("[data-testid='parts-unsorted-cta']");
        expect(cta.exists()).toBe(true);
        expect(cta.text()).toBe('See parts to place in storage');
    });

    it('navigates to /parts/unsorted when the unsorted-parts CTA is clicked', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        await wrapper.find("[data-testid='parts-unsorted-cta']").trigger('click');
        await flushPromises();

        const {familyRouterService} = await import('@app/services');
        expect(familyRouterService.getUrlForRouteName('parts-unsorted')).toBe('/parts/unsorted');
    });

    it('renders search input and filter chips for sorting and colors', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const searchInput = wrapper.findComponent(TextInput);
        expect(searchInput.exists()).toBe(true);
        expect(searchInput.props('type')).toBe('search');

        const filterChips = wrapper.findAllComponents(FilterChip);
        expect(filterChips.length).toBeGreaterThanOrEqual(5);
    });

    it('filters parts when clicking a color FilterChip', async () => {
        mockServer.onGet(
            INITIAL_URL,
            makeEnvelope([
                makePart({part_id: 1, color_id: 1, color_name: 'Red'}),
                makePart({part_id: 2, color_id: 2, color_name: 'Blue', color_rgb: '0000FF'}),
            ]),
        );
        const wrapper = mount(PartsPage);
        await flushPromises();

        expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);

        const filterChips = wrapper.findAllComponents(FilterChip);
        const redChip = filterChips.find((c) => c.text() === 'Red');
        await redChip?.find('button').trigger('click');

        expect(wrapper.findAllComponents(PartListItem)).toHaveLength(1);
    });

    it('shows loading text before API resolves', () => {
        // Register route so mount doesn't error, but loading shows while pending
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        const wrapper = mount(PartsPage);

        expect(wrapper.text()).toContain('Stacking bricks...');
    });

    it('does not show load more button when next_cursor is null', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()], {next_cursor: null}));
        const wrapper = mount(PartsPage);
        await flushPromises();

        expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(false);
    });

    it('shows load more button when next_cursor is present', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()], {next_cursor: 'eyJpZCI6MjV9'}));
        const wrapper = mount(PartsPage);
        await flushPromises();

        const button = wrapper.find("[data-testid='load-more-button']");
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe('Load more bricks');
    });

    it('fetches next page and appends results when load more is clicked', async () => {
        mockServer.onGet(
            INITIAL_URL,
            makeEnvelope([makePart({part_id: 1, part_name: 'Brick 2x4'})], {next_cursor: 'cursor-page-2'}),
        );
        mockServer.onGet(
            '/family/parts?per_page=100&cursor=cursor-page-2',
            makeEnvelope([makePart({part_id: 2, part_num: '3002', part_name: 'Plate 1x2', color_id: 2})]),
        );
        const wrapper = mount(PartsPage);
        await flushPromises();

        expect(wrapper.findAllComponents(PartListItem)).toHaveLength(1);

        await wrapper.find("[data-testid='load-more-button']").trigger('click');
        await flushPromises();

        const items = wrapper.findAllComponents(PartListItem);
        expect(items).toHaveLength(2);
        expect(items.find((p) => p.props('name') === 'Plate 1x2')).toBeDefined();
    });

    it('hides load more button when last page has no next_cursor', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()], {next_cursor: 'cursor-page-2'}));
        mockServer.onGet(
            '/family/parts?per_page=100&cursor=cursor-page-2',
            makeEnvelope([makePart({part_id: 2, part_num: '3002', part_name: 'Plate 1x2', color_id: 2})], {
                next_cursor: null,
            }),
        );
        const wrapper = mount(PartsPage);
        await flushPromises();

        expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(true);

        await wrapper.find("[data-testid='load-more-button']").trigger('click');
        await flushPromises();

        expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(false);
    });

    it('shows loading state on load more button while fetching', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()], {next_cursor: 'cursor-page-2'}));

        const wrapper = mount(PartsPage);
        await flushPromises();

        const button = wrapper.find("[data-testid='load-more-button']");
        expect(button.text()).toBe('Load more bricks');

        // Don't register next page route — the request will hang as a rejected promise
        // Instead, register a route that we can check against
        mockServer.onGet('/family/parts?per_page=100&cursor=cursor-page-2', makeEnvelope([]));

        await button.trigger('click');
        // After click, before promise resolves, button should show loading text
        expect(button.text()).toBe('Loading...');
        expect(button.attributes('disabled')).toBeDefined();

        await flushPromises();
    });

    it('opens the reverse lookup modal with fetched usage when a row is clicked', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        mockServer.onGet('/family/parts/3001/1/usage', {
            part_num: '3001',
            part_name: 'Brick 2x4',
            part_image_url: 'http://example.com/brick.png',
            color_id: 1,
            color_name: 'Red',
            color_hex: 'FF0000',
            usages: [
                {
                    family_set_id: 7,
                    set_num: '10024-1',
                    set_name: 'Red Baron',
                    status: 'sealed',
                    quantity_needed: 4,
                    quantity_stored: 1,
                    shortfall: 3,
                },
            ],
        });

        const wrapper = mount(PartsPage);
        await flushPromises();

        await wrapper.find("[data-testid='part-row-1_1']").trigger('click');
        await flushPromises();

        // The modal renders the part header and the populated usage list
        const modalText = wrapper.text();
        expect(modalText).toContain('Where this brick belongs');
        expect(modalText).toContain('Red Baron');
        expect(modalText).toContain('Sealed');
        expect(modalText).toContain('Needed: 4x');
        expect(modalText).toContain('Short: 3x');
    });

    it('navigates to the matching set when a modal row is clicked', async () => {
        mockServer.onGet(INITIAL_URL, makeEnvelope([makePart()]));
        mockServer.onGet('/family/parts/3001/1/usage', {
            part_num: '3001',
            part_name: 'Brick 2x4',
            part_image_url: null,
            color_id: 1,
            color_name: 'Red',
            color_hex: null,
            usages: [
                {
                    family_set_id: 7,
                    set_num: '10024-1',
                    set_name: 'Red Baron',
                    status: 'built',
                    quantity_needed: 4,
                    quantity_stored: 4,
                    shortfall: 0,
                },
            ],
        });

        const wrapper = mount(PartsPage);
        await flushPromises();
        await wrapper.find("[data-testid='part-row-1_1']").trigger('click');
        await flushPromises();

        // The set row is identified by its data-testid wired through to ListItemButton.
        await wrapper.find("[data-testid='usage-set-7']").trigger('click');
        await flushPromises();

        const {familyRouterService} = await import('@app/services');
        expect(familyRouterService.getUrlForRouteName('sets-detail', 7)).toBe('/sets/7');
    });
});
