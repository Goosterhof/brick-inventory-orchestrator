<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';

import type {BrickPose, BrickShape, IsoView, OutlineStyle} from './canvasBrickScene';

import {
    columnToX,
    drawBaseline,
    drawBrick,
    drawBrickOutline,
    drawGrid,
    drawStamp,
    drawTitleBlock,
    project,
    UNIT,
} from './canvasBrickScene';

const COLORS = ['#F5C518', '#C41A16', '#0055BF', '#237841'] as const;
const GRAVITY = 980; // mm/s² in model space
const SETTLE_MS = 620;
const MAX_BRICKS = 60;
const CANVAS_HEIGHT = 460;
const PARTS = [
    {label: '2×2', studs: 2},
    {label: '2×3', studs: 3},
    {label: '2×4', studs: 4},
] as const;

/** Today's build instructions — two pillars and a bridge make the BW-A1 arch. */
const ARCH = [
    {col: 2, span: 2, level: 0},
    {col: 6, span: 2, level: 0},
    {col: 3, span: 4, level: 1},
] as const;

const PHANTOM_STYLE: OutlineStyle = {stroke: 'rgba(0, 85, 191, 0.55)', alpha: 0.55, dash: [5, 5]};
const GHOST_DASH = [7, 6] as const;
const BLOCKED_STYLE: OutlineStyle = {stroke: '#C41A16', alpha: 0.55, dash: [4, 4]};

interface Brick {
    col: number;
    span: number;
    color: string;
    z: number;
    targetZ: number;
    vz: number;
    state: 'resting' | 'falling';
    landedAt: number;
    squashAmp: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    born: number;
    life: number;
    size: number;
    color: string;
}

interface Impact {
    col: number;
    at: number;
    amp: number;
}

interface Slot {
    col: number;
    span: number;
    level: number;
    blocked: boolean;
}

const host = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const selectedPart = ref(2);
const colorIndex = ref(0);
const placedCount = ref(0);
const retiredCount = ref(0);
const reducedMotion = ref(false);
const pixelRatio = ref(1);

let context: CanvasRenderingContext2D | null = null;
let observer: ResizeObserver | null = null;
let motionQuery: MediaQueryList | null = null;
let frameHandle = 0;
let lastFrameAt = 0;
let cssWidth = 960;
let columns = 18;
let view: IsoView = {cx: 480, baseY: CANVAS_HEIGHT - 36, scale: 4.2};
let bricks: Brick[] = [];
let particles: Particle[] = [];
let impacts: Impact[] = [];
let aim: number | null = null;
let goalDone = false;
let dropRecord = 0;

const nextColor = computed((): string => COLORS[colorIndex.value % COLORS.length] ?? '#F5C518');

const parameterChips = computed((): string[] => [
    `GRAVITY ${GRAVITY} MM/S² · SETTLE ${SETTLE_MS} MS`,
    'SQUASH 10–34% · IMPACT-SCALED',
    'SHUDDER 1/(1+0.9d) FALLOFF · WOBBLE >4 LVL',
    `PLACED ${placedCount.value} · RETIRED ${retiredCount.value}`,
    'CLICK DROPS · RIGHT-CLICK PULLS · KEYS 1·2·3',
]);

const heightsByColumn = (): number[] => {
    const heights = Array.from({length: columns}, (): number => 0);
    for (const brick of bricks) {
        const level = Math.round(brick.targetZ / UNIT.height) + 1;
        for (let col = brick.col; col < brick.col + brick.span; col += 1) {
            heights[col] = Math.max(heights[col] ?? 0, level);
        }
    }
    return heights;
};

const restLevelFor = (col: number, span: number, heights: number[]): number => {
    let level = 0;
    for (let c = col; c < col + span; c += 1) {
        level = Math.max(level, heights[c] ?? 0);
    }
    return level;
};

const maxLevel = (): number => Math.floor(((view.baseY - 40) / view.scale - 24) / UNIT.height);

const aimedSlot = (): Slot | null => {
    if (aim === null) {
        return null;
    }
    const span = PARTS[selectedPart.value]?.studs ?? 4;
    // Clamp the low bound LAST so col can never go negative: when the sheet is
    // narrower than the part (columns < span), `columns - span` is negative and
    // would win the Math.min, pushing the brick off-sheet to the left into
    // negative array indices. maxCol floors at 0; the degenerate sheet is blocked.
    const maxCol = Math.max(0, columns - span);
    const col = Math.min(maxCol, Math.max(0, Math.round(aim / UNIT.pitch + columns / 2 - span / 2)));
    const level = restLevelFor(col, span, heightsByColumn());
    return {col, span, level, blocked: columns < span || level > maxLevel() || bricks.length >= MAX_BRICKS};
};

const spawnHeightFor = (slot: Slot): number => {
    let spawn = (view.baseY - 40) / view.scale - UNIT.height;
    for (const brick of bricks) {
        const overlaps =
            brick.state === 'falling' && brick.col < slot.col + slot.span && slot.col < brick.col + brick.span;
        if (overlaps) {
            spawn = Math.max(spawn, brick.z + UNIT.height + 5);
        }
    }
    return spawn;
};

const spawnDebris = (brick: Brick, now: number, speed: number): void => {
    const count = Math.min(16, Math.round(4 + speed / 45));
    const left = project(view, columnToX(brick.col, columns), 0, brick.targetZ);
    const right = project(view, columnToX(brick.col, columns) + brick.span * UNIT.pitch, 0, brick.targetZ);
    for (let index = 0; index < count; index += 1) {
        const direction = index % 2 === 0 ? -1 : 1;
        const origin = index % 2 === 0 ? left : right;
        particles.push({
            x: origin.x,
            y: origin.y,
            vx: direction * (30 + Math.random() * (60 + speed * 0.3)),
            vy: -(40 + Math.random() * (60 + speed * 0.4)),
            born: now,
            life: 550,
            size: 3.5,
            color: '#222222',
        });
    }
};

const spawnConfetti = (now: number): void => {
    const center = project(view, columnToX(3, columns) + 2 * UNIT.pitch, UNIT.depth / 2, 2 * UNIT.height);
    for (let index = 0; index < 56; index += 1) {
        particles.push({
            x: center.x,
            y: center.y - 10,
            vx: (Math.random() - 0.5) * 540,
            vy: -(90 + Math.random() * 330),
            born: now,
            life: 1100,
            size: 5.5,
            color: COLORS[index % COLORS.length] ?? '#F5C518',
        });
    }
};

const phantomMatched = (phantom: {col: number; span: number; level: number}): boolean =>
    bricks.some(
        (brick) =>
            brick.col === phantom.col &&
            brick.span === phantom.span &&
            Math.round(brick.targetZ / UNIT.height) === phantom.level,
    );

const checkGoal = (now: number): void => {
    if (goalDone || !ARCH.every(phantomMatched)) {
        return;
    }
    goalDone = true;
    if (!reducedMotion.value) {
        spawnConfetti(now);
    }
};

/**
 * Dev-only observable contract: mirrors the scene state onto the canvas element so
 * E2E probes can assert invariants (e.g. no two bricks share a (column, level) cell)
 * against data instead of pixels. Updated on every placement-affecting event.
 */
const publishState = (): void => {
    const target = canvas.value;
    if (!target) {
        return;
    }
    target.dataset.bricks = JSON.stringify(
        bricks.map((brick) => ({
            col: brick.col,
            span: brick.span,
            level: Math.round(brick.targetZ / UNIT.height),
            state: brick.state,
        })),
    );
};

const landBrick = (brick: Brick, now: number): void => {
    const speed = brick.vz;
    brick.z = brick.targetZ;
    brick.vz = 0;
    brick.state = 'resting';
    brick.landedAt = now;
    brick.squashAmp = Math.min(0.34, 0.1 + speed / 1500);
    if (!reducedMotion.value) {
        impacts.push({col: brick.col + brick.span / 2, at: now, amp: Math.min(6, 1.5 + speed / 180)});
        spawnDebris(brick, now, speed);
    }
    checkGoal(now);
    publishState();
};

const dropBrick = (): void => {
    const slot = aimedSlot();
    if (!slot || slot.blocked) {
        return;
    }
    const color = COLORS[colorIndex.value % COLORS.length] ?? '#F5C518';
    colorIndex.value += 1;
    placedCount.value += 1;
    const targetZ = slot.level * UNIT.height;
    const spawn = spawnHeightFor(slot);
    const brick: Brick = {
        col: slot.col,
        span: slot.span,
        color,
        z: spawn,
        targetZ,
        vz: 0,
        state: 'falling',
        landedAt: 0,
        squashAmp: 0,
    };
    bricks.push(brick);
    publishState();
    if (reducedMotion.value) {
        landBrick(brick, performance.now());
        renderFrame(performance.now());
        return;
    }
    dropRecord = Math.max(dropRecord, spawn - targetZ);
};

/** After a brick is pulled, everything above settles down to its new resting level. */
const resettleAll = (): void => {
    const sorted = [...bricks].sort((a, b) => a.targetZ - b.targetZ);
    const heights = Array.from({length: columns}, (): number => 0);
    for (const brick of sorted) {
        const level = restLevelFor(brick.col, brick.span, heights);
        const newTarget = level * UNIT.height;
        if (newTarget < brick.targetZ - 0.01) {
            brick.targetZ = newTarget;
            if (reducedMotion.value) {
                brick.z = newTarget;
            } else if (brick.state === 'resting') {
                brick.state = 'falling';
                brick.vz = 0;
            }
        }
        for (let col = brick.col; col < brick.col + brick.span; col += 1) {
            heights[col] = Math.max(heights[col] ?? 0, level + 1);
        }
    }
    publishState();
};

const pointInBrick = (brick: Brick, px: number, py: number): boolean => {
    const left = view.cx + columnToX(brick.col, columns) * view.scale;
    const width = (brick.span * UNIT.pitch + 5.7) * view.scale;
    const bottom = view.baseY - brick.z * view.scale;
    const top = bottom - (UNIT.height + 5.7) * view.scale;
    return px >= left && px <= left + width && py >= top && py <= bottom;
};

const brickAtPoint = (px: number, py: number): Brick | null => {
    let hit: Brick | null = null;
    for (const brick of bricks) {
        if (brick.state === 'resting' && pointInBrick(brick, px, py) && (hit === null || brick.z > hit.z)) {
            hit = brick;
        }
    }
    return hit;
};

const squashFor = (brick: Brick, now: number): {x: number; y: number} => {
    const elapsed = (now - brick.landedAt) / 1000;
    if (reducedMotion.value || brick.state !== 'resting' || elapsed >= SETTLE_MS / 1000) {
        return {x: 1, y: 1};
    }
    const wobble = Math.exp(-9 * elapsed) * Math.cos(elapsed * 24);
    return {x: 1 + brick.squashAmp * 0.7 * wobble, y: 1 - brick.squashAmp * wobble};
};

/** Impact shudder rippling out to neighbours, plus ambient sway for tall towers. */
const jitterFor = (brick: Brick, now: number, heights: number[]): {x: number; y: number} => {
    if (reducedMotion.value) {
        return {x: 0, y: 0};
    }
    let dy = 0;
    for (const impact of impacts) {
        const t = (now - impact.at) / 1000;
        const distance = Math.abs(brick.col + brick.span / 2 - impact.col);
        dy += (impact.amp * Math.exp(-10 * t) * Math.sin(22 * t)) / (1 + distance * 0.9);
    }
    const towerLevels = restLevelFor(brick.col, brick.span, heights);
    const wobbleAmp = Math.min(2.2, Math.max(0, towerLevels - 4) * 0.5);
    const sway =
        brick.state === 'resting' && wobbleAmp > 0
            ? Math.sin(now / 320 + brick.col * 0.8) * wobbleAmp * (brick.z / (towerLevels * UNIT.height))
            : 0;
    return {x: sway, y: dy};
};

const updatePhysics = (now: number, dt: number): void => {
    for (const brick of bricks) {
        if (brick.state !== 'falling') {
            continue;
        }
        brick.vz += GRAVITY * dt;
        brick.z -= brick.vz * dt;
        if (brick.z <= brick.targetZ) {
            landBrick(brick, now);
        }
    }
    particles = particles.filter((particle) => now - particle.born < particle.life);
    if (particles.length > 150) {
        particles.splice(0, particles.length - 150);
    }
    impacts = impacts.filter((impact) => now - impact.at < 450);
    for (const particle of particles) {
        particle.vy += 760 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
    }
};

const drawOneBrick = (ctx: CanvasRenderingContext2D, brick: Brick, now: number, heights: number[]): void => {
    const squash = squashFor(brick, now);
    const jitter = jitterFor(brick, now, heights);
    const pose: BrickPose = {
        x: columnToX(brick.col, columns),
        z: brick.z,
        studs: brick.span,
        color: brick.color,
        squashX: squash.x,
        squashY: squash.y,
        jitterX: jitter.x,
        jitterY: jitter.y,
    };
    drawBrick(ctx, view, pose);
};

const drawPhantoms = (ctx: CanvasRenderingContext2D): void => {
    if (goalDone) {
        return;
    }
    for (const phantom of ARCH) {
        const shape: BrickShape = {
            x: columnToX(phantom.col, columns),
            z: phantom.level * UNIT.height,
            studs: phantom.span,
        };
        drawBrickOutline(ctx, view, shape, PHANTOM_STYLE);
    }
    const label = project(view, columnToX(3, columns) + 2 * UNIT.pitch, UNIT.depth, 2.6 * UNIT.height);
    ctx.fillStyle = 'rgba(0, 85, 191, 0.7)';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DRAWING BW-A1 — BUILD THE ARCH', label.x, label.y - 8);
    ctx.textAlign = 'left';
};

const drawAimGhost = (ctx: CanvasRenderingContext2D, now: number): void => {
    const slot = aimedSlot();
    if (!slot) {
        return;
    }
    const alpha = reducedMotion.value ? 0.5 : 0.4 + 0.18 * Math.sin(now / 350);
    const style: OutlineStyle = slot.blocked ? BLOCKED_STYLE : {stroke: '#0055BF', alpha, dash: GHOST_DASH};
    const shape: BrickShape = {x: columnToX(slot.col, columns), z: slot.level * UNIT.height, studs: slot.span};
    drawBrickOutline(ctx, view, shape, style);
};

const drawParticles = (ctx: CanvasRenderingContext2D, now: number): void => {
    for (const particle of particles) {
        ctx.globalAlpha = Math.max(0, 1 - (now - particle.born) / particle.life);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
};

const titleLines = (heights: number[]): string[] => [
    'BW-3001X FREE BUILD — THE BRICKWORKS R&D',
    `BRICKS ${bricks.length}/${MAX_BRICKS} · PLACED ${placedCount.value} · RETIRED ${retiredCount.value}`,
    `TALLEST ${Math.max(0, ...heights)} LVL · DROP RECORD ${Math.round(dropRecord)} MM`,
    `DRAWING BW-A1 (ARCH): ${goalDone ? 'APPROVED' : 'IN PROGRESS'}`,
    `GRAVITY ${GRAVITY} MM/S² · SETTLE ${SETTLE_MS} MS · DPR ×${pixelRatio.value}`,
];

const renderFrame = (now: number): void => {
    if (!context) {
        return;
    }
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, cssWidth, CANVAS_HEIGHT);
    drawGrid(context, cssWidth, CANVAS_HEIGHT);
    drawBaseline(context, view, columns);
    drawPhantoms(context);
    const heights = heightsByColumn();
    // Painter's order for the cabinet projection: bottom-to-top first (a higher brick
    // always occludes the studs/top face of bricks under it, wherever it was placed
    // in time), then left-to-right (a right neighbour's front face occludes the left
    // neighbour's receding right face). Column-primary order is wrong: it lets a
    // lower brick to the right paint over a higher brick to its left.
    const sorted = [...bricks].sort((a, b) => a.z - b.z || a.col - b.col);
    for (const brick of sorted) {
        drawOneBrick(context, brick, now, heights);
    }
    drawAimGhost(context, now);
    drawParticles(context, now);
    drawTitleBlock(context, cssWidth, CANVAS_HEIGHT, titleLines(heights));
    if (goalDone) {
        drawStamp(context, cssWidth, CANVAS_HEIGHT);
    }
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
        for (const brick of bricks) {
            brick.z = brick.targetZ;
            brick.state = 'resting';
        }
        particles = [];
        impacts = [];
        renderFrame(performance.now());
        return;
    }
    lastFrameAt = performance.now();
    frameHandle = window.requestAnimationFrame(frame);
};

const resetSheet = (): void => {
    bricks = [];
    particles = [];
    impacts = [];
    goalDone = false;
    dropRecord = 0;
    placedCount.value = 0;
    retiredCount.value = 0;
    publishState();
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const pointerWorldX = (event: MouseEvent): number => (event.offsetX - view.cx) / view.scale;

const onPointerMove = (event: PointerEvent): void => {
    aim = pointerWorldX(event);
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const onPointerLeave = (): void => {
    aim = null;
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const onCanvasClick = (event: MouseEvent): void => {
    aim = pointerWorldX(event);
    dropBrick();
};

const onRightClick = (event: MouseEvent): void => {
    const target = brickAtPoint(event.offsetX, event.offsetY);
    if (!target) {
        return;
    }
    bricks.splice(bricks.indexOf(target), 1);
    retiredCount.value += 1;
    resettleAll();
    if (reducedMotion.value) {
        renderFrame(performance.now());
    }
};

const onKey = (event: KeyboardEvent): void => {
    const index = ['1', '2', '3'].indexOf(event.key);
    if (index >= 0) {
        selectedPart.value = index;
    }
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
    view = {cx: cssWidth / 2, baseY: CANVAS_HEIGHT - 36, scale: Math.min(4.6, Math.max(3.4, cssWidth / 230))};
    columns = Math.min(26, Math.floor((cssWidth / view.scale - 12) / UNIT.pitch));
    bricks = bricks.filter((brick) => brick.col + brick.span <= columns);
    publishState();
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
    window.addEventListener('keydown', onKey);
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
    window.removeEventListener('keydown', onKey);
    observer?.disconnect();
    observer = null;
    motionQuery?.removeEventListener('change', onMotionChange);
    motionQuery = null;
    context = null;
});
</script>

<template>
    <div>
        <div ref="host" border="3 black" bg="white" overflow="hidden" cursor="crosshair" select="none">
            <canvas
                ref="canvas"
                block
                role="img"
                aria-label="Free-build drafting table: aim with the pointer, click to drop bricks, right-click to pull a brick out, keys 1 to 3 pick a part"
                @pointermove="onPointerMove"
                @pointerleave="onPointerLeave"
                @click="onCanvasClick"
                @contextmenu.prevent="onRightClick"
            />
        </div>
        <div flex="~ wrap" items="center" gap="3" m="t-4">
            <div flex="~" gap="2" role="group" aria-label="Parts bin">
                <button
                    v-for="(part, index) in PARTS"
                    :key="part.label"
                    type="button"
                    p="x-3 y-2"
                    font="bold"
                    text="sm black"
                    uppercase
                    tracking="wide"
                    cursor="pointer"
                    class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                    :class="selectedPart === index ? 'bg-brick-yellow' : 'bg-white'"
                    :aria-pressed="selectedPart === index"
                    @click="selectedPart = index"
                >
                    <span flex="~ col" items="center" gap="1">
                        <span grid="~ flow-col rows-2" gap="0.5">
                            <i
                                v-for="dot in part.studs * 2"
                                :key="dot"
                                w="1.5"
                                h="1.5"
                                bg="black"
                                rounded="full"
                                block
                            />
                        </span>
                        {{ part.label }}
                    </span>
                </button>
            </div>
            <span font="mono" text="xs" p="x-2 y-1" bg="gray-100" flex="~" items="center" gap="2" class="brick-border">
                NEXT
                <span inline-block w="3.5" h="3.5" class="brick-border" :style="{backgroundColor: nextColor}" />
            </span>
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
                @click="resetSheet"
            >
                Clear sheet
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
