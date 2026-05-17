<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();
</script>

<template>
    <div
        inline-flex="~"
        :style="{backgroundColor: color}"
        border="3 black"
        :class="shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''"
        position="relative"
        w="16"
        h="10"
        data-tile
    >
        <!-- Tile hint: faint inner rectangle suggesting smooth top -->
        <div
            position="absolute"
            :style="{inset: '3px', border: '1px solid rgba(0,0,0,0.2)'}"
            pointer-events="none"
            data-tile-hint
        />
    </div>
</template>
