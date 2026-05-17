<script setup lang="ts">
import {useId} from 'vue';

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const CELL = 40;
const PAD = 10;
const STUD_RADIUS = 12;
const STROKE = 3;
const SHADOW_OFFSET = 4;
const COLUMNS = 4;

const gradientId = useId();

const bodyWidth = 2 * PAD + COLUMNS * CELL;
const bodyHeight = 2 * PAD + CELL;
const halfStroke = STROKE / 2;

const viewBox = `0 0 ${bodyWidth + STROKE + SHADOW_OFFSET} ${bodyHeight + STROKE + SHADOW_OFFSET}`;

const studs = Array.from({length: COLUMNS}, (_, col) => ({
    cx: halfStroke + PAD + CELL / 2 + col * CELL,
    cy: halfStroke + PAD + CELL / 2,
}));

/* Arch cutout: a semicircular opening spanning the middle two stud positions
   (studs 2 and 3). The arch is drawn as a dark filled semicircle at the bottom
   of the body to simulate looking through the arch opening from above. */
const archCx = halfStroke + bodyWidth / 2;
const archCy = halfStroke + bodyHeight;
const archR = CELL;
const archLeft = archCx - archR;
const archRight = archCx + archR;
</script>

<template>
    <svg :viewBox="viewBox" role="img" aria-label="1 by 4 LEGO arch brick">
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

        <!-- Arch hint: filled semicircular cutout spanning the middle two stud positions -->
        <path
            :d="`M ${archLeft} ${archCy} A ${archR} ${archR} 0 0 1 ${archRight} ${archCy} Z`"
            fill="black"
            fill-opacity="0.2"
            stroke="black"
            stroke-width="1.5"
            stroke-opacity="0.4"
            data-arch-hint
        />

        <!-- Studs -->
        <g v-for="(stud, index) in studs" :key="index">
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="color" stroke="black" :stroke-width="STROKE" />
            <circle :cx="stud.cx" :cy="stud.cy" :r="STUD_RADIUS" :fill="`url(#${gradientId})`" />
        </g>
    </svg>
</template>
