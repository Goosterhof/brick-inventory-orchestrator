<script setup lang="ts">
import {useId} from 'vue';

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

const STROKE = 3;
const SHADOW_OFFSET = 4;
const BODY_R = 28;
const STUD_R = 12;
const CX = BODY_R + STROKE / 2;
const CY = BODY_R + STROKE / 2;

const gradientId = useId();
const totalSize = BODY_R * 2 + STROKE + SHADOW_OFFSET;
</script>

<template>
    <svg :viewBox="`0 0 ${totalSize} ${totalSize}`" role="img" aria-label="1 by 1 round LEGO brick">
        <defs>
            <radialGradient :id="gradientId" cx="35%" cy="35%" r="50%">
                <stop offset="0%" stop-color="white" stop-opacity="0.6" />
                <stop offset="100%" stop-color="black" stop-opacity="0.1" />
            </radialGradient>
        </defs>

        <!-- Shadow -->
        <circle v-if="shadow" :cx="CX + SHADOW_OFFSET" :cy="CY + SHADOW_OFFSET" :r="BODY_R" fill="black" data-shadow />

        <!-- Body -->
        <circle :cx="CX" :cy="CY" :r="BODY_R" :fill="color" stroke="black" :stroke-width="STROKE" data-body />

        <!-- Stud -->
        <circle :cx="CX" :cy="CY" :r="STUD_R" :fill="color" stroke="black" :stroke-width="STROKE" />
        <circle :cx="CX" :cy="CY" :r="STUD_R" :fill="`url(#${gradientId})`" />
    </svg>
</template>
