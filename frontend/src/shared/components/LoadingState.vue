<script setup lang="ts">
const {message = 'Loading...'} = defineProps<{message?: string}>();
</script>

<template>
    <div flex="~ col" items="center" gap="3" p="8" role="status">
        <div flex gap="2">
            <div
                w="4"
                h="4"
                bg="black"
                class="brick-border animate-bounce"
                style="animation-delay: 0ms; animation-duration: 600ms"
            />
            <div
                w="4"
                h="4"
                bg="brick-yellow"
                class="brick-border animate-bounce"
                style="animation-delay: 150ms; animation-duration: 600ms"
            />
            <div
                w="4"
                h="4"
                bg="black"
                class="brick-border animate-bounce"
                style="animation-delay: 300ms; animation-duration: 600ms"
            />
        </div>
        <p text="[var(--brick-muted-text)]" font="medium">{{ message }}</p>
    </div>
</template>
