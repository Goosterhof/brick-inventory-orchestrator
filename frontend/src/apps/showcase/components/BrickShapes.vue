<script setup lang="ts">
import LegoArch from '@shared/components/LegoArch.vue';
import LegoPlate from '@shared/components/LegoPlate.vue';
import LegoRound from '@shared/components/LegoRound.vue';
import LegoSlope from '@shared/components/LegoSlope.vue';
import LegoTechnicBeam from '@shared/components/LegoTechnicBeam.vue';
import LegoTile from '@shared/components/LegoTile.vue';
import LegoWedge from '@shared/components/LegoWedge.vue';
import {useBrickPickup} from '@shared/composables/useBrickPickup';
import {computed, ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

const shapes = [
    {label: 'Slope (2x2 45°)', component: LegoSlope, color: '#C41A16'},
    {label: 'Arch (1x4)', component: LegoArch, color: '#0055BF'},
    {label: 'Wedge (2x4)', component: LegoWedge, color: '#F5C518'},
    {label: 'Round (1x1)', component: LegoRound, color: '#237841'},
    {label: 'Plate (2x4)', component: LegoPlate, color: '#C41A16'},
    {label: 'Tile (1x2)', component: LegoTile, color: '#0055BF'},
    {label: 'Technic Beam (1x4)', component: LegoTechnicBeam, color: '#F5C518'},
];

// Tunable parameters
const hoverLift = ref(8);
const pressLift = ref(4);
const hoverDuration = ref(160);
const pressDuration = ref(100);
const releaseDuration = ref(320);

// Shared composable instance bound to the live parameter sliders. Each card creates
// its own composable below; this instance powers the headline "Active Parameters"
// readout so the demo is honest about the values it ships with.
const headlineParameters = computed(() => ({
    hoverLift: `${String(hoverLift.value)}px`,
    pressLift: `${String(pressLift.value)}px`,
    hoverDuration: `${String(hoverDuration.value)}ms`,
    pressDuration: `${String(pressDuration.value)}ms`,
    releaseDuration: `${String(releaseDuration.value)}ms`,
    hoverEasing: 'cubic-bezier(0.2, 0, 0, 1)',
    pressEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
}));

const reducedMotion = ref(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
);

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        reducedMotion.value = event.matches;
    });
}

// One composable per card. The cards demonstrate the baseline (default) values
// so the on-card pickup feels consistent; the sliders drive the headline
// "Active Parameters" readout so the demo teaches the parameter range without
// confusing the per-card experience with mid-gesture parameter swaps.
const cards = shapes.map((shape) => ({
    ...shape,
    pickup: useBrickPickup(),
}));

const stateColors: Record<'idle' | 'hovered' | 'pressed', string> = {
    idle: 'bg-gray-100',
    hovered: 'bg-brick-yellow-subtle',
    pressed: 'bg-brick-yellow',
};
</script>

<template>
    <section p="y-20" id="brick-shapes">
        <SectionHeading number="14" title="Brick Shapes" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Hover, press, release. Each shape responds to pointer interaction with a tactile lift-and-snap. The
            composable behind it (<code font="mono">useBrickPickup()</code>) and the
            <code font="mono">brick-anim-pickup</code> shortcut are reusable across surfaces. Reduced-motion preference
            disables transforms and silences the snap.
        </p>

        <div grid="~ cols-1 lg:cols-3" gap="8" m="b-10">
            <!-- Active parameters -->
            <div p="6" class="brick-border brick-shadow" bg="white" lg-col-span="2">
                <p class="brick-label" m="b-4">Active Parameters</p>

                <div flex="~ col" gap="3">
                    <div
                        v-for="(value, label) in headlineParameters"
                        :key="label"
                        flex
                        justify="between"
                        items="baseline"
                    >
                        <span text="sm" font="bold" uppercase tracking="wide">{{ label }}</span>
                        <span font="mono bold" text="sm" p="x-2 y-1" bg="gray-100" class="brick-border">
                            {{ value }}
                        </span>
                    </div>
                </div>

                <!-- Reduced motion indicator -->
                <div v-if="reducedMotion" m="t-4" p="2" bg="red-50" class="brick-border" text="xs">
                    <span font="bold">prefers-reduced-motion: reduce</span> — transforms disabled, snap/thud silenced
                </div>
            </div>

            <!-- Interactive controls -->
            <div p="6" class="brick-border brick-shadow" bg="white" data-controls>
                <p class="brick-label" m="b-4">Dial It In</p>

                <div flex="~ col" gap="4">
                    <label flex="~ col" gap="1">
                        <span text="xs" font="bold mono" uppercase tracking="wide">Hover lift: {{ hoverLift }}px</span>
                        <input v-model.number="hoverLift" type="range" min="0" max="20" step="1" data-slider-hover />
                    </label>
                    <label flex="~ col" gap="1">
                        <span text="xs" font="bold mono" uppercase tracking="wide"
                            >Press lift (extra): {{ pressLift }}px</span
                        >
                        <input v-model.number="pressLift" type="range" min="0" max="12" step="1" data-slider-press />
                    </label>
                    <label flex="~ col" gap="1">
                        <span text="xs" font="bold mono" uppercase tracking="wide"
                            >Hover duration: {{ hoverDuration }}ms</span
                        >
                        <input
                            v-model.number="hoverDuration"
                            type="range"
                            min="0"
                            max="400"
                            step="20"
                            data-slider-hover-dur
                        />
                    </label>
                    <label flex="~ col" gap="1">
                        <span text="xs" font="bold mono" uppercase tracking="wide"
                            >Press duration: {{ pressDuration }}ms</span
                        >
                        <input
                            v-model.number="pressDuration"
                            type="range"
                            min="0"
                            max="400"
                            step="20"
                            data-slider-press-dur
                        />
                    </label>
                    <label flex="~ col" gap="1">
                        <span text="xs" font="bold mono" uppercase tracking="wide"
                            >Release duration: {{ releaseDuration }}ms</span
                        >
                        <input
                            v-model.number="releaseDuration"
                            type="range"
                            min="0"
                            max="600"
                            step="20"
                            data-slider-release
                        />
                    </label>
                </div>
            </div>
        </div>

        <!-- Shape grid with live pickup interactions -->
        <div grid="~ cols-1 sm:cols-2 md:cols-3 lg:cols-4" gap="6">
            <div
                v-for="card in cards"
                :key="card.label"
                p="6"
                class="brick-border brick-shadow"
                bg="white"
                flex="~ col"
                items="center"
                gap="4"
                data-shape-card
            >
                <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">{{ card.label }}</p>

                <div
                    class="brick-anim-pickup"
                    flex
                    items="center"
                    justify="center"
                    min-h="24"
                    w="full"
                    :style="card.pickup.style.value"
                    :data-state="card.pickup.state.value"
                    @mouseenter="card.pickup.onEnter"
                    @mouseleave="card.pickup.onLeave"
                    @mousedown="card.pickup.onPress"
                    @mouseup="card.pickup.onRelease"
                >
                    <component :is="card.component" :color="card.color" />
                </div>

                <span
                    text="xs"
                    font="bold mono"
                    p="x-2 y-1"
                    :class="stateColors[card.pickup.state.value]"
                    class="brick-border"
                >
                    {{ card.pickup.state.value.toUpperCase() }}
                </span>
            </div>
        </div>
    </section>
</template>
