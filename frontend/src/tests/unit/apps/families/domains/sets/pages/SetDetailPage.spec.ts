import SetDetailPage from '@app/domains/sets/pages/SetDetailPage.vue';
import PlacePartModal from '@app/modals/PlacePartModal.vue';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import BackButton from '@shared/components/BackButton.vue';
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

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));

vi.mock('@app/modals/PlacePartModal.vue', () => ({
    default: {
        name: 'PlacePartModal',
        template: '<div />',
        props: [
            'open',
            'partIdentity',
            'defaultQuantity',
            'maxQuantity',
            'neededBySetNums',
            'existingLocations',
            'title',
        ],
    },
}));

const {mockGetOrFailById, mockGetRequest, mockGoToRoute, mockCurrentRouteId, mockPatch, mockRetrieveAll} = vi.hoisted(
    () => ({
        mockGetOrFailById: vi.fn<() => Promise<unknown>>(),
        mockGetRequest: vi.fn<() => Promise<unknown>>(),
        mockGoToRoute: vi.fn<() => Promise<void>>(),
        mockCurrentRouteId: {value: 42},
        mockPatch: vi.fn<() => Promise<unknown>>(),
        mockRetrieveAll: vi.fn<() => Promise<void>>(),
    }),
);

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
        familySetStoreModule: {
            getAll: {value: []},
            retrieveAll: mockRetrieveAll,
            getById: vi.fn<() => unknown>(),
            getOrFailById: mockGetOrFailById,
            generateNew: vi.fn<() => unknown>(),
        },
    }),
);

const createMockAdapted = (
    overrides?: Partial<{status: string; purchaseDate: string | null; notes: string | null}>,
) => ({
    id: 42,
    setId: 10,
    setNum: '75192-1',
    quantity: 2,
    status: overrides?.status ?? ('built' as const),
    purchaseDate: overrides?.purchaseDate !== undefined ? overrides.purchaseDate : '2024-01-15',
    notes: overrides?.notes !== undefined ? overrides.notes : 'Birthday gift',
    set: {
        id: 10,
        setNum: '75192-1',
        name: 'Millennium Falcon',
        year: 2017,
        theme: 'Star Wars',
        numParts: 7541,
        imageUrl: 'https://example.com/75192.jpg',
    },
    mutable: ref({
        setId: 10,
        setNum: '75192-1',
        quantity: 2,
        status: overrides?.status ?? ('built' as const),
        purchaseDate: overrides?.purchaseDate !== undefined ? overrides.purchaseDate : '2024-01-15',
        notes: overrides?.notes !== undefined ? overrides.notes : 'Birthday gift',
    }),
    reset: vi.fn<() => void>(),
    update: vi.fn<() => Promise<void>>(),
    patch: mockPatch,
    delete: vi.fn<() => Promise<void>>(),
});

const mockSetWithPartsResponse = {
    id: 10,
    setNum: '75192-1',
    name: 'Millennium Falcon',
    year: 2017,
    theme: 'Star Wars',
    numParts: 7541,
    imageUrl: 'https://example.com/75192.jpg',
    parts: [
        {
            id: 1,
            quantity: 10,
            isSpare: false,
            elementId: '300101',
            part: {
                id: 10,
                partNum: '3001',
                name: 'Brick 2 x 4',
                category: null,
                imageUrl: 'https://example.com/3001.jpg',
            },
            color: {id: 1, name: 'Red', rgb: 'CC0000', isTransparent: false},
        },
        {
            id: 2,
            quantity: 2,
            isSpare: true,
            elementId: '300226',
            part: {id: 20, partNum: '3002', name: 'Brick 2 x 3', category: null, imageUrl: null},
            color: {id: 5, name: 'Blue', rgb: '0000CC', isTransparent: false},
        },
    ],
};

describe('SetDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentRouteId.value = 42;
    });

    it('should fetch set by route id on mount', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        expect(mockGetOrFailById).toHaveBeenCalledWith(42);
    });

    it('should render set details', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Millennium Falcon');
        expect(wrapper.text()).toContain('75192-1');
        expect(wrapper.text()).toContain('2017');
        expect(wrapper.text()).toContain('Star Wars');
        expect(wrapper.text()).toContain('7541');
        expect(wrapper.text()).toContain('2x');
        expect(wrapper.text()).toContain('sets.built');
        expect(wrapper.text()).toContain('2024-01-15');
        expect(wrapper.text()).toContain('Birthday gift');
    });

    it('should render set image when available', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/75192.jpg');
        expect(img.attributes('alt')).toBe('Millennium Falcon');
    });

    it('should show loading state initially', () => {
        // Arrange
        mockGetOrFailById.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = shallowMount(SetDetailPage);

        // Assert
        expect(wrapper.findComponent(LoadingState).exists()).toBe(true);
    });

    it('should navigate to edit page when edit button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const editButton = buttons.find((btn) => btn.text().includes('sets.edit'));
        await editButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets-edit', 42);
    });

    it('should navigate back to overview when back button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        wrapper.findComponent(BackButton).vm.$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets');
    });

    it('should not show purchase date when null', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({purchaseDate: null}));

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('2024-01-15');
    });

    it('should not show notes when null', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted({notes: null}));

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('Birthday gift');
    });

    it('should render status buttons with current status highlighted', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        const statusButtons = wrapper.findAll('button').filter((btn) => btn.text() !== '');
        const sealedButton = statusButtons.find((btn) => btn.text() === 'sets.sealed');
        const builtButton = statusButtons.find((btn) => btn.text() === 'sets.built');
        expect(sealedButton?.exists()).toBe(true);
        expect(builtButton?.exists()).toBe(true);
    });

    it('should update status when a status button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockPatch.mockResolvedValue({});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const sealedButton = wrapper.findAll('button').find((btn) => btn.text() === 'sets.sealed');
        await sealedButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(mockPatch).toHaveBeenCalledWith({status: 'sealed'});
    });

    it('should not call API when clicking the current status', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act — mockAdapted has status "built"
        const builtButton = wrapper.findAll('button').find((btn) => btn.text() === 'sets.built');
        await builtButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(mockPatch).not.toHaveBeenCalled();
    });

    it('should show load parts button initially', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Assert
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        expect(loadPartsButton?.exists()).toBe(true);
    });

    it('should fetch and display parts when load parts button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/sets/75192-1/parts');
        expect(wrapper.text()).toContain('sets.parts');
        expect(wrapper.text()).toContain('(1)');
        const parts = wrapper.findAllComponents(PartListItem);
        const regularPart = parts.find((p) => !p.props('spare'));
        expect(regularPart?.props('name')).toBe('Brick 2 x 4');
        expect(regularPart?.props('partNum')).toBe('3001');
        expect(regularPart?.props('quantity')).toBe(10);
    });

    it('should display spare parts in separate section', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.spareParts');
        expect(wrapper.text()).toContain('(1)');
        const parts = wrapper.findAllComponents(PartListItem);
        const sparePart = parts.find((p) => p.props('spare'));
        expect(sparePart?.props('name')).toBe('Brick 2 x 3');
        expect(sparePart?.props('quantity')).toBe(2);
    });

    it('should hide load parts button after parts are loaded', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        const buttonsAfter = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButtonAfter = buttonsAfter.find((btn) => btn.text().includes('sets.loadParts'));
        expect(loadPartsButtonAfter).toBeUndefined();
    });

    it('should render color swatches for parts', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts[0]?.props('colorRgb')).toBe('CC0000');
        expect(parts[0]?.props('colorName')).toBe('Red');
    });

    it('should render part images when available', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        const parts = wrapper.findAllComponents(PartListItem);
        expect(parts[0]?.props('imageUrl')).toBe('https://example.com/3001.jpg');
    });

    it('should fetch storage map after loading parts', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/sets/75192-1/storage-map');
    });

    it('should display storage location badges on parts', async () => {
        // Arrange
        const storageMapData = {
            entries: [{partId: 10, colorId: 1, storageOptionId: 5, storageOptionName: 'Drawer A', quantity: 8}],
        };
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: storageMapData});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Drawer A (8x)');
    });

    it('should not display storage badges when no storage map data', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('Drawer');
    });

    it('should display every storage location when multiple entries map to one part', async () => {
        // Arrange
        const storageMapData = {
            entries: [
                {partId: 10, colorId: 1, storageOptionId: 5, storageOptionName: 'Drawer A', quantity: 4},
                {partId: 10, colorId: 1, storageOptionId: 6, storageOptionName: 'Drawer B', quantity: 6},
            ],
        };
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: storageMapData});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Drawer A (4x)');
        expect(wrapper.text()).toContain('Drawer B (6x)');
    });

    it('should fall back to empty storage map when the request fails', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest.mockResolvedValueOnce({data: mockSetWithPartsResponse}).mockRejectedValueOnce(new Error('boom'));
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert — no badges, no build check, but the page still rendered the parts list
        expect(wrapper.text()).not.toContain('Drawer');
        expect(wrapper.text()).not.toContain('sets.buildCheck');
        const parts = wrapper.findAllComponents(PartListItem);
        const regularPart = parts.find((p) => !p.props('spare'));
        expect(regularPart?.props('name')).toBe('Brick 2 x 4');
    });

    it('should show build check when all parts are available', async () => {
        // Arrange
        const storageMapData = {
            entries: [{partId: 10, colorId: 1, storageOptionId: 5, storageOptionName: 'Drawer A', quantity: 10}],
        };
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: storageMapData});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.buildCheck');
        expect(wrapper.text()).toContain('sets.readyToBuild');
        expect(wrapper.text()).toContain('1/1');
        expect(wrapper.text()).toContain('10/10');
    });

    it('should show missing parts when not all available', async () => {
        // Arrange
        const storageMapData = {
            entries: [{partId: 10, colorId: 1, storageOptionId: 5, storageOptionName: 'Drawer A', quantity: 3}],
        };
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: storageMapData});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.notReadyToBuild');
        expect(wrapper.text()).toContain('0/1');
        expect(wrapper.text()).toContain('3/10');
    });

    it('should not show build check when no storage map data', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();

        // Act
        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = buttons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.text()).not.toContain('sets.buildCheck');
    });

    it('should open the place modal with the migrated part identity when a part is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();
        const primaryButtons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = primaryButtons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();

        // Act
        const partListItems = wrapper.findAllComponents(PartListItem);
        await partListItems[0]?.trigger('click');
        await flushPromises();

        // Assert
        const modal = wrapper.findComponent(PlacePartModal);
        expect(modal.exists()).toBe(true);
        expect(modal.props('open')).toBe(true);
        expect(modal.props('partIdentity')).toStrictEqual({
            partId: 10,
            partNum: '3001',
            partName: 'Brick 2 x 4',
            colorId: 1,
            colorName: 'Red',
            colorHex: 'CC0000',
            partImageUrl: 'https://example.com/3001.jpg',
        });
        expect(modal.props('title')).toBe('sets.assignPartTitle');
        expect(modal.props('defaultQuantity')).toBe(10);
    });

    it('should close the place modal on close event', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();
        const primaryButtons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = primaryButtons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();
        const partListItems = wrapper.findAllComponents(PartListItem);
        await partListItems[0]?.trigger('click');
        await flushPromises();

        // Act
        wrapper.findComponent(PlacePartModal).vm.$emit('close');
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(PlacePartModal).exists()).toBe(false);
    });

    it('should refetch parts after a successful placement', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockGetRequest
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}})
            .mockResolvedValueOnce({data: mockSetWithPartsResponse})
            .mockResolvedValueOnce({data: {entries: []}});
        const wrapper = shallowMount(SetDetailPage);
        await flushPromises();
        const primaryButtons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsButton = primaryButtons.find((btn) => btn.text().includes('sets.loadParts'));
        await loadPartsButton?.trigger('click');
        await flushPromises();
        const partListItems = wrapper.findAllComponents(PartListItem);
        await partListItems[0]?.trigger('click');
        await flushPromises();
        const callsBeforeAssign = mockGetRequest.mock.calls.length;

        // Act
        wrapper.findComponent(PlacePartModal).vm.$emit('assigned');
        await flushPromises();

        // Assert — modal closes and a fresh /parts fetch fires.
        expect(wrapper.findComponent(PlacePartModal).exists()).toBe(false);
        expect(mockGetRequest.mock.calls.length).toBeGreaterThan(callsBeforeAssign);
    });

    it('should call retrieveAll when store is empty on direct navigation (EntryNotFoundError path)', async () => {
        // Arrange
        mockGetOrFailById
            .mockRejectedValueOnce(new EntryNotFoundError('FamilySet', 42))
            .mockResolvedValueOnce(createMockAdapted());
        mockRetrieveAll.mockResolvedValue(undefined);

        // Act
        shallowMount(SetDetailPage);
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
        const wrapper = shallowMount(SetDetailPage);
        wrapper.vm.$.appContext.config.errorHandler = errorHandler;
        await flushPromises();

        // Assert
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0]?.[0]).toBe(unexpectedError);
        expect(mockRetrieveAll).not.toHaveBeenCalled();
    });
});
