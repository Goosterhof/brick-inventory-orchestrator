<script setup lang="ts">
const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();
</script>

<template>
    <div inline-flex="~" flex="col" items="center">
        <!-- Stud on top -->
        <div w="6" h="3" rounded="t-full" border="3 black" border-b="0" :style="{backgroundColor: color}" data-stud />
        <!-- Cylindrical body -->
        <div
            :style="{backgroundColor: color, borderRadius: '50% / 20%'}"
            w="14"
            h="14"
            border="3 black"
            :class="shadow ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''"
            flex
            items="center"
            justify="center"
            data-body
        />
    </div>
</template>
