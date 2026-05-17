import SetsOverviewPage from '@app/domains/sets/pages/SetsOverviewPage.vue';
import CollapsibleSection from '@shared/components/CollapsibleSection.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {
    createMockAxios,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockFamilyStores,
    createMockFormField,
    createMockFormLabel,
    createMockFormError,
} = await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

vi.mock('@phosphor-icons/vue', () => ({PhCaretRight: {template: '<i />', props: ['size', 'weight']}}));

vi.mock('@shared/components/BadgeLabel.vue', () => ({
    default: {name: 'BadgeLabel', template: '<span><slot /></span>', props: ['variant']},
}));

vi.mock('@shared/components/CollapsibleSection.vue', () => ({
    default: {
        name: 'CollapsibleSection',
        template: '<div @click=\'$emit("toggle")\'><slot /></div>',
        props: ['title', 'count', 'expanded'],
    },
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

vi.mock('@shared/components/ListItemButton.vue', () => ({
    default: {name: 'ListItemButton', template: '<div @click=\'$emit("click")\'><slot /></div>', props: ['variant']},
}));

vi.mock('@shared/components/PageHeader.vue', () => ({
    default: {name: 'PageHeader', template: '<header><h1>{{ title }}</h1><slot /></header>', props: ['title']},
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {
        name: 'PrimaryButton',
        template: '<button @click=\'$emit("click")\'><slot /></button>',
        props: ['variant'],
    },
}));

vi.mock('@shared/helpers/csv', () => ({downloadCsv: vi.fn<() => void>(), toCsv: vi.fn<() => string>()}));

vi.mock('@app/domains/sets/components/SetListItem.vue', () => ({
    default: {
        name: 'SetListItem',
        template:
            '<div @click="$emit(\'click\')">' +
            '<span>{{ familySet.set?.name ?? familySet.setNum }}</span>' +
            '<span>{{ familySet.setNum }}</span>' +
            '</div>',
        props: ['familySet', 'completionPercentage', 'completionLoading'],
    },
}));

const {mockRetrieveAll, mockAllItems, mockIsLoading} = await vi.hoisted(async () => {
    const {ref} = await import('vue');
    return {mockRetrieveAll: vi.fn<() => Promise<void>>(), mockAllItems: ref<unknown[]>([]), mockIsLoading: ref(false)};
});

vi.mock('@app/services', async () => {
    const {computed} = await import('vue');

    return createMockFamilyServices({
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: vi.fn<() => Promise<void>>()},
        familyLoadingService: {isLoading: computed(() => mockIsLoading.value)},
    });
});

vi.mock('@app/stores', async () => {
    const {computed} = await import('vue');

    return createMockFamilyStores({
        familySetStoreModule: {
            getAll: computed(() => mockAllItems.value),
            retrieveAll: mockRetrieveAll,
            getById: vi.fn<() => unknown>(),
            getOrFailById: vi.fn<() => Promise<unknown>>(),
            generateNew: vi.fn<() => unknown>(),
        },
    });
});

const mockStarWarsSet = {
    id: 1,
    setId: 10,
    setNum: '75192-1',
    quantity: 2,
    status: 'built' as const,
    purchaseDate: '2024-01-15',
    notes: null,
    set: {
        id: 10,
        setNum: '75192-1',
        name: 'Millennium Falcon',
        year: 2017,
        theme: 'Star Wars',
        numParts: 7541,
        imageUrl: 'https://example.com/75192.jpg',
    },
};

const mockTechnicSet = {
    id: 3,
    setId: 30,
    setNum: '42100-1',
    quantity: 1,
    status: 'built' as const,
    purchaseDate: null,
    notes: null,
    set: {
        id: 30,
        setNum: '42100-1',
        name: 'Liebherr R 9800',
        year: 2019,
        theme: 'Technic',
        numParts: 4108,
        imageUrl: null,
    },
};

const mockStarWarsSet2 = {
    id: 4,
    setId: 40,
    setNum: '75300-1',
    quantity: 1,
    status: 'sealed' as const,
    purchaseDate: null,
    notes: null,
    set: {
        id: 40,
        setNum: '75300-1',
        name: 'Imperial TIE Fighter',
        year: 2021,
        theme: 'Star Wars',
        numParts: 432,
        imageUrl: null,
    },
};

describe('SetsOverviewPage — theme grouping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAllItems.value = [];
        mockIsLoading.value = false;
        mockRetrieveAll.mockResolvedValue(undefined);
    });

    it('should group sets by theme in collapsible sections with correct counts', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockStarWarsSet2, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert — grouping
        const sections = wrapper.findAllComponents(CollapsibleSection);
        expect(sections).toHaveLength(2);
        const titles = sections.map((s) => s.props('title'));
        expect(titles).toContain('Star Wars');
        expect(titles).toContain('Technic');

        // Assert — counts
        const starWars = sections.find((s) => s.props('title') === 'Star Wars');
        const technic = sections.find((s) => s.props('title') === 'Technic');
        expect(starWars?.props('count')).toBe(2);
        expect(technic?.props('count')).toBe(1);
    });

    it('should sort theme groups alphabetically', async () => {
        // Arrange
        mockAllItems.value = [mockTechnicSet, mockStarWarsSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert
        const titles = wrapper.findAllComponents(CollapsibleSection).map((s) => s.props('title'));
        expect(titles).toStrictEqual(['Star Wars', 'Technic']);
    });

    it('should start collapsed and toggle on emit', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert — start collapsed
        const sections = wrapper.findAllComponents(CollapsibleSection);
        for (const section of sections) {
            expect(section.props('expanded')).toBe(false);
        }

        // Act — expand
        const starWarsSection = sections.find((s) => s.props('title') === 'Star Wars');
        starWarsSection?.vm.$emit('toggle');
        await flushPromises();

        // Assert — expanded
        const updated = wrapper.findAllComponents(CollapsibleSection);
        expect(updated.find((s) => s.props('title') === 'Star Wars')?.props('expanded')).toBe(true);
        expect(updated.find((s) => s.props('title') === 'Technic')?.props('expanded')).toBe(false);

        // Act — collapse
        starWarsSection?.vm.$emit('toggle');
        await flushPromises();

        // Assert — collapsed again
        const final = wrapper.findAllComponents(CollapsibleSection);
        expect(final.find((s) => s.props('title') === 'Star Wars')?.props('expanded')).toBe(false);
    });

    it('should group sets with no theme under Unknown', async () => {
        // Arrange
        const noThemeSet = {...mockStarWarsSet, id: 5, set: {...mockStarWarsSet.set, theme: null}};
        mockAllItems.value = [noThemeSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert
        const titles = wrapper.findAllComponents(CollapsibleSection).map((s) => s.props('title'));
        expect(titles).toContain('Unknown');
    });

    it('should maintain grouping when search is active', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockStarWarsSet2, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act
        await wrapper.findComponent(TextInput).setValue('Imperial');
        await flushPromises();

        // Assert — only Star Wars group remains
        const sections = wrapper.findAllComponents(CollapsibleSection);
        expect(sections).toHaveLength(1);
        const starWars = sections.find((s) => s.props('title') === 'Star Wars');
        expect(starWars?.props('count')).toBe(1);
    });

    it('should hide empty theme groups when filtering by status', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act — filter by "built" status
        const builtChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'sets.built');
        builtChip?.vm.$emit('click');
        await flushPromises();

        // Assert
        const sections = wrapper.findAllComponents(CollapsibleSection);
        expect(sections).toHaveLength(2);
    });

    it('should show no results when all groups are filtered out', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act — search for nonexistent
        await wrapper.findComponent(TextInput).setValue('nonexistent');
        await flushPromises();

        // Assert
        const emptyStates = wrapper.findAllComponents(EmptyState);
        const noResults = emptyStates.find((e) => e.props('message') === 'common.noResults');
        expect(noResults?.exists()).toBe(true);
    });
});

describe('SetsOverviewPage — theme filter chips', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAllItems.value = [];
        mockIsLoading.value = false;
        mockRetrieveAll.mockResolvedValue(undefined);
    });

    it('should show theme filter chips when multiple themes exist', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert
        const allChips = wrapper.findAllComponents(FilterChip);
        const themeChips = allChips.filter((chip) => chip.text() === 'Star Wars' || chip.text() === 'Technic');
        expect(themeChips).toHaveLength(2);
    });

    it('should not show theme filter chips when only one theme exists', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert
        const allChips = wrapper.findAllComponents(FilterChip);
        const themeChips = allChips.filter((chip) => chip.text() === 'Star Wars');
        expect(themeChips).toHaveLength(0);
    });

    it('should filter by theme, mark active chips, and deselect on re-click', async () => {
        // Arrange
        mockAllItems.value = [mockStarWarsSet, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act — select Technic
        const technicChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Technic');
        technicChip?.vm.$emit('click');
        await flushPromises();

        // Assert — filtered
        const filteredNames = wrapper
            .findAllComponents({name: 'SetListItem'})
            .map((c) => (c.props('familySet') as {set?: {name?: string}; setNum: string}).set?.name);
        expect(filteredNames).toStrictEqual(['Liebherr R 9800']);

        // Assert — active state
        const updatedTechnicChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Technic');
        const starWarsChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Star Wars');
        expect(updatedTechnicChip?.props('active')).toBe(true);
        expect(starWarsChip?.props('active')).toBe(false);

        // Act — deselect Technic
        technicChip?.vm.$emit('click');
        await flushPromises();

        // Assert — both visible again
        const allNames = wrapper
            .findAllComponents({name: 'SetListItem'})
            .map((c) => (c.props('familySet') as {set?: {name?: string}}).set?.name);
        expect(allNames).toContain('Millennium Falcon');
        expect(allNames).toContain('Liebherr R 9800');
    });

    it('should support multi-select theme filtering', async () => {
        // Arrange
        const mockCitySet = {
            id: 5,
            setId: 50,
            setNum: '60316-1',
            quantity: 1,
            status: 'built' as const,
            purchaseDate: null,
            notes: null,
            set: {
                id: 50,
                setNum: '60316-1',
                name: 'Police Station',
                year: 2022,
                theme: 'City',
                numParts: 668,
                imageUrl: null,
            },
        };
        mockAllItems.value = [mockStarWarsSet, mockTechnicSet, mockCitySet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act — select both Star Wars and Technic
        const starWarsChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Star Wars');
        const technicChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Technic');
        starWarsChip?.vm.$emit('click');
        technicChip?.vm.$emit('click');
        await flushPromises();

        // Assert
        const names = wrapper
            .findAllComponents({name: 'SetListItem'})
            .map((c) => (c.props('familySet') as {set?: {name?: string}}).set?.name);
        expect(names).toContain('Millennium Falcon');
        expect(names).toContain('Liebherr R 9800');
        expect(names).not.toContain('Police Station');
    });

    it('should combine theme and status filters', async () => {
        // Arrange
        const sealedStarWarsSet = {...mockStarWarsSet, id: 6, status: 'sealed' as const};
        mockAllItems.value = [mockStarWarsSet, sealedStarWarsSet, mockTechnicSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Act — filter by Star Wars theme AND built status
        const starWarsChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Star Wars');
        starWarsChip?.vm.$emit('click');
        await flushPromises();

        const builtChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'sets.built');
        builtChip?.vm.$emit('click');
        await flushPromises();

        // Assert — only built Star Wars set visible
        const sections = wrapper.findAllComponents(CollapsibleSection);
        expect(sections).toHaveLength(1);
        const starWars = sections.find((s) => s.props('title') === 'Star Wars');
        expect(starWars?.props('count')).toBe(1);
    });

    it('should show Unknown theme chip for sets without theme', async () => {
        // Arrange
        const noThemeSet = {...mockStarWarsSet, id: 7, set: {...mockStarWarsSet.set, theme: null}};
        mockAllItems.value = [mockStarWarsSet, noThemeSet];
        const wrapper = shallowMount(SetsOverviewPage);
        await flushPromises();

        // Assert
        const unknownChip = wrapper.findAllComponents(FilterChip).find((chip) => chip.text() === 'Unknown');
        expect(unknownChip?.exists()).toBe(true);
    });
});
