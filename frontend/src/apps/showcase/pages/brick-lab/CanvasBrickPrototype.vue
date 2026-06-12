<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';

import type {BrickPose, IsoView} from './canvasBrickScene';

import {BRICK, drawBrick, drawGhostSlot, drawGrid, drawTitleBlock, project} from './canvasBrickScene';

const COLORS = ['#F5C518', '#C41A16', '#0055BF', '#237841'] as const;
const MAX_STACK = 5;
const GRAVITY = 980; // mm/s² in model space
const SETTLE_MS = 620;
const SQUASH = 0.22;
const PARTICLE_LIFE_MS = 550;
const CANVAS_HEIGHT = 460;

interface SettledBrick {
    color: string;
    landedAt: number;
}

interface FallingBrick {
    color: string;
    altitude: number;
    speed: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    born: number;
}

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const stackSize = ref(1);
const dropping = ref(false);
const reducedMotion = ref(false);
const pixelRatio = ref(1);

let context: CanvasRenderingContext2D | null = null;
let observer: ResizeObserver | null = null;
let motionQuery: MediaQueryList | null = null;
let frameHandle = 0;
let lastFrameAt = 0;
let cssWidth = 960;
let impactAt = -1;
let stack: SettledBrick[] = [{color: COLORS[0], landedAt: 0}];
let falling: FallingBrick | null = null;
let particles: Particle[] = [];

const colorAt = (index: number): string => COLORS[index % COLORS.length] ?? '#F5C518';

const currentView = (): IsoView => ({
    cx: cssWidth / 2,
    baseY: CANVAS_HEIGHT - 26,
    scale: Math.min(6.8, Math.max(4, cssWidth / 150)),
});

const parameterChips = computed((): string[] => [
    `GRAVITY ${GRAVITY} MM/S²`,
    `SQUASH ${Math.round(SQUASH * 100)}% · SETTLE ${SETTLE_MS} MS`,
    `STACK ${stackSize.value}/${MAX_STACK}`,
    `DPR ×${pixelRatio.value}`,
    'CLICK THE TABLE TO DROP',
]);

const settleSquash = (now: number, landedAt: number): {x: number; y: number} => {
    const elapsed = (now - landedAt) / 1000;
    if (reducedMotion.value || elapsed >= SETTLE_MS / 1000) {
        return {x: 1, y: 1};
    }
    const wobble = Math.exp(-9 * elapsed) * Math.cos(elapsed * 24);
    return {x: 1 + SQUASH * 0.7 * wobble, y: 1 - SQUASH * wobble};
};

const stackBounce = (now: number): number => {
    if (impactAt < 0 || reducedMotion.value) {
        return 0;
    }
    const elapsed = (now - impactAt) / 1000;
    return elapsed > 0.4 ? 0 : 4 * Math.exp(-10 * elapsed) * Math.sin(elapsed * 22);
};

const spawnParticles = (now: number): void => {
    const ground = project(currentView(), BRICK.length / 2, BRICK.width, (stack.length - 1) * BRICK.height);
    for (let index = 0; index < 12; index += 1) {
        const direction = index % 2 === 0 ? -1 : 1;
        particles.push({
            x: ground.x + direction * (10 + Math.random() * 80),
            y: ground.y,
            vx: direction * (30 + Math.random() * 120),
            vy: -(40 + Math.random() * 130),
            born: now,
        });
    }
};

const updatePhysics = (now: number, dt: number): void => {
    if (falling) {
        falling.speed += GRAVITY * dt;
        falling.altitude -= falling.speed * dt;
        if (falling.altitude <= 0) {
            stack.push({color: falling.color, landedAt: now});
            stackSize.value = stack.length;
            falling = null;
            dropping.value = false;
            impactAt = now;
            spawnParticles(now);
        }
    }
    particles = particles.filter((particle) => now - particle.born < PARTICLE_LIFE_MS);
    for (const particle of particles) {
        particle.vy += 700 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
    }
};

const drawParticles = (ctx: CanvasRenderingContext2D, now: number): void => {
    for (const particle of particles) {
        ctx.globalAlpha = Math.max(0, 1 - (now - particle.born) / PARTICLE_LIFE_MS);
        ctx.fillStyle = '#222222';
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
};

const titleLines = (view: IsoView): string[] => [
    'BW-3001X — "IMPROVED BRICK" 2×4',
    'THE BRICKWORKS · R&D DIVISION',
    `SCALE ${view.scale.toFixed(1)} PX/MM · DPR ${pixelRatio.value}`,
    `GRAVITY ${GRAVITY} MM/S² · SETTLE ${SETTLE_MS} MS`,
    'CLUTCH CHANNELS ×4 · CHAMFER SKIRT 0.7 MM',
];

const renderFrame = (now: number): void => {
    if (!context) {
        return;
    }
    const view = currentView();
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, cssWidth, CANVAS_HEIGHT);
    drawGrid(context, cssWidth, CANVAS_HEIGHT);
    const bouncedView = {...view, baseY: view.baseY + stackBounce(now)};
    for (const [index, brick] of stack.entries()) {
        const squash = settleSquash(now, brick.landedAt);
        const pose: BrickPose = {z: index * BRICK.height, color: brick.color, squashX: squash.x, squashY: squash.y};
        drawBrick(context, bouncedView, pose);
    }
    if (falling) {
        const z = stack.length * BRICK.height + falling.altitude;
        drawBrick(context, view, {z, color: falling.color, squashX: 1, squashY: 1});
    } else if (stack.length < MAX_STACK) {
        const pulse = reducedMotion.value ? 0.45 : 0.32 + 0.18 * Math.sin(now / 380);
        drawGhostSlot(context, view, stack.length * BRICK.height, pulse);
    }
    drawParticles(context, now);
    drawTitleBlock(context, cssWidth, CANVAS_HEIGHT, titleLines(view));
};

const frame = (now: number): void => {
    const dt = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;
    updatePhysics(now, dt);
    renderFrame(now);
    frameHandle = window.requestAnimationFrame(frame);
};

const syncLoop = (): void => {
    window.cancelAnimationFrame(frameHandle);
    if (reducedMotion.value) {
        falling = null;
        dropping.value = false;
        particles = [];
        renderFrame(performance.now());
        return;
    }
    lastFrameAt = performance.now();
    frameHandle = window.requestAnimationFrame(frame);
};

const resetStack = (): void => {
    falling = null;
    dropping.value = false;
    particles = [];
    stack = [{color: colorAt(0), landedAt: reducedMotion.value ? 0 : performance.now()}];
    stackSize.value = 1;
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const dropBrick = (): void => {
    if (stack.length >= MAX_STACK) {
        resetStack();
        return;
    }
    if (falling) {
        return;
    }
    const color = colorAt(stack.length);
    if (reducedMotion.value) {
        stack.push({color, landedAt: 0});
        stackSize.value = stack.length;
        renderFrame(performance.now());
        return;
    }
    dropping.value = true;
    falling = {color, altitude: (MAX_STACK + 1.5 - stack.length) * BRICK.height, speed: 0};
};

const applySize = (width: number): void => {
    const target = canvas.value;
    if (!target) {
        return;
    }
    cssWidth = Math.max(320, width);
    pixelRatio.value = Math.min(window.devicePixelRatio || 1, 3);
    target.width = Math.round(cssWidth * pixelRatio.value);
    target.height = Math.round(CANVAS_HEIGHT * pixelRatio.value);
    target.style.width = `${cssWidth}px`;
    target.style.height = `${CANVAS_HEIGHT}px`;
    context?.setTransform(pixelRatio.value, 0, 0, pixelRatio.value, 0, 0);
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const onMotionChange = (event: MediaQueryListEvent): void => {
    reducedMotion.value = event.matches;
    syncLoop();
};

onMounted((): void => {
    const target = canvas.value;
    const wrapper = host.value;
    if (!target || !wrapper) {
        return;
    }
    context = target.getContext('2d');
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.value = motionQuery.matches;
    motionQuery.addEventListener('change', onMotionChange);
    observer = new ResizeObserver((entries): void => {
        const entry = entries[0];
        if (entry) {
            applySize(entry.contentRect.width);
        }
    });
    observer.observe(wrapper);
    applySize(wrapper.clientWidth);
    syncLoop();
});

onUnmounted((): void => {
    window.cancelAnimationFrame(frameHandle);
    observer?.disconnect();
    observer = null;
    motionQuery?.removeEventListener('change', onMotionChange);
    motionQuery = null;
    context = null;
});
</script>

<template>
    <div>
        <div ref="host" border="3 black" bg="white" overflow="hidden" cursor="pointer" select="none" @click="dropBrick">
            <canvas
                ref="canvas"
                block
                role="img"
                aria-label="Isometric drafting table where improved LEGO bricks drop and stack with squash-and-settle physics"
            />
        </div>
        <div flex="~ wrap" items="center" gap="3" m="t-4">
            <button
                type="button"
                p="x-4 y-2"
                bg="brick-yellow"
                text="sm black"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                :disabled="dropping"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active disabled:opacity-60"
                @click="dropBrick"
            >
                {{ stackSize >= MAX_STACK ? 'Rebuild' : 'Drop brick' }}
            </button>
            <button
                type="button"
                p="x-4 y-2"
                bg="white"
                text="sm black"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="resetStack"
            >
                Reset
            </button>
            <span
                v-for="chip in parameterChips"
                :key="chip"
                font="mono"
                text="xs"
                p="x-2 y-1"
                bg="gray-100"
                class="brick-border"
            >
                {{ chip }}
            </span>
            <span v-if="reducedMotion" font="mono" text="xs" p="x-2 y-1" bg="brick-yellow-subtle" class="brick-border">
                REDUCED MOTION — BRICKS PLACE INSTANTLY
            </span>
        </div>
    </div>
</template>
