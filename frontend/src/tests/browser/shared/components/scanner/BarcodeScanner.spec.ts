import BarcodeScanner from '@shared/components/scanner/BarcodeScanner.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {mockDetect, MockBarcodeDetector} = vi.hoisted(() => {
    const mockDetect = vi.fn<() => Promise<{rawValue: string; format: string}[]>>();
    class MockBarcodeDetector {
        detect = mockDetect;
    }
    return {mockDetect, MockBarcodeDetector};
});

vi.mock('barcode-detector', () => ({BarcodeDetector: MockBarcodeDetector}));

const defaultProps = {loadingText: 'Starting camera...', retryText: 'Retry'};

const createMockStream = () => {
    const mockTrack = {stop: vi.fn<() => void>()};
    const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
    return {mockTrack, mockStream};
};

describe('BarcodeScanner (browser)', () => {
    let mockGetUserMedia: ReturnType<typeof vi.fn>;

    let originalSrcObjectDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
        mockGetUserMedia = vi.fn<() => Promise<MediaStream>>();
        mockDetect.mockReset();

        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: mockGetUserMedia}});

        originalSrcObjectDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject');
        Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
            set: vi.fn<() => void>(),
            get: vi.fn<() => null>(() => null),
            configurable: true,
        });
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        vi.useRealTimers();

        if (originalSrcObjectDescriptor) {
            Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', originalSrcObjectDescriptor);
        }
    });

    describe('camera initialization', () => {
        it('should request camera access on mount and show video element', async () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledWith({
                video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}},
            });
            expect(wrapper.find('video').exists()).toBe(true);
        });

        it('should show loading state initially', () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});

            // Assert
            expect(wrapper.text()).toContain('Starting camera...');
            const loadingDiv = wrapper.find("[role='status']");
            expect(loadingDiv.exists()).toBe(true);
        });

        it('should hide loading state after camera starts successfully', async () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('Starting camera...');
        });
    });

    describe('camera permission denied (NotAllowedError)', () => {
        it('should show error message when camera access is denied', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Camera access denied. Please allow camera access and try again.');
        });

        it('should render error state with proper aria attributes', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Assert
            const errorDiv = wrapper.find("[role='alert']");
            expect(errorDiv.exists()).toBe(true);
            expect(errorDiv.attributes('aria-live')).toBe('assertive');
        });

        it('should show retry button and retry camera access when clicked', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockRejectedValueOnce(error).mockResolvedValueOnce(mockStream);
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Act
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            expect(retryButton?.exists()).toBe(true);
            await retryButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
        });
    });

    describe('camera not found (NotFoundError)', () => {
        it('should show appropriate error message', async () => {
            // Arrange
            const error = new Error('No camera');
            error.name = 'NotFoundError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('No camera found. Please connect a camera and try again.');
        });
    });

    describe('barcode detection', () => {
        it('should emit detect event when a barcode is found', async () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            const emitted = wrapper.emitted('detect');
            expect(emitted).toBeTruthy();
            const firstEvent = emitted?.find((e) => e[0] === '5702015357197');
            expect(firstEvent).toBeTruthy();
        });

        it('should display detected barcode overlay', async () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('5702015357197');
        });
    });

    describe('reset mechanism', () => {
        it('should clear detected code and resume scanning when resetKey changes', async () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = mount(BarcodeScanner, {props: {...defaultProps, resetKey: 0}, attachTo: document.body});
            await flushPromises();
            vi.advanceTimersByTime(250);
            await flushPromises();
            expect(wrapper.text()).toContain('5702015357197');

            // Act
            mockDetect.mockResolvedValue([]);
            await wrapper.setProps({resetKey: 1});
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('5702015357197');
        });
    });

    describe('cleanup', () => {
        it('should stop camera tracks on unmount', async () => {
            // Arrange
            const {mockTrack, mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});
            await flushPromises();

            // Act
            wrapper.unmount();

            // Assert
            expect(mockTrack.stop).toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have aria-label on video element', () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});

            // Assert
            const video = wrapper.find('video');
            expect(video.attributes('aria-label')).toBe('Live camera feed for scanning barcodes');
        });

        it('should have aria-label on viewfinder region', () => {
            // Arrange
            const {mockStream} = createMockStream();
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = mount(BarcodeScanner, {props: defaultProps, attachTo: document.body});

            // Assert
            const region = wrapper.find("[role='region']");
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toBe('Barcode scanner viewfinder');
        });
    });
});
