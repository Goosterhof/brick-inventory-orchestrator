<script setup lang="ts">
import {computed} from 'vue';

import {ShowcaseRouterLink, ShowcaseRouterView, showcaseRouterService} from './router';

const currentRouteName = computed(() => showcaseRouterService.currentRouteRef.value.name);
</script>

<template>
    <div min-h="screen" bg="white" text="black">
        <nav p="x-4 md:x-8 y-3" border="b-3 black" bg="white" flex="~" items="center" gap="4" sticky top="0" z="50">
            <span font="heading bold" text="sm" uppercase tracking="widest" m="r-4">Brick &amp; Mortar</span>
            <ShowcaseRouterLink
                :to="{name: 'showcase'}"
                p="x-4 y-2"
                font="bold"
                text="sm"
                uppercase
                tracking="wide"
                class="brick-transition"
                :class="currentRouteName === 'showcase' ? 'bg-black text-white' : 'hover:bg-gray-100'"
            >
                Showcase
            </ShowcaseRouterLink>
            <ShowcaseRouterLink
                :to="{name: 'playground'}"
                p="x-4 y-2"
                font="bold"
                text="sm"
                uppercase
                tracking="wide"
                class="brick-transition"
                :class="currentRouteName === 'playground' ? 'bg-black text-white' : 'hover:bg-gray-100'"
            >
                Playground
            </ShowcaseRouterLink>
        </nav>

        <ShowcaseRouterView />

        <footer p="y-16 x-4" border="t-3 black" m="t-24">
            <div max-w="6xl" m="x-auto" flex="~ col" items="center" gap="4">
                <p font="heading bold" text="sm" uppercase tracking="widest">Brick Brutalism</p>
                <p text="sm gray-600">Every brick has a place. This is the proof.</p>
            </div>
        </footer>
    </div>
</template>
