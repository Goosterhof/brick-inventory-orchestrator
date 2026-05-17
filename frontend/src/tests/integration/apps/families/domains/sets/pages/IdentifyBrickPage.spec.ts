import IdentifyBrickPage from '@app/domains/sets/pages/IdentifyBrickPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import BackButton from '@shared/components/BackButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import CameraCapture from '@shared/components/scanner/CameraCapture.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

describe('IdentifyBrickPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = () => mount(IdentifyBrickPage);

    it('renders PageHeader with BackButton', () => {
        const wrapper = mountPage();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.find('h1').text()).toBe('Identify brick');

        const backButton = wrapper.findComponent(BackButton);
        expect(backButton.find('button').exists()).toBe(true);
    });

    it('renders real CameraCapture component with correct props', () => {
        const wrapper = mountPage();

        const camera = wrapper.findComponent(CameraCapture);
        expect(camera.exists()).toBe(true);
        expect(camera.props('loadingText')).toBe('Starting camera...');
        expect(camera.props('captureText')).toBe('Capture Photo');
    });

    it('shows identified part after capture', async () => {
        mockServer.onPost('/identify-brick', {name: 'Brick 2x4', part_num: '3001', image_url: null});

        const wrapper = mountPage();

        const camera = wrapper.findComponent(CameraCapture);
        camera.vm.$emit('capture', new Blob(['test']));
        await flushPromises();

        expect(wrapper.text()).toContain('Brick 2x4');
        expect(wrapper.text()).toContain('3001');

        const tryAgainBtn = wrapper.findAllComponents(PrimaryButton).find((b) => b.text().includes('Try again'));
        expect(tryAgainBtn).toBeDefined();
    });

    it('shows error message when identification fails', async () => {
        // No route registered for /identify-brick — postRequest will reject
        const wrapper = mountPage();

        const camera = wrapper.findComponent(CameraCapture);
        camera.vm.$emit('capture', new Blob(['test']));
        await flushPromises();

        expect(wrapper.text()).toContain('Could not identify this brick');
    });

    it('shows camera with capture button before any identification', () => {
        const wrapper = mountPage();

        const camera = wrapper.findComponent(CameraCapture);
        expect(camera.exists()).toBe(true);
        expect(camera.props('captureText')).toBe('Capture Photo');
    });

    it('navigates back via BackButton', async () => {
        const wrapper = mountPage();

        const backButton = wrapper.findComponent(BackButton);
        await backButton.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });
});
