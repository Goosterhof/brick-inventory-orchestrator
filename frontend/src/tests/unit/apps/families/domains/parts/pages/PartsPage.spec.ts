import PartUsageModal from '@app/domains/parts/modals/PartUsageModal.vue';
import PartsPage from '@app/domains/parts/pages/PartsPage.vue';
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

const {mockGetRequest, mockGoToRoute} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

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

vi.mock('@shared/helpers/csv', () => ({downloadCsv: vi.fn<() => void>(), toCsv: vi.fn<() => string>()}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);

const mockPartsData = [
    {
        partId: 10,
        partNum: '3001',
        partName: 'Brick 2 x 4',
        partImageUrl: 'https://example.com/3001.jpg',
        colorId: 1,
        colorName: 'Red',
        colorRgb: 'CC0000',
        storageOptionId: 5,
        storageOptionName: 'Drawer A',
        quantity: 8,
        familySetId: 1,
    },
    {
        partId: 10,
        partNum: '3001',
        partName: 'Brick 2 x 4',
        partImageUrl: 'https://example.com/3001.jpg',
        colorId: 1,
        colorName: 'Red',
        colorRgb: 'CC0000',
        storageOptionId: 6,
        storageOptionName: 'Drawer B',
        quantity: 4,
        familySetId: 1,
    },
    {
        partId: 20,
        partNum: '3002',
        partName: 'Brick 2 x 3',
        partImageUrl: null,
        colorId: 5,
        colorName: 'Blue',
        colorRgb: '0000CC',
        storageOptionId: 5,
        storageOptionName: 'Drawer A',
        quantity: 3,
        familySetId: null,
    },
];

/** Wrap parts data in cursor pagination envelope. */
const makeEnvelope = (data: Record<string, unknown>[] = mockPartsData, nextCursor: string | null = null) => ({
    data,
    nextCursor: nextCursor,
    prevCursor: null,
    path: '/api/family/parts',
    perPage: 100,
});

describe('PartsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page header', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

        // Act
        const wrapper = shallowMount(PartsPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(PageHeader).props('title')).toBe('parts.title');
    });

    it('should fetch parts on mount with per_page=100', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

        // Act
        shallowMount(PartsPage);
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family/parts?per_page=100');
    });

    it('should show loading state initially', () => {
        // Arrange
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = shallowMount(PartsPage);

        // Assert
        expect(wrapper.text()).toContain('common.loading');
    });

    it('should show empty state when no parts', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

        // Act
        const wrapper = shallowMount(PartsPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).props('message')).toBe('parts.noParts');
    });

    it('should group parts by part+color and show total quantity', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: makeEnvelope()});

        // Act
        const wrapper = shallowMount(PartsPage);
        await flushPromises();

        // Assert
        const items = wrapper.findAllComponents(PartListItem);
        expect(items).toHaveLength(2);

        const brick2x4 = items.find((item) => item.props('name') === 'Brick 2 x 4');
        expect(brick2x4?.props('quantity')).toBe(12);
        expect(brick2x4?.props('colorName')).toBe('Red');

        const brick2x3 = items.find((item) => item.props('name') === 'Brick 2 x 3');
        expect(brick2x3?.props('quantity')).toBe(3);
        expect(brick2x3?.props('colorName')).toBe('Blue');
    });

    it('should display storage location badges', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: makeEnvelope()});

        // Act
        const wrapper = shallowMount(PartsPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Drawer A (8x)');
        expect(wrapper.text()).toContain('Drawer B (4x)');
    });

    it('should handle fetch error gracefully', async () => {
        // Arrange
        mockGetRequest.mockRejectedValue(new Error('Network error'));

        // Act
        const wrapper = shallowMount(PartsPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);
    });

    describe('search', () => {
        it('should filter parts by name', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('Brick 2 x 3');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('name') === 'Brick 2 x 3')?.exists()).toBe(true);
        });

        it('should filter parts by part number', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('3001');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('name') === 'Brick 2 x 4')?.exists()).toBe(true);
        });

        it('should be case-insensitive', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('brick 2 x 3');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(1);
        });

        it('should show no results when search matches nothing', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('nonexistent');
            await flushPromises();

            // Assert
            const emptyStates = wrapper.findAllComponents(EmptyState);
            const noResults = emptyStates.find((e) => e.props('message') === 'parts.noResults');
            expect(noResults?.exists()).toBe(true);
        });
    });

    describe('color filter', () => {
        it('should display unique color chips', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const chips = wrapper.findAllComponents(FilterChip);
            const chipTexts = chips.map((c) => c.text());
            expect(chipTexts).toContain('Blue');
            expect(chipTexts).toContain('Red');
        });

        it('should show all-colors chip', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const chips = wrapper.findAllComponents(FilterChip);
            const allColorsChip = chips.find((c) => c.text() === 'parts.allColors');
            expect(allColorsChip?.exists()).toBe(true);
            expect(allColorsChip?.props('active')).toBe(true);
        });

        it('should filter parts by color when a color chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const blueChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'Blue');
            blueChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('colorName') === 'Blue')?.exists()).toBe(true);
        });

        it('should toggle color filter off when clicked again', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const blueChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'Blue');
            blueChip?.vm.$emit('click');
            blueChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);
        });

        it('should clear color filter when all-colors chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Apply a color filter first
            const blueChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'Blue');
            blueChip?.vm.$emit('click');
            await flushPromises();
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(1);

            // Act
            const allChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.allColors');
            allChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);
        });
    });

    describe('sort', () => {
        it('should display sort chips', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const chips = wrapper.findAllComponents(FilterChip);
            const chipTexts = chips.map((c) => c.text());
            expect(chipTexts).toContain('parts.sortName');
            expect(chipTexts).toContain('parts.sortQuantity');
            expect(chipTexts).toContain('parts.sortColor');
        });

        it('should sort by name by default (alphabetical)', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const names = wrapper.findAllComponents(PartListItem).map((i) => i.props('name'));
            expect(names).toStrictEqual(['Brick 2 x 3', 'Brick 2 x 4']);
        });

        it('should sort by quantity descending when quantity chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const quantityChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.sortQuantity');
            quantityChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const quantities = wrapper.findAllComponents(PartListItem).map((i) => i.props('quantity'));
            expect(quantities).toStrictEqual([12, 3]);
        });

        it('should sort by color name when color sort chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const colorSortChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.sortColor');
            colorSortChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const colors = wrapper.findAllComponents(PartListItem).map((i) => i.props('colorName'));
            expect(colors).toStrictEqual(['Blue', 'Red']);
        });

        it('should mark the active sort chip', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — name is active by default
            const nameChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.sortName');
            expect(nameChip?.props('active')).toBe(true);
        });
    });

    describe('orphan parts', () => {
        it('should mark parts without a family set as orphans', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — Brick 2 x 3 has familySetId: null so it's an orphan
            expect(wrapper.text()).toContain('parts.orphanParts');
        });

        it('should filter to only orphan parts when orphan chip is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const orphanChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.orphanParts');
            orphanChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('name') === 'Brick 2 x 3')?.exists()).toBe(true);
        });

        it('should toggle orphan filter off when clicked again', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const orphanChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.orphanParts');
            orphanChip?.vm.$emit('click');
            orphanChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);
        });

        it('should show orphan badge on orphan part items', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — the orphan badge text appears for Brick 2 x 3
            const orphanBadges = wrapper.findAll('span').filter((s) => s.text() === 'parts.orphanParts');
            expect(orphanBadges.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('combined filters', () => {
        it('should apply search and color filter together', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act — search for "Brick" and filter by Red
            await wrapper.findComponent(TextInput).setValue('Brick');
            const redChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'Red');
            redChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('colorName') === 'Red')?.exists()).toBe(true);
        });

        it('should apply search and orphan filter together', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act — search for "Brick" and filter orphans only
            await wrapper.findComponent(TextInput).setValue('Brick');
            const orphanChip = wrapper.findAllComponents(FilterChip).find((c) => c.text() === 'parts.orphanParts');
            orphanChip?.vm.$emit('click');
            await flushPromises();

            // Assert
            const items = wrapper.findAllComponents(PartListItem);
            expect(items).toHaveLength(1);
            expect(items.find((i) => i.props('name') === 'Brick 2 x 3')?.exists()).toBe(true);
        });
    });

    describe('pagination', () => {
        it('should not show load more button when next_cursor is null', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope(mockPartsData, null)});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(false);
        });

        it('should show load more button when next_cursor is present', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope(mockPartsData, 'cursor-abc')});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const button = wrapper.find("[data-testid='load-more-button']");
            expect(button.exists()).toBe(true);
            expect(button.text()).toBe('parts.loadMore');
        });

        it('should fetch next page and append results when load more is clicked', async () => {
            // Arrange — first page with cursor
            mockGetRequest.mockResolvedValueOnce({data: makeEnvelope(mockPartsData, 'cursor-page-2')});

            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(2);

            // Arrange — second page with no cursor
            mockGetRequest.mockResolvedValueOnce({
                data: makeEnvelope(
                    [
                        {
                            partId: 30,
                            partNum: '3003',
                            partName: 'Brick 1 x 2',
                            partImageUrl: null,
                            colorId: 3,
                            colorName: 'Green',
                            colorRgb: '00CC00',
                            storageOptionId: 7,
                            storageOptionName: 'Drawer C',
                            quantity: 6,
                            familySetId: 2,
                        },
                    ],
                    null,
                ),
            });

            // Act
            await wrapper.find("[data-testid='load-more-button']").trigger('click');
            await flushPromises();

            // Assert — 2 original grouped + 1 new = 3
            expect(wrapper.findAllComponents(PartListItem)).toHaveLength(3);
            expect(mockGetRequest).toHaveBeenCalledWith('/family/parts?per_page=100&cursor=cursor-page-2');
        });

        it('should hide load more button after last page', async () => {
            // Arrange
            mockGetRequest.mockResolvedValueOnce({data: makeEnvelope(mockPartsData, 'cursor-page-2')});

            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(true);

            // Arrange — last page
            mockGetRequest.mockResolvedValueOnce({data: makeEnvelope([], null)});

            // Act
            await wrapper.find("[data-testid='load-more-button']").trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(false);
        });

        it('should show loading state on load more button while fetching', async () => {
            // Arrange
            mockGetRequest.mockResolvedValueOnce({data: makeEnvelope(mockPartsData, 'cursor-page-2')});

            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Arrange — next page hangs
            mockGetRequest.mockReturnValueOnce(new Promise(() => {}));

            // Act
            await wrapper.find("[data-testid='load-more-button']").trigger('click');

            // Assert — button shows loading text and is disabled
            const button = wrapper.find("[data-testid='load-more-button']");
            expect(button.text()).toBe('parts.loadingMore');
            expect(button.attributes('disabled')).toBeDefined();
        });

        it('should not fetch when loadMore is called without a cursor', async () => {
            // Arrange — no cursor
            mockGetRequest.mockResolvedValue({data: makeEnvelope(mockPartsData, null)});

            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — no button, and only 1 call was made (the initial fetch)
            expect(wrapper.find("[data-testid='load-more-button']").exists()).toBe(false);
            expect(mockGetRequest).toHaveBeenCalledTimes(1);
        });
    });

    describe('export', () => {
        it('should show export button when parts exist', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const exportButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'common.export');
            expect(exportButton?.exists()).toBe(true);
        });

        it('should not show export button when no parts exist', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const exportButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'common.export');
            expect(exportButton).toBeUndefined();
        });
    });

    describe('missing parts CTA', () => {
        it('renders the CTA regardless of whether any parts are stored', async () => {
            // Arrange — no parts should still offer the CTA so the user can discover the feature early
            mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const cta = wrapper.find("[data-testid='parts-missing-cta']");
            expect(cta.exists()).toBe(true);
            expect(cta.text()).toBe('parts.seeMissingCta');
        });

        it('navigates to the parts-missing route when the CTA is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.find("[data-testid='parts-missing-cta']").trigger('click');

            // Assert
            expect(mockGoToRoute).toHaveBeenCalledWith('parts-missing');
        });
    });

    describe('unsorted parts CTA', () => {
        it('renders the CTA regardless of whether any parts are stored', async () => {
            // Arrange — the placement-workflow CTA is discoverable from day one,
            // even before the user has anything sorted.
            mockGetRequest.mockResolvedValue({data: makeEnvelope([])});

            // Act
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert
            const cta = wrapper.find("[data-testid='parts-unsorted-cta']");
            expect(cta.exists()).toBe(true);
            expect(cta.text()).toBe('parts.seeUnsortedCta');
        });

        it('navigates to the parts-unsorted route when the CTA is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            await wrapper.find("[data-testid='parts-unsorted-cta']").trigger('click');

            // Assert
            expect(mockGoToRoute).toHaveBeenCalledWith('parts-unsorted');
        });

        it('coexists with the missing-parts CTA — both are rendered, neither replaces the other', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — both doors into the same data are visible side by side
            expect(wrapper.find("[data-testid='parts-missing-cta']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='parts-unsorted-cta']").exists()).toBe(true);
        });
    });

    describe('reverse lookup modal', () => {
        it('opens PartUsageModal with the row partNum and colorId when a row is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // No modal until a row is clicked (gated by usageColorId !== null)
            expect(wrapper.findComponent(PartUsageModal).exists()).toBe(false);

            // Act — click the Brick 2 x 4 / Red row (partId 10, colorId 1)
            await wrapper.find("[data-testid='part-row-10_1']").trigger('click');

            // Assert
            const modal = wrapper.findComponent(PartUsageModal);
            expect(modal.exists()).toBe(true);
            expect(modal.props('open')).toBe(true);
            expect(modal.props('partNum')).toBe('3001');
            expect(modal.props('colorId')).toBe(1);
        });

        it('closes the modal when it emits close', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();
            await wrapper.find("[data-testid='part-row-10_1']").trigger('click');

            // Act
            wrapper.findComponent(PartUsageModal).vm.$emit('close');
            await flushPromises();

            // Assert — modal stays mounted (we keep the last partNum/colorId) but is closed
            expect(wrapper.findComponent(PartUsageModal).props('open')).toBe(false);
        });

        it('includes the part name in the aria-label for each row button', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: makeEnvelope()});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Assert — generic label alone is insufficient; the part name must be appended
            const row = wrapper.find("[data-testid='part-row-10_1']");
            expect(row.attributes('aria-label')).toContain('parts.usageOpenModalLabel');
            expect(row.attributes('aria-label')).toContain('Brick 2 x 4');
        });

        it('does not open the modal for orphan rows whose colorId is null', async () => {
            // Arrange — orphan row with colorId null
            const orphanData = [
                {
                    partId: 30,
                    partNum: '3003',
                    partName: 'Mystery Brick',
                    partImageUrl: null,
                    colorId: null,
                    colorName: null,
                    colorRgb: null,
                    storageOptionId: 9,
                    storageOptionName: 'Drawer Z',
                    quantity: 2,
                    familySetId: null,
                },
            ];
            mockGetRequest.mockResolvedValue({data: makeEnvelope(orphanData)});
            const wrapper = shallowMount(PartsPage);
            await flushPromises();

            // Act
            const orphanRow = wrapper.find("[data-testid='part-row-30_null']");
            expect(orphanRow.attributes('disabled')).toBeDefined();
            await orphanRow.trigger('click');

            // Assert — modal stays unmounted because usageColorId never left its null initial value
            expect(wrapper.findComponent(PartUsageModal).exists()).toBe(false);
        });
    });
});
