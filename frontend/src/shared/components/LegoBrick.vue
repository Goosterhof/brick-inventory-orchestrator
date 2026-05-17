<script setup lang="ts">
const {
    color = '#DC2626',
    shadow = true,
    columns = 4,
    rows = 2,
} = defineProps<{color?: string; shadow?: boolean; columns?: number; rows?: number}>();

const studCount = columns * rows;
</script>

<template>
    <div
        border="3 black"
        p="2"
        :class="shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''"
        :style="{backgroundColor: color, gridTemplateColumns: `repeat(${columns}, 1fr)`}"
        inline-grid
        place-items="center"
        class="gap-0"
    >
        <div
            v-for="stud in studCount"
            :key="stud"
            class="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            w="6"
            h="6"
            m="2"
            rounded="full"
            border="3 black"
            :style="{backgroundColor: color}"
        />
    </div>
</template>
