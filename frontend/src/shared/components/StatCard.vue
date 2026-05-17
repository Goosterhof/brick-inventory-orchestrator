<script setup lang="ts">
const {label, value} = defineProps<{label: string; value: string}>();
</script>

<template>
    <div p="4" bg="[var(--brick-card-bg)]" class="brick-border brick-shadow">
        <p text="sm" font="bold" uppercase tracking="wide" m="b-2">{{ label }}</p>
        <p text="3xl" font="bold">{{ value }}</p>
        <slot />
    </div>
</template>
