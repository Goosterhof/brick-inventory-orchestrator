<script setup lang="ts">
const {to} = defineProps<{to: string}>();

const emit = defineEmits<{click: []}>();

const handleClick = (event: Event) => {
    event.preventDefault();
    emit('click');
};
</script>

<template>
    <a
        :href="to"
        p="x-4 y-2"
        bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
        font="bold"
        uppercase
        tracking="wide"
        outline="none"
        focus-visible:brick-focus
        class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
        @click="handleClick"
    >
        <slot />
    </a>
</template>
