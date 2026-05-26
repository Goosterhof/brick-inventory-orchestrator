import type {SoundService} from '@shared/services/sound';
import type {ComputedRef, Ref} from 'vue';

import {computed, ref} from 'vue';

/**
 * Discrete states of a brick under pickup interaction.
 *
 * - `idle` — resting on the baseplate
 * - `hovered` — pointer-over, brick lifts slightly
 * - `pressed` — pointer-down, brick snaps up further
 *
 * The transition `idle → hovered → pressed → hovered → idle` mirrors the physical
 * sequence of approaching, picking up, and releasing a real LEGO brick.
 * @public
 */
export type BrickPickupState = 'idle' | 'hovered' | 'pressed';

/**
 * Tunable parameters for the pickup interaction.
 *
 * All distances are in pixels; all durations are in milliseconds. The shape
 * mirrors the Pattern Master Parameter Record categories so the values can be
 * recorded verbatim into the Build Record.
 * @public
 */
export interface BrickPickupOptions {
    /** Pixels the brick lifts on hover. Defaults to 8. */
    hoverLift?: number;
    /** Additional pixels the brick lifts on press (on top of hover). Defaults to 4. */
    pressLift?: number;
    /** Hover transition duration in milliseconds. Defaults to 160. */
    hoverDuration?: number;
    /** Press transition duration in milliseconds (sharper than hover). Defaults to 100. */
    pressDuration?: number;
    /** Release (settle) transition duration in milliseconds. Defaults to 320. */
    releaseDuration?: number;
    /** CSS easing applied to hover / release. Defaults to the page-transition language. */
    hoverEasing?: string;
    /** CSS easing applied to press (tighter than hover). Defaults to a snappy ease. */
    pressEasing?: string;
    /**
     * Optional sound service. When supplied, `snap` fires on press and `thud`
     * fires on release-into-place. Honors the service's own user-preference
     * and reduced-motion gating.
     */
    soundService?: SoundService;
}

/**
 * The shape consumed by template bindings.
 * @public
 */
export interface UseBrickPickup {
    /** Current interaction state. Useful for ARIA hooks or visual debug overlays. */
    state: Ref<BrickPickupState>;
    /** Whether the user prefers reduced motion. When `true`, transforms are suppressed. */
    reducedMotion: ComputedRef<boolean>;
    /** Inline style object to bind to the animated element. */
    style: ComputedRef<{transform: string; transition: string}>;
    /** `mouseenter` / `pointerenter` handler. */
    onEnter: () => void;
    /** `mouseleave` / `pointerleave` handler. */
    onLeave: () => void;
    /** `mousedown` / `pointerdown` handler. Plays the snap sound on press. */
    onPress: () => void;
    /** `mouseup` / `pointerup` handler. Plays the thud sound on release-into-place. */
    onRelease: () => void;
}

const DEFAULTS = {
    hoverLift: 8,
    pressLift: 4,
    hoverDuration: 160,
    pressDuration: 100,
    releaseDuration: 320,
    hoverEasing: 'cubic-bezier(0.2, 0, 0, 1)',
    pressEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

const detectReducedMotion = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Hover/press/release micro-interaction for LEGO-shape elements.
 *
 * Designed first for the `prefers-reduced-motion: reduce` user — when the
 * preference is set, the composable returns a no-op transform and a zero
 * transition, never plays sound, and emits state changes only as a discrete
 * data signal (consumers can still render a color/border cue from `state`).
 *
 * Transform discipline: `translateY` only. No animation of layout-affecting
 * properties (width/height/margin). The transition is composited on the GPU.
 * @public
 */
export const useBrickPickup = (options: BrickPickupOptions = {}): UseBrickPickup => {
    const hoverLift = options.hoverLift ?? DEFAULTS.hoverLift;
    const pressLift = options.pressLift ?? DEFAULTS.pressLift;
    const hoverDuration = options.hoverDuration ?? DEFAULTS.hoverDuration;
    const pressDuration = options.pressDuration ?? DEFAULTS.pressDuration;
    const releaseDuration = options.releaseDuration ?? DEFAULTS.releaseDuration;
    const hoverEasing = options.hoverEasing ?? DEFAULTS.hoverEasing;
    const pressEasing = options.pressEasing ?? DEFAULTS.pressEasing;
    const soundService = options.soundService;

    const state = ref<BrickPickupState>('idle');
    const previousState = ref<BrickPickupState>('idle');
    const reducedMotion = computed(detectReducedMotion);

    const transformFor = (current: BrickPickupState): string => {
        if (reducedMotion.value) return 'none';
        if (current === 'pressed') return `translateY(-${String(hoverLift + pressLift)}px)`;
        if (current === 'hovered') return `translateY(-${String(hoverLift)}px)`;
        return 'translateY(0px)';
    };

    const transitionFor = (current: BrickPickupState, previous: BrickPickupState): string => {
        if (reducedMotion.value) return 'none';
        const entersPress = current === 'pressed';
        const leavesPress = previous === 'pressed' && current !== 'pressed';
        if (entersPress) return `transform ${String(pressDuration)}ms ${pressEasing}`;
        if (leavesPress) return `transform ${String(releaseDuration)}ms ${hoverEasing}`;
        return `transform ${String(hoverDuration)}ms ${hoverEasing}`;
    };

    const style = computed(() => ({
        transform: transformFor(state.value),
        transition: transitionFor(state.value, previousState.value),
    }));

    const transitionTo = (next: BrickPickupState): void => {
        previousState.value = state.value;
        state.value = next;
    };

    const onEnter = (): void => {
        if (state.value === 'idle') transitionTo('hovered');
    };

    const onLeave = (): void => {
        transitionTo('idle');
    };

    const onPress = (): void => {
        if (state.value === 'pressed') return;
        transitionTo('pressed');
        if (!reducedMotion.value) soundService?.play('snap');
    };

    const onRelease = (): void => {
        if (state.value !== 'pressed') return;
        transitionTo('hovered');
        if (!reducedMotion.value) soundService?.play('thud');
    };

    return {state, reducedMotion, style, onEnter, onLeave, onPress, onRelease};
};
