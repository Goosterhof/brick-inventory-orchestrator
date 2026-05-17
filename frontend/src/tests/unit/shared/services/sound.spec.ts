import type {StorageService} from '@script-development/fs-storage';

import {createSoundService} from '@shared/services/sound';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const createMockStorageService = (initialData: Record<string, unknown> = {}): StorageService => {
    const store = new Map<string, unknown>(Object.entries(initialData));

    return {
        put: vi.fn<(key: string, value: unknown) => void>((key: string, value: unknown) => store.set(key, value)),
        get: vi.fn<(key: string) => unknown>((key: string) => store.get(key)) as unknown as StorageService['get'],
        remove: vi.fn<(key: string) => void>((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn<() => void>(() => {
            store.clear();
        }),
    };
};

const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn<() => {matches: boolean}>().mockReturnValue({matches}),
    });
};

const createMockAudioContext = () => {
    const mockGainNode = {
        gain: {
            value: 0,
            setValueAtTime: vi.fn<() => void>(),
            exponentialRampToValueAtTime: vi.fn<() => void>(),
            linearRampToValueAtTime: vi.fn<() => void>(),
        },
        connect: vi.fn<() => void>(),
    };

    const mockFilter = {type: '', frequency: {value: 0}, Q: {value: 0}, connect: vi.fn<() => void>()};

    const mockBufferSource = {
        buffer: null,
        connect: vi.fn<() => void>(),
        start: vi.fn<() => void>(),
        stop: vi.fn<() => void>(),
    };

    const mockBuffer = {getChannelData: vi.fn<() => Float32Array>().mockReturnValue(new Float32Array(4800))};

    const mockContext = {
        currentTime: 0,
        sampleRate: 48000,
        destination: {},
        createBufferSource: vi.fn<() => typeof mockBufferSource>().mockReturnValue(mockBufferSource),
        createBiquadFilter: vi.fn<() => typeof mockFilter>().mockReturnValue(mockFilter),
        createGain: vi.fn<() => typeof mockGainNode>().mockReturnValue(mockGainNode),
        createBuffer: vi.fn<() => typeof mockBuffer>().mockReturnValue(mockBuffer),
        close: vi.fn<() => void>(),
    };

    return mockContext;
};

describe('createSoundService', () => {
    beforeEach(() => {
        mockMatchMedia(false);

        vi.stubGlobal(
            'AudioContext',
            vi.fn<() => ReturnType<typeof createMockAudioContext>>().mockImplementation(function () {
                return createMockAudioContext();
            }),
        );
    });

    it('should initialize with sound disabled', () => {
        // Arrange
        const storage = createMockStorageService();

        // Act
        const service = createSoundService(storage);

        // Assert
        expect(service.isEnabled.value).toBe(false);
    });

    it('should initialize with sound enabled when stored preference is true', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});

        // Act
        const service = createSoundService(storage);

        // Assert
        expect(service.isEnabled.value).toBe(true);
    });

    it('should enable sound when toggled on', () => {
        // Arrange
        const storage = createMockStorageService();
        const service = createSoundService(storage);

        // Act
        service.toggle();

        // Assert
        expect(service.isEnabled.value).toBe(true);
    });

    it('should disable sound when toggled off', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.toggle();

        // Assert
        expect(service.isEnabled.value).toBe(false);
    });

    it('should persist toggle state to storage', () => {
        // Arrange
        const storage = createMockStorageService();
        const service = createSoundService(storage);

        // Act
        service.toggle();

        // Assert
        expect(storage.put).toHaveBeenCalledWith('sound-enabled', true);

        // Act - toggle off
        service.toggle();

        // Assert
        expect(storage.put).toHaveBeenCalledWith('sound-enabled', false);
    });

    it('should disable sound when prefers-reduced-motion matches', () => {
        // Arrange
        mockMatchMedia(true);
        const storage = createMockStorageService({'sound-enabled': true});

        // Act
        const service = createSoundService(storage);

        // Assert
        expect(service.isEnabled.value).toBe(false);
    });

    it('should not play sound when disabled', () => {
        // Arrange
        const storage = createMockStorageService();
        const service = createSoundService(storage);

        // Act
        service.play('snap');

        // Assert
        expect(AudioContext).not.toHaveBeenCalled();
    });

    it('should not play sound when prefers-reduced-motion is active', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Enable reduced motion after creation
        mockMatchMedia(true);

        // Act
        service.play('snap');

        // Assert
        expect(AudioContext).not.toHaveBeenCalled();
    });

    it('should create AudioContext and play snap sound', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('snap');

        // Assert
        expect(AudioContext).toHaveBeenCalledOnce();
    });

    it('should create AudioContext and play pull sound', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('pull');

        // Assert
        expect(AudioContext).toHaveBeenCalledOnce();
    });

    it('should create AudioContext and play cascade sound', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('cascade');

        // Assert
        expect(AudioContext).toHaveBeenCalledOnce();
    });

    it('should create AudioContext and play thud sound', () => {
        // Arrange
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('thud');

        // Assert
        expect(AudioContext).toHaveBeenCalledOnce();
    });

    it('should close previous AudioContext when playing a new sound', () => {
        // Arrange
        const mockContext = createMockAudioContext();
        vi.stubGlobal(
            'AudioContext',
            vi.fn<() => ReturnType<typeof createMockAudioContext>>().mockImplementation(function () {
                return mockContext;
            }),
        );

        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act - play twice
        service.play('snap');
        service.play('pull');

        // Assert
        expect(mockContext.close).toHaveBeenCalledOnce();
    });

    it('should read stored preference on initialization', () => {
        // Arrange
        const storage = createMockStorageService();

        // Act
        createSoundService(storage);

        // Assert
        expect(storage.get).toHaveBeenCalledWith('sound-enabled');
    });

    it('should use noise-based synthesis with bandpass filter for snap', () => {
        // Arrange
        const mockContext = createMockAudioContext();
        vi.stubGlobal(
            'AudioContext',
            vi.fn<() => ReturnType<typeof createMockAudioContext>>().mockImplementation(function () {
                return mockContext;
            }),
        );
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('snap');

        // Assert
        expect(mockContext.createBuffer).toHaveBeenCalled();
        expect(mockContext.createBufferSource).toHaveBeenCalled();
        expect(mockContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should use noise-based synthesis with bandpass filter for cascade', () => {
        // Arrange
        const mockContext = createMockAudioContext();
        vi.stubGlobal(
            'AudioContext',
            vi.fn<() => ReturnType<typeof createMockAudioContext>>().mockImplementation(function () {
                return mockContext;
            }),
        );
        const storage = createMockStorageService({'sound-enabled': true});
        const service = createSoundService(storage);

        // Act
        service.play('cascade');

        // Assert — cascade creates 4 snaps
        expect(mockContext.createBufferSource).toHaveBeenCalledTimes(4);
        expect(mockContext.createBiquadFilter).toHaveBeenCalledTimes(4);
    });
});
