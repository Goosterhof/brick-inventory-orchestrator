import StorageOverviewPage from '@app/domains/storage/pages/StorageOverviewPage.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
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

vi.mock('@shared/components/EmptyState.vue', () => ({
    default: {name: 'EmptyState', template: '<span><slot /></span>', props: ['message']},
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

const {mockRetrieveAll, mockGoToRoute, mockAllItems, mockIsLoading} = await vi.hoisted(async () => {
    const {ref} = await import('vue');
    return {
        mockRetrieveAll: vi.fn<() => Promise<void>>(),
        mockGoToRoute: vi.fn<() => Promise<void>>(),
        mockAllItems: ref<unknown[]>([]),
        mockIsLoading: ref(false),
    };
});

vi.mock('@app/services', async () => {
    const {computed} = await import('vue');

    return createMockFamilyServices({
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
        familyLoadingService: {isLoading: computed(() => mockIsLoading.value)},
    });
});

vi.mock('@app/stores', async () => {
    const {computed} = await import('vue');

    return createMockFamilyStores({
        storageOptionStoreModule: {
            getAll: computed(() => mockAllItems.value),
            retrieveAll: mockRetrieveAll,
            getById: vi.fn<() => unknown>(),
            getOrFailById: vi.fn<() => Promise<unknown>>(),
            generateNew: vi.fn<() => unknown>(),
        },
    });
});

const mockStorageOption = {
    id: 1,
    name: 'Lade A',
    description: 'Linkerla op plank 1',
    parentId: null,
    row: 1,
    column: 2,
    childIds: [2],
};

const mockChildOption = {
    id: 2,
    name: 'Lade A - Vak 1',
    description: null,
    parentId: 1,
    row: null,
    column: null,
    childIds: [],
};

describe('StorageOverviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAllItems.value = [];
        mockIsLoading.value = false;
        mockRetrieveAll.mockResolvedValue(undefined);
    });

    it('should render page title', async () => {
        // Arrange & Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(PageHeader).props('title')).toBe('storage.title');
    });

    it('should call retrieveAll on mount', async () => {
        // Arrange & Act
        shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(mockRetrieveAll).toHaveBeenCalled();
    });

    it('should render storage option cards when options exist', async () => {
        // Arrange
        mockAllItems.value = [mockStorageOption];

        // Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Lade A');
        expect(wrapper.text()).toContain('Linkerla op plank 1');
        expect(wrapper.text()).toContain('storage.subLocationsCount');
        expect(wrapper.text()).toContain('storage.rowColumnLabel');
    });

    it('should show empty state when no storage options exist', async () => {
        // Arrange
        mockAllItems.value = [];

        // Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).props('message')).toBe('storage.noStorage');
    });

    it('should show loading state initially', () => {
        // Arrange
        mockIsLoading.value = true;

        // Act
        const wrapper = shallowMount(StorageOverviewPage);

        // Assert
        expect(wrapper.text()).toContain('common.loading');
    });

    it('should navigate to add page when add button is clicked', async () => {
        // Arrange
        mockAllItems.value = [];
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Act
        await wrapper.findComponent(PrimaryButton).trigger('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage-add');
    });

    it('should navigate to detail page when a storage card is clicked', async () => {
        // Arrange
        mockAllItems.value = [mockStorageOption];
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Act
        wrapper.findComponent(ListItemButton).vm.$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage-detail', 1);
    });

    it('should not show sub-locations badge when no children', async () => {
        // Arrange
        const optionWithoutChildren = {...mockStorageOption, childIds: []};
        mockAllItems.value = [optionWithoutChildren];

        // Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('storage.subLocationsCount');
    });

    it('should not show row and column when null', async () => {
        // Arrange
        const optionWithoutGrid = {...mockStorageOption, row: null, column: null};
        mockAllItems.value = [optionWithoutGrid];

        // Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('storage.rowColumnLabel');
    });

    it('should not show description when null', async () => {
        // Arrange
        const optionWithoutDescription = {...mockStorageOption, description: null};
        mockAllItems.value = [optionWithoutDescription];

        // Act
        const wrapper = shallowMount(StorageOverviewPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('Linkerla op plank 1');
    });

    describe('tree view', () => {
        it('should show children indented under parent', async () => {
            // Arrange
            mockAllItems.value = [mockStorageOption, mockChildOption];

            // Act
            const wrapper = shallowMount(StorageOverviewPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Lade A');
            expect(wrapper.text()).toContain('Lade A - Vak 1');
            const listItems = wrapper.findAllComponents(ListItemButton);
            expect(listItems).toHaveLength(2);
        });

        it('should not show children at top level', async () => {
            // Arrange
            mockAllItems.value = [mockStorageOption, mockChildOption];

            // Act
            const wrapper = shallowMount(StorageOverviewPage);
            await flushPromises();

            // Assert — only 1 top-level group, child is nested
            const topLevelDivs = wrapper.findAll("[m='l-8']");
            expect(topLevelDivs).toHaveLength(1);
        });
    });

    describe('search', () => {
        const mockStorageOptionB = {
            id: 3,
            name: 'Lade B',
            description: 'Rechterla op plank 1',
            parentId: null,
            row: 1,
            column: 3,
            childIds: [],
        };

        it('should filter storage by name', async () => {
            // Arrange
            mockAllItems.value = [mockStorageOption, mockStorageOptionB];
            const wrapper = shallowMount(StorageOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('Lade B');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Lade B');
            expect(wrapper.text()).not.toContain('Lade A');
        });

        it('should filter storage by description', async () => {
            // Arrange
            mockAllItems.value = [mockStorageOption, mockStorageOptionB];
            const wrapper = shallowMount(StorageOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('Rechterla');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Lade B');
            expect(wrapper.text()).not.toContain('Lade A');
        });

        it('should show no results when search matches nothing', async () => {
            // Arrange
            mockAllItems.value = [mockStorageOption];
            const wrapper = shallowMount(StorageOverviewPage);
            await flushPromises();

            // Act
            await wrapper.findComponent(TextInput).setValue('nonexistent');
            await flushPromises();

            // Assert
            const emptyStates = wrapper.findAllComponents(EmptyState);
            const noResults = emptyStates.find((e) => e.props('message') === 'common.noResults');
            expect(noResults?.exists()).toBe(true);
        });
    });
});
