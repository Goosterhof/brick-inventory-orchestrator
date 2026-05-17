import StorageDetailPage from '@app/domains/storage/pages/StorageDetailPage.vue';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import BackButton from '@shared/components/BackButton.vue';
import DetailRow from '@shared/components/DetailRow.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices, createMockFamilyStores} =
    await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

const {mockGetOrFailById, mockGetRequest, mockGoToRoute, mockCurrentRouteId, mockRetrieveAll} = vi.hoisted(() => ({
    mockGetOrFailById: vi.fn<(id: number) => Promise<unknown>>(),
    mockGetRequest: vi.fn<(endpoint: string) => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
    mockCurrentRouteId: {value: 5},
    mockRetrieveAll: vi.fn<() => Promise<void>>(),
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute, currentRouteId: mockCurrentRouteId},
        familyLoadingService: {isLoading: {value: false}},
    }),
);
vi.mock('@app/stores', () =>
    createMockFamilyStores({
        storageOptionStoreModule: {
            getAll: {value: []},
            retrieveAll: mockRetrieveAll,
            getById: vi.fn<() => unknown>(),
            getOrFailById: mockGetOrFailById,
            generateNew: vi.fn<() => unknown>(),
        },
    }),
);

const createMockAdapted = (
    overrides?: Partial<{description: string | null; row: number | null; column: number | null; childIds: number[]}>,
) => ({
    id: 5,
    name: 'Lade A',
    description: overrides?.description !== undefined ? overrides.description : 'Linkerla op plank 1',
    parentId: null,
    row: overrides?.row !== undefined ? overrides.row : 1,
    column: overrides?.column !== undefined ? overrides.column : 2,
    childIds: overrides?.childIds ?? [6, 7],
    mutable: ref({
        name: 'Lade A',
        description: overrides?.description !== undefined ? overrides.description : 'Linkerla op plank 1',
        parentId: null,
        row: overrides?.row !== undefined ? overrides.row : 1,
        column: overrides?.column !== undefined ? overrides.column : 2,
        childIds: overrides?.childIds ?? [6, 7],
    }),
    reset: vi.fn<() => void>(),
    update: vi.fn<() => Promise<void>>(),
    patch: vi.fn<() => Promise<void>>(),
    delete: vi.fn<() => Promise<void>>(),
});

const mockStoragePartsResponse = [
    {
        id: 1,
        storageOptionId: 5,
        quantity: 12,
        part: {id: 10, partNum: '3001', name: 'Brick 2 x 4', category: null, imageUrl: 'https://example.com/3001.jpg'},
        color: {id: 1, name: 'Red', rgb: 'CC0000', isTransparent: false},
    },
    {
        id: 2,
        storageOptionId: 5,
        quantity: 8,
        part: {id: 20, partNum: '3002', name: 'Brick 2 x 3', category: null, imageUrl: null},
        color: null,
    },
];

describe('StorageDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentRouteId.value = 5;
    });

    it('should fetch storage option and parts by route id on mount', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(mockGetOrFailById).toHaveBeenCalledWith(5);
        expect(mockGetRequest).toHaveBeenCalledWith('/storage-options/5/parts');
    });

    it('should render storage option details', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Lade A');
        expect(wrapper.text()).toContain('Linkerla op plank 1');
        expect(wrapper.text()).toContain('1');
        expect(wrapper.text()).toContain('2');
    });

    it('should show loading state initially', () => {
        // Arrange
        mockGetOrFailById.mockReturnValue(new Promise(() => {}));
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = shallowMount(StorageDetailPage);

        // Assert
        expect(wrapper.findComponent(LoadingState).exists()).toBe(true);
    });

    it('should navigate to edit page when edit button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Act
        await wrapper.findComponent(PrimaryButton).trigger('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage-edit', 5);
    });

    it('should navigate back to overview when back button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Act
        wrapper.findComponent(BackButton).vm.$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage');
    });

    it('should not show description when null', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({description: null}));
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('Linkerla op plank 1');
    });

    it('should not show row when null', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({row: null}));
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const rowDetail = wrapper.findAllComponents(DetailRow).find((r) => r.props('label') === 'storage.row');
        expect(rowDetail).toBeUndefined();
    });

    it('should not show column when null', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({column: null}));
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const colDetail = wrapper.findAllComponents(DetailRow).find((r) => r.props('label') === 'storage.column');
        expect(colDetail).toBeUndefined();
    });

    it('should not show sub-locations when no children', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({childIds: []}));
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const subLocationsRow = wrapper
            .findAllComponents(DetailRow)
            .find((row) => row.props('label') === 'storage.subLocations');
        expect(subLocationsRow).toBeUndefined();
    });

    it('should show child count when children exist', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const subLocationsRow = wrapper
            .findAllComponents(DetailRow)
            .find((row) => row.props('label') === 'storage.subLocations');
        expect(subLocationsRow).toBeTruthy();
        expect(subLocationsRow?.text()).toContain('2');
    });

    it('should render parts with names and quantities', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('storage.parts');
        expect(wrapper.text()).toContain('(2)');
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts).toHaveLength(2);
        expect(parts[0]?.props('name')).toBe('Brick 2 x 4');
        expect(parts[0]?.props('partNum')).toBe('3001');
        expect(parts[0]?.props('quantity')).toBe(12);
        expect(parts[1]?.props('name')).toBe('Brick 2 x 3');
        expect(parts[1]?.props('quantity')).toBe(8);
    });

    it('should render color swatch when color is present', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts[0]?.props('colorRgb')).toBe('CC0000');
    });

    it('should render color name when color is present', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts[0]?.props('colorName')).toBe('Red');
    });

    it('should render part image when available', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: mockStoragePartsResponse});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts[0]?.props('imageUrl')).toBe('https://example.com/3001.jpg');
    });

    it('should show empty message when no parts', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValue({data: []});

        // Act
        const wrapper = shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).props('message')).toBe('storage.noParts');
    });

    it('should call retrieveAll when store is empty on direct navigation (EntryNotFoundError path)', async () => {
        // Arrange
        mockGetOrFailById
            .mockRejectedValueOnce(new EntryNotFoundError('StorageOption', 5))
            .mockResolvedValueOnce(createMockAdapted());
        mockRetrieveAll.mockResolvedValue(undefined);
        mockGetRequest.mockResolvedValue({data: []});

        // Act
        shallowMount(StorageDetailPage);
        await flushPromises();

        // Assert
        expect(mockRetrieveAll).toHaveBeenCalledOnce();
        expect(mockGetOrFailById).toHaveBeenCalledTimes(2);
    });

    it('should re-throw non-EntryNotFoundError from getOrFailById on mount', async () => {
        // Arrange
        const unexpectedError = new Error('Unexpected error');
        mockGetOrFailById.mockRejectedValue(unexpectedError);

        // Act
        const errorHandler = vi.fn<(err: unknown, instance: unknown, info: string) => void>();
        const wrapper = shallowMount(StorageDetailPage);
        wrapper.vm.$.appContext.config.errorHandler = errorHandler;
        await flushPromises();

        // Assert
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0]?.[0]).toBe(unexpectedError);
        expect(mockRetrieveAll).not.toHaveBeenCalled();
    });
});
