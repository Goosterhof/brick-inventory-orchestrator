<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const CELL = 40;
const PAD = 10;
const HOLE_RADIUS = 12;
const STROKE = 3;
const SHADOW_OFFSET = 4;
const COLUMNS = 4;

const bodyWidth = 2 * PAD + COLUMNS * CELL;
const bodyHeight = 2 * PAD + CELL;
const halfStroke = STROKE / 2;

const viewBox = `0 0 ${bodyWidth + STROKE + SHADOW_OFFSET} ${bodyHeight + STROKE + SHADOW_OFFSET}`;

const holes = Array.from({length: COLUMNS}, (_, col) => ({
    cx: halfStroke + PAD + CELL / 2 + col * CELL,
    cy: halfStroke + PAD + CELL / 2,
}));
</script>

<template>
    <svg :viewBox="viewBox" role="img" aria-label="1 by 4 LEGO Technic beam">
        <!-- Shadow -->
        <rect
            v-if="shadow"
            :x="halfStroke + SHADOW_OFFSET"
            :y="halfStroke + SHADOW_OFFSET"
            :width="bodyWidth"
            :height="bodyHeight"
            fill="black"
            data-shadow
        />

        <!-- Body -->
        <rect
            :x="halfStroke"
            :y="halfStroke"
            :width="bodyWidth"
            :height="bodyHeight"
            :fill="color"
            stroke="black"
            :stroke-width="STROKE"
            data-body
        />

        <!-- Pin holes -->
        <circle
            v-for="(hole, index) in holes"
            :key="index"
            :cx="hole.cx"
            :cy="hole.cy"
            :r="HOLE_RADIUS"
            fill="white"
            stroke="black"
            :stroke-width="STROKE"
            data-pin-hole
        />
    </svg>
</template>
