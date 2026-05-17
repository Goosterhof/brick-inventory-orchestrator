<script setup lang="ts">
import {computed} from 'vue';

/**
 * Pure-CSS 3D LEGO brick (6x2, fixed footprint).
 *
 * Technique: six faces positioned via `transform: rotateX/Y translateZ` inside a
 * `transform-style: preserve-3d` stage. Studs are rendered as short cylinders —
 * each stud composes a top disk (flat, translated up by the stud height) and a
 * curved-side shim rendered as a thin rectangle rotated and offset. Together
 * they read as a cylinder in perspective without needing WebGL.
 *
 * The hover tilt uses `transition` rather than `animation`, which means the
 * global `prefers-reduced-motion` override in accessibility.css neutralises it
 * automatically. No JS motion logic required.
 */

const {color = '#DC2626', shadow = true} = defineProps<{color?: string; shadow?: boolean}>();

// Fixed 6x2 footprint. All measurements in pixels.
const COLS = 6;
const ROWS = 2;
const CELL = 40;
const BODY_HEIGHT = 48;
const STUD_RADIUS = 12;
const STUD_HEIGHT = 10;

const bodyWidth = COLS * CELL; // 240
const bodyDepth = ROWS * CELL; // 80

const studs = computed(() => {
    const result: Array<{x: number; y: number}> = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            result.push({x: col * CELL + CELL / 2, y: row * CELL + CELL / 2});
        }
    }
    return result;
});

const ariaLabel = `${COLS} by ${ROWS} LEGO brick rendered as a CSS cuboid`;

// Face transforms. The brick sits centred on the stage with its bottom on the
// stage's y=0 plane; translateY(-BODY_HEIGHT) pulls the top face upward.
const topTransform = `translateZ(${bodyDepth / 2}px) rotateX(-90deg) translateZ(${BODY_HEIGHT}px)`;
const bottomTransform = `translateZ(${bodyDepth / 2}px) rotateX(90deg)`;
const frontTransform = `translateZ(${bodyDepth / 2}px)`;
const backTransform = `translateZ(-${bodyDepth / 2}px) rotateY(180deg)`;
const leftTransform = `rotateY(-90deg) translateZ(${bodyWidth / 2}px)`;
const rightTransform = `rotateY(90deg) translateZ(${bodyWidth / 2}px)`;
</script>

<template>
    <div
        class="brick3d-stage"
        :class="{'brick3d-shadow': shadow}"
        role="img"
        :aria-label="ariaLabel"
        data-brick-cuboid-css
    >
        <div class="brick3d-scene" data-scene>
            <!-- Body: six faces of the cuboid -->
            <div
                class="brick3d-face brick3d-face-top"
                data-face="top"
                :style="{
                    width: `${bodyWidth}px`,
                    height: `${bodyDepth}px`,
                    transform: topTransform,
                    backgroundColor: color,
                }"
            >
                <!-- Studs: each stud is a 3D cylinder (side + top disk) -->
                <div
                    v-for="(stud, index) in studs"
                    :key="index"
                    class="brick3d-stud"
                    data-stud
                    :style="{
                        left: `${stud.x - STUD_RADIUS}px`,
                        top: `${stud.y - STUD_RADIUS}px`,
                        width: `${STUD_RADIUS * 2}px`,
                        height: `${STUD_RADIUS * 2}px`,
                    }"
                >
                    <!-- Cylinder side: a thin disk extruded upward via transform -->
                    <span class="brick3d-stud-side" :style="{backgroundColor: color, height: `${STUD_HEIGHT}px`}" />
                    <!-- Cylinder top: the flat disk the player pinches -->
                    <span
                        class="brick3d-stud-top"
                        :style="{backgroundColor: color, transform: `translateZ(${STUD_HEIGHT}px)`}"
                    />
                </div>
            </div>
            <div
                class="brick3d-face brick3d-face-bottom"
                data-face="bottom"
                :style="{
                    width: `${bodyWidth}px`,
                    height: `${bodyDepth}px`,
                    transform: bottomTransform,
                    backgroundColor: color,
                }"
            />
            <div
                class="brick3d-face brick3d-face-front"
                data-face="front"
                :style="{
                    width: `${bodyWidth}px`,
                    height: `${BODY_HEIGHT}px`,
                    transform: frontTransform,
                    backgroundColor: color,
                }"
            />
            <div
                class="brick3d-face brick3d-face-back"
                data-face="back"
                :style="{
                    width: `${bodyWidth}px`,
                    height: `${BODY_HEIGHT}px`,
                    transform: backTransform,
                    backgroundColor: color,
                }"
            />
            <div
                class="brick3d-face brick3d-face-left"
                data-face="left"
                :style="{
                    width: `${bodyDepth}px`,
                    height: `${BODY_HEIGHT}px`,
                    transform: leftTransform,
                    backgroundColor: color,
                }"
            />
            <div
                class="brick3d-face brick3d-face-right"
                data-face="right"
                :style="{
                    width: `${bodyDepth}px`,
                    height: `${BODY_HEIGHT}px`,
                    transform: rightTransform,
                    backgroundColor: color,
                }"
            />
        </div>
    </div>
</template>

<style scoped>
.brick3d-stage {
    /* The stage owns the perspective. Sizing holds the scene + tilt headroom. */
    width: 320px;
    height: 220px;
    perspective: 900px;
    perspective-origin: 50% 30%;
    display: inline-block;
}

.brick3d-stage.brick3d-shadow {
    filter: drop-shadow(6px 8px 0 rgba(0, 0, 0, 0.9));
}

.brick3d-scene {
    position: relative;
    width: 240px;
    height: 80px;
    /* Centre the brick inside the stage; tilt it forward so the top is visible. */
    margin: 90px auto 0;
    transform-style: preserve-3d;
    transform: rotateX(-20deg) rotateY(-28deg);
    transition: transform 350ms cubic-bezier(0.2, 0, 0, 1);
}

.brick3d-stage:hover .brick3d-scene {
    transform: rotateX(-24deg) rotateY(-22deg);
}

.brick3d-face {
    position: absolute;
    top: 0;
    left: 0;
    border: 3px solid #000000;
    box-sizing: border-box;
    background-clip: padding-box;
}

.brick3d-face-top {
    /* Slight highlight so the lit face reads brighter than the side faces. */
    background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
}

.brick3d-face-front,
.brick3d-face-back {
    background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.18));
}

.brick3d-face-left,
.brick3d-face-right {
    background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.3));
}

.brick3d-face-bottom {
    background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.35));
}

.brick3d-stud {
    position: absolute;
    transform-style: preserve-3d;
}

.brick3d-stud-side {
    /* Approximates the cylinder's visible side band — a ring that reads as a
       short extrusion between the top face and the stud's top disk. */
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    border-radius: 50%;
    border: 3px solid #000000;
    box-sizing: border-box;
    background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.15));
    transform-origin: center bottom;
}

.brick3d-stud-top {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid #000000;
    box-sizing: border-box;
    background-image: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.55), rgba(0, 0, 0, 0.1));
}
</style>
