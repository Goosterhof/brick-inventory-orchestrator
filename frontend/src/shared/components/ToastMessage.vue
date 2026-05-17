<script setup lang="ts">
import {PhCheckCircle, PhWarningCircle, PhX} from '@phosphor-icons/vue';

const {message, variant = 'success'} = defineProps<{message: string; variant?: 'success' | 'error'}>();
defineEmits<{close: []}>();
</script>

<template>
    <div
        flex
        gap="3"
        items="center"
        p="3 r-4"
        bg="[var(--brick-card-bg)]"
        :class="[variant === 'error' ? 'border-3 border-brick-red brick-shadow-error' : 'brick-border brick-shadow']"
    >
        <PhCheckCircle v-if="variant === 'success'" size="20" aria-hidden="true" />
        <PhWarningCircle v-else size="20" text="[var(--brick-danger-text)]" aria-hidden="true" />
        <p
            flex="1"
            :text="variant === 'error' ? '[var(--brick-danger-text)]' : '[var(--brick-page-text)]'"
            font="medium"
        >
            {{ message }}
        </p>
        <button
            @click="$emit('close')"
            p="1"
            bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
            cursor="pointer"
            outline="none"
            focus-visible:brick-focus
            class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
            aria-label="Dismiss"
        >
            <PhX size="16" aria-hidden="true" />
        </button>
    </div>
</template>
