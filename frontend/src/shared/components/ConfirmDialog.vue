<script setup lang="ts">
import type {SoundService} from '@shared/services/sound';

import ModalDialog from '@shared/components/ModalDialog.vue';

const {
    open,
    title,
    message,
    soundService = undefined,
} = defineProps<{open: boolean; title: string; message: string; soundService?: SoundService}>();
const emit = defineEmits<{confirm: []; cancel: []}>();

const handleConfirm = () => {
    soundService?.play('thud');
    emit('confirm');
};
</script>

<template>
    <ModalDialog :open="open" :sound-service="soundService" @close="emit('cancel')">
        <template #title>{{ title }}</template>
        <p m="b-6">{{ message }}</p>
        <div flex gap="3">
            <button
                @click="handleConfirm"
                p="x-4 y-3"
                border="3 brick-red"
                bg="[var(--brick-card-bg)] hover:brick-red-light focus:brick-red-light"
                text="[var(--brick-danger-text)]"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                outline="none"
                focus-visible:brick-focus
                class="brick-shadow-danger brick-transition hover:brick-shadow-error-hover focus:brick-shadow-error-hover active:shadow-[2px_2px_0px_0px_#C41A16] active:translate-x-[2px] active:translate-y-[2px]"
            >
                <slot name="confirm">Confirm</slot>
            </button>
            <button
                @click="emit('cancel')"
                p="x-4 y-3"
                bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                outline="none"
                focus-visible:brick-focus
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
            >
                <slot name="cancel">Cancel</slot>
            </button>
        </div>
    </ModalDialog>
</template>
