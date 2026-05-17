<script setup lang="ts">
import {computed} from 'vue';

const {distribution} = defineProps<{distribution: Map<number, number>}>();

const maxCount = computed(() => {
    let max = 0;
    for (const count of distribution.values()) {
        if (count > max) max = count;
    }
    return max;
});

const sortedEntries = computed(() => [...distribution.entries()].sort(([a], [b]) => a - b));

const barWidthPercent = (count: number): string => {
    if (maxCount.value === 0) return '0%';
    return `${String(Math.round((count / maxCount.value) * 100))}%`;
};
</script>

<template>
    <div w="full">
        <div flex flex-col gap="2">
            <div v-for="[year, count] in sortedEntries" :key="year" flex items-center gap="3">
                <span w="16" text="sm right" font="mono" flex-shrink="0">{{ year }}</span>
                <div flex-1 h="8" bg="[var(--brick-surface-subtle)]" brick-border overflow="hidden">
                    <div
                        h="full"
                        bg="brick-yellow"
                        brick-transition
                        :style="{width: barWidthPercent(count)}"
                        min-w="0"
                    />
                </div>
                <span w="8" text="sm" font="bold" flex-shrink="0">{{ count }}</span>
            </div>
        </div>
    </div>
</template>
