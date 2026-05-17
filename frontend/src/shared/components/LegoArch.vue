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
        <!-- 4 studs in a single row -->
        <div
            v-for="stud in 4"
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

        <!-- Arch hint: a subtle semicircle at the bottom center -->
        <div
            position="absolute"
            bottom="1"
            left="50%"
            :style="{
                transform: 'translateX(-50%)',
                width: '16px',
                height: '8px',
                borderTop: '2px solid rgba(0,0,0,0.35)',
                borderRadius: '999px 999px 0 0',
            }"
            data-arch-hint
        />
    </div>
</template>
