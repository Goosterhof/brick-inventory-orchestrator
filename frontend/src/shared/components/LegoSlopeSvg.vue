<script setup lang="ts">
import {useId} from 'vue';

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const CELL = 40;
const PAD = 10;
const STUD_RADIUS = 12;
const STROKE = 3;
const SHADOW_OFFSET = 4;
const COLUMNS = 2;
const ROWS = 2;

const gradientId = useId();
const slopeGradientId = `${gradientId}-slope`;

const bodyWidth = 2 * PAD + COLUMNS * CELL;
const bodyHeight = 2 * PAD + ROWS * CELL;
const halfStroke = STROKE / 2;

const viewBox = `0 0 ${bodyWidth + STROKE + SHADOW_OFFSET} ${bodyHeight + STROKE + SHADOW_OFFSET}`;

const studs = [
    {cx: halfStroke + PAD + CELL / 2, cy: halfStroke + PAD + CELL + CELL / 2},
    {cx: halfStroke + PAD + CELL + CELL / 2, cy: halfStroke + PAD + CELL + CELL / 2},
];

/* Slope hint: a filled triangular region covering the top-left half of the body,
   with a gradient from transparent to a darker shade — communicates "this surface
   angles downward from top-right to bottom-left" when viewed from above. */
const slopePoints = [
    `${halfStroke},${halfStroke}`,
    `${halfStroke + bodyWidth},${halfStroke}`,
    `${halfStroke},${halfStroke + PAD + CELL}`,
].join(' ');
</script>

<template>
    <svg :viewBox="viewBox" role="img" aria-label="2 by 2 LEGO slope brick">
        <defs>
            <radialGradient :id="gradientId" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stop-color="white" stop-opacity="0.6" />
                <stop offset="100%" stop-color="black" stop-opacity="0.1" />
            </radialGradient>
            <linearGradient :id="slopeGradientId" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="black" stop-opacity="0" />
                <stop offset="100%" stop-color="black" stop-opacity="0.25" />
            </linearGradient>
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

        <!-- Slope hint: shaded triangle over top-left half with gradient darkening toward the low edge -->
        <polygon :points="slopePoints" :fill="`url(#${slopeGradientId})`" data-slope-hint />
        <line
            :x1="halfStroke + bodyWidth"
            :y1="halfStroke"
            :x2="halfStroke"
            :y2="halfStroke + PAD + CELL"
            stroke="black"
            stroke-width="2"
            stroke-opacity="0.4"
            data-slope-edge
        />

        <!-- Studs on the bottom row only -->
        <g v-for="(stud, index) in studs" :key="index">
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="color" stroke="black" :stroke-width="STROKE" />
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="`url(#${gradientId})`" />
        </g>
    </svg>
</template>
