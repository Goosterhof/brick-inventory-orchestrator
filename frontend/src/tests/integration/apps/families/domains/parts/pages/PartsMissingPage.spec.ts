import PartsMissingPage from '@app/domains/parts/pages/PartsMissingPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import BackButton from '@shared/components/BackButton.vue';
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

/** CSV + XML helpers don't run in happy-dom — mock to prevent file system access. */
vi.mock('@shared/helpers/csv', () => ({downloadCsv: vi.fn<() => void>(), toCsv: vi.fn<() => string>(() => '')}));
vi.mock('@shared/helpers/bricklinkWantedList', () => ({
    toBrickLinkWantedListXml: vi.fn<() => string>(() => '<xml />'),
    downloadBrickLinkWantedList: vi.fn<() => void>(),
}));

/**
 * Snake_case fixture — matching the real `/family-sets/missing-parts`
 * response shape verified against
 * `app/Http/Resources/FamilyMissingPartsResourceData.php` +
 * `app/Actions/FamilySet/GetFamilyMissingPartsAction.php` (Liaison M3,
 * 2026-04-30).
 */
const makeEntry = (overrides: Record<string, unknown> = {}) => ({
    part_id: 100,
    part_num: '3001',
    color_id: 4,
    part_name: 'Brick 2x4',
    color_name: 'Red',
    color_hex: 'C91A09',
    part_image_url: 'https://example.com/3001.jpg',
    quantity_needed: 10,
    quantity_stored: 3,
    shortfall: 7,
    needed_by_set_nums: ['75313-1', '10497-1'],
    ...overrides,
});

const makePayload = (entries: Record<string, unknown>[] = [], unknownFamilySetIds: string[] = []) => ({
    shortfalls: entries,
    unknown_family_set_ids: unknownFamilySetIds,
});

const URL_MISSING = '/family-sets/missing-parts';

describe('PartsMissingPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    it('renders the empty state with the real EmptyState when no parts are missing', async () => {
        mockServer.onGet(URL_MISSING, makePayload([]));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        const empty = wrapper.findComponent(EmptyState);
        expect(empty.exists()).toBe(true);
        expect(empty.text()).toContain('All parts accounted for');
    });

    it('renders the PageHeader with a translated title', async () => {
        mockServer.onGet(URL_MISSING, makePayload([makeEntry()]));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        expect(wrapper.findComponent(PageHeader).find('h1').text()).toBe('Master Shopping List');
    });

    it('renders a PartListItem per missing entry with the shortfall as the displayed quantity', async () => {
        mockServer.onGet(URL_MISSING, makePayload([makeEntry({shortfall: 4, part_name: 'Plate 1x2'})]));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        const items = wrapper.findAllComponents(PartListItem);
        expect(items).toHaveLength(1);
        const item = items[0];
        expect(item?.props('name')).toBe('Plate 1x2');
        expect(item?.props('quantity')).toBe(4);
    });

    it('shows the unknown-sets callout when the backend reports unsynced sets', async () => {
        mockServer.onGet(URL_MISSING, makePayload([makeEntry()], ['42', '43']));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        const callout = wrapper.find("[data-testid='missing-unknown-sets']");
        expect(callout.exists()).toBe(true);
        expect(callout.attributes('data-unknown-count')).toBe('2');
    });

    it('surfaces the non-intrusive error banner on fetch failure', async () => {
        // Register no route — the mock server rejects unregistered GETs.
        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        expect(wrapper.find("[data-testid='missing-error']").exists()).toBe(true);
    });

    it('wires the BackButton and export buttons as real PrimaryButton components', async () => {
        mockServer.onGet(URL_MISSING, makePayload([makeEntry()]));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        const back = wrapper.findComponent(BackButton);
        expect(back.exists()).toBe(true);

        const buttonLabels = wrapper.findAllComponents(PrimaryButton).map((b) => b.text());
        expect(buttonLabels).toContain('Export BrickLink wanted list');
        expect(buttonLabels).toContain('Export CSV');
    });

    it('renders the sort and search FilterChips as real components', async () => {
        mockServer.onGet(URL_MISSING, makePayload([makeEntry()]));

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        const chipTexts = wrapper.findAllComponents(FilterChip).map((c) => c.text());
        expect(chipTexts).toContain('Most missing');
        expect(chipTexts).toContain('Part name');
        expect(chipTexts).toContain('Color');
    });

    it('filters the PartListItem list when a search term is entered', async () => {
        mockServer.onGet(
            URL_MISSING,
            makePayload([
                makeEntry({part_name: 'Brick 2x4', part_num: '3001'}),
                makeEntry({part_name: 'Plate 1x2', part_num: '3023'}),
            ]),
        );

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);

        await wrapper.findComponent(TextInput).setValue('Plate');
        await flushPromises();

        const items = wrapper.findAllComponents(PartListItem);
        expect(items).toHaveLength(1);
        expect(items[0]?.props('name')).toBe('Plate 1x2');
    });

    it('reorders PartListItems when a sort FilterChip is clicked', async () => {
        mockServer.onGet(
            URL_MISSING,
            makePayload([
                makeEntry({part_name: 'Brick 2x4', part_num: '3001', shortfall: 9}),
                makeEntry({part_name: 'Axle 2', part_num: '3705', shortfall: 2}),
            ]),
        );

        const wrapper = mount(PartsMissingPage);
        await flushPromises();

        // Default sort: shortfall descending — Brick 2x4 (9) first
        const namesByShortfall = wrapper.findAllComponents(PartListItem).map((i) => i.props('name'));
        expect(namesByShortfall).toStrictEqual(['Brick 2x4', 'Axle 2']);

        const nameChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'Part name');
        await nameChip?.find('button').trigger('click');
        await flushPromises();

        // After switching to name sort: Axle 2 < Brick 2x4 alphabetically
        const namesByName = wrapper.findAllComponents(PartListItem).map((i) => i.props('name'));
        expect(namesByName).toStrictEqual(['Axle 2', 'Brick 2x4']);
    });

    /**
     * Backend-contract regression guard (Liaison M3 / Medic 2026-04-30).
     *
     * The page previously consumed an imagined contract — `payload.entries`,
     * per-entry `neededByFamilySetIds: number[]`, and `brickLinkColorId`. The
     * real `/family-sets/missing-parts` response ships `shortfalls`,
     * `needed_by_set_nums: list<string>` (LEGO set numbers like "75313-1"), and
     * `unknown_family_set_ids: list<string>` — verified against
     * `app/Http/Resources/FamilyMissingPartsResourceData.php` +
     * `app/Actions/FamilySet/GetFamilyMissingPartsAction.php`. This block fails
     * the page if it ever regresses to the phantom contract.
     */
    describe('real backend contract', () => {
        it('renders a PartListItem for every shortfall the backend ships', async () => {
            mockServer.onGet(URL_MISSING, makePayload([makeEntry({part_name: 'Plate 1x2', shortfall: 4})]));

            const wrapper = mount(PartsMissingPage);
            await flushPromises();

            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            const item = items[0];
            expect(item?.props('name')).toBe('Plate 1x2');
            expect(item?.props('quantity')).toBe(4);
        });

        it('counts distinct set_nums across all shortfalls in the affected-sets summary', async () => {
            mockServer.onGet(
                URL_MISSING,
                makePayload([
                    makeEntry({part_num: '3001', shortfall: 3, needed_by_set_nums: ['75313-1', '10497-1']}),
                    makeEntry({part_num: '3002', shortfall: 4, needed_by_set_nums: ['10497-1', '21034-1']}),
                ]),
            );

            const wrapper = mount(PartsMissingPage);
            await flushPromises();

            const summaryLine = wrapper.find('[data-total-shortfall]');
            expect(summaryLine.attributes('data-total-shortfall')).toBe('7');
            // Three distinct set_nums: 75313-1, 10497-1, 21034-1.
            expect(summaryLine.attributes('data-affected-sets')).toBe('3');
        });

        it('renders the unknown-sets callout for string-typed family_set_ids', async () => {
            mockServer.onGet(URL_MISSING, makePayload([makeEntry()], ['42', '43']));

            const wrapper = mount(PartsMissingPage);
            await flushPromises();

            const callout = wrapper.find("[data-testid='missing-unknown-sets']");
            expect(callout.exists()).toBe(true);
            expect(callout.attributes('data-unknown-count')).toBe('2');
        });

        it('renders the unknown-sets callout when shortfalls is empty but unknown sets are present', async () => {
            mockServer.onGet(URL_MISSING, makePayload([], ['11', '12']));

            const wrapper = mount(PartsMissingPage);
            await flushPromises();

            expect(wrapper.find("[data-testid='missing-unknown-sets']").exists()).toBe(true);
            expect(wrapper.findComponent(EmptyState).exists()).toBe(false);
        });
    });
});
