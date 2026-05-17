<script setup lang="ts">
defineEmits<{click: []}>();
</script>

<template>
    <button
        @click="$emit('click')"
        flex
        gap="4"
        items="center"
        p="4"
        bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
        cursor="pointer"
        text="left"
        outline="none"
        focus-visible:brick-focus
        class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
    >
        <slot />
    </button>
</template>
