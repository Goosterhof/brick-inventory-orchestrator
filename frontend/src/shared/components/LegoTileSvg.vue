<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const CELL = 40;
const PAD = 10;
const STROKE = 3;
const SHADOW_OFFSET = 4;
const COLUMNS = 2;
const INSET = 5;

const bodyWidth = 2 * PAD + COLUMNS * CELL;
const bodyHeight = 2 * PAD + CELL;
const halfStroke = STROKE / 2;

const viewBox = `0 0 ${bodyWidth + STROKE + SHADOW_OFFSET} ${bodyHeight + STROKE + SHADOW_OFFSET}`;
</script>

<template>
    <svg :viewBox="viewBox" role="img" aria-label="1 by 2 LEGO tile">
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

        <!-- Tile hint: faint inner rectangle suggesting smooth top -->
        <rect
            :x="halfStroke + INSET"
            :y="halfStroke + INSET"
            :width="bodyWidth - 2 * INSET"
            :height="bodyHeight - 2 * INSET"
            fill="none"
            stroke="black"
            stroke-width="1"
            stroke-opacity="0.2"
            data-tile-hint
        />
    </svg>
</template>
