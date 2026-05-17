<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';

type ColorToken = {
    name: string;
    variable: string;
    hex: string;
    bg: string;
    textOnBg: string;
    contrastOnWhite: string;
    reserved?: boolean;
    usage: string;
};

const colors: ColorToken[] = [
    {
        name: 'Ink',
        variable: '--brick-ink',
        hex: '#000000',
        bg: 'bg-black',
        textOnBg: 'text-white',
        contrastOnWhite: '21:1',
        usage: 'Text, borders, shadows — the default.',
    },
    {
        name: 'Surface',
        variable: '--brick-surface',
        hex: '#FFFFFF',
        bg: 'bg-white',
        textOnBg: 'text-black',
        contrastOnWhite: '1:1',
        usage: 'Background. The empty baseplate.',
    },
    {
        name: 'Yellow',
        variable: '--brick-yellow',
        hex: '#F5C518',
        bg: 'bg-[#F5C518]',
        textOnBg: 'text-black',
        contrastOnWhite: '1.6:1',
        usage: 'Interactive highlight. Focus rings, hover states.',
    },
    {
        name: 'Yellow Subtle',
        variable: '--brick-yellow-subtle',
        hex: '#FDF0C4',
        bg: 'bg-[#FDF0C4]',
        textOnBg: 'text-black',
        contrastOnWhite: '1.2:1',
        usage: 'Pressed states. The afterglow of interaction.',
    },
    {
        name: 'Red',
        variable: '--brick-red',
        hex: '#C41A16',
        bg: 'bg-[#C41A16]',
        textOnBg: 'text-white',
        contrastOnWhite: '6.5:1',
        usage: 'Error borders and shadows.',
    },
    {
        name: 'Red Light',
        variable: '--brick-red-light',
        hex: '#F8D0CF',
        bg: 'bg-[#F8D0CF]',
        textOnBg: 'text-black',
        contrastOnWhite: '1.3:1',
        usage: 'Error backgrounds. Soft alarm.',
    },
    {
        name: 'Red Dark',
        variable: '--brick-red-dark',
        hex: '#9B1510',
        bg: 'bg-[#9B1510]',
        textOnBg: 'text-white',
        contrastOnWhite: '8.8:1',
        usage: 'Error text. Maximum urgency.',
    },
    {
        name: 'Blue',
        variable: '--brick-blue',
        hex: '#0055BF',
        bg: 'bg-[#0055BF]',
        textOnBg: 'text-white',
        contrastOnWhite: '7.1:1',
        reserved: true,
        usage: 'Reserved for future use.',
    },
    {
        name: 'Baseplate Green',
        variable: '--baseplate-green',
        hex: '#237841',
        bg: 'bg-[#237841]',
        textOnBg: 'text-white',
        contrastOnWhite: '5.0:1',
        reserved: true,
        usage: 'Reserved for future use.',
    },
];
</script>

<template>
    <section p="y-20" id="colors">
        <SectionHeading number="01" title="Color Palette" />

        <div grid="~ cols-1 sm:cols-2 lg:cols-3" gap="6">
            <div
                v-for="color in colors"
                :key="color.variable"
                class="brick-border brick-shadow"
                bg="white"
                overflow="hidden"
                relative
                :class="{'opacity-60': color.reserved}"
            >
                <!-- Color specimen -->
                <div :class="color.bg" h="28" relative>
                    <!-- Reserved overlay -->
                    <div v-if="color.reserved" absolute inset="0" flex items="center" justify="center" bg="white/70">
                        <span
                            font="heading bold"
                            text="xs"
                            uppercase
                            tracking="widest"
                            p="x-3 y-1"
                            border="3 black dashed"
                        >
                            Reserved
                        </span>
                    </div>
                    <!-- Hex label on specimen -->
                    <span
                        v-if="!color.reserved"
                        absolute
                        bottom="2"
                        right="3"
                        :class="color.textOnBg"
                        font="mono"
                        text="xs"
                    >
                        {{ color.hex }}
                    </span>
                </div>

                <!-- Info panel -->
                <div p="4" border="t-3 black">
                    <p font="heading bold" text="sm" uppercase tracking="wide" m="b-1">
                        {{ color.name }}
                    </p>
                    <p font="mono" text="xs gray-600" m="b-3">{{ color.variable }}</p>
                    <p text="sm" leading="snug">{{ color.usage }}</p>

                    <!-- WCAG badge -->
                    <div m="t-3" flex items="center" gap="2">
                        <span text="xs" font="bold mono" p="x-2 y-0.5" class="brick-border">
                            {{ color.contrastOnWhite }}
                        </span>
                        <span text="xs gray-600">vs white</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
