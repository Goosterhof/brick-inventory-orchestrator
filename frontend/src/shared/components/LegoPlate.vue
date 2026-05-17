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
        <div
            v-for="stud in 8"
            :key="stud"
            w="6"
            h="6"
            m="2"
            rounded="full"
            border="3 black"
            :style="{backgroundColor: color}"
            class="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            data-stud
        />

        <!-- Plate hint: thin inner outline suggesting lower profile -->
        <div
            position="absolute"
            :style="{inset: '2px', border: '1px solid rgba(0,0,0,0.15)'}"
            pointer-events="none"
            data-plate-hint
        />
    </div>
</template>
