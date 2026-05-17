import AddSetPage from '@app/domains/sets/pages/AddSetPage.vue';
import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
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
const mockStoreGetAll = vi.hoisted(() => ({value: [] as {setNum: string; quantity: number; status: string}[]}));

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
        familySetStoreModule: {
            getAll: mockStoreGetAll,
            retrieveAll: vi.fn<() => Promise<void>>(),
            getById: vi.fn<() => unknown>(),
            getOrFailById: vi.fn<() => Promise<unknown>>(),
            generateNew: () => ({
                setNum: '',
                quantity: 1,
                status: 'sealed',
                purchaseDate: null,
                notes: null,
                mutable: ref({setNum: '', quantity: 1, status: 'sealed', purchaseDate: null, notes: null}),
                reset: vi.fn<() => void>(),
                create: mockCreate,
            }),
        },
    }),
);

describe('AddSetPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreGetAll.value = [];
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddSetPage);

        // Assert
        expect(wrapper.find('h1').text()).toBe('sets.addSet');
    });

    it('should render form fields', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddSetPage);

        // Assert
        const textInputs = wrapper.findAllComponents(TextInput);
        expect(textInputs).toHaveLength(1);
        expect(textInputs[0]?.props('label')).toBe('sets.setNumber');

        const numberInputs = wrapper.findAllComponents(NumberInput);
        expect(numberInputs).toHaveLength(1);
        expect(numberInputs[0]?.props('label')).toBe('sets.quantity');

        expect(wrapper.findComponent(SelectInput).exists()).toBe(true);
        expect(wrapper.findComponent(DateInput).exists()).toBe(true);
        expect(wrapper.findComponent(TextareaInput).exists()).toBe(true);
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddSetPage);

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('sets.add');
    });

    it('should call create on form submit', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, setNum: '75192-1', quantity: 1, status: 'sealed'});
        const wrapper = shallowMount(AddSetPage);

        const textInput = wrapper.findComponent(TextInput);
        textInput.vm.$emit('update:modelValue', '75192-1');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should navigate to detail page on successful create', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 42, setNum: '75192-1', quantity: 1, status: 'sealed'});
        const wrapper = shallowMount(AddSetPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets-detail', 42);
    });

    it('should not navigate on 422 validation error', async () => {
        // Arrange
        const axiosError = new AxiosError('Validation failed');
        axiosError.response = {status: 422, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddSetPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should show not-found error on 404 and not navigate', async () => {
        // Arrange
        const axiosError = new AxiosError('Not found');
        axiosError.response = {status: 404, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddSetPage);

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        const notFound = wrapper.find("[data-testid='not-found-error']");
        expect(notFound.exists()).toBe(true);
        expect(notFound.text()).toBe('sets.setNotFound');
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('should clear not-found error when set number changes', async () => {
        // Arrange
        const axiosError = new AxiosError('Not found');
        axiosError.response = {status: 404, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddSetPage);
        await wrapper.find('form').trigger('submit');
        await flushPromises();
        expect(wrapper.find("[data-testid='not-found-error']").exists()).toBe(true);

        // Act
        const textInput = wrapper.findComponent(TextInput);
        textInput.vm.$emit('update:modelValue', '10179-1');
        await flushPromises();

        // Assert
        expect(wrapper.find("[data-testid='not-found-error']").exists()).toBe(false);
    });

    it('should rethrow non-422 errors', async () => {
        // Arrange
        const axiosError = new AxiosError('Server error');
        axiosError.response = {status: 500, data: {}, statusText: '', headers: {}, config: {} as never};
        mockCreate.mockRejectedValue(axiosError);
        const wrapper = shallowMount(AddSetPage);

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

    it('should have setnummer required by default', () => {
        // Arrange & Act
        const wrapper = shallowMount(AddSetPage);

        // Assert
        const textInput = wrapper.findComponent(TextInput);
        expect(textInput.props('optional')).toBe(false);
    });

    describe('duplicate detection', () => {
        it('should show duplicate warning when entered set number matches store', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            const wrapper = shallowMount(AddSetPage);

            // Act
            const textInput = wrapper.findComponent(TextInput);
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Assert
            const warning = wrapper.find("[data-testid='duplicate-warning']");
            expect(warning.exists()).toBe(true);
            expect(warning.text()).toContain('sets.duplicateWarning');
        });

        it('should not show duplicate warning when set number does not match', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '10179-1', quantity: 1, status: 'sealed'}];
            const wrapper = shallowMount(AddSetPage);

            // Act
            const textInput = wrapper.findComponent(TextInput);
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should not show duplicate warning when set number is empty', () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 1, status: 'sealed'}];

            // Act
            const wrapper = shallowMount(AddSetPage);

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should dismiss duplicate warning when dismiss button is clicked', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            const wrapper = shallowMount(AddSetPage);
            const textInput = wrapper.findComponent(TextInput);
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Act
            const dismissButton = wrapper.find("[data-testid='duplicate-warning'] button");
            await dismissButton.trigger('click');

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should reset dismissed state when set number changes', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            const wrapper = shallowMount(AddSetPage);
            const textInput = wrapper.findComponent(TextInput);
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Dismiss the warning
            const dismissButton = wrapper.find("[data-testid='duplicate-warning'] button");
            await dismissButton.trigger('click');
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);

            // Act — change set number to something else and back
            textInput.vm.$emit('update:modelValue', '10179-1');
            await flushPromises();
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Assert — warning reappears
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(true);
        });

        it('should not show duplicate warning when store is empty', async () => {
            // Arrange
            mockStoreGetAll.value = [];
            const wrapper = shallowMount(AddSetPage);

            // Act
            const textInput = wrapper.findComponent(TextInput);
            textInput.vm.$emit('update:modelValue', '75192-1');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });
    });
});
