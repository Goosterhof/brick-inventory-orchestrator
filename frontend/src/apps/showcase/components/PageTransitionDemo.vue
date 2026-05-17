<script setup lang="ts">
import type {TransitionVariant} from '@shared/components/PageTransition.vue';

import PageTransition from '@shared/components/PageTransition.vue';
import {computed, ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

const pages = ['Home', 'Sets', 'Storage', 'Parts'] as const;
const currentPage = ref<(typeof pages)[number]>('Home');
const selectedVariant = ref<TransitionVariant>('brick-snap');

const prefersReducedMotion = ref(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
);

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        prefersReducedMotion.value = event.matches;
    });
}

const routePath = computed(() => `/${currentPage.value.toLowerCase()}`);

const handleVariantChange = (variant: TransitionVariant): void => {
    selectedVariant.value = variant;
};

const navigateTo = (page: (typeof pages)[number]): void => {
    currentPage.value = page;
};

const parameters = computed(() => {
    if (prefersReducedMotion.value) {
        return {name: 'brick-none', enterDuration: '0ms', leaveDuration: '0ms', easing: 'none', distance: '0px'};
    }
    if (selectedVariant.value === 'brick-lift') {
        return {
            name: 'brick-lift',
            enterDuration: '200ms',
            leaveDuration: '140ms',
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            distance: '12px (up on enter, down on leave)',
        };
    }
    return {
        name: 'brick-snap',
        enterDuration: '220ms',
        leaveDuration: '140ms',
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        distance: '12px (up on enter), 4px (up on leave)',
    };
});
</script>

<template>
    <section p="y-20" id="page-transitions">
        <SectionHeading number="15" title="Page Transitions" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Route changes feel like bricks clicking into place. Two variants cover forward navigation (snap down) and
            back navigation (lift up). Reduced motion preference disables all animation instantly.
        </p>

        <div grid="~ cols-1 lg:cols-2" gap="8">
            <!-- Interactive demo -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <p class="brick-label" m="b-4">Live Preview</p>

                <!-- Variant selector -->
                <div flex gap="2" m="b-4">
                    <button
                        v-for="variant in ['brick-snap', 'brick-lift'] as const"
                        :key="variant"
                        @click="handleVariantChange(variant)"
                        p="x-3 y-1"
                        font="bold mono"
                        text="xs"
                        cursor="pointer"
                        class="brick-border brick-transition"
                        :bg="selectedVariant === variant ? 'brick-yellow' : 'white hover:gray-100'"
                    >
                        {{ variant }}
                    </button>
                </div>

                <!-- Navigation tabs -->
                <div flex gap="1" m="b-4" border="b-3 black" p="b-0">
                    <button
                        v-for="page in pages"
                        :key="page"
                        @click="navigateTo(page)"
                        p="x-3 y-2"
                        font="bold"
                        text="sm"
                        uppercase
                        tracking="wide"
                        cursor="pointer"
                        class="brick-border border-b-0 brick-transition"
                        :bg="currentPage === page ? 'brick-yellow' : 'white hover:gray-100'"
                    >
                        {{ page }}
                    </button>
                </div>

                <!-- Transition preview area -->
                <div
                    class="brick-border"
                    bg="gray-50"
                    p="6"
                    min-h="32"
                    flex
                    items="center"
                    justify="center"
                    overflow="hidden"
                >
                    <PageTransition :route-path="routePath" :default-variant="selectedVariant">
                        <div text="center">
                            <p font="heading bold" text="2xl" m="b-2">{{ currentPage }}</p>
                            <p text="sm gray-500">Simulated page content</p>
                        </div>
                    </PageTransition>
                </div>

                <!-- Reduced motion indicator -->
                <div v-if="prefersReducedMotion" m="t-3" p="2" bg="red-50" class="brick-border" text="xs">
                    <span font="bold">prefers-reduced-motion: reduce</span> — all animations disabled
                </div>
            </div>

            <!-- Parameter display -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <p class="brick-label" m="b-4">Active Parameters</p>

                <div flex="~ col" gap="3">
                    <div v-for="(value, label) in parameters" :key="label" flex justify="between" items="baseline">
                        <span text="sm" font="bold" uppercase tracking="wide">{{ label }}</span>
                        <span font="mono bold" text="sm" p="x-2 y-1" bg="gray-100" class="brick-border">
                            {{ value }}
                        </span>
                    </div>
                </div>

                <!-- Variant comparison table -->
                <div m="t-6" border="t-3 black" p="t-4">
                    <p class="brick-label" m="b-3">Variant Comparison</p>
                    <table w="full" text="sm">
                        <thead>
                            <tr border="b-2 black">
                                <th text="left" p="2" font="bold">Property</th>
                                <th text="left" p="2" font="bold">brick-snap</th>
                                <th text="left" p="2" font="bold">brick-lift</th>
                            </tr>
                        </thead>
                        <tbody font="mono">
                            <tr border="b gray-200">
                                <td p="2" font="sans bold">Enter</td>
                                <td p="2">220ms</td>
                                <td p="2">200ms</td>
                            </tr>
                            <tr border="b gray-200">
                                <td p="2" font="sans bold">Leave</td>
                                <td p="2">140ms</td>
                                <td p="2">140ms</td>
                            </tr>
                            <tr border="b gray-200">
                                <td p="2" font="sans bold">Easing</td>
                                <td p="2" colspan="2">cubic-bezier(0.2, 0, 0, 1)</td>
                            </tr>
                            <tr border="b gray-200">
                                <td p="2" font="sans bold">Enter from</td>
                                <td p="2">translateY(12px)</td>
                                <td p="2">translateY(-12px)</td>
                            </tr>
                            <tr>
                                <td p="2" font="sans bold">Leave to</td>
                                <td p="2">translateY(-4px)</td>
                                <td p="2">translateY(12px)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>
</template>
