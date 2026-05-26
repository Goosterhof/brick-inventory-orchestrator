import type {SoundService, SoundType} from '@shared/services/sound';

import {useBrickPickup} from '@shared/composables/useBrickPickup';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {computed, ref} from 'vue';

const setMatchMedia = (matches: boolean): void => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi
            .fn<(query: string) => {matches: boolean; addEventListener: () => void}>()
            .mockReturnValue({matches, addEventListener: vi.fn<() => void>()}),
    });
};

const createMockSoundService = (): SoundService & {play: ReturnType<typeof vi.fn>} => ({
    isEnabled: computed(() => true),
    toggle: vi.fn<() => void>(),
    play: vi.fn<(sound: SoundType) => void>(),
});

describe('useBrickPickup', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        setMatchMedia(false);
    });

    it('should expose state, reducedMotion, style, and four handlers', () => {
        // Act
        const pickup = useBrickPickup();

        // Assert
        expect(pickup.state.value).toBe('idle');
        expect(pickup.reducedMotion.value).toBe(false);
        expect(pickup.style.value).toStrictEqual({
            transform: 'translateY(0px)',
            transition: 'transform 160ms cubic-bezier(0.2, 0, 0, 1)',
        });
        expect(pickup.onEnter).toBeInstanceOf(Function);
        expect(pickup.onLeave).toBeInstanceOf(Function);
        expect(pickup.onPress).toBeInstanceOf(Function);
        expect(pickup.onRelease).toBeInstanceOf(Function);
    });

    it('should transition idle → hovered on enter', () => {
        // Arrange
        const pickup = useBrickPickup();

        // Act
        pickup.onEnter();

        // Assert
        expect(pickup.state.value).toBe('hovered');
        expect(pickup.style.value.transform).toBe('translateY(-8px)');
    });

    it('should transition hovered → pressed on press', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onEnter();

        // Act
        pickup.onPress();

        // Assert
        expect(pickup.state.value).toBe('pressed');
        expect(pickup.style.value.transform).toBe('translateY(-12px)');
    });

    it('should use the press easing and duration on press', () => {
        // Arrange
        const pickup = useBrickPickup();

        // Act
        pickup.onPress();

        // Assert
        expect(pickup.style.value.transition).toBe('transform 100ms cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should transition pressed → hovered on release', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onEnter();
        pickup.onPress();

        // Act
        pickup.onRelease();

        // Assert
        expect(pickup.state.value).toBe('hovered');
        expect(pickup.style.value.transform).toBe('translateY(-8px)');
    });

    it('should use the release duration when transitioning out of pressed', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onPress();

        // Act
        pickup.onRelease();

        // Assert
        expect(pickup.style.value.transition).toBe('transform 320ms cubic-bezier(0.2, 0, 0, 1)');
    });

    it('should transition any state → idle on leave', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onEnter();

        // Act
        pickup.onLeave();

        // Assert
        expect(pickup.state.value).toBe('idle');
        expect(pickup.style.value.transform).toBe('translateY(0px)');
    });

    it('should snap directly back to idle from pressed on leave', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onEnter();
        pickup.onPress();

        // Act — pointer leaves while still pressed (e.g. drag-off)
        pickup.onLeave();

        // Assert
        expect(pickup.state.value).toBe('idle');
        expect(pickup.style.value.transform).toBe('translateY(0px)');
    });

    it('should not re-enter hovered if already hovered (idempotent enter)', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onEnter();

        // Act
        pickup.onEnter();

        // Assert
        expect(pickup.state.value).toBe('hovered');
    });

    it('should not re-press if already pressed (idempotent press)', () => {
        // Arrange
        const sound = createMockSoundService();
        const pickup = useBrickPickup({soundService: sound});
        pickup.onPress();
        sound.play.mockClear();

        // Act
        pickup.onPress();

        // Assert — no double-snap
        expect(sound.play).not.toHaveBeenCalled();
        expect(pickup.state.value).toBe('pressed');
    });

    it('should ignore release when not in pressed state', () => {
        // Arrange
        const sound = createMockSoundService();
        const pickup = useBrickPickup({soundService: sound});
        pickup.onEnter();

        // Act
        pickup.onRelease();

        // Assert — no thud, state unchanged
        expect(sound.play).not.toHaveBeenCalled();
        expect(pickup.state.value).toBe('hovered');
    });

    it('should play the snap sound on press when a sound service is provided', () => {
        // Arrange
        const sound = createMockSoundService();
        const pickup = useBrickPickup({soundService: sound});

        // Act
        pickup.onPress();

        // Assert
        expect(sound.play).toHaveBeenCalledOnce();
        expect(sound.play).toHaveBeenCalledWith('snap');
    });

    it('should play the thud sound on release-into-place when a sound service is provided', () => {
        // Arrange
        const sound = createMockSoundService();
        const pickup = useBrickPickup({soundService: sound});
        pickup.onPress();
        sound.play.mockClear();

        // Act
        pickup.onRelease();

        // Assert
        expect(sound.play).toHaveBeenCalledOnce();
        expect(sound.play).toHaveBeenCalledWith('thud');
    });

    it('should not error on press when no sound service is provided', () => {
        // Arrange
        const pickup = useBrickPickup();

        // Act & Assert
        expect(() => pickup.onPress()).not.toThrow();
    });

    it('should not error on release when no sound service is provided', () => {
        // Arrange
        const pickup = useBrickPickup();
        pickup.onPress();

        // Act & Assert
        expect(() => pickup.onRelease()).not.toThrow();
    });

    it('should honor custom hoverLift', () => {
        // Arrange & Act
        const pickup = useBrickPickup({hoverLift: 14});
        pickup.onEnter();

        // Assert
        expect(pickup.style.value.transform).toBe('translateY(-14px)');
    });

    it('should honor custom pressLift on top of hoverLift', () => {
        // Arrange & Act
        const pickup = useBrickPickup({hoverLift: 10, pressLift: 6});
        pickup.onPress();

        // Assert — 10 + 6 = 16
        expect(pickup.style.value.transform).toBe('translateY(-16px)');
    });

    it('should honor custom durations', () => {
        // Arrange
        const pickup = useBrickPickup({hoverDuration: 200, pressDuration: 80, releaseDuration: 400});

        // Act + Assert (initial idle uses hoverDuration)
        expect(pickup.style.value.transition).toContain('200ms');

        pickup.onPress();
        expect(pickup.style.value.transition).toContain('80ms');

        pickup.onRelease();
        expect(pickup.style.value.transition).toContain('400ms');
    });

    it('should honor custom easings', () => {
        // Arrange
        const pickup = useBrickPickup({hoverEasing: 'ease-in', pressEasing: 'ease-out'});

        // Act + Assert
        expect(pickup.style.value.transition).toContain('ease-in');
        pickup.onPress();
        expect(pickup.style.value.transition).toContain('ease-out');
        pickup.onRelease();
        // Release uses hoverEasing
        expect(pickup.style.value.transition).toContain('ease-in');
    });

    it('should short-circuit to no transform and no sound when reduced motion is preferred', () => {
        // Arrange
        setMatchMedia(true);
        const sound = createMockSoundService();
        const pickup = useBrickPickup({soundService: sound});

        // Assert — initial style is the reduced-motion shape
        expect(pickup.reducedMotion.value).toBe(true);
        expect(pickup.style.value).toStrictEqual({transform: 'none', transition: 'none'});

        // Act — exercise the full interaction sequence
        pickup.onEnter();
        pickup.onPress();
        pickup.onRelease();
        pickup.onLeave();

        // Assert — no transform applied at any state, no sound played
        expect(pickup.style.value.transform).toBe('none');
        expect(pickup.style.value.transition).toBe('none');
        expect(sound.play).not.toHaveBeenCalled();
    });

    it('should still surface state transitions under reduced motion so consumers can render a color cue', () => {
        // Arrange
        setMatchMedia(true);
        const pickup = useBrickPickup();

        // Act
        pickup.onEnter();
        // Assert
        expect(pickup.state.value).toBe('hovered');

        pickup.onPress();
        expect(pickup.state.value).toBe('pressed');

        pickup.onRelease();
        expect(pickup.state.value).toBe('hovered');

        pickup.onLeave();
        expect(pickup.state.value).toBe('idle');
    });

    it('should default reduced-motion to false in SSR-like environments without matchMedia', () => {
        // Arrange
        Object.defineProperty(window, 'matchMedia', {writable: true, value: undefined});

        // Act
        const pickup = useBrickPickup();

        // Assert — defaults to active animation behavior
        expect(pickup.reducedMotion.value).toBe(false);
        expect(pickup.style.value.transform).toBe('translateY(0px)');
    });

    it('should expose a state ref that is reactive', () => {
        // Arrange
        const pickup = useBrickPickup();
        const observed = ref<string[]>([]);
        // Subscribe by reading inside a computed
        const subscriber = computed(() => {
            observed.value.push(pickup.state.value);
            return pickup.state.value;
        });
        // Force initial read
        expect(subscriber.value).toBe('idle');

        // Act
        pickup.onEnter();
        // Assert
        expect(subscriber.value).toBe('hovered');
    });
});
