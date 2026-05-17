import BarcodeScanner from '@shared/components/scanner/BarcodeScanner.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
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

describe('BarcodeScanner', () => {
    let mockGetUserMedia: ReturnType<typeof vi.fn>;
    let restoreSrcObject: (() => void) | undefined;

    beforeEach(() => {
        mockGetUserMedia = vi.fn<() => Promise<MediaStream>>();
        mockDetect.mockReset();

        Object.defineProperty(navigator, 'mediaDevices', {
            value: {getUserMedia: mockGetUserMedia},
            writable: true,
            configurable: true,
        });

        // happy-dom validates srcObject type strictly (must be MediaStream instance).
        // Override at the prototype level so mock objects are accepted.
        const proto = HTMLMediaElement.prototype;
        const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'srcObject');
        Object.defineProperty(proto, 'srcObject', {
            set(val: MediaProvider | null) {
                (this as unknown as {_srcObject: MediaProvider | null})._srcObject = val;
            },
            get(): MediaProvider | null {
                return (this as unknown as {_srcObject: MediaProvider | null})._srcObject ?? null;
            },
            configurable: true,
        });
        restoreSrcObject = () => {
            if (originalDescriptor) {
                Object.defineProperty(proto, 'srcObject', originalDescriptor);
            }
        };

        vi.useFakeTimers();
    });

    afterEach(() => {
        restoreSrcObject?.();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('rendering', () => {
        it('should render video element', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            expect(wrapper.find('video').exists()).toBe(true);
        });

        it('should show loading state initially', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            expect(wrapper.text()).toContain('Starting camera...');
        });

        it('should hide loading state after camera starts', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('Starting camera...');
        });

        it('should apply opacity-0 class to video when camera is not active', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            expect(wrapper.find('video').classes()).toContain('opacity-0');
        });
    });

    describe('camera initialization', () => {
        it('should request camera access on mount with correct constraints', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledWith({
                video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}},
            });
        });

        it('should stop camera tracks on unmount', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();

            // Act
            wrapper.unmount();

            // Assert
            expect(mockTrack.stop).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should show error message when camera access is denied (NotAllowedError)', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Camera access denied. Please allow camera access and try again.');
        });

        it('should show error message when no camera is found (NotFoundError)', async () => {
            // Arrange
            const error = new Error('No camera');
            error.name = 'NotFoundError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('No camera found. Please connect a camera and try again.');
        });

        it('should show generic error message for other Error types', async () => {
            // Arrange
            const error = new Error('Something went wrong');
            error.name = 'UnknownError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Failed to access camera: Something went wrong');
        });

        it('should show generic error for non-Error objects', async () => {
            // Arrange
            mockGetUserMedia.mockRejectedValue('string error');

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('An unexpected error occurred while accessing the camera.');
        });
    });

    describe('retry functionality', () => {
        it('should show retry button when error occurs', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            expect(retryButton?.exists()).toBe(true);
        });

        it('should retry camera access when retry button is clicked', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValueOnce(error).mockResolvedValueOnce(mockStream);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Act
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
        });
    });

    describe('unmount during async initialization', () => {
        it('should clean up stream when component unmounts during getUserMedia', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            let resolveGetUserMedia: ((value: unknown) => void) | undefined;
            mockGetUserMedia.mockReturnValue(
                new Promise((resolve) => {
                    resolveGetUserMedia = resolve;
                }),
            );

            // Act — mount starts camera, then unmount before getUserMedia resolves
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            wrapper.unmount();
            resolveGetUserMedia?.(mockStream);
            await flushPromises();

            // Assert — stream tracks should be stopped (cleanup happened)
            expect(mockTrack.stop).toHaveBeenCalled();
        });

        it('should not start scanning when component unmounts during video play', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            let resolvePlay: (() => void) | undefined;
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>(
                    () =>
                        new Promise<void>((resolve) => {
                            resolvePlay = resolve;
                        }),
                ),
                writable: true,
            });
            await flushPromises();
            wrapper.unmount();
            resolvePlay?.();
            await flushPromises();

            // Assert — scanning should not have started
            vi.advanceTimersByTime(250);
            await flushPromises();
            expect(mockDetect).not.toHaveBeenCalled();
        });
    });

    describe('race condition prevention', () => {
        it('should prevent concurrent camera starts', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            let resolveGetUserMedia: ((value: unknown) => void) | undefined;
            let callCount = 0;
            mockGetUserMedia = vi.fn<() => Promise<unknown>>(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(error);
                }
                return new Promise((resolve) => {
                    resolveGetUserMedia = resolve;
                });
            });
            Object.defineProperty(navigator, 'mediaDevices', {
                value: {getUserMedia: mockGetUserMedia},
                writable: true,
                configurable: true,
            });
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');

            // Act
            await retryButton?.trigger('click');
            await retryButton?.trigger('click');
            resolveGetUserMedia?.(mockStream);
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
        });
    });

    describe('barcode detection', () => {
        it('should emit detect event when a barcode is found', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            const emitted = wrapper.emitted('detect');
            expect(emitted).toBeTruthy();
            expect(emitted?.[0]?.[0]).toBe('5702015357197');
        });

        it('should not emit detect when no barcode is found', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([]);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            expect(wrapper.emitted('detect')).toBeUndefined();
        });

        it('should stop detecting after first barcode is found', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Act
            mockDetect.mockClear();
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert - detect should not be called again because detectedCode is set
            expect(wrapper.emitted('detect')).toHaveLength(1);
        });

        it('should show detected code overlay when barcode is found', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('5702015357197');
        });

        it('should handle detection errors gracefully', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockRejectedValue(new Error('Detection failed'));
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert - should not crash or emit error
            expect(wrapper.emitted('detect')).toBeUndefined();
            expect(wrapper.emitted('error')).toBeUndefined();
        });

        it('should not scan when camera is not active', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);
            shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Act
            vi.advanceTimersByTime(250);
            await flushPromises();

            // Assert
            expect(mockDetect).not.toHaveBeenCalled();
        });
    });

    describe('resetKey prop', () => {
        it('should reset without restarting scanning when camera is not active', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);
            const wrapper = shallowMount(BarcodeScanner, {props: {...defaultProps, resetKey: 0}});
            await flushPromises();

            // Act
            await wrapper.setProps({resetKey: 1});
            await flushPromises();

            // Assert — no crash, no scanning restarted
            expect(wrapper.emitted('detect')).toBeUndefined();
        });

        it('should clear detected code and resume scanning when resetKey changes', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            mockDetect.mockResolvedValue([{rawValue: '5702015357197', format: 'ean_13'}]);
            const wrapper = shallowMount(BarcodeScanner, {props: {...defaultProps, resetKey: 0}});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
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

    describe('accessibility', () => {
        it('should have aria-label on video element', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            const video = wrapper.find('video');
            expect(video.attributes('aria-label')).toBe('Live camera feed for scanning barcodes');
        });

        it('should have aria-live polite region for loading state', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            const loadingDiv = wrapper.find("[role='status']");
            expect(loadingDiv.exists()).toBe(true);
            expect(loadingDiv.attributes('aria-live')).toBe('polite');
        });

        it('should have aria-live assertive region for error state', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});
            await flushPromises();

            // Assert
            const errorDiv = wrapper.find("[role='alert']");
            expect(errorDiv.exists()).toBe(true);
            expect(errorDiv.attributes('aria-live')).toBe('assertive');
        });

        it('should have aria-label on viewfinder region', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(BarcodeScanner, {props: defaultProps});

            // Assert
            const region = wrapper.find("[role='region']");
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toBe('Barcode scanner viewfinder');
        });
    });
});
