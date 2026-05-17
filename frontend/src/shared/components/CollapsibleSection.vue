<script setup lang="ts">
import {PhCaretRight} from '@phosphor-icons/vue';

const {expanded = false} = defineProps<{title: string; count?: number; expanded?: boolean}>();

defineEmits<{toggle: []}>();
</script>

<template>
    <div>
        <button
            type="button"
            flex
            items="center"
            gap="2"
            w="full"
            p="3"
            bg="[var(--brick-surface-subtle)] hover:brick-yellow"
            cursor="pointer"
            outline="none"
            focus-visible:brick-focus
            class="brick-border brick-transition"
            @click="$emit('toggle')"
        >
            <PhCaretRight :size="16" weight="bold" class="brick-transition" :transform="expanded ? 'rotate(90)' : ''" />
            <span class="brick-label" flex="1" text="left sm">{{ title }}</span>
            <span
                v-if="count !== undefined"
                text="xs"
                font="bold"
                p="x-2 y-0.5"
                bg="[var(--brick-card-bg)]"
                class="brick-border"
            >
                {{ count }}
            </span>
        </button>
        <div v-show="expanded">
            <slot />
        </div>
    </div>
</template>
