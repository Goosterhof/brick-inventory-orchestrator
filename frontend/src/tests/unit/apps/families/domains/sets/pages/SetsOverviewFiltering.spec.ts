import SetsOverviewPage from '@app/domains/sets/pages/SetsOverviewPage.vue';
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
            '<span>sets.{{ familySet.status }}</span>' +
            '<span>{{ familySet.quantity }}x</span>' +
            '</div>',
        props: ['familySet', 'completionPercentage', 'completionLoading'],
    },
}));

const {mockRetrieveAll, mockGoToRoute, mockAllItems, mockIsLoading, mockGetRequest} = await vi.hoisted(async () => {
    const {ref} = await import('vue');
    return {
        mockRetrieveAll: vi.fn<() => Promise<void>>(),
        mockGoToRoute: vi.fn<() => Promise<void>>(),
        mockAllItems: ref<unknown[]>([]),
        mockIsLoading: ref(false),
        mockGetRequest: vi.fn<() => Promise<unknown>>(),
    };
});

vi.mock('@app/services', async () => {
    const {computed} = await import('vue');

    return createMockFamilyServices({
        familyAuthService: {isLoggedIn: {value: true}},
        familyHttpService: {getRequest: mockGetRequest},
        familyRouterService: {goToRoute: mockGoToRoute},
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

const mockAdaptedSet = {
    id: 1,
    setId: 10,
    setNum: '75192-1',
    quantity: 2,
    status: 'built' as const,
    purchaseDate: '2024-01-15',
    notes: 'Test notes',
    set: {
        id: 10,
        setNum: '75192-1',
        name: 'Millennium Falcon',
        year: 2017,
        theme: {id: 158, name: 'Star Wars', parentId: null},
        numParts: 7541,
        imageUrl: 'https://example.com/75192.jpg',
    },
};

const mockSealedSet = {
    id: 2,
    setId: 20,
    setNum: '10294-1',
    quantity: 1,
    status: 'sealed' as const,
    purchaseDate: null,
    notes: null,
    set: {
        id: 20,
        setNum: '10294-1',
        name: 'Titanic',
        year: 2021,
        theme: {id: 673, name: 'Creator Expert', parentId: null},
        numParts: 9090,
        imageUrl: null,
    },
};

const renderedSetNames = (wrapper: ReturnType<typeof shallowMount>): string[] =>
    wrapper
        .findAllComponents({name: 'SetListItem'})
        .map((c) => c.props('familySet') as {set?: {name?: string}; setNum: string})
        .map((fs) => fs.set?.name ?? fs.setNum);

describe('SetsOverviewPage — filtering and view modes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAllItems.value = [];
        mockIsLoading.value = false;
        mockRetrieveAll.mockResolvedValue(undefined);
        mockGetRequest.mockResolvedValue({data: []});
    });

    describe('search and filter', () => {
        it('should filter sets by search query', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent({name: 'TextInput'}).setValue('Titanic');
            await flushPromises();

            // Assert
            expect(renderedSetNames(wrapper)).toStrictEqual(['Titanic']);
        });

        it('should filter sets by set number', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent({name: 'TextInput'}).setValue('75192');
            await flushPromises();

            // Assert
            expect(renderedSetNames(wrapper)).toStrictEqual(['Millennium Falcon']);
        });

        it('should filter wishlist sets by set number when no nested set summary exists', async () => {
            // Arrange — wishlist item without a resolved set summary; only top-level setNum is available
            const wishlistSet = {
                id: 3,
                setId: 0,
                setNum: '40000-1',
                quantity: 1,
                status: 'wishlist' as const,
                purchaseDate: null,
                notes: null,
            };
            mockAllItems.value = [mockAdaptedSet, wishlistSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent({name: 'TextInput'}).setValue('40000');
            await flushPromises();

            // Assert
            expect(renderedSetNames(wrapper)).toStrictEqual(['40000-1']);
        });

        it('should filter sets by status', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act — click "sealed" status filter
            const sealedChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((chip) => chip.text() === 'sets.sealed');
            await sealedChip?.trigger('click');
            await flushPromises();

            // Assert
            expect(renderedSetNames(wrapper)).toStrictEqual(['Titanic']);
        });

        it('should toggle status filter off when clicked again', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act — click sealed, then click sealed again
            const sealedChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((chip) => chip.text() === 'sets.sealed');
            await sealedChip?.trigger('click');
            await sealedChip?.trigger('click');
            await flushPromises();

            // Assert — both sets visible
            const names = renderedSetNames(wrapper);
            expect(names).toContain('Millennium Falcon');
            expect(names).toContain('Titanic');
        });

        it('should filter sets by theme chip', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            const themeChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((chip) => chip.text() === 'Star Wars');
            await themeChip?.trigger('click');
            await flushPromises();

            // Assert
            expect(renderedSetNames(wrapper)).toStrictEqual(['Millennium Falcon']);
        });

        it('should toggle theme filter off when clicked again', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            const themeChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((chip) => chip.text() === 'Star Wars');
            await themeChip?.trigger('click');
            await themeChip?.trigger('click');
            await flushPromises();

            // Assert
            const names = renderedSetNames(wrapper);
            expect(names).toContain('Millennium Falcon');
            expect(names).toContain('Titanic');
        });

        it('should show no results when search matches nothing', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent({name: 'TextInput'}).setValue('nonexistent');
            await flushPromises();

            // Assert
            const emptyStates = wrapper.findAllComponents({name: 'EmptyState'});
            const noResults = emptyStates.find((e) => e.props('message') === 'common.noResults');
            expect(noResults?.exists()).toBe(true);
        });
    });

    describe('view mode toggle', () => {
        it('should default to grouped view (CollapsibleSection per theme)', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];

            // Act
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Assert
            const sections = wrapper.findAllComponents({name: 'CollapsibleSection'});
            expect(sections).toHaveLength(2);
            const titles = sections.map((s) => s.props('title') as string);
            expect(titles).toContain('Star Wars');
            expect(titles).toContain('Creator Expert');
        });

        it('should switch to flat view when "All sets" chip is clicked', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            const allSetsChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewAllSets');
            await allSetsChip?.trigger('click');
            await flushPromises();

            // Assert — no theme groupings in flat view
            expect(wrapper.findAllComponents({name: 'CollapsibleSection'})).toHaveLength(0);
            const items = wrapper.findAllComponents({name: 'SetListItem'});
            expect(items).toHaveLength(2);
        });

        it('should sort flat view alphabetically by set name', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act — switch to flat
            const allSetsChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewAllSets');
            await allSetsChip?.trigger('click');
            await flushPromises();

            // Assert — Millennium Falcon comes before Titanic alphabetically
            const names = renderedSetNames(wrapper);
            expect(names).toStrictEqual(['Millennium Falcon', 'Titanic']);
        });

        it('should switch back to grouped view when "By theme" chip is clicked', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet, mockSealedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act — flip to flat then back to grouped
            const allSetsChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewAllSets');
            await allSetsChip?.trigger('click');
            await flushPromises();

            const byThemeChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewByTheme');
            await byThemeChip?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents({name: 'CollapsibleSection'})).toHaveLength(2);
        });

        it('should mark the active view mode chip as active', async () => {
            // Arrange
            mockAllItems.value = [mockAdaptedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Assert default
            const byThemeChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewByTheme');
            const allSetsChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewAllSets');
            expect(byThemeChip?.props('active')).toBe(true);
            expect(allSetsChip?.props('active')).toBe(false);

            // Act
            await allSetsChip?.trigger('click');
            await flushPromises();

            // Assert
            expect(byThemeChip?.props('active')).toBe(false);
            expect(allSetsChip?.props('active')).toBe(true);
        });

        it('should pass completion data to SetListItem in flat view', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({
                data: [{familySetId: 1, setNum: '75192-1', totalParts: 100, storedParts: 78, percentage: 78}],
            });
            mockAllItems.value = [mockAdaptedSet];
            const wrapper = shallowMount(SetsOverviewPage);
            await flushPromises();

            // Act
            const allSetsChip = wrapper
                .findAllComponents({name: 'FilterChip'})
                .find((c) => c.text() === 'sets.viewAllSets');
            await allSetsChip?.trigger('click');
            await flushPromises();

            // Assert
            const item = wrapper.findComponent({name: 'SetListItem'});
            expect(item.props('completionPercentage')).toBe(78);
            expect(item.props('completionLoading')).toBe(false);
        });
    });
});
