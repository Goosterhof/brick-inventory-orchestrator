<script setup lang="ts">
const {active = false} = defineProps<{active?: boolean}>();
defineEmits<{click: []}>();
</script>

<template>
    <button
        type="button"
        text="xs"
        p="x-3 y-1"
        font="bold"
        uppercase
        tracking="wide"
        cursor="pointer"
        outline="none"
        focus-visible:brick-focus
        class="brick-border brick-transition"
        :bg="active ? 'yellow-300' : '[var(--brick-card-bg)] hover:yellow-100'"
        @click="$emit('click')"
    >
        <slot />
    </button>
</template>
