<script setup lang="ts">
const {variant = 'default'} = defineProps<{variant?: 'default' | 'highlight' | 'muted'}>();
</script>

<template>
    <span
        text="xs"
        p="x-2 y-1"
        font="bold"
        :class="variant === 'muted' ? '' : 'brick-border'"
        :border="variant === 'muted' ? '1 black dashed' : '1'"
        :bg="
            variant === 'highlight'
                ? 'brick-yellow'
                : variant === 'muted'
                  ? '[var(--brick-surface-subtle)]'
                  : '[var(--brick-card-bg)]'
        "
    >
        <slot />
    </span>
</template>
