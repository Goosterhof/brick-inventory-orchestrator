import ScanSetPage from '@app/domains/sets/pages/ScanSetPage.vue';
import BackButton from '@shared/components/BackButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import BarcodeScanner from '@shared/components/scanner/BarcodeScanner.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices, createMockFamilyStores} =
    await vi.hoisted(() => import('../../../../../../helpers'));

const {mockGetRequest, mockPostRequest, mockGoToRoute} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<() => Promise<unknown>>(),
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

const mockStoreGetAll = vi.hoisted(() => ({value: [] as {setNum: string; quantity: number; status: string}[]}));

vi.mock('barcode-detector', () => ({BarcodeDetector: vi.fn<() => void>()}));

// Mock heavy shared components to cut import chain cost (ADR-010).
vi.mock('@shared/components/BackButton.vue', () => ({
    default: {name: 'BackButton', emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>'},
}));
vi.mock('@shared/components/PageHeader.vue', () => ({
    default: {name: 'PageHeader', props: ['title'], template: '<header><h1>{{ title }}</h1><slot /></header>'},
}));
vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {
        name: 'PrimaryButton',
        props: ['disabled'],
        emits: ['click'],
        template: "<button :disabled='disabled' @click=\"$emit('click')\"><slot /></button>",
    },
}));
vi.mock('@shared/components/scanner/BarcodeScanner.vue', () => ({
    default: {name: 'BarcodeScanner', props: ['resetKey'], emits: ['detect'], template: '<div><slot /></div>'},
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest, postRequest: mockPostRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);
vi.mock('@app/stores', () =>
    createMockFamilyStores({
        familySetStoreModule: {
            getAll: mockStoreGetAll,
            retrieveAll: vi.fn<() => Promise<void>>(),
            getById: vi.fn<() => unknown>(),
            getOrFailById: vi.fn<() => Promise<unknown>>(),
        },
    }),
);

const mockSetResponse = {
    id: 10,
    setNum: '75192-1',
    name: 'Millennium Falcon',
    year: 2017,
    theme: 'Star Wars',
    numParts: 7541,
    imageUrl: 'https://example.com/75192.jpg',
};

describe('ScanSetPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreGetAll.value = [];
    });

    it('should render page header with title', () => {
        // Arrange & Act
        const wrapper = shallowMount(ScanSetPage);

        // Assert
        const header = wrapper.findComponent(PageHeader);
        expect(header.exists()).toBe(true);
        expect(header.props('title')).toBe('sets.scanSet');
    });

    it('should render BarcodeScanner component', () => {
        // Arrange & Act
        const wrapper = shallowMount(ScanSetPage);

        // Assert
        expect(wrapper.findComponent(BarcodeScanner).exists()).toBe(true);
    });

    it('should render back button', () => {
        // Arrange & Act
        const wrapper = shallowMount(ScanSetPage);

        // Assert
        expect(wrapper.findComponent(BackButton).exists()).toBe(true);
    });

    it('should navigate back to sets overview when back button is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(ScanSetPage);

        // Act
        wrapper.findComponent(BackButton).vm.$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets');
    });

    it('should not show results section before scan', () => {
        // Arrange & Act
        const wrapper = shallowMount(ScanSetPage);

        // Assert
        expect(wrapper.text()).not.toContain('sets.scannedCode');
    });

    describe('barcode detection', () => {
        it('should show scanned code after detection', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('5702015357197');
        });

        it('should lookup set by EAN after detection', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(mockGetRequest).toHaveBeenCalledWith('/sets/ean/5702015357197');
        });

        it('should show loading state while searching', async () => {
            // Arrange
            let resolveRequest: ((value: unknown) => void) | undefined;
            mockGetRequest.mockReturnValue(
                new Promise((resolve) => {
                    resolveRequest = resolve;
                }),
            );
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('common.loading');
            resolveRequest?.({data: mockSetResponse});
        });

        it('should display found set info', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Millennium Falcon');
            expect(wrapper.text()).toContain('75192-1');
            expect(wrapper.text()).toContain('2017');
        });

        it('should display set image when available', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            const img = wrapper.find('img');
            expect(img.exists()).toBe(true);
            expect(img.attributes('src')).toBe('https://example.com/75192.jpg');
        });

        it('should show add to collection button when set is found', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            expect(addButton?.exists()).toBe(true);
        });

        it('should show no result message when set is not found', async () => {
            // Arrange
            mockGetRequest.mockRejectedValue(new Error('Not found'));
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('sets.scanNoResult');
        });

        it('should handle lookup error gracefully', async () => {
            // Arrange
            mockGetRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('sets.scanNoResult');
        });
    });

    describe('add to collection (conveyor flow)', () => {
        it('should post set to collection and reset scanner for next scan', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockResolvedValue({data: {id: 42}});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Act
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Assert — POST fires correctly
            expect(mockPostRequest).toHaveBeenCalledWith('/family-sets', {
                setNum: '75192-1',
                quantity: 1,
                status: 'sealed',
            });
            // Assert — does NOT navigate away (conveyor stays open)
            expect(mockGoToRoute).not.toHaveBeenCalled();
            // Assert — scanner resets for next scan
            expect(wrapper.findComponent(BarcodeScanner).props('resetKey')).toBe(1);
            // Assert — scanned code is cleared
            expect(wrapper.text()).not.toContain('5702015357197');
        });

        it('should increment session count after successful add', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockResolvedValue({data: {id: 42}});
            const wrapper = shallowMount(ScanSetPage);

            // Act — add first set
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Assert — session count visible
            expect(wrapper.text()).toContain('sets.setsAddedCount');
        });

        it('should show done button after adding a set', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockResolvedValue({data: {id: 42}});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Assert
            const doneButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'sets.scanDone');
            expect(doneButton?.exists()).toBe(true);
        });

        it('should navigate to sets overview when done button is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockResolvedValue({data: {id: 42}});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Act
            const doneButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'sets.scanDone');
            await doneButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockGoToRoute).toHaveBeenCalledWith('sets');
        });

        it('should not show session count before any set is added', () => {
            // Arrange & Act
            const wrapper = shallowMount(ScanSetPage);

            // Assert
            expect(wrapper.text()).not.toContain('sets.setsAddedCount');
        });

        it('should not show done button before any set is added', () => {
            // Arrange & Act
            const wrapper = shallowMount(ScanSetPage);

            // Assert
            const doneButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'sets.scanDone');
            expect(doneButton).toBeUndefined();
        });

        it('should allow consecutive scans after adding', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockResolvedValue({data: {id: 42}});
            const wrapper = shallowMount(ScanSetPage);

            // Act — first scan + add
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Act — second scan
            const secondSetResponse = {...mockSetResponse, setNum: '10179-1', name: 'UCS Falcon'};
            mockGetRequest.mockResolvedValue({data: secondSetResponse});
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '1234567890123');
            await flushPromises();

            // Assert — second set is displayed
            expect(wrapper.text()).toContain('UCS Falcon');
            expect(wrapper.text()).toContain('10179-1');
        });

        it('should show error when add fails without killing conveyor', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            mockPostRequest.mockRejectedValue(new Error('Server error'));
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Act
            const addButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.addToCollection');
            await addButton?.trigger('click');
            await flushPromises();

            // Assert — error shown but scanner still available
            expect(wrapper.text()).toContain('sets.scanAddError');
            expect(wrapper.findComponent(BarcodeScanner).exists()).toBe(true);
        });

        it('should not add when no set is found', () => {
            // Arrange & Act
            shallowMount(ScanSetPage);

            // Assert — no POST without a detected set
            expect(mockPostRequest).not.toHaveBeenCalled();
        });
    });

    describe('scan again', () => {
        it('should show scan again button after detection', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            const scanAgainButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.scanAgain');
            expect(scanAgainButton?.exists()).toBe(true);
        });

        it('should reset state when scan again is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Act
            const scanAgainButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'sets.scanAgain');
            await scanAgainButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('5702015357197');
            expect(wrapper.findComponent(BarcodeScanner).props('resetKey')).toBe(1);
        });
    });

    describe('duplicate detection', () => {
        it('should show duplicate warning when scanned set already exists in store', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            const warning = wrapper.find("[data-testid='duplicate-warning']");
            expect(warning.exists()).toBe(true);
            expect(warning.text()).toContain('sets.duplicateWarning');
        });

        it('should not show duplicate warning when scanned set is not in store', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '10179-1', quantity: 1, status: 'sealed'}];
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should dismiss duplicate warning when dismiss button is clicked', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Act
            const dismissButton = wrapper.find("[data-testid='duplicate-warning'] button");
            await dismissButton.trigger('click');

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should reset duplicate dismissed state on new scan', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 2, status: 'built'}];
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Dismiss the warning
            const dismissButton = wrapper.find("[data-testid='duplicate-warning'] button");
            await dismissButton.trigger('click');
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);

            // Act — scan again with same barcode
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert — warning reappears
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(true);
        });

        it('should not show duplicate warning when no set is found', async () => {
            // Arrange
            mockStoreGetAll.value = [{setNum: '75192-1', quantity: 1, status: 'sealed'}];
            mockGetRequest.mockRejectedValue(new Error('Not found'));
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });

        it('should not show duplicate warning when store is empty', async () => {
            // Arrange
            mockStoreGetAll.value = [];
            mockGetRequest.mockResolvedValue({data: mockSetResponse});
            const wrapper = shallowMount(ScanSetPage);

            // Act
            wrapper.findComponent(BarcodeScanner).vm.$emit('detect', '5702015357197');
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
        });
    });
});
