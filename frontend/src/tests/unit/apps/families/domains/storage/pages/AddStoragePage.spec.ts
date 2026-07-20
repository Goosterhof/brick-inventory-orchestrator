import AddStoragePage from '@app/domains/storage/pages/AddStoragePage.vue';
import {FormField, TextInput} from '@script-development/ui-inputs';
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

const {mockCreate, mockGoToRoute} = vi.hoisted(() => ({
    mockCreate: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@script-development/ui-inputs', () => createMockUiInputs());
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

// atom-at-call-site: unstub the package controls so the FormField slots + the
// TextInput / NumberInput / Textarea atoms render.
const renderPage = () =>
    shallowMount(AddStoragePage, {
        global: {stubs: {FormField: false, TextInput: false, NumberInput: false, Textarea: false}},
    });

describe('AddStoragePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        expect(wrapper.find('h1').text()).toBe('storage.addStorage');
    });

    it('should render form fields', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — four labelled fields (name, description, row, column)
        expect(wrapper.findAllComponents(FormField)).toHaveLength(4);
        const labels = wrapper.findAll('.ui-label').map((label) => label.text().replace(/\*$/, ''));
        expect(labels).toStrictEqual(['storage.name', 'storage.description', 'storage.row', 'storage.column']);

        // name is a TextInput; description a Textarea; row/column are NumberInputs
        expect(wrapper.findAllComponents(TextInput)).toHaveLength(1);
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = renderPage();

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
        const wrapper = renderPage();

        const textInput = wrapper.findComponent(TextInput);
        textInput.vm.$emit('update:modelValue', 'Lade A');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should accept a numeric row value', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, name: 'Lade A', childIds: []});
        const wrapper = renderPage();

        // Act — a valid number flows through the NumberInput v-model into row
        await wrapper.findAll('input[type="number"]')[0]?.setValue('3');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should clear a number field to null on empty input', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, name: 'Lade A', childIds: []});
        const wrapper = renderPage();

        // Act — clearing the NumberInput emits null into row
        await wrapper.findAll('input[type="number"]')[0]?.setValue('');
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
        const wrapper = renderPage();

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
        const wrapper = renderPage();

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
        const wrapper = renderPage();

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

    it('should mark the name field required', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — name is the first field
        const fields = wrapper.findAllComponents(FormField);
        expect(fields[0]?.props('required')).toBe(true);
    });
});
