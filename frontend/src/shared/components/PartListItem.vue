<script setup lang="ts">
import {computed} from 'vue';

const {name, partNum, quantity, imageUrl, colorName, colorRgb, spare} = defineProps<{
    name: string;
    partNum: string;
    quantity: number;
    imageUrl?: string | null;
    colorName: string | null;
    colorRgb: string | null;
    spare?: boolean;
}>();

const colorStyle = computed(() => (colorRgb ? {backgroundColor: `#${colorRgb}`} : undefined));
const partDescription = computed(() => (colorName ? `${partNum} · ${colorName}` : partNum));
</script>

<template>
    <div
        flex
        gap="3"
        items="center"
        p="3"
        :bg="spare ? '[var(--brick-surface-subtle)]' : '[var(--brick-card-bg)]'"
        class="brick-border brick-shadow"
    >
        <div v-show="colorStyle" w="6" h="6" shrink="0" class="brick-border" :style="colorStyle" />
        <img v-show="imageUrl" :src="imageUrl ?? undefined" :alt="name" w="10" h="10" object="contain" shrink="0" />
        <div flex="1" min-w="0">
            <p font="bold" truncate>{{ name }}</p>
            <p text="sm [var(--brick-muted-text)]">{{ partDescription }}</p>
            <slot />
        </div>
        <span font="bold" shrink="0">{{ quantity }}x</span>
    </div>
</template>
