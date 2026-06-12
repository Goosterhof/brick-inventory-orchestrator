<script setup lang="ts">
import type {Component} from 'vue';

import CanvasBrickPrototype from './brick-lab/CanvasBrickPrototype.vue';
import CssBrickPrototype from './brick-lab/CssBrickPrototype.vue';
import GsapBrickPrototype from './brick-lab/GsapBrickPrototype.vue';
import SvgBrickPrototype from './brick-lab/SvgBrickPrototype.vue';
import ThreeBrickPrototype from './brick-lab/ThreeBrickPrototype.vue';
import WebglBrickPrototype from './brick-lab/WebglBrickPrototype.vue';

interface PrototypeEntry {
    id: string;
    title: string;
    technique: string;
    description: string;
    component: Component;
}

const prototypes: PrototypeEntry[] = [
    {
        id: 'canvas-2d',
        title: 'The Draftsman',
        technique: 'Canvas 2D',
        description: 'Immediate-mode raster drawing — the brick rebuilt sixty times a second from pure geometry.',
        component: CanvasBrickPrototype,
    },
    {
        id: 'svg',
        title: 'The Blueprint',
        technique: 'SVG',
        description: 'Declarative vector construction — every stud a node in the document, crisp at any zoom.',
        component: SvgBrickPrototype,
    },
    {
        id: 'css-3d',
        title: 'The Origamist',
        technique: 'CSS 3D',
        description: 'Six faces folded in the browser compositor — no canvas, no script-driven rendering.',
        component: CssBrickPrototype,
    },
    {
        id: 'webgl',
        title: 'The Forge',
        technique: 'Raw WebGL',
        description:
            'A fragment shader sculpting the brick from signed distance fields — light, material, and form computed per pixel.',
        component: WebglBrickPrototype,
    },
    {
        id: 'three-js',
        title: 'The Sculptor',
        technique: 'Three.js',
        description: 'A true mesh in a true scene graph — drag it, light it, walk around it.',
        component: ThreeBrickPrototype,
    },
    {
        id: 'gsap',
        title: 'The Choreographer',
        technique: 'GSAP',
        description: 'Timeline-driven assembly — the brick as a performance with entrances, beats, and a finale.',
        component: GsapBrickPrototype,
    },
];
</script>

<template>
    <main p="x-4 md:x-8 y-12" max-w="6xl" m="x-auto">
        <header m="b-16">
            <p font="bold" text="sm" uppercase tracking="widest" m="b-2">The Brickworks — R&amp;D Division</p>
            <h1 font="heading bold" text="5xl md:6xl" leading="tight">Brick Lab</h1>
            <p text="lg gray-600" m="t-4" max-w="2xl">
                Six prototypes of a new and improved brick, each forged with a different rendering technique. Same
                brick, six ways of seeing it.
            </p>
        </header>

        <section
            v-for="(proto, index) in prototypes"
            :id="proto.id"
            :key="proto.id"
            m="b-16"
            border="3 black"
            class="brick-shadow"
        >
            <header p="x-6 y-4" border="b-3 black" bg="black" text="white" flex="~ wrap" items="baseline" gap="x-4 y-1">
                <span font="heading bold" text="xl">{{ String(index + 1).padStart(2, '0') }}</span>
                <h2 font="heading bold" text="2xl">{{ proto.title }}</h2>
                <span p="x-3 y-1" bg="brick-yellow" text="black xs" font="bold" uppercase tracking="widest" m="l-auto">
                    {{ proto.technique }}
                </span>
            </header>
            <p p="x-6 y-4" border="b-3 black" text="sm gray-600">{{ proto.description }}</p>
            <div p="6" bg="white">
                <component :is="proto.component" />
            </div>
        </section>
    </main>
</template>
