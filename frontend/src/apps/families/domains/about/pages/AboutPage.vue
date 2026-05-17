<script setup lang="ts">
import {familyTranslationService} from '@app/services';
import LegoArch from '@shared/components/LegoArch.vue';
import LegoArchSvg from '@shared/components/LegoArchSvg.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
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

const {t} = familyTranslationService;

const RED = '#DC2626';
const BLUE = '#1D4ED8';
const GREEN = '#16A34A';
const YELLOW = '#EAB308';
const BROWN = '#92400E';
const GRAY = '#6B7280';
</script>

<template>
    <div>
        <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-4">{{ t('about.title').value }}</h1>
        <p text="[var(--brick-muted-text)]" m="b-6">{{ t('about.description').value }}</p>
        <div flex gap="8">
            <div inline-block style="filter: drop-shadow(4px 4px 0 black)">
                <!-- Row 1: Red 2×2 + Blue 1×1 (bottom-aligned) -->
                <div flex items="end">
                    <LegoBrick :color="RED" :columns="2" :rows="2" :shadow="false" />
                    <LegoBrick class="ml-[-3px]" :color="BLUE" :columns="1" :rows="1" :shadow="false" />
                </div>
                <!-- Row 2: Yellow 2×3 + Green 1×3 -->
                <div flex class="mt-[-3px]">
                    <LegoBrick :color="YELLOW" :columns="2" :rows="3" :shadow="false" />
                    <LegoBrick class="ml-[-3px]" :color="GREEN" :columns="1" :rows="3" :shadow="false" />
                </div>
            </div>
            <div inline-block style="filter: drop-shadow(4px 4px 0 black)">
                <!-- Row 1: Red 2×2 + Blue 1×1 (bottom-aligned, SVG) -->
                <div flex items="end">
                    <div w="[180px]">
                        <LegoBrickSvg :color="RED" :columns="2" :rows="2" :shadow="false" />
                    </div>
                    <div w="[180px]">
                        <LegoBrickSvg :color="BLUE" :columns="1" :rows="1" :shadow="false" />
                    </div>
                </div>
                <!-- Row 2: Yellow 2×3 + Green 1×3 (SVG) -->
                <div flex>
                    <div w="[180px]">
                        <LegoBrickSvg :color="YELLOW" :columns="2" :rows="3" :shadow="false" />
                    </div>
                    <div w="[180px]">
                        <LegoBrickSvg :color="GREEN" :columns="1" :rows="3" :shadow="false" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Dioramas -->
        <h2 text="xl" font="bold" uppercase tracking="wide" m="t-8 b-4">{{ t('about.diorama').value }}</h2>
        <div flex gap="8" items="end">
            <!-- HTML Diorama -->
            <div data-diorama inline-flex flex="col" items="center" style="filter: drop-shadow(4px 4px 0 black)">
                <!-- Scene: house + tree -->
                <div flex items="end" gap="2">
                    <!-- House -->
                    <div flex="col" items="center">
                        <!-- Roof: two slopes mirrored to form a peak -->
                        <div flex>
                            <LegoSlope :color="YELLOW" :shadow="false" />
                            <LegoSlope
                                class="ml-[-3px]"
                                :color="YELLOW"
                                :shadow="false"
                                style="transform: scaleX(-1)"
                            />
                        </div>
                        <!-- Wall with window -->
                        <div flex items="end" class="mt-[-3px]">
                            <LegoBrick :color="RED" :columns="1" :rows="1" :shadow="false" />
                            <LegoTile class="ml-[-3px]" :color="BLUE" :shadow="false" />
                            <LegoBrick class="ml-[-3px]" :color="RED" :columns="1" :rows="1" :shadow="false" />
                        </div>
                        <!-- Door -->
                        <div class="mt-[-3px]">
                            <LegoArch :color="RED" :shadow="false" />
                        </div>
                    </div>
                    <!-- Tree -->
                    <div flex="col" items="center">
                        <LegoRound :color="GREEN" :shadow="false" />
                        <LegoBrick class="mt-[-3px]" :color="BROWN" :columns="1" :rows="2" :shadow="false" />
                    </div>
                </div>
                <!-- Ground row -->
                <div flex items="start" class="mt-[-3px]">
                    <LegoPlate :color="GREEN" :shadow="false" />
                    <LegoTechnicBeam class="ml-[-3px]" :color="GRAY" :shadow="false" />
                    <LegoWedge class="ml-[-3px]" :color="GRAY" :shadow="false" />
                </div>
            </div>

            <!-- SVG Diorama -->
            <div data-diorama-svg inline-flex flex="col" items="center" style="filter: drop-shadow(4px 4px 0 black)">
                <!-- Scene: house + tree -->
                <div flex items="end" gap="2">
                    <!-- House -->
                    <div flex="col" items="center">
                        <!-- Roof: two slopes mirrored to form a peak -->
                        <div flex>
                            <div w="[75px]">
                                <LegoSlopeSvg :color="YELLOW" :shadow="false" />
                            </div>
                            <div w="[75px]" style="transform: scaleX(-1)">
                                <LegoSlopeSvg :color="YELLOW" :shadow="false" />
                            </div>
                        </div>
                        <!-- Wall with window -->
                        <div flex items="end" class="mt-[-3px]">
                            <div w="[50px]">
                                <LegoBrickSvg :color="RED" :columns="1" :rows="1" :shadow="false" />
                            </div>
                            <div w="[70px]">
                                <LegoTileSvg :color="BLUE" :shadow="false" />
                            </div>
                            <div w="[50px]">
                                <LegoBrickSvg :color="RED" :columns="1" :rows="1" :shadow="false" />
                            </div>
                        </div>
                        <!-- Door -->
                        <div class="mt-[-3px]">
                            <div w="[150px]">
                                <LegoArchSvg :color="RED" :shadow="false" />
                            </div>
                        </div>
                    </div>
                    <!-- Tree -->
                    <div flex="col" items="center">
                        <div w="[50px]">
                            <LegoRoundSvg :color="GREEN" :shadow="false" />
                        </div>
                        <div w="[50px]" class="mt-[-3px]">
                            <LegoBrickSvg :color="BROWN" :columns="1" :rows="2" :shadow="false" />
                        </div>
                    </div>
                </div>
                <!-- Ground row -->
                <div flex items="start" class="mt-[-3px]">
                    <div w="[150px]">
                        <LegoPlateSvg :color="GREEN" :shadow="false" />
                    </div>
                    <div w="[130px]">
                        <LegoTechnicBeamSvg :color="GRAY" :shadow="false" />
                    </div>
                    <div w="[100px]">
                        <LegoWedgeSvg :color="GRAY" :shadow="false" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
