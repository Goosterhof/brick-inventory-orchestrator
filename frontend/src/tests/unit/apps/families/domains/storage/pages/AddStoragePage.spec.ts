import AddStoragePage from '@app/domains/storage/pages/AddStoragePage.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
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
} = await vi.hoisted(() => import('../../../../../../helpers'));

const {mockCreate, mockGoToRoute} = vi.hoisted(() => ({
    mockCreate: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
        familyLoadingService: {isLoading: {value: false}},
    }),
);
vi.mock('@app/stores', () =>
    createMockFamilyStores({
        storageOptionStoreModule: {
            getAll: {value: []},
            retrieveAll: vi.fn<() => Promise<void>>(),
            getById: vi.fn<() => unknown>(),
            getOrFailById: vi.fn<() => Promise<unknown>>(),
            generateNew: () => ({
                name: '',
                description: null,
                parentId: null,
                row: null,
                column: null,
                childIds: [],
                mutable: ref({name: '', description: null, parentId: null, row: null, column: null, childIds: []}),
                reset: vi.fn<() => void>(),
                create: mockCreate,
            }),
        },
    }),
);

describe('AddStoragePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddStoragePage);

        // Assert
        expect(wrapper.find('h1').text()).toBe('storage.addStorage');
    });

    it('should render form fields', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddStoragePage);

        // Assert
        const textInputs = wrapper.findAllComponents(TextInput);
        expect(textInputs).toHaveLength(1);
        expect(textInputs[0]?.props('label')).toBe('storage.name');

        const numberInputs = wrapper.findAllComponents(NumberInput);
        expect(numberInputs).toHaveLength(2);
        expect(numberInputs[0]?.props('label')).toBe('storage.row');
        expect(numberInputs[1]?.props('label')).toBe('storage.column');

        expect(wrapper.findComponent(TextareaInput).exists()).toBe(true);
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddStoragePage);

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('storage.add');
    });

    it('should call create on form submit', async () => {
        // Arrange
        mockCreate.mockResolvedValue({
            id: 1,
            name: 'Lade A',
            description: null,
            parentId: null,
            row: null,
            column: null,
            childIds: [],
        });
        const wrapper = shallowMount(AddStoragePage);

        const textInput = wrapper.findComponent(TextInput);
        textInput.vm.$emit('update:modelValue', 'Lade A');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should navigate to detail page on successful create', async () => {
        // Arrange
        mockCreate.mockResolvedValue({
            id: 7,
            name: 'Lade A',
            description: null,
            parentId: null,
            row: null,
            column: null,
            childIds: [],
        });
        const wrapper = shallowMount(AddStoragePage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('storage-detail', 7);
    });

    it('should not navigate on 422 validation error', async () => {
        // Arrange
        const axiosError = new AxiosError('Validation failed');
        axiosError.response = {status: 422, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddStoragePage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should rethrow non-422 errors', async () => {
        // Arrange
        const axiosError = new AxiosError('Server error');
        axiosError.response = {status: 500, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddStoragePage);

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

    it('should have name required by default', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddStoragePage);

        // Assert
        const textInput = wrapper.findComponent(TextInput);
        expect(textInput.props('optional')).toBe(false);
    });
});
