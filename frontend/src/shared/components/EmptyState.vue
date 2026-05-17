<script setup lang="ts">
import LegoBrick from '@shared/components/LegoBrick.vue';

const {
    message,
    showBrick = false,
    brickColor = '#F5C518',
} = defineProps<{message: string; showBrick?: boolean; brickColor?: string}>();
</script>

<template>
    <div flex="~ col" items="center" gap="4" p="8" text-center class="brick-stud-grid">
        <LegoBrick v-if="showBrick" :columns="4" :rows="2" :color="brickColor" :shadow="false" />
        <p text="[var(--brick-muted-text)]">{{ message }}</p>
        <slot />
    </div>
</template>
