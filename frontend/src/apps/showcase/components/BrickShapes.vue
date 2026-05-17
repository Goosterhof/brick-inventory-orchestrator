<script setup lang="ts">
import LegoArch from '@shared/components/LegoArch.vue';
import LegoArchSvg from '@shared/components/LegoArchSvg.vue';
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

import SectionHeading from './SectionHeading.vue';

const shapes = [
    {label: 'Slope (2x2 45\u00B0)', html: LegoSlope, svg: LegoSlopeSvg, color: '#C41A16'},
    {label: 'Arch (1x4)', html: LegoArch, svg: LegoArchSvg, color: '#0055BF'},
    {label: 'Wedge (2x4)', html: LegoWedge, svg: LegoWedgeSvg, color: '#F5C518'},
    {label: 'Round (1x1)', html: LegoRound, svg: LegoRoundSvg, color: '#237841'},
    {label: 'Plate (2x4)', html: LegoPlate, svg: LegoPlateSvg, color: '#C41A16'},
    {label: 'Tile (1x2)', html: LegoTile, svg: LegoTileSvg, color: '#0055BF'},
    {label: 'Technic Beam (1x4)', html: LegoTechnicBeam, svg: LegoTechnicBeamSvg, color: '#F5C518'},
];
</script>

<template>
    <section p="y-20" id="brick-shapes">
        <SectionHeading number="14" title="Brick Shapes" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Each LEGO shape rendered top-down in both HTML/CSS and SVG, with subtle hints at the defining feature.
            Side-by-side comparison reveals the strengths and limits of each approach.
        </p>

        <div flex="~ col" gap="6">
            <div
                v-for="shape in shapes"
                :key="shape.label"
                p="6"
                class="brick-border brick-shadow"
                bg="white"
                data-shape-card
            >
                <p class="brick-label" m="b-4">{{ shape.label }}</p>

                <div grid="~ cols-2" gap="8">
                    <!-- HTML/CSS -->
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono" text-color="gray-500" uppercase tracking="wide">HTML / CSS</p>
                        <div flex items="center" justify="center" min-h="24">
                            <component :is="shape.html" :color="shape.color" />
                        </div>
                    </div>

                    <!-- SVG -->
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono" text-color="gray-500" uppercase tracking="wide">SVG</p>
                        <div flex items="center" justify="center" min-h="24" w="40">
                            <component :is="shape.svg" :color="shape.color" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
