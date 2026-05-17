<script setup lang="ts">
import type {SoundService} from '@shared/services/sound';

const {
    type = 'button',
    disabled = false,
    silent = false,
    soundService = undefined,
} = defineProps<{
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    silent?: boolean;
    soundService?: SoundService;
}>();

const handleClick = () => {
    if (!silent && soundService) {
        soundService.play('snap');
    }
};
</script>

<template>
    <button
        :type="type"
        :disabled="disabled"
        p="x-4 y-3"
        bg="[var(--brick-border-color)] hover:brick-yellow focus:brick-yellow disabled:[var(--brick-surface-subtle)]"
        text="[var(--brick-page-bg)] hover:[var(--brick-page-text)] focus:[var(--brick-page-text)] disabled:[var(--brick-muted-text)]"
        font="bold"
        uppercase
        tracking="wide"
        cursor="pointer disabled:not-allowed"
        outline="none"
        focus-visible:brick-focus
        class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px] disabled:brick-disabled"
        @click="handleClick"
    >
        <slot />
    </button>
</template>
