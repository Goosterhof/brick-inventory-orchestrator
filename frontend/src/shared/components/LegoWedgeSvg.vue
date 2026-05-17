<script setup lang="ts">
import {useId} from 'vue';

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const CELL = 40;
const PAD = 10;
const STUD_RADIUS = 12;
const STROKE = 3;
const SHADOW_OFFSET = 4;
const COLUMNS = 4;
const ROWS = 2;

const gradientId = useId();

const bodyWidth = 2 * PAD + COLUMNS * CELL;
const bodyHeight = 2 * PAD + ROWS * CELL;
const halfStroke = STROKE / 2;

const viewBox = `0 0 ${bodyWidth + STROKE + SHADOW_OFFSET} ${bodyHeight + STROKE + SHADOW_OFFSET}`;

const studs = (() => {
    const result: Array<{cx: number; cy: number}> = [];
    for (let col = 0; col < COLUMNS; col++) {
        result.push({cx: halfStroke + PAD + CELL / 2 + col * CELL, cy: halfStroke + PAD + CELL / 2});
    }
    for (let col = 0; col < COLUMNS - 1; col++) {
        result.push({cx: halfStroke + PAD + CELL / 2 + col * CELL, cy: halfStroke + PAD + CELL + CELL / 2});
    }
    return result;
})();

const taperX1 = halfStroke + bodyWidth;
const taperY1 = halfStroke;
const taperX2 = halfStroke + bodyWidth - PAD - CELL;
const taperY2 = halfStroke + bodyHeight;
</script>

<template>
    <svg :viewBox="viewBox" role="img" aria-label="2 by 4 LEGO wedge plate">
        <defs>
            <radialGradient :id="gradientId" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stop-color="white" stop-opacity="0.6" />
                <stop offset="100%" stop-color="black" stop-opacity="0.1" />
            </radialGradient>
        </defs>

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

        <!-- Wedge hint: diagonal taper line from top-right to bottom -->
        <line
            :x1="taperX1"
            :y1="taperY1"
            :x2="taperX2"
            :y2="taperY2"
            stroke="black"
            stroke-width="2"
            stroke-opacity="0.4"
            data-wedge-hint
        />

        <!-- Studs: 4 on row 1, 3 on row 2 (4th cut off by taper) -->
        <g v-for="(stud, index) in studs" :key="index">
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="color" stroke="black" :stroke-width="STROKE" />
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="`url(#${gradientId})`" />
        </g>
    </svg>
</template>
