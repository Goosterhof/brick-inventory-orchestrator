<script setup lang="ts">
import type {Component} from 'vue';

import LegoArch from '@shared/components/LegoArch.vue';
import LegoArchSvg from '@shared/components/LegoArchSvg.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import LegoBrickSideSvg from '@shared/components/LegoBrickSideSvg.vue';
import LegoBrickSvg from '@shared/components/LegoBrickSvg.vue';
import LegoPlate from '@shared/components/LegoPlate.vue';
import LegoPlateSvg from '@shared/components/LegoPlateSvg.vue';
import LegoRound from '@shared/components/LegoRound.vue';
import LegoRoundSvg from '@shared/components/LegoRoundSvg.vue';
import LegoSlope from '@shared/components/LegoSlope.vue';
import LegoSlopeSvg from '@shared/components/LegoSlopeSvg.vue';
import LegoTechnicBeam from '@shared/components/LegoTechnicBeam.vue';
import LegoTechnicBeamSvg from '@shared/components/LegoTechnicBeamSvg.vue';
import LegoTile from '@shared/components/LegoTile.vue';
import LegoTileSvg from '@shared/components/LegoTileSvg.vue';
import LegoWedge from '@shared/components/LegoWedge.vue';
import LegoWedgeSvg from '@shared/components/LegoWedgeSvg.vue';

interface BrickEntry {
    label: string;
    dimensions: string;
    partNumber: string;
    bricklinkId: string;
    html: Component;
    svg: Component;
    color: string;
    htmlProps?: Record<string, unknown>;
    svgProps?: Record<string, unknown>;
    sideSvg?: Component;
    sideSvgProps?: Record<string, unknown>;
}

const bricks: BrickEntry[] = [
    {
        label: 'Brick',
        dimensions: '2x4',
        partNumber: '3001',
        bricklinkId: '3001',
        html: LegoBrick,
        svg: LegoBrickSvg,
        color: '#C41A16',
        htmlProps: {columns: 4, rows: 2},
        svgProps: {columns: 4, rows: 2},
        sideSvg: LegoBrickSideSvg,
        sideSvgProps: {columns: 4, rows: 2},
    },
    {
        label: 'Brick',
        dimensions: '2x2',
        partNumber: '3003',
        bricklinkId: '3003',
        html: LegoBrick,
        svg: LegoBrickSvg,
        color: '#0055BF',
        htmlProps: {columns: 2, rows: 2},
        svgProps: {columns: 2, rows: 2},
        sideSvg: LegoBrickSideSvg,
        sideSvgProps: {columns: 2, rows: 2},
    },
    {
        label: 'Brick',
        dimensions: '1x1',
        partNumber: '3005',
        bricklinkId: '3005',
        html: LegoBrick,
        svg: LegoBrickSvg,
        color: '#237841',
        htmlProps: {columns: 1, rows: 1},
        svgProps: {columns: 1, rows: 1},
        sideSvg: LegoBrickSideSvg,
        sideSvgProps: {columns: 1, rows: 1},
    },
    {
        label: 'Plate',
        dimensions: '2x4',
        partNumber: '3020',
        bricklinkId: '3020',
        html: LegoPlate,
        svg: LegoPlateSvg,
        color: '#C41A16',
    },
    {
        label: 'Tile',
        dimensions: '1x2',
        partNumber: '3069',
        bricklinkId: '3069b',
        html: LegoTile,
        svg: LegoTileSvg,
        color: '#0055BF',
    },
    {
        label: 'Slope 45\u00B0',
        dimensions: '2x2',
        partNumber: '3039',
        bricklinkId: '3039',
        html: LegoSlope,
        svg: LegoSlopeSvg,
        color: '#F5C518',
    },
    {
        label: 'Arch',
        dimensions: '1x4',
        partNumber: '3659',
        bricklinkId: '3659',
        html: LegoArch,
        svg: LegoArchSvg,
        color: '#0055BF',
    },
    {
        label: 'Wedge Plate',
        dimensions: '2x4',
        partNumber: '51739',
        bricklinkId: '51739',
        html: LegoWedge,
        svg: LegoWedgeSvg,
        color: '#F5C518',
    },
    {
        label: 'Round Brick',
        dimensions: '1x1',
        partNumber: '3062',
        bricklinkId: '3062b',
        html: LegoRound,
        svg: LegoRoundSvg,
        color: '#237841',
    },
    {
        label: 'Technic Beam',
        dimensions: '1x4',
        partNumber: '3701',
        bricklinkId: '3701',
        html: LegoTechnicBeam,
        svg: LegoTechnicBeamSvg,
        color: '#C41A16',
    },
];

const bricklinkUrl = (id: string) => `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${id}`;
const bricklinkImageUrl = (id: string) => `https://img.bricklink.com/ItemImage/PT/5/${id}.png`;
</script>

<template>
    <section p="y-12 sm:y-16 x-4 md:x-8" border="b-3 black" bg="brick-yellow">
        <div max-w="6xl" m="x-auto">
            <p font="heading bold" text="sm" uppercase tracking="widest" m="b-4" opacity="60">Component Playground</p>
            <h1 font="heading bold" text="4xl sm:5xl md:7xl" uppercase tracking="wide" leading="none" m="b-4">
                Brick Dimensions
            </h1>
            <p text="base sm:lg" max-w="xl" leading="relaxed">
                Every brick component next to its real-world reference. Compare HTML/CSS, SVG, and the actual LEGO part.
            </p>
        </div>
    </section>

    <div max-w="6xl" m="x-auto" p="x-4 md:x-8 y-8 sm:y-12">
        <div flex="~ col" gap="6 sm:8">
            <div
                v-for="brick in bricks"
                :key="`${brick.label}-${brick.dimensions}`"
                p="4 sm:6"
                bg="white"
                class="brick-border brick-shadow"
            >
                <!-- Header row: name + part info -->
                <div flex="~ wrap" items="center" justify="between" gap="3" m="b-6" border="b-2 black" p="b-4">
                    <div min-w="0">
                        <h2 font="heading bold" text="lg sm:xl" uppercase tracking="wide" leading="tight">
                            {{ brick.label }} ({{ brick.dimensions }})
                        </h2>
                        <p text="sm gray-500" m="t-1" font="mono">Part #{{ brick.partNumber }}</p>
                    </div>
                    <a
                        :href="bricklinkUrl(brick.bricklinkId)"
                        target="_blank"
                        rel="noopener noreferrer"
                        inline-flex
                        items="center"
                        justify="center"
                        min-h="11"
                        p="x-4 y-2"
                        bg="gray-100 hover:gray-200"
                        text="sm black"
                        font="bold"
                        uppercase
                        tracking="wide"
                        class="brick-border brick-transition"
                    >
                        BrickLink
                    </a>
                </div>

                <!-- Comparison grid: Reference | HTML/CSS | SVG Top | SVG Side -->
                <div
                    :class="
                        brick.sideSvg
                            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'
                            : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'
                    "
                >
                    <!-- Reference image -->
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">Reference</p>
                        <div
                            flex
                            items="center"
                            justify="center"
                            min-h="32"
                            w="full"
                            bg="gray-50"
                            border="2 dashed gray-200"
                            rounded="sm"
                            p="2"
                        >
                            <img
                                :src="bricklinkImageUrl(brick.bricklinkId)"
                                :alt="`Real LEGO ${brick.label} ${brick.dimensions}`"
                                max-h="28"
                                max-w="full"
                                object="contain"
                            />
                        </div>
                    </div>

                    <!-- HTML/CSS -->
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">HTML / CSS</p>
                        <div flex items="center" justify="center" min-h="32" w="full" bg="gray-50" rounded="sm" p="4">
                            <component :is="brick.html" :color="brick.color" v-bind="brick.htmlProps" />
                        </div>
                    </div>

                    <!-- SVG Top-Down -->
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">
                            {{ brick.sideSvg ? 'SVG Top' : 'SVG' }}
                        </p>
                        <div flex items="center" justify="center" min-h="32" w="full" bg="gray-50" rounded="sm" p="4">
                            <div w="40">
                                <component :is="brick.svg" :color="brick.color" v-bind="brick.svgProps" />
                            </div>
                        </div>
                    </div>

                    <!-- SVG Side View -->
                    <div v-if="brick.sideSvg" flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">SVG Side</p>
                        <div flex items="center" justify="center" min-h="32" w="full" bg="gray-50" rounded="sm" p="4">
                            <div w="40">
                                <component :is="brick.sideSvg" :color="brick.color" v-bind="brick.sideSvgProps" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
