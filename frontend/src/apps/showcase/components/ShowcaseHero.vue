<script setup lang="ts">
import {ref, onMounted} from 'vue';

const isVisible = ref(false);

onMounted(() => {
    isVisible.value = true;
});
</script>

<template>
    <section p="y-24 md:y-32 x-4 md:x-8" border="b-3 black" bg="black" text="white" overflow="hidden" relative>
        <!-- Stacked decorative layers behind the title -->
        <div
            absolute
            top="8 md:12"
            right="-4 md:8"
            w="48 md:72"
            h="48 md:72"
            border="3 white"
            opacity="5"
            :class="isVisible ? 'translate-x-0 opacity-5' : 'translate-x-20 opacity-0'"
            transition="all"
            duration="700"
            delay="300"
        />
        <div
            absolute
            top="16 md:20"
            right="0 md:16"
            w="40 md:56"
            h="40 md:56"
            border="3 white"
            opacity="8"
            :class="isVisible ? 'translate-x-0 opacity-8' : 'translate-x-20 opacity-0'"
            transition="all"
            duration="700"
            delay="500"
        />

        <div max-w="6xl" m="x-auto" relative z="10">
            <p font="heading bold" text="sm" uppercase tracking="widest" m="b-6" text-color="yellow-400">
                Design System Specimen
            </p>

            <h1 font="heading bold" text="6xl md:8xl lg:9xl" uppercase tracking="wide" leading="none" m="b-8">
                Brick<br />
                Brutalism
            </h1>

            <p text="lg md:xl" max-w="xl" leading="relaxed" m="b-12">
                Every brick has a place. This is where they're made.
            </p>

            <!-- Decorative brick stack -->
            <div flex gap="3">
                <div w="16" h="16" bg="yellow-400" class="brick-border" border-color="white" />
                <div w="16" h="16" border="3 white" shadow="[4px_4px_0px_0px_rgba(255,255,255,0.3)]" />
                <div w="16" h="16" border="3 white" shadow="[4px_4px_0px_0px_rgba(255,255,255,0.3)]" />
            </div>
        </div>
    </section>
</template>
