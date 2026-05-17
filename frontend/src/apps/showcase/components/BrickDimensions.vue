<script setup lang="ts">
import LegoBrick from '@shared/components/LegoBrick.vue';
import LegoPlate from '@shared/components/LegoPlate.vue';
import LegoRound from '@shared/components/LegoRound.vue';

import SectionHeading from './SectionHeading.vue';

const bricks = [
    {cols: 2, rows: 4, label: '2x4 Brick', component: LegoBrick},
    {cols: 2, rows: 2, label: '2x2 Brick', component: LegoBrick},
    {cols: 1, rows: 2, label: '1x2 Plate', component: LegoPlate},
    {cols: 1, rows: 1, label: '1x1 Round', component: LegoRound},
];
</script>

<template>
    <section p="y-20" id="dimensions">
        <SectionHeading number="07" title="Brick Dimensions" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            The design system's spatial rhythm is derived from actual LEGO dimensions. A stud is the atomic unit — all
            spacing relates back to the 0.6 stud-diameter-to-cell-width ratio of a real LEGO brick.
        </p>

        <!-- Stud ratio visualization -->
        <div m="b-12" p="6" class="brick-border brick-shadow" bg="white">
            <p class="brick-label" m="b-6">The Stud — Atomic Unit</p>

            <div flex items="end" gap="8">
                <!-- Single stud, large -->
                <div flex="~ col" items="center" gap="3">
                    <div
                        w="16"
                        h="16"
                        rounded="full"
                        bg="[#F5C518]"
                        class="brick-border brick-shadow"
                        flex
                        items="center"
                        justify="center"
                    >
                        <div w="4" h="4" rounded="full" bg="black" opacity="10" />
                    </div>
                    <p text="xs" font="mono" text-color="gray-500">1 stud</p>
                </div>

                <!-- Ratio diagram -->
                <div flex="~ col" gap="2">
                    <div flex items="center" gap="2">
                        <div w="20" h="1" bg="black" />
                        <span text="xs" font="mono">cell width (8mm)</span>
                    </div>
                    <div flex items="center" gap="2">
                        <div w="12" h="1" bg="[#F5C518]" class="brick-border" />
                        <span text="xs" font="mono">stud ⌀ = 0.6 × cell (4.8mm)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Brick specimens with studs -->
        <div grid="~ cols-1 sm:cols-2 lg:cols-4" gap="6">
            <div
                v-for="brick in bricks"
                :key="brick.label"
                p="6"
                class="brick-border brick-shadow"
                bg="white"
                flex="~ col"
                items="center"
                gap="4"
            >
                <p class="brick-label" text="center">{{ brick.label }}</p>

                <component
                    :is="brick.component"
                    :columns="brick.cols"
                    :rows="brick.rows"
                    color="#F5C518"
                    :shadow="false"
                />

                <p text="xs" font="mono" text-color="gray-500">{{ brick.cols }} x {{ brick.rows }} studs</p>
            </div>
        </div>

        <!-- Spacing scale -->
        <div m="t-12" p="6" class="brick-border brick-shadow" bg="white">
            <p class="brick-label" m="b-6">Spacing Scale — Stud Multiples</p>

            <div flex="~ col" gap="4">
                <div v-for="mult in [1, 2, 3, 4, 6, 8]" :key="mult" flex items="center" gap="4">
                    <span text="xs" font="mono" w="16" text-color="gray-500" flex="shrink-0">
                        {{ mult }} stud{{ mult > 1 ? 's' : '' }}
                    </span>
                    <div h="6" bg="[#F5C518]" class="brick-border" :style="{width: `${mult * 2.5}rem`}" />
                    <span text="xs" font="mono" text-color="gray-400"> {{ mult * 8 }}px </span>
                </div>
            </div>
        </div>
    </section>
</template>
