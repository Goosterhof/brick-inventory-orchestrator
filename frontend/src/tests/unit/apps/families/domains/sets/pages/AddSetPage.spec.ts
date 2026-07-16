import AddSetPage from '@app/domains/sets/pages/AddSetPage.vue';
import {FormField} from '@script-development/ui-inputs';
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
const mockStoreGetAll = vi.hoisted(() => ({value: [] as {setNum: string; quantity: number; status: string}[]}));

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

// atom-at-call-site puts each control inside FormField's scoped slot, which a
// bare shallowMount won't render while FormField is stubbed. Unstub the package
// trio (kept light by the vi.mock above — no floating-ui) so the slot + controls
// render; everything else stays shallow (ADR-0012: unit tests use shallowMount).
const renderPage = () =>
    shallowMount(AddSetPage, {
        global: {stubs: {FormField: false, TextInput: false, SingleSelect: false}},
    });

// The set-number field is the only text input on the page; v-model wires through
// the package TextInput, so we drive the DOM control rather than a molecule.
const setNumberInput = (wrapper: ReturnType<typeof renderPage>) => wrapper.get('input[type="text"]');

describe('AddSetPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreGetAll.value = [];
    });

    it('should render page title', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        expect(wrapper.find('h1').text()).toBe('sets.addSet');
    });

    it('should render a labelled field per input', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — five FormFields (setNum, quantity, status, purchaseDate, notes), each labelled
        expect(wrapper.findAllComponents(FormField)).toHaveLength(5);
        expect(wrapper.findAll('.ui-label')).toHaveLength(5);
        expect(wrapper.find('input[type="text"]').exists()).toBe(true);
        expect(wrapper.find('input[type="number"]').exists()).toBe(true);
        expect(wrapper.find('input[type="date"]').exists()).toBe(true);
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.find('[role="combobox"]').exists()).toBe(true);
    });

    it('should render submit button', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.exists()).toBe(true);
        expect(button.props('type')).toBe('submit');
        expect(button.text()).toBe('sets.add');
    });

    it('should call create on form submit', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, setNum: '75192-1', quantity: 1, status: 'sealed'});
        const wrapper = renderPage();

        await setNumberInput(wrapper).setValue('75192-1');
        await flushPromises();

        // Act
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should update quantity on valid numeric input and still submit', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, setNum: '75192-1', quantity: 5, status: 'sealed'});
        const wrapper = renderPage();

        // Act — a valid number flows through onQuantityInput's assigning branch
        await wrapper.get('input[type="number"]').setValue('5');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should ignore non-numeric quantity input and still submit', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 1, setNum: '75192-1', quantity: 1, status: 'sealed'});
        const wrapper = renderPage();

        // Act — clearing the number input yields NaN; onQuantityInput's guard skips the write
        await wrapper.get('input[type="number"]').setValue('');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Assert
        expect(mockCreate).toHaveBeenCalled();
    });

    it('should navigate to detail page on successful create', async () => {
        // Arrange
        mockCreate.mockResolvedValue({id: 42, setNum: '75192-1', quantity: 1, status: 'sealed'});
        const wrapper = renderPage();

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
        const wrapper = renderPage();

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
        const wrapper = renderPage();

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
        const wrapper = renderPage();
        await wrapper.find('form').trigger('submit');
        await flushPromises();
        expect(wrapper.find("[data-testid='not-found-error']").exists()).toBe(true);

        // Act
        await setNumberInput(wrapper).setValue('10179-1');
        await flushPromises();

        // Assert
        expect(wrapper.find("[data-testid='not-found-error']").exists()).toBe(false);
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

    it('should mark the set-number field required for assistive tech', () => {
        // Arrange & Act
        const wrapper = renderPage();

        // Assert — the atom conveys required state via aria-required (error-as-prop lib)
        expect(setNumberInput(wrapper).attributes('aria-required')).toBe('true');
    });

    describe('duplicate detection', () => {
        it('should show duplicate warning when entered set number matches store', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            const wrapper = renderPage();

            // Act
            await setNumberInput(wrapper).setValue('75192-1');
            await flushPromises();

            // Assert
            const warning = wrapper.find("[data-testid='duplicate-warning']");
            expect(warning.exists()).toBe(true);
            expect(warning.text()).toContain('sets.duplicateWarning');
        });

        it('should not show duplicate warning when set number does not match', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '10179-1', quantity: 1, status: 'sealed'}];
            const wrapper = renderPage();

            // Act
            await setNumberInput(wrapper).setValue('75192-1');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should not show duplicate warning when set number is empty', () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 1, status: 'sealed'}];

            // Act
            const wrapper = renderPage();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should dismiss duplicate warning when dismiss button is clicked', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            const wrapper = renderPage();
            await setNumberInput(wrapper).setValue('75192-1');
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
            const wrapper = renderPage();
            await setNumberInput(wrapper).setValue('75192-1');
            await flushPromises();

            // Dismiss the warning
            const dismissButton = wrapper.find("[data-testid='duplicate-warning'] button");
            await dismissButton.trigger('click');
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);

            // Act — change set number to something else and back
            await setNumberInput(wrapper).setValue('10179-1');
            await flushPromises();
            await setNumberInput(wrapper).setValue('75192-1');
            await flushPromises();

            // Assert — warning reappears
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(true);
        });

        it('should not show duplicate warning when store is empty', async () => {
            // Arrange
            mockStoreGetAll.value = [];
            const wrapper = renderPage();

            // Act
            await setNumberInput(wrapper).setValue('75192-1');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });
    });
});
