<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';

import {
    BRICK_COLORS,
    type BrickConfig,
    type BrickParts,
    buildBrickParts,
    createSculptorScene,
    type SculptorScene,
} from './threeSculptor';

const IDLE_SPIN_RAD_PER_SECOND = 0.22;
const CLICK_SLOP_PX = 6;
const STUD_OPTIONS = [2, 4, 6] as const;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);
const studsX = ref<number>(4);
const exploded = ref(false);
const colorIndex = ref(0);

let sceneState: SculptorScene | null = null;
let parts: BrickParts | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let reducedMotion = false;
let dragging = false;
let yaw = 0.65;
let pitch = 0.42;
let lastX = 0;
let lastY = 0;
let downX = 0;
let downY = 0;
let explodeT = 0;
let lastTime = 0;

const activeColor = computed(() => BRICK_COLORS[colorIndex.value % BRICK_COLORS.length] ?? BRICK_COLORS[0]);

const applyCamera = (): void => {
    if (!sceneState) {
        return;
    }
    const radius = 4.6 + studsX.value * 0.45;
    const clampedPitch = Math.min(1.35, Math.max(0.08, pitch));
    sceneState.camera.position.set(
        radius * Math.cos(clampedPitch) * Math.sin(yaw),
        radius * Math.sin(clampedPitch),
        radius * Math.cos(clampedPitch) * Math.cos(yaw),
    );
    sceneState.camera.lookAt(0, 0.55, 0);
};

const applyExplosion = (dt: number): void => {
    const target = exploded.value ? 1 : 0;
    explodeT = reducedMotion ? target : explodeT + (target - explodeT) * Math.min(1, dt * 7);
    if (Math.abs(explodeT - target) < 0.002) {
        explodeT = target;
    }
    if (parts) {
        parts.studGroup.position.y = 0.62 * explodeT;
        parts.tubeGroup.position.y = -0.72 * explodeT;
    }
};

const tick = (now: number): void => {
    rafId = null;
    const dt = lastTime === 0 ? 0 : Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (!dragging && !reducedMotion) {
        yaw += dt * IDLE_SPIN_RAD_PER_SECOND;
    }
    applyExplosion(dt);
    applyCamera();
    if (sceneState) {
        sceneState.renderer.render(sceneState.scene, sceneState.camera);
    }
    if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
    }
};

const requestFrame = (): void => {
    if (rafId === null && sceneState) {
        rafId = requestAnimationFrame(tick);
    }
};

const rebuildBrick = (): void => {
    if (!sceneState) {
        return;
    }
    if (parts) {
        sceneState.scene.remove(parts.group);
        parts.dispose();
    }
    const config: BrickConfig = {studsX: studsX.value, studsZ: 2};
    parts = buildBrickParts(config, sceneState.material);
    sceneState.scene.add(parts.group);
    requestFrame();
};

const cycleColor = (): void => {
    colorIndex.value = (colorIndex.value + 1) % BRICK_COLORS.length;
    sceneState?.material.color.setHex(activeColor.value.hex);
    requestFrame();
};

const onPointerDown = (event: PointerEvent): void => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    downX = event.clientX;
    downY = event.clientY;
    canvasEl.value?.setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) {
        return;
    }
    yaw -= (event.clientX - lastX) * 0.008;
    pitch += (event.clientY - lastY) * 0.006;
    pitch = Math.min(1.35, Math.max(0.08, pitch));
    lastX = event.clientX;
    lastY = event.clientY;
    requestFrame();
};

const onPointerUp = (event: PointerEvent): void => {
    dragging = false;
    canvasEl.value?.releasePointerCapture(event.pointerId);
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
    if (moved < CLICK_SLOP_PX) {
        cycleColor();
    }
};

const resizeCanvas = (): void => {
    const canvas = canvasEl.value;
    if (!canvas || !sceneState) {
        return;
    }
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    sceneState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    sceneState.renderer.setSize(width, height, false);
    sceneState.camera.aspect = width / height;
    sceneState.camera.updateProjectionMatrix();
    requestFrame();
};

onMounted(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasEl.value;
    if (!canvas) {
        return;
    }
    sceneState = createSculptorScene(canvas);
    if (!sceneState) {
        failed.value = true;
        return;
    }
    rebuildBrick();
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
    parts?.dispose();
    parts = null;
    sceneState?.dispose();
    sceneState = null;
});

watch(studsX, rebuildBrick);
watch(exploded, requestFrame);

const readouts = computed(() => [
    {label: 'Studs', value: `${studsX.value} × 2`},
    {label: 'Color', value: activeColor.value.name},
    {label: 'View', value: exploded.value ? 'exploded' : 'assembled'},
    {label: 'Shadows', value: 'PCF soft 2048²'},
    {label: 'Rim', value: 'chamfer 0.05'},
]);
</script>

<template>
    <div v-if="failed" p="12" border="3 black" bg="brick-yellow-subtle" text="center">
        <p font="heading bold" text="xl" m="b-2">The sculptor is out of clay</p>
        <p text="sm gray-600">
            This browser refused a WebGL context, so the Three.js scene cannot render. The other five prototypes still
            run.
        </p>
    </div>

    <div v-else>
        <canvas
            ref="canvasEl"
            block
            w="full"
            h="120"
            border="3 black"
            bg="white"
            cursor="grab active:grabbing"
            touch="none"
            select="none"
            aria-label="Three.js LEGO brick — drag to orbit, click to cycle color"
            role="img"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        />

        <div m="t-4" flex="~ wrap" items="center" gap="3">
            <span text="xs" font="bold" uppercase tracking="wide">Mould</span>
            <button
                v-for="option in STUD_OPTIONS"
                :key="option"
                p="x-3 y-2"
                border="3 black"
                font="bold"
                text="xs"
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="studsX === option ? 'brick-yellow' : 'white'"
                @click="studsX = option"
            >
                2 × {{ option }}
            </button>
            <button
                p="x-3 y-2"
                border="3 black"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                m="l-2"
                :bg="exploded ? 'brick-blue' : 'white'"
                :text="exploded ? 'white xs' : 'black xs'"
                @click="exploded = !exploded"
            >
                {{ exploded ? 'Assemble' : 'Explode' }}
            </button>
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
            A real mesh in a real scene graph: bevel-extruded body, lathed studs with the lab's chamfered self-aligning
            rim, and open internal tubes under a three-point light rig. Drag to orbit, click the brick to cycle through
            the four works colors, swap the mould to recast the geometry, and explode the view to inspect the internals.
        </p>
    </div>
</template>
