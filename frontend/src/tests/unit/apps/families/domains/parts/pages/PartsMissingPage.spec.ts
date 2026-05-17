import PartsMissingPage from '@app/domains/parts/pages/PartsMissingPage.vue';
import BackButton from '@shared/components/BackButton.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {
    createMockAxios,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockFormField,
    createMockFormLabel,
    createMockFormError,
} = await vi.hoisted(() => import('../../../../../../helpers'));

const {mockGetRequest, mockGoToRoute, mockToBrickLinkXml, mockDownloadBrickLink, mockDownloadCsv, mockToCsv} =
    vi.hoisted(() => ({
        mockGetRequest: vi.fn<() => Promise<unknown>>(),
        mockGoToRoute: vi.fn<() => Promise<void>>(),
        mockToBrickLinkXml: vi.fn<(entries: readonly unknown[]) => string>(() => '<xml />'),
        mockDownloadBrickLink: vi.fn<(xml: string, filename: string) => void>(),
        mockDownloadCsv: vi.fn<(csv: string, filename: string) => void>(),
        mockToCsv: vi.fn<(headers: string[], rows: string[][]) => string>(() => 'csv'),
    }));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

vi.mock('@shared/components/BackButton.vue', () => ({
    default: {name: 'BackButton', template: '<button @click=\'$emit("click")\'><slot /></button>'},
}));

vi.mock('@shared/components/EmptyState.vue', () => ({
    default: {name: 'EmptyState', template: '<span><slot /></span>', props: ['message']},
}));

vi.mock('@shared/components/FilterChip.vue', () => ({
    default: {name: 'FilterChip', template: '<button @click=\'$emit("click")\'><slot /></button>', props: ['active']},
}));

vi.mock('@shared/components/forms/inputs/TextInput.vue', () => ({
    default: {
        name: 'TextInput',
        template: '<input @input=\'$emit("update:modelValue", $event.target.value)\' />',
        props: ['modelValue'],
    },
}));

vi.mock('@shared/components/PageHeader.vue', () => ({
    default: {name: 'PageHeader', template: '<header><h1>{{ title }}</h1><slot /></header>', props: ['title']},
}));

vi.mock('@shared/components/PartListItem.vue', () => ({
    default: {
        name: 'PartListItem',
        template: '<div><slot /></div>',
        props: ['name', 'partNum', 'quantity', 'imageUrl', 'colorName', 'colorRgb'],
    },
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {
        name: 'PrimaryButton',
        template: '<button @click=\'$emit("click")\'><slot /></button>',
        props: ['variant'],
    },
}));

vi.mock('@shared/helpers/csv', () => ({downloadCsv: mockDownloadCsv, toCsv: mockToCsv}));
vi.mock('@shared/helpers/bricklinkWantedList', () => ({
    toBrickLinkWantedListXml: mockToBrickLinkXml,
    downloadBrickLinkWantedList: mockDownloadBrickLink,
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);

/**
 * Fixture mirrors the real `/family-sets/missing-parts` shortfall row shape
 * after camelCase conversion at the HTTP boundary. Verified against
 * `app/Http/Resources/FamilyMissingPartsResourceData.php` +
 * `app/Actions/FamilySet/GetFamilyMissingPartsAction.php` (Liaison M3).
 */
const makeEntry = (overrides: Record<string, unknown> = {}) => ({
    partId: 100,
    partNum: '3001',
    colorId: 4,
    partName: 'Brick 2 x 4',
    colorName: 'Red',
    colorHex: 'C91A09',
    partImageUrl: 'https://example.com/3001.jpg',
    quantityNeeded: 10,
    quantityStored: 3,
    shortfall: 7,
    neededBySetNums: ['75313-1', '10497-1'],
    ...overrides,
});

const makePayload = (shortfalls: Record<string, unknown>[] = [makeEntry()], unknownFamilySetIds: string[] = []) => ({
    data: {shortfalls, unknownFamilySetIds},
});

describe('PartsMissingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the page title from translation keys', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([]));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(PageHeader).props('title')).toBe('parts.missingTitle');
    });

    it('fetches the master shopping list on mount', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([]));

        // Act
        shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family-sets/missing-parts');
    });

    it('shows the loading state while the request is in flight', () => {
        // Arrange
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = shallowMount(PartsMissingPage);

        // Assert
        expect(wrapper.find("[data-testid='missing-loading']").exists()).toBe(true);
    });

    it('shows the empty state when there are no entries and no unknown sets', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([]));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).props('message')).toBe('parts.missingEmpty');
    });

    it('shows a non-intrusive error message when the fetch fails', async () => {
        // Arrange
        mockGetRequest.mockRejectedValue(new Error('Network error'));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(wrapper.find("[data-testid='missing-error']").exists()).toBe(true);
    });

    it('renders one PartListItem per entry with shortfall as the quantity', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(
            makePayload([
                makeEntry({partId: 1, partName: 'Brick A', shortfall: 2}),
                makeEntry({partId: 2, partName: 'Brick B', shortfall: 5}),
            ]),
        );

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        const items = wrapper.findAllComponents(PartListItem);
        expect(items).toHaveLength(2);
        const brickB = items.find((i) => i.props('name') === 'Brick B');
        expect(brickB?.props('quantity')).toBe(5);
    });

    it('shows the summary totals (shortfall count and distinct sets)', async () => {
        // Arrange — three distinct LEGO set numbers across the two shortfalls.
        mockGetRequest.mockResolvedValue(
            makePayload([
                makeEntry({partNum: '3001', shortfall: 3, neededBySetNums: ['75313-1', '10497-1']}),
                makeEntry({partNum: '3002', shortfall: 4, neededBySetNums: ['10497-1', '21034-1']}),
            ]),
        );

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        const summaryLine = wrapper.find('[data-total-shortfall]');
        expect(summaryLine.attributes('data-total-shortfall')).toBe('7');
        expect(summaryLine.attributes('data-affected-sets')).toBe('3');
    });

    it('surfaces the unknown-sets callout when unknownFamilySetIds is non-empty', async () => {
        // Arrange — backend stringifies family_set ids on this endpoint.
        mockGetRequest.mockResolvedValue(makePayload([makeEntry()], ['42', '43']));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        const callout = wrapper.find("[data-testid='missing-unknown-sets']");
        expect(callout.exists()).toBe(true);
        expect(callout.attributes('data-unknown-count')).toBe('2');
    });

    it('hides the unknown-sets callout when unknownFamilySetIds is empty', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([makeEntry()]));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(wrapper.find("[data-testid='missing-unknown-sets']").exists()).toBe(false);
    });

    it('renders the unknown-sets callout even when there are no entries', async () => {
        // Arrange — an edge case: all owned sets are unsynced, no shortfall rows
        mockGetRequest.mockResolvedValue(makePayload([], ['11', '12']));

        // Act
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Assert
        expect(wrapper.find("[data-testid='missing-unknown-sets']").exists()).toBe(true);
        expect(wrapper.findComponent(EmptyState).exists()).toBe(false);
    });

    it('navigates back to the parts inventory when the back button is clicked', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([makeEntry()]));
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Act
        await wrapper.findComponent(BackButton).trigger('click');

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('parts');
    });

    it('navigates to settings when the unknown-sets sync link is clicked', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([makeEntry()], ['7']));
        const wrapper = shallowMount(PartsMissingPage);
        await flushPromises();

        // Act
        await wrapper.find("[data-testid='missing-unknown-sets-link']").trigger('click');

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('settings');
    });

    describe('search', () => {
        it('filters by part name (case insensitive)', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(
                makePayload([makeEntry({partId: 1, partName: 'Plate'}), makeEntry({partId: 2, partName: 'Brick'})]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('brick');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('name') === 'Brick')?.exists()).toBe(true);
        });

        it('filters by part number', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(
                makePayload([makeEntry({partId: 1, partNum: '3001'}), makeEntry({partId: 2, partNum: '3002'})]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('3001');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(1);
        });

        it("shows a 'no results' empty state when the search matches nothing", async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(makePayload([makeEntry()]));
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('zzzzzz');
            await flushPromises();

            // Assert
            const emptyStates = wrapper.findAllComponents(EmptyState);
            expect(emptyStates.find((e) => e.props('message') === 'parts.missingNoResults')?.exists()).toBe(true);
        });
    });

    describe('sort', () => {
        it('sorts by shortfall descending by default', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(
                makePayload([
                    makeEntry({partId: 1, partName: 'Small', shortfall: 2}),
                    makeEntry({partId: 2, partName: 'Large', shortfall: 10}),
                    makeEntry({partId: 3, partName: 'Medium', shortfall: 5}),
                ]),
            );

            // Act
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Assert
            const quantities = wrapper.findAllComponents(PartListItem).map((i) => i.props('quantity'));
            expect(quantities).toStrictEqual([10, 5, 2]);
        });

        it('sorts by part name when the name chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(
                makePayload([
                    makeEntry({partId: 1, partName: 'Charlie'}),
                    makeEntry({partId: 2, partName: 'Alpha'}),
                    makeEntry({partId: 3, partName: 'Bravo'}),
                ]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            const nameChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.missingSortName');
            nameChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const names = wrapper.findAllComponents(PartListItem).map((i) => i.props('name'));
            expect(names).toStrictEqual(['Alpha', 'Bravo', 'Charlie']);
        });

        it('sorts by color name when the color chip is clicked (empty strings sort first)', async () => {
            // Arrange — backend always ships a color name string; an empty string
            // (defensive edge case) sorts before alphabetic names via localeCompare.
            mockGetRequest.mockResolvedValue(
                makePayload([
                    makeEntry({partNum: '3001', colorName: 'Red'}),
                    makeEntry({partNum: '3002', colorName: ''}),
                    makeEntry({partNum: '3003', colorName: 'Blue'}),
                ]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            const colorChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.missingSortColor');
            colorChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const colors = wrapper.findAllComponents(PartListItem).map((i) => i.props('colorName'));
            expect(colors).toStrictEqual(['', 'Blue', 'Red']);
        });

        it('marks the active sort chip as active', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(makePayload([makeEntry()]));

            // Act
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Assert — shortfall is active by default
            const shortfallChip = wrapper
                .findAllComponents(FilterChip)
                .find((c) => c.text() === 'parts.missingSortShortfall');
            expect(shortfallChip?.props('active')).toBe(true);
        });
    });

    describe('export', () => {
        it('shows the export buttons when there are entries', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(makePayload([makeEntry()]));

            // Act
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Assert
            const labels = wrapper.findAllComponents(PrimaryButton).map((b) => b.text());
            expect(labels).toContain('parts.missingExportBrickLink');
            expect(labels).toContain('parts.missingExportCsv');
        });

        it('hides the export buttons when there are no entries', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(makePayload([], ['1']));

            // Act
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Assert
            const labels = wrapper.findAllComponents(PrimaryButton).map((b) => b.text());
            expect(labels).not.toContain('parts.missingExportBrickLink');
            expect(labels).not.toContain('parts.missingExportCsv');
        });

        it('passes filtered entries (search + sort respected) to the BrickLink helper', async () => {
            // Arrange — backend has no Rebrickable→BrickLink colour mapping yet, so
            // the page emits `brickLinkColorId: null` for every entry (the helper
            // omits `<COLOR>` for null/undefined). See bricklinkWantedList.ts CAVEAT.
            mockGetRequest.mockResolvedValue(
                makePayload([makeEntry({partNum: '3001', shortfall: 3}), makeEntry({partNum: '3002', shortfall: 7})]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('3002');
            await flushPromises();
            const exportBtn = wrapper
                .findAllComponents(PrimaryButton)
                .find((b) => b.text() === 'parts.missingExportBrickLink');
            exportBtn?.vm.$emit('click');
            await flushPromises();

            // Assert
            expect(mockToBrickLinkXml).toHaveBeenCalledWith([{partNum: '3002', brickLinkColorId: null, shortfall: 7}]);
            expect(mockDownloadBrickLink).toHaveBeenCalledWith('<xml />', 'bricklink-wanted-list.xml');
        });

        it('passes the full column set to the CSV helper', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue(
                makePayload([
                    makeEntry({
                        partNum: '3001',
                        partName: 'Brick 2 x 4',
                        colorName: 'Red',
                        quantityNeeded: 10,
                        quantityStored: 3,
                        shortfall: 7,
                        neededBySetNums: ['75313-1', '10497-1'],
                    }),
                ]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            const exportBtn = wrapper
                .findAllComponents(PrimaryButton)
                .find((b) => b.text() === 'parts.missingExportCsv');
            exportBtn?.vm.$emit('click');
            await flushPromises();

            // Assert
            expect(mockToCsv).toHaveBeenCalledWith(
                [
                    'Part Number',
                    'Part Name',
                    'Color',
                    'Quantity Needed',
                    'Quantity Stored',
                    'Shortfall',
                    'Needed By Sets',
                ],
                [['3001', 'Brick 2 x 4', 'Red', '10', '3', '7', '2']],
            );
            expect(mockDownloadCsv).toHaveBeenCalledWith('csv', 'master-shopping-list.csv');
        });

        it('emits a CSV row with the color name verbatim (defensive empty-string case)', async () => {
            // Arrange — defensive: if backend ever ships an empty colorName,
            // the CSV column should reflect that without crashing.
            mockGetRequest.mockResolvedValue(
                makePayload([
                    makeEntry({
                        partNum: '3001',
                        colorName: '',
                        quantityNeeded: 1,
                        quantityStored: 0,
                        shortfall: 1,
                        neededBySetNums: ['10497-1'],
                    }),
                ]),
            );
            const wrapper = shallowMount(PartsMissingPage);
            await flushPromises();

            // Act
            const exportBtn = wrapper
                .findAllComponents(PrimaryButton)
                .find((b) => b.text() === 'parts.missingExportCsv');
            exportBtn?.vm.$emit('click');
            await flushPromises();

            // Assert
            const rowArg = mockToCsv.mock.calls[0]?.[1];
            expect(rowArg?.[0]?.[2]).toBe('');
        });
    });
});
