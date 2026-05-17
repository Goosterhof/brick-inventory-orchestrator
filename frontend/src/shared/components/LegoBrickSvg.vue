<script setup lang="ts">
import {computed, useId} from 'vue';

const {
    color = '#DC2626',
    shadow = true,
    columns = 4,
    rows = 2,
} = defineProps<{color?: string; shadow?: boolean; columns?: number; rows?: number}>();

const CELL = 40;
const PAD = 10;
const STUD_RADIUS = 12;
const STROKE = 3;
const SHADOW_OFFSET = 4;

const gradientId = useId();

const bodyWidth = computed(() => 2 * PAD + columns * CELL);
const bodyHeight = computed(() => 2 * PAD + rows * CELL);

const viewBox = computed(
    () => `0 0 ${bodyWidth.value + STROKE + SHADOW_OFFSET} ${bodyHeight.value + STROKE + SHADOW_OFFSET}`,
);

const studs = computed(() => {
    const result: Array<{cx: number; cy: number}> = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            result.push({cx: STROKE / 2 + PAD + CELL / 2 + col * CELL, cy: STROKE / 2 + PAD + CELL / 2 + row * CELL});
        }
    }
    return result;
});

const ariaLabel = computed(() => `${columns} by ${rows} LEGO brick`);
</script>

<template>
    <svg :viewBox="viewBox" role="img" :aria-label="ariaLabel" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient :id="gradientId" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stop-color="white" stop-opacity="0.6" />
                <stop offset="100%" stop-color="black" stop-opacity="0.1" />
            </radialGradient>
        </defs>

        <!-- Shadow -->
        <rect
            v-if="shadow"
            :x="STROKE / 2 + SHADOW_OFFSET"
            :y="STROKE / 2 + SHADOW_OFFSET"
            :width="bodyWidth"
            :height="bodyHeight"
            fill="black"
            data-shadow
        />

        <!-- Body -->
        <rect
            :x="STROKE / 2"
            :y="STROKE / 2"
            :width="bodyWidth"
            :height="bodyHeight"
            :fill="color"
            stroke="black"
            :stroke-width="STROKE"
            data-body
        />

        <!-- Studs -->
        <g v-for="(stud, index) in studs" :key="index">
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="color" stroke="black" :stroke-width="STROKE" />
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="`url(#${gradientId})`" />
        </g>
    </svg>
</template>
