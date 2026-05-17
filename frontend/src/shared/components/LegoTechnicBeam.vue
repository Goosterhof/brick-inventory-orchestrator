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
        data-body
    >
        <div v-for="hole in 4" :key="hole" w="6" h="6" m="2" rounded="full" border="3 black" bg="white" data-pin-hole />
    </div>
</template>
