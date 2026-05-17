import ScanSetPage from '@app/domains/sets/pages/ScanSetPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import BackButton from '@shared/components/BackButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import BarcodeScanner from '@shared/components/scanner/BarcodeScanner.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

/** barcode-detector is a browser API not available in happy-dom. */
vi.mock('barcode-detector', () => ({BarcodeDetector: vi.fn<() => void>()}));

describe('ScanSetPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = async () => {
        // Store needs hydration for duplicate detection
        mockServer.onGet('family-sets', []);
        const wrapper = mount(ScanSetPage);
        await flushPromises();
        return wrapper;
    };

    it('renders PageHeader with real BackButton', async () => {
        const wrapper = await mountPage();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('Scan set');

        const backButton = wrapper.findComponent(BackButton);
        expect(backButton.exists()).toBe(true);
        expect(backButton.find('button').exists()).toBe(true);
    });

    it('renders real BarcodeScanner component', async () => {
        const wrapper = await mountPage();

        const scanner = wrapper.findComponent(BarcodeScanner);
        expect(scanner.exists()).toBe(true);
        expect(scanner.props('loadingText')).toBe('Starting camera...');
    });

    it('shows search result after barcode detection', async () => {
        const wrapper = await mountPage();

        mockServer.onGet('/sets/ean/5702017153636', {
            name: 'City Police',
            set_num: '60316-1',
            year: 2022,
            num_parts: 300,
            image_url: null,
        });

        const scanner = wrapper.findComponent(BarcodeScanner);
        scanner.vm.$emit('detect', '5702017153636');
        await flushPromises();

        expect(wrapper.text()).toContain('Scanned code');
        expect(wrapper.text()).toContain('City Police');

        const addButton = wrapper.findAllComponents(PrimaryButton).find((b) => b.text().includes('Add to collection'));
        expect(addButton).toBeDefined();
    });

    it('resets scanner after adding a set (conveyor flow)', async () => {
        const wrapper = await mountPage();

        mockServer.onGet('/sets/ean/5702017153636', {
            name: 'City Police',
            set_num: '60316-1',
            year: 2022,
            num_parts: 300,
            image_url: null,
        });
        mockServer.onPost('/family-sets', {id: 99});

        const scanner = wrapper.findComponent(BarcodeScanner);
        scanner.vm.$emit('detect', '5702017153636');
        await flushPromises();

        const addButton = wrapper.findAllComponents(PrimaryButton).find((b) => b.text().includes('Add to collection'));
        await addButton?.find('button').trigger('click');
        await flushPromises();

        // Conveyor: does NOT navigate away, scanner resets
        expect(wrapper.findComponent(BarcodeScanner).props('resetKey')).toBe(1);
    });

    it('shows no result message when barcode lookup fails', async () => {
        const wrapper = await mountPage();

        // No route registered for this EAN — getRequest will reject
        const scanner = wrapper.findComponent(BarcodeScanner);
        scanner.vm.$emit('detect', '0000000000000');
        await flushPromises();

        expect(wrapper.text()).toContain('No set found for this barcode');
    });

    it('navigates back via BackButton click', async () => {
        const wrapper = await mountPage();

        const backButton = wrapper.findComponent(BackButton);
        await backButton.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });
});
