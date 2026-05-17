import CameraCapture from '@shared/components/scanner/CameraCapture.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const defaultProps = {loadingText: 'Starting camera...', retryText: 'Retry', captureText: 'Capture Photo'};

describe('CameraCapture', () => {
    let mockGetUserMedia: ReturnType<typeof vi.fn>;
    let restoreSrcObject: (() => void) | undefined;

    beforeEach(() => {
        mockGetUserMedia = vi.fn<() => Promise<MediaStream>>();

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
    });

    afterEach(() => {
        restoreSrcObject?.();
        vi.restoreAllMocks();
    });

    describe('rendering', () => {
        it('should render video element and capture button', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

            // Assert
            expect(wrapper.find('video').exists()).toBe(true);
            expect(wrapper.find('canvas').exists()).toBe(true);
            expect(wrapper.find('button').text()).toBe('Capture Photo');
        });

        it('should show loading state initially', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

            // Assert
            expect(wrapper.text()).toContain('Starting camera...');
        });

        it('should hide loading state after camera starts', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

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
            shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(mockGetUserMedia).toHaveBeenCalledWith({
                video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}},
            });
        });

        it('should enable capture button when camera is active', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            await flushPromises();

            // Act
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            if (retryButton) {
                await retryButton.trigger('click');
                await flushPromises();
            }

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            expect(captureButton?.attributes('disabled')).toBeUndefined();
        });

        it('should stop camera tracks on unmount', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Failed to access camera: Something went wrong');
        });

        it('should show generic error for non-Error objects', async () => {
            // Arrange
            mockGetUserMedia.mockRejectedValue('string error');

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('An unexpected error occurred while accessing the camera.');
        });

        it('should disable capture button when camera is not active', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            expect(captureButton?.attributes('disabled')).toBeDefined();
        });
    });

    describe('retry functionality', () => {
        it('should show retry button when error occurs', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            wrapper.unmount();
            resolveGetUserMedia?.(mockStream);
            await flushPromises();

            // Assert — stream tracks should be stopped (cleanup happened)
            expect(mockTrack.stop).toHaveBeenCalled();
        });

        it('should not activate camera when component unmounts during video play', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            let resolvePlay: (() => void) | undefined;
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
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

            // Assert — camera should not be active after unmount
            expect(mockTrack.stop).toHaveBeenCalled();
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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');

            // Act - click retry to start pending request, then click again while pending
            await retryButton?.trigger('click');
            await retryButton?.trigger('click');
            resolveGetUserMedia?.(mockStream);
            await flushPromises();

            // Assert - first call from mount (rejected), second from first retry click, third blocked by guard
            expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
        });

        it('should stop existing stream before starting new one on retry', async () => {
            // Arrange
            const firstTrack = {stop: vi.fn<() => void>()};
            const firstStream = {getTracks: vi.fn<() => (typeof firstTrack)[]>(() => [firstTrack])};
            const secondTrack = {stop: vi.fn<() => void>()};
            const secondStream = {getTracks: vi.fn<() => (typeof secondTrack)[]>(() => [secondTrack])};
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce(firstStream)
                .mockResolvedValueOnce(secondStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            await retryButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(firstTrack.stop).toHaveBeenCalled();
        });
    });

    describe('image capture', () => {
        it('should emit capture event with blob when capture button is clicked', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            const mockContext = {drawImage: vi.fn<() => void>()};
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {
                value: vi.fn<() => typeof mockContext>(() => mockContext),
                writable: true,
            });
            Object.defineProperty(canvasElement, 'toBlob', {
                value: vi.fn<(callback: (blob: Blob | null) => void) => void>(
                    (callback: (blob: Blob | null) => void) => {
                        callback(new Blob(['test'], {type: 'image/jpeg'}));
                    },
                ),
                writable: true,
            });
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert
            expect(mockContext.drawImage).toHaveBeenCalledWith(videoElement, 0, 0);
            const emitted = wrapper.emitted('capture');
            expect(emitted).toBeTruthy();
            expect(emitted?.[0]?.[0]).toBeInstanceOf(Blob);
        });

        it('should not allow capture when camera is not active', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert
            expect(captureButton?.attributes('disabled')).toBeDefined();
            expect(wrapper.emitted('capture')).toBeUndefined();
        });

        it('should emit error event when toBlob returns null', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            const mockContext = {drawImage: vi.fn<() => void>()};
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {
                value: vi.fn<() => typeof mockContext>(() => mockContext),
                writable: true,
            });
            Object.defineProperty(canvasElement, 'toBlob', {
                value: vi.fn<(callback: (blob: Blob | null) => void) => void>(
                    (callback: (blob: Blob | null) => void) => {
                        callback(null);
                    },
                ),
                writable: true,
            });
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert
            expect(wrapper.emitted('capture')).toBeUndefined();
            const errorEmitted = wrapper.emitted('error');
            expect(errorEmitted).toBeTruthy();
            expect(errorEmitted?.[0]?.[0]).toBe('Failed to capture image. Please try again.');
        });

        it('should emit error when canvas context is not available', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {value: vi.fn<() => null>(() => null), writable: true});
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert
            const errorEmitted = wrapper.emitted('error');
            expect(errorEmitted).toBeTruthy();
            expect(errorEmitted?.[0]?.[0]).toBe('Unable to capture image. Canvas context not available.');
        });

        it('should return early when video dimensions are zero and metadata is loaded', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 0, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 0, writable: true});
            Object.defineProperty(videoElement, 'readyState', {value: HTMLMediaElement.HAVE_METADATA, writable: true});
            const mockContext = {drawImage: vi.fn<() => void>()};
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {
                value: vi.fn<() => typeof mockContext>(() => mockContext),
                writable: true,
            });
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert - should return early without emitting anything
            expect(wrapper.emitted('capture')).toBeUndefined();
            expect(wrapper.emitted('error')).toBeUndefined();
        });

        it('should wait for metadata when video dimensions are not available', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 0, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 0, writable: true});
            Object.defineProperty(videoElement, 'readyState', {value: 0, writable: true});
            // happy-dom's addEventListener is not spyable via vi.spyOn on element instances.
            // Override via defineProperty to intercept calls.
            const addEventListenerCalls: Array<{event: string; options: unknown}> = [];
            const originalAddEventListener = videoElement.addEventListener.bind(videoElement);
            Object.defineProperty(videoElement, 'addEventListener', {
                value: (event: string, callback: EventListenerOrEventListenerObject, options?: unknown) => {
                    addEventListenerCalls.push({event, options});
                    originalAddEventListener(event, callback, options as AddEventListenerOptions);
                },
                writable: true,
                configurable: true,
            });
            const mockContext = {drawImage: vi.fn<() => void>()};
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {
                value: vi.fn<() => typeof mockContext>(() => mockContext),
                writable: true,
            });
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Act
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Assert
            const metadataCall = addEventListenerCalls.find((c) => c.event === 'loadedmetadata');
            expect(metadataCall).toBeDefined();
            expect(metadataCall?.options).toStrictEqual({once: true});
            expect(wrapper.emitted('capture')).toBeUndefined();
        });

        it('should capture image after loadedmetadata event fires', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            let videoWidth = 0;
            let videoHeight = 0;
            Object.defineProperty(videoElement, 'videoWidth', {get: () => videoWidth, configurable: true});
            Object.defineProperty(videoElement, 'videoHeight', {get: () => videoHeight, configurable: true});
            Object.defineProperty(videoElement, 'readyState', {value: 0, writable: true});
            // happy-dom's addEventListener is not spyable via vi.spyOn on element instances.
            // Override via defineProperty to capture the loadedmetadata callback.
            const callbacks: {metadata: EventListener | null} = {metadata: null};
            Object.defineProperty(videoElement, 'addEventListener', {
                value: (event: string, callback: EventListenerOrEventListenerObject) => {
                    if (event === 'loadedmetadata') {
                        callbacks.metadata = callback as EventListener;
                    }
                },
                writable: true,
                configurable: true,
            });
            const mockContext = {drawImage: vi.fn<() => void>()};
            const canvasElement = wrapper.find('canvas').element as HTMLCanvasElement;
            Object.defineProperty(canvasElement, 'getContext', {
                value: vi.fn<() => typeof mockContext>(() => mockContext),
                writable: true,
            });
            Object.defineProperty(canvasElement, 'toBlob', {
                value: vi.fn<(callback: (blob: Blob | null) => void) => void>(
                    (callback: (blob: Blob | null) => void) => {
                        callback(new Blob(['test'], {type: 'image/jpeg'}));
                    },
                ),
                writable: true,
            });
            await flushPromises();
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            await captureButton?.trigger('click');

            // Act - simulate metadata loaded with valid dimensions
            videoWidth = 1280;
            videoHeight = 720;
            callbacks.metadata?.(new Event('loadedmetadata'));

            // Assert
            const emitted = wrapper.emitted('capture');
            expect(emitted).toBeTruthy();
            expect(emitted?.[0]?.[0]).toBeInstanceOf(Blob);
        });
    });

    describe('props rendering', () => {
        it('should render loading text from prop', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

            // Assert
            expect(wrapper.find("[role='status'] span").text()).toBe('Starting camera...');
        });

        it('should render custom loading text from prop', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: {...defaultProps, loadingText: 'Camera starten...'}});

            // Assert
            expect(wrapper.find("[role='status'] span").text()).toBe('Camera starten...');
        });

        it('should render retry text from prop', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            const retryButton = wrapper.find("[role='alert'] button");
            expect(retryButton.text()).toBe('Retry');
        });

        it('should render custom retry text from prop', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: {...defaultProps, retryText: 'Opnieuw proberen'}});
            await flushPromises();

            // Assert
            const retryButton = wrapper.find("[role='alert'] button");
            expect(retryButton.text()).toBe('Opnieuw proberen');
        });

        it('should render capture text from prop', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            expect(captureButton?.exists()).toBe(true);
        });

        it('should render custom capture text from prop', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: {...defaultProps, captureText: 'Foto maken'}});

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Foto maken');
            expect(captureButton?.exists()).toBe(true);
        });
    });

    describe('accessibility', () => {
        it('should have aria-label on video element', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

            // Assert
            const video = wrapper.find('video');
            expect(video.attributes('aria-label')).toBe('Live camera feed for capturing Lego bricks');
        });

        it('should have aria-live polite region for loading state', () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});

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
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            const errorDiv = wrapper.find("[role='alert']");
            expect(errorDiv.exists()).toBe(true);
            expect(errorDiv.attributes('aria-live')).toBe('assertive');
        });

        it('should have dynamic aria-label on capture button based on camera state', async () => {
            // Arrange
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            mockGetUserMedia.mockRejectedValue(error);

            // Act
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            await flushPromises();

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            expect(captureButton?.attributes('aria-label')).toBe('Capture photo (camera not ready)');
        });

        it('should update aria-label when camera becomes active', async () => {
            // Arrange
            const mockTrack = {stop: vi.fn<() => void>()};
            const mockStream = {getTracks: vi.fn<() => (typeof mockTrack)[]>(() => [mockTrack])};
            mockGetUserMedia.mockResolvedValue(mockStream);
            const wrapper = shallowMount(CameraCapture, {props: defaultProps});
            const videoElement = wrapper.find('video').element as HTMLVideoElement;
            Object.defineProperty(videoElement, 'play', {
                value: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
                writable: true,
            });
            Object.defineProperty(videoElement, 'videoWidth', {value: 1280, writable: true});
            Object.defineProperty(videoElement, 'videoHeight', {value: 720, writable: true});
            await flushPromises();

            // Act
            const retryButton = wrapper.findAll('button').find((btn) => btn.text() === 'Retry');
            await retryButton?.trigger('click');
            await flushPromises();

            // Assert
            const captureButton = wrapper.findAll('button').find((btn) => btn.text() === 'Capture Photo');
            expect(captureButton?.attributes('aria-label')).toBe('Capture photo of Lego brick');
        });
    });
});
