<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();
</script>

<template>
    <div
        inline-grid
        :style="{backgroundColor: color, gridTemplateColumns: 'repeat(2, 1fr)'}"
        place-items="center"
        border="3 black"
        :class="shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''"
        p="2"
        class="gap-0"
        data-body
    >
        <!-- Row 1: slope hint (diagonal line overlay) — no studs -->
        <div w="6" h="6" m="2" position="relative" data-slope-hint>
            <div
                position="absolute"
                inset="0"
                :style="{
                    background:
                        'linear-gradient(to top right, transparent calc(50% - 1px), black calc(50% - 1px), black calc(50% + 1px), transparent calc(50% + 1px))',
                }"
            />
        </div>
        <div w="6" h="6" m="2" position="relative" data-slope-hint>
            <div
                position="absolute"
                inset="0"
                :style="{
                    background:
                        'linear-gradient(to top right, transparent calc(50% - 1px), black calc(50% - 1px), black calc(50% + 1px), transparent calc(50% + 1px))',
                }"
            />
        </div>

        <!-- Row 2: studs (flat top, rear half) -->
        <div
            v-for="stud in 2"
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
    </div>
</template>
