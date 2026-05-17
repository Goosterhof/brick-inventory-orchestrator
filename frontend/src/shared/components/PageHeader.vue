<script setup lang="ts">
const {title} = defineProps<{title: string}>();
</script>

<template>
    <div flex justify="between" items="center" m="b-6">
        <h1 text="2xl" font="bold" uppercase tracking="wide">{{ title }}</h1>
        <slot />
    </div>
</template>
