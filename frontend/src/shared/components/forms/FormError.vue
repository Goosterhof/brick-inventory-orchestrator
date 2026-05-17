<script setup lang="ts">
const {id, message} = defineProps<{id: string; message: string}>();
</script>

<template>
    <p :id="id" text="sm [var(--brick-danger-text)]" font="bold" role="alert">
        {{ message }}
    </p>
</template>
