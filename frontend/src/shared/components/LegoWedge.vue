<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();
</script>

<template>
    <div
        inline-grid
        :style="{backgroundColor: color, gridTemplateColumns: 'repeat(4, 1fr)'}"
        place-items="center"
        border="3 black"
        :class="shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''"
        p="2"
        class="gap-0"
        position="relative"
        data-body
    >
        <!-- Row 1: 4 studs -->
        <div
            v-for="stud in 4"
            :key="`r1-${stud}`"
            w="6"
            h="6"
            m="2"
            rounded="full"
            border="3 black"
            :style="{backgroundColor: color}"
            class="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            data-stud
        />

        <!-- Row 2: 3 studs (4th cut off by taper) + empty cell -->
        <div
            v-for="stud in 3"
            :key="`r2-${stud}`"
            w="6"
            h="6"
            m="2"
            rounded="full"
            border="3 black"
            :style="{backgroundColor: color}"
            class="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            data-stud
        />
        <div />

        <!-- Wedge hint: diagonal taper line across the right edge -->
        <div
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            w="25%"
            :style="{
                background:
                    'linear-gradient(to bottom right, transparent calc(50% - 1px), rgba(0,0,0,0.35) calc(50% - 1px), rgba(0,0,0,0.35) calc(50% + 1px), transparent calc(50% + 1px))',
            }"
            pointer-events="none"
            data-wedge-hint
        />
    </div>
</template>
