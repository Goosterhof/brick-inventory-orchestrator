<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';

import {createForge, type ForgeHandle, type ForgeState} from './webglForge';

const DEG_TO_RAD = Math.PI / 180;
const IDLE_SPIN_DEG_PER_SECOND = 9;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);
const yawDegrees = ref(38);
const pitchDegrees = ref(17);
const lightDegrees = ref(55);
const shadowSoftness = ref(9);
const chamfer = ref(true);
const cutaway = ref(false);

let forge: ForgeHandle | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let reducedMotion = false;
let dragging = false;
let lastX = 0;
let lastY = 0;
let lastTime = 0;

const forgeState = (): ForgeState => ({
    yaw: yawDegrees.value * DEG_TO_RAD,
    pitch: pitchDegrees.value * DEG_TO_RAD,
    lightAzimuth: lightDegrees.value * DEG_TO_RAD,
    shadowSoftness: shadowSoftness.value,
    chamfer: chamfer.value,
    cutaway: cutaway.value,
});

const tick = (now: number): void => {
    rafId = null;
    const dt = lastTime === 0 ? 0 : Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (!dragging && !reducedMotion) {
        yawDegrees.value = (yawDegrees.value + dt * IDLE_SPIN_DEG_PER_SECOND) % 360;
    }
    forge?.render(forgeState());
    if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
    }
};

const requestFrame = (): void => {
    if (rafId === null && forge) {
        rafId = requestAnimationFrame(tick);
    }
};

const onPointerDown = (event: PointerEvent): void => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvasEl.value?.setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) {
        return;
    }
    yawDegrees.value = (yawDegrees.value - (event.clientX - lastX) * 0.45 + 360) % 360;
    pitchDegrees.value = Math.min(80, Math.max(3, pitchDegrees.value + (event.clientY - lastY) * 0.3));
    lastX = event.clientX;
    lastY = event.clientY;
    requestFrame();
};

const onPointerUp = (event: PointerEvent): void => {
    dragging = false;
    canvasEl.value?.releasePointerCapture(event.pointerId);
};

const resizeCanvas = (): void => {
    const canvas = canvasEl.value;
    if (!canvas) {
        return;
    }
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    requestFrame();
};

onMounted(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasEl.value;
    if (!canvas) {
        return;
    }
    forge = createForge(canvas);
    if (!forge) {
        failed.value = true;
        return;
    }
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();
});

onUnmounted(() => {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    forge?.dispose();
    forge = null;
});

watch([lightDegrees, shadowSoftness, chamfer, cutaway], requestFrame);

const readouts = computed(() => [
    {label: 'Yaw', value: `${Math.round(yawDegrees.value)}°`},
    {label: 'Pitch', value: `${Math.round(pitchDegrees.value)}°`},
    {label: 'Light', value: `${Math.round(lightDegrees.value)}°`},
    {label: 'Shadow k', value: shadowSoftness.value.toFixed(0)},
    {label: 'Steps', value: '96'},
    {label: 'Rim', value: chamfer.value ? 'chamfer 0.07' : 'classic 90°'},
]);
</script>

<template>
    <div v-if="failed" p="12" border="3 black" bg="brick-yellow-subtle" text="center">
        <p font="heading bold" text="xl" m="b-2">The forge is cold</p>
        <p text="sm gray-600">
            WebGL context creation failed in this browser, so the raymarcher cannot ignite. The other five prototypes
            still run.
        </p>
    </div>

    <div v-else>
        <canvas
            ref="canvasEl"
            block
            w="full"
            h="120"
            border="3 black"
            cursor="grab active:grabbing"
            touch="none"
            select="none"
            aria-label="Raymarched LEGO brick — drag to orbit"
            role="img"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        />

        <div m="t-4" flex="~ wrap" items="center" gap="3">
            <button
                p="x-3 y-2"
                border="3 black"
                font="bold"
                text="xs"
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="chamfer ? 'brick-yellow' : 'white'"
                @click="chamfer = !chamfer"
            >
                Stud rim: {{ chamfer ? 'chamfered' : 'classic' }}
            </button>
            <button
                p="x-3 y-2"
                border="3 black"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="cutaway ? 'brick-red' : 'white'"
                :text="cutaway ? 'white xs' : 'black xs'"
                @click="cutaway = !cutaway"
            >
                Cutaway: {{ cutaway ? 'open' : 'closed' }}
            </button>
            <label flex="~" items="center" gap="2" text="xs" font="bold" uppercase tracking="wide">
                Key light
                <input v-model.number="lightDegrees" type="range" min="0" max="360" step="1" accent="black" w="36" />
            </label>
            <label flex="~" items="center" gap="2" text="xs" font="bold" uppercase tracking="wide">
                Shadow softness
                <input v-model.number="shadowSoftness" type="range" min="2" max="24" step="1" accent="black" w="36" />
            </label>
        </div>

        <dl m="t-4" flex="~ wrap" gap="2">
            <div
                v-for="readout in readouts"
                :key="readout.label"
                flex="~"
                items="baseline"
                gap="2"
                p="x-3 y-1"
                border="2 black"
                bg="gray-50"
            >
                <dt text="xs gray-500" font="bold" uppercase tracking="wide">{{ readout.label }}</dt>
                <dd font="mono bold" text="sm">{{ readout.value }}</dd>
            </div>
        </dl>

        <p m="t-3" text="xs gray-500">
            Signed distance fields, raymarched at 96 steps with 5-tap ambient occlusion and penumbra soft shadows. Drag
            to orbit. The chamfered stud rim is the lab's proposed improvement — a 45° lead-in so bricks self-align when
            stacking. Open the cutaway to see the hollow underside and internal tubes; the cross-section is inked in
            Brick Red.
        </p>
    </div>
</template>
