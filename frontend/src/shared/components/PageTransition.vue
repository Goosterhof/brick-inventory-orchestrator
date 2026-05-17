<script lang="ts">
export type TransitionVariant = 'brick-snap' | 'brick-lift';
</script>

<script setup lang="ts">
import {computed, ref} from 'vue';

type TransitionName = TransitionVariant | 'brick-none';

const {routePath, defaultVariant = 'brick-snap'} = defineProps<{
    /** The current route path — used as the transition key */
    routePath: string;
    /** Optional: override the default variant selection */
    defaultVariant?: TransitionVariant;
}>();

const prefersReducedMotion = ref(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
);

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        prefersReducedMotion.value = event.matches;
    });
}

const transitionName = computed<TransitionName>(() => {
    if (prefersReducedMotion.value) return 'brick-none';
    return defaultVariant;
});
</script>

<template>
    <Transition :name="transitionName" mode="out-in">
        <div :key="routePath">
            <slot />
        </div>
    </Transition>
</template>

<style scoped>
/* brick-snap: the default forward navigation.
 * New page translates up slightly and fades in — a brick snapping onto the baseplate.
 * Duration: 220ms. Easing: cubic-bezier(0.2, 0, 0, 1) — same as brick-transition.
 * Distance: 12px (0.75rem) translateY. Opacity: 0 -> 1.
 */
.brick-snap-enter-active {
    transition:
        opacity 220ms cubic-bezier(0.2, 0, 0, 1),
        transform 220ms cubic-bezier(0.2, 0, 0, 1);
}

.brick-snap-leave-active {
    transition:
        opacity 140ms cubic-bezier(0.2, 0, 0, 1),
        transform 140ms cubic-bezier(0.2, 0, 0, 1);
}

.brick-snap-enter-from {
    opacity: 0;
    transform: translateY(12px);
}

.brick-snap-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* brick-lift: the back navigation variant.
 * Page lifts up and fades — a brick being lifted off the baseplate.
 * Duration: 200ms. Easing: cubic-bezier(0.2, 0, 0, 1).
 * Distance: 12px translateY (reversed direction). Opacity: 0 -> 1.
 */
.brick-lift-enter-active {
    transition:
        opacity 200ms cubic-bezier(0.2, 0, 0, 1),
        transform 200ms cubic-bezier(0.2, 0, 0, 1);
}

.brick-lift-leave-active {
    transition:
        opacity 140ms cubic-bezier(0.2, 0, 0, 1),
        transform 140ms cubic-bezier(0.2, 0, 0, 1);
}

.brick-lift-enter-from {
    opacity: 0;
    transform: translateY(-12px);
}

.brick-lift-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

/* brick-none: reduced motion — instant swap, no animation.
 * The global prefers-reduced-motion override in accessibility.css
 * sets all transition-duration to 0.01ms, but we also explicitly
 * disable transforms to prevent any visual shift.
 */
.brick-none-enter-active,
.brick-none-leave-active {
    transition: none;
}

.brick-none-enter-from,
.brick-none-leave-to {
    opacity: 1;
    transform: none;
}
</style>
