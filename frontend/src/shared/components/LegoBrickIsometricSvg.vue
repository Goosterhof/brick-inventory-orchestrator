<script setup lang="ts">
import {computed, useId} from 'vue';

/**
 * SVG isometric 3D LEGO brick (6x2, fixed footprint).
 *
 * Technique: standard 30° isometric projection. Each 3D world point (x, y, z)
 * is projected to screen space with:
 *   screenX = (x - y) * cos(30°)
 *   screenY = (x + y) * sin(30°) - z
 * This produces the familiar "two receding axes at 30° above horizontal, one
 * vertical axis" view. All three visible faces (top, front, right) are drawn
 * as parallelograms using this projection — no transform gymnastics, just
 * straight path coordinates.
 *
 * Studs: a cylinder in isometric view reads as an ellipse with the horizontal
 * radius = STUD_RADIUS * cos(30°) and the vertical radius = STUD_RADIUS * sin(30°).
 * Each stud gets two ellipses (top disk + base disk) plus side bands connecting
 * them, forming a proper cylinder silhouette.
 */

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

// 6x2 fixed footprint. World-space units before projection.
const COLS = 6;
const ROWS = 2;
const CELL = 40;
const BODY_HEIGHT = 48;
const STUD_RADIUS = 12;
const STUD_HEIGHT = 10;
const STROKE = 3;
const SHADOW_OFFSET = 6;

// 30° isometric projection constants. Pre-computed for clarity.
const COS30 = Math.cos(Math.PI / 6); // ~0.866
const SIN30 = Math.sin(Math.PI / 6); // 0.5

const bodyWidth = COLS * CELL; // 240 world-x
const bodyDepth = ROWS * CELL; // 80 world-y

/**
 * Project a world-space point (x, y, z) to screen space.
 * The z-axis points up, so world z = BODY_HEIGHT is the top of the brick.
 */
const project = (x: number, y: number, z: number): {sx: number; sy: number} => ({
    sx: (x - y) * COS30,
    sy: (x + y) * SIN30 - z,
});

// The projected bounding box so we can anchor everything in positive viewBox space.
const projectedExtents = computed(() => {
    const corners = [
        project(0, 0, 0),
        project(bodyWidth, 0, 0),
        project(0, bodyDepth, 0),
        project(bodyWidth, bodyDepth, 0),
        project(0, 0, BODY_HEIGHT),
        project(bodyWidth, 0, BODY_HEIGHT),
        project(0, bodyDepth, BODY_HEIGHT),
        project(bodyWidth, bodyDepth, BODY_HEIGHT),
    ];
    const xs = corners.map((c) => c.sx);
    const ys = corners.map((c) => c.sy);
    return {minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys)};
});

// Studs sit above the brick top. Their topmost screen-y is minY (the top brick
// corners) minus one more STUD_HEIGHT — since stud tops are STUD_HEIGHT above
// the top face in world-z, which maps to −STUD_HEIGHT in screen-y.
// Former formula −BODY_HEIGHT −STUD_HEIGHT + minY double-counted BODY_HEIGHT
// (minY already reflects the top face at z=BODY_HEIGHT), producing a viewBox
// ~48 px taller than needed.
const studExtentTop = computed(() => projectedExtents.value.minY - STUD_HEIGHT);

const viewBox = computed(() => {
    const {minX, maxX, maxY} = projectedExtents.value;
    // Reserve stud height above, shadow offset below-right.
    const pad = STROKE + STUD_HEIGHT;
    const x = minX - pad;
    const y = studExtentTop.value - pad;
    const width = maxX - minX + pad * 2 + SHADOW_OFFSET;
    const height = maxY - y + pad + SHADOW_OFFSET;
    return `${x} ${y} ${width} ${height}`;
});

// Helper to format a projected point into an SVG path-compatible "x,y" string.
const pt = (x: number, y: number, z: number): string => {
    const {sx, sy} = project(x, y, z);
    return `${sx},${sy}`;
};

// Face paths (counter-clockwise in screen space so fill-rule doesn't bite us).
const topFace = computed(
    () =>
        `M ${pt(0, 0, BODY_HEIGHT)} L ${pt(bodyWidth, 0, BODY_HEIGHT)} ` +
        `L ${pt(bodyWidth, bodyDepth, BODY_HEIGHT)} L ${pt(0, bodyDepth, BODY_HEIGHT)} Z`,
);

const frontFace = computed(
    () =>
        `M ${pt(0, bodyDepth, BODY_HEIGHT)} L ${pt(bodyWidth, bodyDepth, BODY_HEIGHT)} ` +
        `L ${pt(bodyWidth, bodyDepth, 0)} L ${pt(0, bodyDepth, 0)} Z`,
);

const rightFace = computed(
    () =>
        `M ${pt(bodyWidth, 0, BODY_HEIGHT)} L ${pt(bodyWidth, bodyDepth, BODY_HEIGHT)} ` +
        `L ${pt(bodyWidth, bodyDepth, 0)} L ${pt(bodyWidth, 0, 0)} Z`,
);

// Shadow: project the footprint (z=0) and offset it down-right in screen space.
const shadowPath = computed(() => {
    const offsetX = SHADOW_OFFSET;
    const offsetY = SHADOW_OFFSET;
    const p = (x: number, y: number) => {
        const {sx, sy} = project(x, y, 0);
        return `${sx + offsetX},${sy + offsetY}`;
    };
    return `M ${p(0, 0)} L ${p(bodyWidth, 0)} L ${p(bodyWidth, bodyDepth)} L ${p(0, bodyDepth)} Z`;
});

/**
 * A stud in world space is a cylinder of radius STUD_RADIUS centred at (cx, cy)
 * with its base at z=BODY_HEIGHT and its top at z=BODY_HEIGHT+STUD_HEIGHT.
 * In isometric projection it becomes two ellipses (top + base) connected by a
 * side band. We draw base-ellipse first, then the side band, then top-ellipse
 * — back-to-front painter's order.
 */
const studs = computed(() => {
    const result: Array<{
        cx: number;
        cy: number;
        baseCenter: {sx: number; sy: number};
        topCenter: {sx: number; sy: number};
        sidePath: string;
    }> = [];

    // Ellipse radii in screen space.
    const rxEllipse = STUD_RADIUS * COS30;
    const ryEllipse = STUD_RADIUS * SIN30;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cx = col * CELL + CELL / 2;
            const cy = row * CELL + CELL / 2;
            const baseCenter = project(cx, cy, BODY_HEIGHT);
            const topCenter = project(cx, cy, BODY_HEIGHT + STUD_HEIGHT);

            // The visible side of the cylinder is the left and right extremes of
            // the ellipse — a rectangle-ish band joining base and top. We build
            // it as a closed path: down-right edge of top ellipse, down-right of
            // base ellipse (reversed), closed.
            const leftBaseX = baseCenter.sx - rxEllipse;
            const leftBaseY = baseCenter.sy;
            const rightBaseX = baseCenter.sx + rxEllipse;
            const rightBaseY = baseCenter.sy;
            const leftTopX = topCenter.sx - rxEllipse;
            const leftTopY = topCenter.sy;
            const rightTopX = topCenter.sx + rxEllipse;
            const rightTopY = topCenter.sy;

            // Path: start at left-top, arc along base to right-top, straight line
            // down from right-top to right-base (wait — back to front painter's).
            // Simpler: a rectangle using the two extreme ellipse points, then an
            // elliptical arc along the visible (front) half of the base ellipse.
            const sidePath =
                `M ${leftTopX},${leftTopY} ` +
                `L ${leftBaseX},${leftBaseY} ` +
                `A ${rxEllipse},${ryEllipse} 0 0 0 ${rightBaseX},${rightBaseY} ` +
                `L ${rightTopX},${rightTopY} ` +
                `A ${rxEllipse},${ryEllipse} 0 0 1 ${leftTopX},${leftTopY} Z`;

            result.push({cx, cy, baseCenter, topCenter, sidePath});
        }
    }
    return result;
});

const studRx = STUD_RADIUS * COS30;
const studRy = STUD_RADIUS * SIN30;

const topGradientId = useId();
const frontGradientId = useId();
const rightGradientId = useId();
const studTopGradientId = useId();

const ariaLabel = `${COLS} by ${ROWS} LEGO brick in SVG isometric projection`;
</script>

<template>
    <svg :viewBox="viewBox" role="img" :aria-label="ariaLabel" xmlns="http://www.w3.org/2000/svg" data-brick-iso-svg>
        <defs>
            <!-- Top face: brightest (lit from above). -->
            <linearGradient :id="topGradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="white" stop-opacity="0.35" />
                <stop offset="100%" stop-color="white" stop-opacity="0.1" />
            </linearGradient>
            <!-- Front (receding-left) face: mid tone. -->
            <linearGradient :id="frontGradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="black" stop-opacity="0.05" />
                <stop offset="100%" stop-color="black" stop-opacity="0.25" />
            </linearGradient>
            <!-- Right (receding-right) face: darkest so the geometry reads. -->
            <linearGradient :id="rightGradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="black" stop-opacity="0.15" />
                <stop offset="100%" stop-color="black" stop-opacity="0.4" />
            </linearGradient>
            <!-- Stud top: the off-centre highlight that sells the cylinder. -->
            <radialGradient :id="studTopGradientId" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stop-color="white" stop-opacity="0.6" />
                <stop offset="100%" stop-color="black" stop-opacity="0.15" />
            </radialGradient>
        </defs>

        <!-- Shadow: footprint projected down-right in screen space. -->
        <path v-if="shadow" :d="shadowPath" fill="black" data-shadow />

        <!-- Right face (draw before front so the front reads in front). -->
        <path :d="rightFace" :fill="color" stroke="black" :stroke-width="STROKE" data-face="right" />
        <path :d="rightFace" :fill="`url(#${rightGradientId})`" />

        <!-- Front face. -->
        <path :d="frontFace" :fill="color" stroke="black" :stroke-width="STROKE" data-face="front" />
        <path :d="frontFace" :fill="`url(#${frontGradientId})`" />

        <!-- Top face. -->
        <path :d="topFace" :fill="color" stroke="black" :stroke-width="STROKE" data-face="top" />
        <path :d="topFace" :fill="`url(#${topGradientId})`" />

        <!-- Studs: base-hidden; render the visible side band, then the top ellipse. -->
        <g v-for="(stud, index) in studs" :key="index" data-stud>
            <!-- Cylinder side band. -->
            <path :d="stud.sidePath" :fill="color" stroke="black" :stroke-width="STROKE" data-stud-side />
            <!-- Top disk. -->
            <ellipse
                :cx="stud.topCenter.sx"
                :cy="stud.topCenter.sy"
                :rx="studRx"
                :ry="studRy"
                :fill="color"
                stroke="black"
                :stroke-width="STROKE"
                data-stud-top
            />
            <ellipse
                :cx="stud.topCenter.sx"
                :cy="stud.topCenter.sy"
                :rx="studRx"
                :ry="studRy"
                :fill="`url(#${studTopGradientId})`"
            />
        </g>
    </svg>
</template>
