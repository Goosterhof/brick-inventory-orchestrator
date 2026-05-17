<script setup lang="ts">
const {to, active} = defineProps<{to: string; active: boolean}>();

const emit = defineEmits<{click: []}>();

const handleClick = (event: Event) => {
    event.preventDefault();
    emit('click');
};
</script>

<template>
    <a
        :href="to"
        block
        p="4"
        border="b-3 [var(--brick-border-color)]"
        font="bold"
        uppercase
        tracking="wide"
        outline="none"
        focus-visible:brick-focus
        :bg="active ? 'brick-yellow' : '[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow'"
        class="brick-transition"
        @click="handleClick"
    >
        <slot />
    </a>
</template>
