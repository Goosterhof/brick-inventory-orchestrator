<script setup lang="ts">
const {number, title} = defineProps<{number: string; title: string}>();
</script>

<template>
    <div m="b-10" flex="~" items="end" gap="4">
        <span
            font="heading bold"
            text="5xl md:7xl"
            leading="none"
            tracking="tight"
            opacity="10"
            select="none"
            aria-hidden="true"
        >
            {{ number }}
        </span>
        <h2 font="heading bold" text="2xl md:3xl" uppercase tracking="wide" leading="tight" p="b-1">
            {{ title }}
        </h2>
    </div>
</template>
