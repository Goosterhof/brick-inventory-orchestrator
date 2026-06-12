<script setup lang="ts">
import {computed, ref} from 'vue';

import type {StudPlacement} from './svgBlueprintGeometry';

import {
    anchorPoints,
    brickOutline,
    cylinderPath,
    dimensions,
    STUD,
    studPlacements,
    TUBE,
    tubePlacements,
} from './svgBlueprintGeometry';

/*
 * IMPORTANT — UnoCSS attributify hazard: presentation attributes like
 * `font-size="12"` or `opacity="0.85"` on SVG elements are picked up by the
 * attributify extractor and turned into CSS rules ([font-size~="12"] {font-size: 3rem})
 * that OVERRIDE the SVG attribute. All text styling lives in scoped classes below,
 * stroke/fill alpha is expressed via rgba() colors, and sheet-sized rects are paths.
 */

// Animation parameters — DRAW_MS and STAGGER_MS must match the scoped keyframe styles below.
const DRAW_MS = 1100;
const STAGGER_MS = 80;
const EXPLODE_CROWN = -0.62; // px of crown lift per explode %
const EXPLODE_TUBES = 0.5; // px of tube drop per explode %
const ORIGIN_X = 290; // viewBox x of the brick footprint centre
const ORIGIN_Y = 428; // viewBox y of the brick front-bottom corner
const NOTE_COLUMN_X = 310; // local x of the right-hand annotation column

const faces = brickOutline();
const studs = studPlacements();
const tubes = tubePlacements();
const dims = dimensions();
const anchors = anchorPoints();
const studSidePath = cylinderPath(STUD.rx, STUD.ry, STUD.height);
const tubeSidePath = cylinderPath(TUBE.rx, TUBE.ry, TUBE.height);
const brickTransform = `translate(${ORIGIN_X}, ${ORIGIN_Y})`;

interface MarginNote {
    title: string;
    detail: string;
    y: number;
}

const marginNotes: MarginNote[] = [
    {title: 'ALIGNMENT CHAMFER 0.3 MM', detail: 'SELF-SEATING — BLIND PLACEMENT OK', y: -278},
    {title: 'CLUTCH CHANNELS ×4', detail: '+12% GRIP · −18% PULL-APART FORCE', y: -203},
    {title: 'VENTED CORE TUBES ×3', detail: 'PRESSURE RELIEF · NO AIR-LOCK', y: -128},
];

const explode = ref(0);
const hovered = ref<StudPlacement | null>(null);
const drawKey = ref(0);

const crownOffset = computed((): number => Math.round(explode.value * EXPLODE_CROWN));
const tubeOffset = computed((): number => Math.round(explode.value * EXPLODE_TUBES));
const crownStyle = computed(() => ({transform: `translateY(${crownOffset.value}px)`}));
const tubeStyle = computed(() => ({transform: `translateY(${tubeOffset.value}px)`}));

const delayStyle = (step: number): {animationDelay: string} => ({animationDelay: `${Math.round(step * STAGGER_MS)}ms`});

const replayDraw = (): void => {
    drawKey.value += 1;
};

const leaderTo = (from: {x: number; y: number}, entryY: number): string =>
    `M ${from.x} ${from.y} L ${NOTE_COLUMN_X - 14} ${entryY} L ${NOTE_COLUMN_X - 4} ${entryY}`;

/** Margin annotations stay put; their leader lines stretch as the exploded view moves. */
const annotationLeads = computed(() => {
    const anchorList = [
        {x: anchors.stud.x, y: anchors.stud.y + crownOffset.value},
        anchors.groove,
        {x: anchors.tube.x, y: anchors.tube.y + tubeOffset.value},
    ];
    return marginNotes.map((note, index) => {
        const anchor = anchorList[index] ?? anchors.groove;
        return {...note, dotX: anchor.x, dotY: anchor.y, d: leaderTo(anchor, note.y)};
    });
});

const callout = computed(() => {
    if (!hovered.value) {
        return null;
    }
    const direction = hovered.value.x >= 35 ? -1 : 1;
    const tipX = hovered.value.x;
    const tipY = hovered.value.y - STUD.height - 6;
    const lift = Math.min(40, ORIGIN_Y + tipY + crownOffset.value - 26);
    return {
        d: `M ${tipX} ${tipY} L ${tipX + direction * 28} ${tipY - lift} L ${tipX + direction * 40} ${tipY - lift}`,
        dotX: tipX,
        dotY: tipY,
        textX: tipX + direction * 46,
        textY: tipY - lift + 4,
        anchor: direction > 0 ? 'start' : 'end',
        text: `STUD ${hovered.value.id} · ø 4.9 MM · CHAMFER 0.3 MM`,
    };
});

const parameterChips = computed((): string[] => [
    `DRAW-IN ${DRAW_MS} MS · STAGGER ${STAGGER_MS} MS`,
    'EASE CUBIC-BEZIER(0.4, 0, 0.2, 1)',
    `EXPLODE ${explode.value}% · CROWN ${crownOffset.value} PX · TUBES +${tubeOffset.value} PX`,
    'HOVER A STUD FOR SPECS',
]);
</script>

<template>
    <div>
        <svg
            :key="drawKey"
            viewBox="0 0 980 520"
            w="full"
            block
            border="3 black"
            role="img"
            aria-label="Engineering blueprint of the improved brick BW-3001X with exploded view, dimension lines, and hoverable stud annotations"
        >
            <defs>
                <radialGradient id="bpx-bg" cx="50%" cy="35%" r="80%">
                    <stop offset="0%" stop-color="#0B4DAD" />
                    <stop offset="100%" stop-color="#062F73" />
                </radialGradient>
                <pattern id="bpx-grid-16" width="16" height="16" patternUnits="userSpaceOnUse">
                    <path d="M 16 0 L 0 0 L 0 16" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                </pattern>
                <pattern id="bpx-grid-80" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 L 0 80" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
                </pattern>
                <marker
                    id="bpx-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FFFFFF" />
                </marker>
                <filter id="bpx-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <g id="bpx-stud">
                    <path
                        :d="studSidePath"
                        pathLength="1"
                        class="bp-draw"
                        fill="rgba(255,255,255,0.06)"
                        stroke="#FFFFFF"
                        stroke-width="2"
                    />
                    <ellipse
                        cx="0"
                        :cy="-STUD.height"
                        :rx="STUD.rx"
                        :ry="STUD.ry"
                        pathLength="1"
                        class="bp-draw"
                        fill="rgba(255,255,255,0.10)"
                        stroke="#FFFFFF"
                        stroke-width="2"
                    />
                    <ellipse
                        cx="0"
                        :cy="-STUD.height"
                        :rx="STUD.rx * 0.68"
                        :ry="STUD.ry * 0.68"
                        pathLength="1"
                        class="bp-draw"
                        fill="none"
                        stroke="#F5C518"
                        stroke-width="1.5"
                    />
                </g>
                <g id="bpx-tube">
                    <path
                        :d="tubeSidePath"
                        pathLength="1"
                        class="bp-draw"
                        fill="rgba(255,255,255,0.04)"
                        stroke="rgba(255,255,255,0.85)"
                        stroke-width="1.5"
                    />
                    <ellipse
                        cx="0"
                        :cy="-TUBE.height"
                        :rx="TUBE.rx"
                        :ry="TUBE.ry"
                        pathLength="1"
                        class="bp-draw"
                        fill="none"
                        stroke="rgba(255,255,255,0.85)"
                        stroke-width="1.5"
                    />
                    <ellipse
                        cx="0"
                        :cy="-TUBE.height"
                        :rx="TUBE.rx * 0.55"
                        :ry="TUBE.ry * 0.55"
                        pathLength="1"
                        class="bp-draw"
                        fill="none"
                        stroke="#F5C518"
                        stroke-width="1.2"
                    />
                </g>
            </defs>

            <path d="M 0 0 H 980 V 520 H 0 Z" fill="url(#bpx-bg)" />
            <path d="M 0 0 H 980 V 520 H 0 Z" fill="url(#bpx-grid-16)" />
            <path d="M 0 0 H 980 V 520 H 0 Z" fill="url(#bpx-grid-80)" />
            <path
                d="M 8 8 H 972 V 512 H 8 Z"
                pathLength="1"
                class="bp-draw"
                :style="delayStyle(0)"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                stroke-width="2"
            />

            <g :transform="brickTransform">
                <!-- Vented core tubes — drop out of the shell in the exploded view -->
                <g :style="tubeStyle">
                    <g
                        v-for="(tube, index) in tubes"
                        :key="tube.x"
                        class="bp-fade"
                        :style="delayStyle(6.5 + index * 0.5)"
                    >
                        <use href="#bpx-tube" :x="tube.x" :y="tube.y" />
                    </g>
                </g>

                <!-- Shell — translucent cutaway faces, clutch grooves, chamfer skirt, dimensions -->
                <g>
                    <g class="bp-fade" :style="delayStyle(3)">
                        <path :d="faces.top" fill="rgba(255,255,255,0.10)" />
                        <path :d="faces.front" fill="rgba(255,255,255,0.05)" />
                        <path :d="faces.right" fill="rgba(255,255,255,0.03)" />
                    </g>
                    <path
                        :d="faces.top"
                        class="bp-draw"
                        pathLength="1"
                        :style="delayStyle(1)"
                        fill="none"
                        stroke="#FFFFFF"
                        stroke-width="2"
                    />
                    <path
                        :d="faces.front"
                        class="bp-draw"
                        pathLength="1"
                        :style="delayStyle(1.6)"
                        fill="none"
                        stroke="#FFFFFF"
                        stroke-width="2"
                    />
                    <path
                        :d="faces.right"
                        class="bp-draw"
                        pathLength="1"
                        :style="delayStyle(2.2)"
                        fill="none"
                        stroke="#FFFFFF"
                        stroke-width="2"
                    />
                    <path
                        v-for="groove in faces.grooves"
                        :key="groove"
                        :d="groove"
                        class="bp-draw"
                        pathLength="1"
                        :style="delayStyle(4)"
                        fill="none"
                        stroke="#F5C518"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                    <path
                        :d="faces.chamfer"
                        class="bp-draw"
                        pathLength="1"
                        :style="delayStyle(4.6)"
                        fill="none"
                        stroke="rgba(245,197,24,0.9)"
                        stroke-width="1.5"
                    />
                    <g v-for="(dim, index) in dims" :key="dim.label" class="bp-fade" :style="delayStyle(8 + index)">
                        <path :d="dim.extensions" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
                        <path
                            :d="dim.line"
                            fill="none"
                            stroke="#FFFFFF"
                            stroke-width="1.5"
                            marker-start="url(#bpx-arrow)"
                            marker-end="url(#bpx-arrow)"
                        />
                        <text :x="dim.labelX" :y="dim.labelY" class="bp-dim-label" fill="#FFFFFF" text-anchor="middle">
                            {{ dim.label }}
                        </text>
                    </g>
                </g>

                <!-- Stud crown — lifts off in the exploded view, studs are hoverable -->
                <g :style="crownStyle">
                    <g
                        v-for="(stud, index) in studs"
                        :key="stud.id"
                        class="bp-fade"
                        cursor="pointer"
                        :style="delayStyle(5 + index * 0.4)"
                        tabindex="0"
                        :aria-label="`Stud ${stud.id} — diameter 4.9 millimetres, chamfered rim`"
                        @mouseenter="hovered = stud"
                        @mouseleave="hovered = null"
                        @focus="hovered = stud"
                        @blur="hovered = null"
                    >
                        <use href="#bpx-stud" :x="stud.x" :y="stud.y" />
                        <ellipse
                            v-if="hovered?.id === stud.id"
                            :cx="stud.x"
                            :cy="stud.y - STUD.height"
                            :rx="STUD.rx"
                            :ry="STUD.ry"
                            fill="rgba(245,197,24,0.85)"
                            filter="url(#bpx-glow)"
                            pointer-events="none"
                        />
                        <ellipse
                            :cx="stud.x"
                            :cy="stud.y - STUD.height"
                            :rx="STUD.rx + 5"
                            :ry="STUD.ry + 5"
                            fill="transparent"
                        />
                    </g>
                    <g v-if="callout" pointer-events="none">
                        <circle :cx="callout.dotX" :cy="callout.dotY" r="3" fill="#F5C518" />
                        <path :d="callout.d" fill="none" stroke="#F5C518" stroke-width="1.5" />
                        <text
                            :x="callout.textX"
                            :y="callout.textY"
                            :text-anchor="callout.anchor"
                            class="bp-callout-text"
                            fill="#F5C518"
                            stroke="#06337A"
                            stroke-width="4"
                            paint-order="stroke"
                        >
                            {{ callout.text }}
                        </text>
                    </g>
                </g>

                <!-- Improvement annotations — fixed margin column, leaders track the exploded parts -->
                <g pointer-events="none">
                    <g
                        v-for="(lead, index) in annotationLeads"
                        :key="lead.title"
                        class="bp-fade"
                        :style="delayStyle(11 + index)"
                    >
                        <circle :cx="lead.dotX" :cy="lead.dotY" r="3.5" fill="#F5C518" />
                        <path :d="lead.d" fill="none" stroke="#F5C518" stroke-width="1.5" />
                        <text :x="NOTE_COLUMN_X + 2" :y="lead.y" fill="#F5C518">
                            <tspan class="bp-note-title">{{ lead.title }}</tspan>
                            <tspan class="bp-note-detail" :x="NOTE_COLUMN_X + 2" dy="14" fill="rgba(245,197,24,0.8)">
                                {{ lead.detail }}
                            </tspan>
                        </text>
                    </g>
                </g>
            </g>

            <!-- Title block, compact at bottom-right inside the sheet frame -->
            <g class="bp-fade" :style="delayStyle(13.5)">
                <path
                    d="M 700 426 H 966 V 506 H 700 Z"
                    fill="rgba(255,255,255,0.05)"
                    stroke="#FFFFFF"
                    stroke-width="2"
                />
                <line x1="700" y1="452" x2="966" y2="452" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
                <text x="712" y="446" class="bp-tb-title" fill="#FFFFFF">THE BRICKWORKS — R&amp;D DIVISION</text>
                <text x="712" y="468" class="bp-tb-row" fill="rgba(255,255,255,0.85)">
                    PART BW-3001X · IMPROVED BRICK 2×4
                </text>
                <text x="712" y="481" class="bp-tb-row" fill="rgba(255,255,255,0.85)">
                    SCALE 10 PX/MM · SHEET 2/6 · 2026-06-12
                </text>
                <text x="712" y="494" class="bp-tb-row" fill="rgba(255,255,255,0.85)">
                    DRAWN: PATTERN MASTER · STATUS: PROTOTYPE
                </text>
            </g>
        </svg>

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
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="replayDraw"
            >
                Replay draw-in
            </button>
            <label flex="~" items="center" gap="2" font="bold" text="sm" uppercase tracking="wide">
                Exploded view
                <input
                    v-model.number="explode"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    w="40"
                    class="accent-[#0055BF]"
                    aria-label="Exploded view amount"
                />
            </label>
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
        </div>
    </div>
</template>

<style scoped>
/*
 * Genuinely needed: dash-offset draw-in keyframes and staggered fades cannot be
 * expressed as UnoCSS utilities, and SVG text styling must live in CSS classes
 * because font-size/opacity presentation attributes collide with the UnoCSS
 * attributify extractor (which generates overriding [font-size~="..."] rules).
 * Reduced-motion users get the fully drawn sheet immediately; the exploded-view
 * slider is direct-drive (no transition), so it needs no reduced-motion handling.
 */
.bp-draw {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: bp-draw-in 1100ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.bp-fade {
    opacity: 0;
    animation: bp-fade-in 700ms ease-out forwards;
}

.bp-dim-label {
    font:
        700 13px ui-monospace,
        Menlo,
        monospace;
}

.bp-note-title {
    font:
        700 11.5px ui-monospace,
        Menlo,
        monospace;
    letter-spacing: 0.5px;
}

.bp-note-detail {
    font:
        400 10px ui-monospace,
        Menlo,
        monospace;
    letter-spacing: 0.5px;
}

.bp-callout-text {
    font:
        700 11px ui-monospace,
        Menlo,
        monospace;
    letter-spacing: 0.5px;
}

.bp-tb-title {
    font:
        700 12px 'Space Grotesk',
        sans-serif;
    letter-spacing: 0.5px;
}

.bp-tb-row {
    font:
        400 8.5px ui-monospace,
        Menlo,
        monospace;
}

@keyframes bp-draw-in {
    to {
        stroke-dashoffset: 0;
    }
}

@keyframes bp-fade-in {
    to {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .bp-draw {
        animation: none;
        stroke-dashoffset: 0;
    }

    .bp-fade {
        animation: none;
        opacity: 1;
    }
}
</style>
