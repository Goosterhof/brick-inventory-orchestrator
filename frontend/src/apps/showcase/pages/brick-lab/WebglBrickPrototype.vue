<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';

import {
    computeStackPose,
    createForge,
    type ForgeBrick2,
    type ForgeHandle,
    type ForgeState,
    STACK_DROP_OFFSET,
    type StackPose,
    type StackStatus,
} from './webglForge';

const DEG_TO_RAD = Math.PI / 180;
const IDLE_SPIN_DEG_PER_SECOND = 9;
const REDUCED_MOTION_CLOCK_SKIP_MS = 10000;
const SCALE_STEPS = [0.5, 0.75, 1, 1.5, 2] as const;
const SLOW_FRAME_MS = 32;
const FAST_FRAME_MS = 12;
const SCALE_COOLDOWN_MS = 700;
const IDLE_BRICK2: ForgeBrick2 = {active: false, x: 0, y: 0, z: 0, tilt: 0};
const MATERIALS = [
    {id: 0, label: 'ABS', detail: 'ABS opaque'},
    {id: 1, label: 'Trans', detail: 'PC trans-yellow'},
    {id: 2, label: 'Two-tone', detail: 'two-tone moulded'},
] as const;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);
const yawDegrees = ref(38);
const pitchDegrees = ref(17);
const lightDegrees = ref(55);
const shadowSoftness = ref(9);
const chamfer = ref(true);
const cutaway = ref(false);
const material = ref(0);
const stacking = ref(false);
const stackStatus = ref<StackStatus | null>(null);
const brick2Height = ref<number | null>(null);
const renderScale = ref(1);

let forge: ForgeHandle | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let reducedMotion = false;
let dragging = false;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let stackStartMs = 0;
let scaleIndex = 2;
let maxScaleIndex = 2;
let frameAvgMs = 16;
let lastScaleAdjustMs = 0;

const forgeState = (now: number): ForgeState => {
    const pose: StackPose | null = stacking.value ? computeStackPose((now - stackStartMs) / 1000, chamfer.value) : null;
    stackStatus.value = pose ? pose.status : null;
    brick2Height.value = pose ? pose.y : null;
    return {
        yaw: yawDegrees.value * DEG_TO_RAD,
        pitch: pitchDegrees.value * DEG_TO_RAD,
        lightAzimuth: lightDegrees.value * DEG_TO_RAD,
        shadowSoftness: shadowSoftness.value,
        chamfer: chamfer.value,
        cutaway: cutaway.value,
        material: material.value,
        brick2: pose ? {active: true, x: pose.x, y: pose.y, z: pose.z, tilt: pose.tilt} : IDLE_BRICK2,
    };
};

// Frame-time governor: holds the budget by stepping the internal render
// scale down on slow devices (and back up when there is headroom), instead
// of letting frame rate collapse at full DPR. Hysteresis + cooldown prevent
// oscillation; the current scale is surfaced in the readout strip.
const updateAdaptiveScale = (now: number, frameMs: number): void => {
    frameAvgMs = frameAvgMs * 0.8 + frameMs * 0.2;
    if (now - lastScaleAdjustMs < SCALE_COOLDOWN_MS) {
        return;
    }
    const down = frameAvgMs > SLOW_FRAME_MS && scaleIndex > 0;
    const up = frameAvgMs < FAST_FRAME_MS && scaleIndex < maxScaleIndex;
    if (!down && !up) {
        return;
    }
    scaleIndex += down ? -1 : 1;
    renderScale.value = SCALE_STEPS[scaleIndex] ?? 1;
    frameAvgMs = (SLOW_FRAME_MS + FAST_FRAME_MS) / 2;
    lastScaleAdjustMs = now;
    // Resize WITHOUT scheduling a frame: this runs inside tick, which already
    // reschedules at the bottom. Calling resizeCanvas() here would re-enter
    // requestFrame() after tick cleared rafId, leaking the prior frame id and
    // multiplying the rAF loop on every scale transition.
    resizeCanvasOnly();
};

const tick = (now: number): void => {
    rafId = null;
    const elapsedMs = lastTime === 0 ? 0 : now - lastTime;
    const dt = Math.min(elapsedMs / 1000, 0.1);
    lastTime = now;
    if (!dragging && !reducedMotion) {
        yawDegrees.value = (yawDegrees.value + dt * IDLE_SPIN_DEG_PER_SECOND) % 360;
    }
    if (!reducedMotion && elapsedMs > 0) {
        updateAdaptiveScale(now, elapsedMs);
    }
    forge?.render(forgeState(now));
    if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
    }
};

const requestFrame = (): void => {
    if (rafId === null && forge) {
        rafId = requestAnimationFrame(tick);
    }
};

const startStack = (): void => {
    // Reduced motion: back-date the clock so the pose function lands on its
    // terminal state (seated or jammed) in the single on-demand frame.
    stackStartMs = performance.now() - (reducedMotion ? REDUCED_MOTION_CLOCK_SKIP_MS : 0);
    stacking.value = true;
    requestFrame();
};

const resetStack = (): void => {
    stacking.value = false;
    requestFrame();
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

// Resize the backing store only. Callers that are NOT already inside the rAF
// loop should use resizeCanvas(), which also schedules a frame to repaint.
const resizeCanvasOnly = (): void => {
    const canvas = canvasEl.value;
    if (!canvas) {
        return;
    }
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * renderScale.value));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * renderScale.value));
};

const resizeCanvas = (): void => {
    resizeCanvasOnly();
    requestFrame();
};

onMounted(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nativeScale = Math.min(window.devicePixelRatio, 2);
    const nativeIndex = SCALE_STEPS.findIndex((step) => step >= nativeScale);
    maxScaleIndex = nativeIndex === -1 ? SCALE_STEPS.length - 1 : nativeIndex;
    scaleIndex = maxScaleIndex;
    renderScale.value = SCALE_STEPS[scaleIndex] ?? 1;
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

watch([lightDegrees, shadowSoftness, chamfer, cutaway, material], requestFrame);

const materialDetail = computed(() => MATERIALS[material.value]?.detail ?? 'ABS opaque');

const readouts = computed(() => [
    {label: 'Yaw', value: `${Math.round(yawDegrees.value)}°`},
    {label: 'Pitch', value: `${Math.round(pitchDegrees.value)}°`},
    {label: 'Light', value: `${Math.round(lightDegrees.value)}°`},
    {label: 'Shadow k', value: shadowSoftness.value.toFixed(0)},
    {label: 'Material', value: materialDetail.value},
    {
        label: 'Brick 2',
        value: brick2Height.value === null ? 'in the box' : `y ${brick2Height.value.toFixed(2)} · ${stackStatus.value}`,
    },
    {label: 'Drop offset', value: `+${STACK_DROP_OFFSET.x}x +${STACK_DROP_OFFSET.z}z`},
    {label: 'March', value: '96 · shadow 48/24'},
    {label: 'Render', value: `×${renderScale.value} auto`},
    {label: 'Floor', value: 'stud grid ∞ · 0.8'},
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
            aria-label="Raymarched LEGO bricks on a baseplate floor — drag to orbit, stack to drop a second brick"
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
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="stacking ? 'brick-blue' : 'brick-yellow'"
                :text="stacking ? 'white xs' : 'black xs'"
                @click="startStack"
            >
                {{ stacking ? 'Re-drop' : 'Stack' }}
            </button>
            <button
                p="x-3 y-2"
                border="3 black"
                font="bold"
                text="xs"
                uppercase
                tracking="wide"
                cursor="pointer"
                bg="white"
                @click="resetStack"
            >
                Reset
            </button>
            <span text="xs" font="bold" uppercase tracking="wide" m="l-2">Material</span>
            <button
                v-for="option in MATERIALS"
                :key="option.id"
                p="x-3 y-2"
                border="3 black"
                font="bold"
                text="xs"
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="material === option.id ? 'brick-yellow' : 'white'"
                @click="material = option.id"
            >
                {{ option.label }}
            </button>
        </div>

        <div m="t-3" flex="~ wrap" items="center" gap="3">
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
            The whole scene is one fragment shader: two bricks and an infinite baseplate stud floor, all signed distance
            fields. Press Stack to drop the BW-3001X — it spawns deliberately misaligned and the 45° rim chamfers guide
            it into registration as it engages, with a settle bounce at the moment of clutch. Toggle the rim to classic
            and the same drop jams crooked on the stud tops: that contrast is the product story. The material lab
            re-renders identical geometry as opaque ABS, trans-yellow polycarbonate (Beer–Lambert absorption marched
            through the interior), or a two-tone moulding. The budget is held adaptively: 48 shadow iterations on bricks
            vs 24 on the floor, bounding-volume early-outs around the bricks and the stud slab, and a frame-time
            governor that steps the render scale between ×0.5 and native so slow GPUs keep their frame rate instead of
            their pixels.
        </p>
    </div>
</template>
