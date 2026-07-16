import EditStoragePage from '@app/domains/storage/pages/EditStoragePage.vue';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import {TextInput} from '@script-development/ui-inputs';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {AxiosError} from 'axios';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';

const {
    createMockAxiosWithError,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockFamilyStores,
    createMockUiInputs,
} = await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@script-development/ui-inputs', () => createMockUiInputs());

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));

// atom-at-call-site: the page composes FormField + a package TextInput (name) and
// native textarea/number controls; unstub the package pair so the slots render.
const renderPage = () => shallowMount(EditStoragePage, {global: {stubs: {FormField: false, TextInput: false}}});

const {mockGetOrFailById, mockGoToRoute, mockCurrentRouteId, mockPatch, mockDelete, mockRetrieveAll} = vi.hoisted(
    () => ({
        mockGetOrFailById: vi.fn<() => Promise<unknown>>(),
        mockGoToRoute: vi.fn<() => Promise<void>>(),
        mockCurrentRouteId: {value: 5},
        mockPatch: vi.fn<() => Promise<unknown>>(),
        mockDelete: vi.fn<() => Promise<void>>(),
        mockRetrieveAll: vi.fn<() => Promise<void>>(),
    }),
);

vi.mock('@app/services', () =>
    createMockFamilyServices({
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

const createMockAdapted = () => ({
    id: 5,
    name: 'Lade A',
    description: 'Linkerla op plank 1',
    parentId: null,
    row: 1,
    column: 2,
    childIds: [6, 7],
    mutable: ref({
        name: 'Lade A',
        description: 'Linkerla op plank 1',
        parentId: null,
        row: 1,
        column: 2,
        childIds: [6, 7],
    }),
    reset: vi.fn<() => void>(),
    update: vi.fn<() => Promise<void>>(),
    patch: mockPatch,
    delete: mockDelete,
});

describe('EditStoragePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentRouteId.value = 5;
    });

    it('should fetch storage option on mount', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        renderPage();
        await flushPromises();

        // Assert
        expect(mockGetOrFailById).toHaveBeenCalledWith(5);
    });

    it('should render page title with storage name', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = renderPage();
        await flushPromises();

        // Assert
        expect(wrapper.find('h1').text()).toBe('storage.editStorage');
        expect(wrapper.text()).toContain('Lade A');
    });

    it('should populate form with existing data', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = renderPage();
        await flushPromises();

        // Assert — name via package TextInput; row/column native numbers; description textarea
        expect(wrapper.findComponent(TextInput).props('modelValue')).toBe('Lade A');

        const numberValues = wrapper
            .findAll('input[type="number"]')
            .map((input) => (input.element as HTMLInputElement).value);
        expect(numberValues).toStrictEqual(['1', '2']);

        expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Linkerla op plank 1');
    });

    it('should update a number field on valid numeric input', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockPatch.mockResolvedValue({});
        const wrapper = renderPage();
        await flushPromises();

        // Act — a valid number flows through onNumberInput's value branch
        await wrapper.findAll('input[type="number"]')[0]?.setValue('9');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({row: 9}));
    });

    it('should clear a number field to null on empty input', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockPatch.mockResolvedValue({});
        const wrapper = renderPage();
        await flushPromises();

        // Act — clearing the number input yields NaN; onNumberInput's null branch fires
        await wrapper.findAll('input[type="number"]')[0]?.setValue('');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({row: null}));
    });

    it('should show loading state initially', () => {
        // Arrange
        mockGetOrFailById.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = renderPage();

        // Assert
        expect(wrapper.findComponent(LoadingState).exists()).toBe(true);
    });

    it('should submit update with correct payload', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockPatch.mockResolvedValue({});
        const wrapper = renderPage();
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockPatch).toHaveBeenCalledWith({
            name: 'Lade A',
            description: 'Linkerla op plank 1',
            parentId: null,
            row: 1,
            column: 2,
        });
    });

    it('should navigate to detail page on successful update', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockPatch.mockResolvedValue({});
        const wrapper = renderPage();
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage-detail', 5);
    });

    it('should not navigate on 422 validation error', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const axiosError = new AxiosError('Validation failed');
        axiosError.response = {status: 422, data: {}, statusText: '', headers: {}, config: {} as never};
        mockPatch.mockRejectedValue(axiosError);
        const wrapper = renderPage();
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should rethrow non-422 errors', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const axiosError = new AxiosError('Server error');
        axiosError.response = {status: 500, data: {}, statusText: '', headers: {}, config: {} as never};
        mockPatch.mockRejectedValue(axiosError);
        const wrapper = renderPage();
        await flushPromises();

        // Act
        const errorHandler = vi.fn<(err: unknown, instance: unknown, info: string) => void>();
        wrapper.vm.$.appContext.config.errorHandler = errorHandler;
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0]?.[0]).toBe(axiosError);
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should open confirm dialog when delete button is clicked', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const wrapper = renderPage();
        await flushPromises();

        // Act
        wrapper.findComponent(DangerButton).vm.$emit('click');
        await wrapper.vm.$nextTick();

        // Assert
        expect(wrapper.findComponent(ConfirmDialog).props('open')).toBe(true);
    });

    it('should delete storage option and navigate to overview on confirm', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        mockDelete.mockResolvedValue(undefined);
        const wrapper = renderPage();
        await flushPromises();

        // Act
        wrapper.findComponent(DangerButton).vm.$emit('click');
        await wrapper.vm.$nextTick();
        wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
        await flushPromises();

        // Assert
        expect(mockDelete).toHaveBeenCalled();
        expect(mockGoToRoute).toHaveBeenCalledWith('storage');
    });

    it('should close dialog when user cancels confirmation', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());
        const wrapper = renderPage();
        await flushPromises();

        // Act
        wrapper.findComponent(DangerButton).vm.$emit('click');
        await wrapper.vm.$nextTick();
        wrapper.findComponent(ConfirmDialog).vm.$emit('cancel');
        await wrapper.vm.$nextTick();

        // Assert
        expect(mockDelete).not.toHaveBeenCalled();
        expect(wrapper.findComponent(ConfirmDialog).props('open')).toBe(false);
    });

    it('should render save and delete buttons', async () => {
        // Arrange
        mockGetOrFailById.mockResolvedValue(createMockAdapted());

        // Act
        const wrapper = renderPage();
        await flushPromises();

        // Assert
        const primaryButton = wrapper.findComponent(PrimaryButton);
        expect(primaryButton.text()).toBe('storage.save');

        const dangerButton = wrapper.findComponent(DangerButton);
        expect(dangerButton.exists()).toBe(true);
    });

    it('should call retrieveAll when store is empty on direct navigation (EntryNotFoundError path)', async () => {
        // Arrange
        mockGetOrFailById
            .mockRejectedValueOnce(new EntryNotFoundError('StorageOption', 5))
            .mockResolvedValueOnce(createMockAdapted());
        mockRetrieveAll.mockResolvedValue(undefined);

        // Act
        renderPage();
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
        const wrapper = renderPage();
        wrapper.vm.$.appContext.config.errorHandler = errorHandler;
        await flushPromises();

        // Assert
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0]?.[0]).toBe(unexpectedError);
        expect(mockRetrieveAll).not.toHaveBeenCalled();
    });
});
