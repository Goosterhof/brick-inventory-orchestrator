<script setup lang="ts">
const {type = 'button', disabled = false} = defineProps<{type?: 'button' | 'submit' | 'reset'; disabled?: boolean}>();
</script>

<template>
    <button
        :type="type"
        :disabled="disabled"
        p="x-4 y-3"
        border="3 brick-red"
        bg="[var(--brick-card-bg)] hover:brick-red-light focus:brick-red-light disabled:[var(--brick-surface-subtle)]"
        text="[var(--brick-danger-text)] disabled:[var(--brick-muted-text)]"
        font="bold"
        uppercase
        tracking="wide"
        cursor="pointer disabled:not-allowed"
        outline="none"
        focus-visible:brick-focus
        class="brick-shadow-danger brick-transition hover:brick-shadow-error-hover focus:brick-shadow-error-hover active:shadow-[2px_2px_0px_0px_#C41A16] active:translate-x-[2px] active:translate-y-[2px] disabled:brick-disabled"
    >
        <slot />
    </button>
</template>
