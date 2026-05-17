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
const STUD_WIDTH = 24;
const STUD_HEIGHT = 9;
const BODY_HEIGHT = 48;
const STROKE = 3;
const SHADOW_OFFSET = 4;

const gradientId = useId();

const bodyWidth = computed(() => 2 * PAD + columns * CELL);

const viewBox = computed(
    () => `0 0 ${bodyWidth.value + STROKE + SHADOW_OFFSET} ${STUD_HEIGHT + BODY_HEIGHT + STROKE + SHADOW_OFFSET}`,
);

const studs = computed(() => {
    const result: Array<{x: number}> = [];
    for (let col = 0; col < columns; col++) {
        result.push({x: STROKE / 2 + PAD + col * CELL + (CELL - STUD_WIDTH) / 2});
    }
    return result;
});

const studY = STROKE / 2;
const bodyY = STROKE / 2 + STUD_HEIGHT;

const ariaLabel = computed(() => `${columns} by ${rows} LEGO brick side view`);
</script>

<template>
    <svg :viewBox="viewBox" role="img" :aria-label="ariaLabel" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="white" stop-opacity="0.3" />
                <stop offset="100%" stop-color="black" stop-opacity="0.1" />
            </linearGradient>
        </defs>

        <!-- Shadow — covers full silhouette (studs + body) so the shadow matches the brick outline -->
        <rect
            v-if="shadow"
            :x="STROKE / 2 + SHADOW_OFFSET"
            :y="studY + SHADOW_OFFSET"
            :width="bodyWidth"
            :height="STUD_HEIGHT + BODY_HEIGHT"
            fill="black"
            data-shadow
        />

        <!-- Body -->
        <rect
            :x="STROKE / 2"
            :y="bodyY"
            :width="bodyWidth"
            :height="BODY_HEIGHT"
            :fill="color"
            stroke="black"
            :stroke-width="STROKE"
            data-body
        />

        <!-- Studs -->
        <g v-for="(stud, index) in studs" :key="index">
            <!-- +STROKE in height overlaps the body's top edge by one stroke width, eliminating the visible seam -->
            <rect
                :x="stud.x"
                :y="studY"
                :width="STUD_WIDTH"
                :height="STUD_HEIGHT + STROKE"
                :fill="color"
                stroke="black"
                :stroke-width="STROKE"
                data-stud
            />
            <rect
                :x="stud.x"
                :y="studY"
                :width="STUD_WIDTH"
                :height="STUD_HEIGHT + STROKE"
                :fill="`url(#${gradientId})`"
            />
        </g>
    </svg>
</template>
