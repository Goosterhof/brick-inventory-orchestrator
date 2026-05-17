<script setup lang="ts">
import {computed} from 'vue';

const {percentage, unknownLabel} = defineProps<{percentage: number | null; unknownLabel: string}>();

type GaugeState = 'unknown' | 'empty' | 'partial' | 'complete';

const state = computed<GaugeState>(() => {
    if (percentage === null) return 'unknown';
    if (percentage <= 0) return 'empty';
    if (percentage >= 100) return 'complete';
    return 'partial';
});

const clampedPercentage = computed(() => {
    if (percentage === null) return 0;
    if (percentage < 0) return 0;
    if (percentage > 100) return 100;
    return percentage;
});

const barColor = computed(() => {
    switch (state.value) {
        case 'empty':
            return 'brick-red';
        case 'partial':
            return 'brick-yellow';
        case 'complete':
            return 'baseplate-green';
        default:
            return '[var(--brick-surface-subtle)]';
    }
});

const labelText = computed(() => {
    if (state.value === 'unknown') return unknownLabel;
    return `${String(Math.round(clampedPercentage.value))}%`;
});

const labelColorClass = computed(() => {
    switch (state.value) {
        case 'complete':
            return 'text-baseplate-green';
        case 'empty':
            return 'text-[var(--brick-danger-text)]';
        default:
            return 'text-[var(--brick-page-text)]';
    }
});
</script>

<template>
    <div flex items="center" gap="2" w="full" aria-label="set-completion-gauge" :data-state="state">
        <div
            flex-1
            h="2"
            bg="[var(--brick-surface-subtle)]"
            :border="state === 'unknown' ? '1 black dashed' : '1 black'"
            overflow="hidden"
        >
            <div
                v-if="state !== 'unknown'"
                h="full"
                brick-transition
                :bg="barColor"
                :style="{width: `${String(clampedPercentage)}%`}"
                min-w="0"
            />
        </div>
        <span
            text="xs"
            font="bold"
            tracking="wide"
            uppercase
            :class="labelColorClass"
            w="14"
            text-align="right"
            flex-shrink="0"
        >
            {{ labelText }}
        </span>
    </div>
</template>
