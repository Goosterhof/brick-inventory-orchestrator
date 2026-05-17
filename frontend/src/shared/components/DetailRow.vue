<script setup lang="ts">
const {label} = defineProps<{label: string}>();
</script>

<template>
    <div flex gap="2">
        <span font="bold">{{ label }}:</span>
        <span><slot /></span>
    </div>
</template>
