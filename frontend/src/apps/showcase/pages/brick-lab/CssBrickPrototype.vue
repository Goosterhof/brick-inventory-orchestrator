<script setup lang="ts">
import {ref} from 'vue';

interface StudSpot {
    id: number;
    x: number;
    z: number;
}

const STUD_XS = [-75, -25, 25, 75];
const STUD_ZS = [-25, 25];
const TUBE_XS = [-50, 0, 50];

const studs: StudSpot[] = STUD_ZS.flatMap((z, row) => STUD_XS.map((x, col) => ({id: row * 4 + col, x, z})));

const stage = ref<HTMLElement | null>(null);
const exploded = ref(false);
const paused = ref(false);

const studStyle = (spot: StudSpot): {transform: string} => ({transform: `translate3d(${spot.x}px, 0px, ${spot.z}px)`});

const tubeStyle = (x: number): {transform: string} => ({transform: `translate3d(${x}px, 0px, 0px)`});

const studDiscStyle = (disc: number): {transform: string} => ({
    transform: `rotateX(90deg) translateZ(${28 + disc * 2}px)`,
});

const tubeDiscStyle = (disc: number): {transform: string} => ({
    transform: `rotateX(90deg) translateZ(${disc * 6.5 - 32.5}px)`,
});

const onPointerMove = (event: PointerEvent): void => {
    const el = stage.value;
    if (el === null) {
        return;
    }
    const rect = el.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-y', `${(nx * 24).toFixed(2)}deg`);
    el.style.setProperty('--tilt-x', `${(-18 - ny * 16).toFixed(2)}deg`);
};

const onPointerLeave = (): void => {
    stage.value?.style.setProperty('--tilt-y', '0deg');
    stage.value?.style.setProperty('--tilt-x', '-18deg');
};
</script>

<template>
    <div>
        <div
            ref="stage"
            relative
            overflow="hidden"
            h="[420px]"
            bg="gray-50"
            border="3 black"
            cursor="crosshair"
            class="brick-stud-grid"
            :class="{exploded, paused}"
            @pointermove="onPointerMove"
            @pointerleave="onPointerLeave"
        >
            <div class="scene">
                <div class="tilt">
                    <div class="turntable">
                        <div class="brick3d">
                            <div class="ground-shadow" />

                            <div class="face face-front" flex items="center" justify="center">
                                <span font="heading bold" text="xs" tracking="widest">THE BRICKWORKS · 3001-X</span>
                            </div>
                            <div class="face face-back" flex items="center" justify="center">
                                <span font="heading bold" text="xs" tracking="widest">TWIN-WALL SHELL</span>
                            </div>
                            <div class="face face-left" />
                            <div class="face face-right" />
                            <div class="face face-bottom" />

                            <!-- The improvement: tri-tube clutch core, revealed on explode -->
                            <div v-for="tube in TUBE_XS" :key="tube" class="tube" :style="tubeStyle(tube)">
                                <div v-for="disc in 9" :key="disc" class="tube-disc" :style="tubeDiscStyle(disc)" />
                                <div class="tube-disc tube-cap" />
                            </div>

                            <div class="top-plate">
                                <div class="face face-top" />
                                <div v-for="stud in studs" :key="stud.id" class="stud" :style="studStyle(stud)">
                                    <div v-for="disc in 8" :key="disc" class="stud-disc" :style="studDiscStyle(disc)" />
                                    <div class="stud-disc stud-cap" flex items="center" justify="center">
                                        <span text="[8px]" font="bold">BW</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Exploded-view callouts (2D overlay, pure class-swap fade) -->
            <p
                class="callout"
                absolute
                left="4"
                top="4"
                bg="white"
                border="2 black"
                p="x-2 y-1"
                font="mono bold"
                text="xs"
            >
                GRID-TRUE STUD CAPS<br />
                <span font="normal" text="gray-600">9 stacked discs each — no canvas</span>
            </p>
            <p
                class="callout"
                absolute
                right="4"
                top="1/2"
                bg="white"
                border="2 black"
                p="x-2 y-1"
                font="mono bold"
                text="xs"
            >
                TRI-TUBE CLUTCH CORE<br />
                <span font="normal" text="gray-600">+38% grip · zero stress-whitening</span>
            </p>
            <p
                class="callout"
                absolute
                left="4"
                bottom="4"
                bg="white"
                border="2 black"
                p="x-2 y-1"
                font="mono bold"
                text="xs"
            >
                TWIN-WALL SHELL<br />
                <span font="normal" text="gray-600">faces part along their normals</span>
            </p>
        </div>

        <!-- Controls -->
        <div flex="~ wrap" items="center" gap="3" m="t-4">
            <button
                p="x-4 y-2"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                :bg="exploded ? 'brick-yellow' : 'black hover:brick-yellow'"
                :text="exploded ? 'black' : 'white hover:black'"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="exploded = !exploded"
            >
                {{ exploded ? 'Assemble' : 'Explode view' }}
            </button>
            <button
                p="x-4 y-2"
                bg="white hover:brick-yellow"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="paused = !paused"
            >
                {{ paused ? 'Resume turntable' : 'Pause turntable' }}
            </button>
            <span font="mono" text="xs gray-600"
                >hover the stage to tilt — pointer drives custom properties, not a render loop</span
            >
        </div>

        <!-- Visible parameters -->
        <div flex="~ wrap" gap="2" m="t-3" font="mono" text="xs">
            <span border="2 black" bg="white" p="x-2 y-1">turntable · rotateY 360° · 14s linear · compositor-only</span>
            <span border="2 black" bg="white" p="x-2 y-1"
                >tilt · pointer → --tilt-x / --tilt-y · ±12° / ±8° · 250ms ease-out</span
            >
            <span border="2 black" bg="white" p="x-2 y-1"
                >explode · class swap · 600ms cubic-bezier(0.34, 1.56, 0.64, 1) · 60ms stagger</span
            >
            <span border="2 black" bg="white" p="x-2 y-1"
                >geometry · 6 faces + 8 studs × 9 discs + 3 tubes × 10 discs · zero JS frames</span
            >
        </div>
    </div>
</template>

<style scoped>
.scene {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1100px;
}

.tilt {
    transform-style: preserve-3d;
    transform: rotateX(var(--tilt-x, -18deg)) rotateY(var(--tilt-y, 0deg));
    transition: transform 250ms ease-out;
}

.turntable {
    transform-style: preserve-3d;
    animation: brick-spin 14s linear infinite;
    will-change: transform;
}

.paused .turntable {
    animation-play-state: paused;
}

@keyframes brick-spin {
    from {
        transform: rotateY(0deg);
    }
    to {
        transform: rotateY(360deg);
    }
}

.brick3d {
    position: relative;
    width: 200px;
    height: 60px;
    transform-style: preserve-3d;
}

.face {
    position: absolute;
    left: 50%;
    top: 50%;
    border: 3px solid #000;
    backface-visibility: hidden;
    transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 60ms;
}

.face-front {
    width: 200px;
    height: 60px;
    background: #f5c518;
    transform: translate(-50%, -50%) rotateY(0deg) translateZ(50px);
}

.face-back {
    width: 200px;
    height: 60px;
    background: #f5c518;
    transform: translate(-50%, -50%) rotateY(180deg) translateZ(50px);
}

.face-right {
    width: 100px;
    height: 60px;
    background: #dda90e;
    transform: translate(-50%, -50%) rotateY(90deg) translateZ(100px);
}

.face-left {
    width: 100px;
    height: 60px;
    background: #dda90e;
    transform: translate(-50%, -50%) rotateY(-90deg) translateZ(100px);
}

.face-top {
    width: 200px;
    height: 100px;
    background: #f8d24a;
    transform: translate(-50%, -50%) rotateX(90deg) translateZ(30px);
}

.face-bottom {
    width: 200px;
    height: 100px;
    background: #b8890b;
    transform: translate(-50%, -50%) rotateX(-90deg) translateZ(30px);
    transition-delay: 140ms;
}

.top-plate {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.exploded .top-plate {
    transform: translateY(-95px);
}

.exploded .face-front {
    transform: translate(-50%, -50%) rotateY(0deg) translateZ(130px);
}

.exploded .face-back {
    transform: translate(-50%, -50%) rotateY(180deg) translateZ(130px);
}

.exploded .face-right {
    transform: translate(-50%, -50%) rotateY(90deg) translateZ(180px);
}

.exploded .face-left {
    transform: translate(-50%, -50%) rotateY(-90deg) translateZ(180px);
}

.exploded .face-bottom {
    transform: translate(-50%, -50%) rotateX(-90deg) translateZ(95px);
}

.stud {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-style: preserve-3d;
}

.stud-disc {
    position: absolute;
    left: -16px;
    top: -16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ce9e0c;
}

.stud-cap {
    background: #f8d24a;
    border: 2px solid #000;
    transform: rotateX(90deg) translateZ(46px);
}

.tube {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-style: preserve-3d;
}

.tube-disc {
    position: absolute;
    left: -14px;
    top: -14px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0055bf;
}

.tube-cap {
    background: #7fb0e8;
    border: 2px solid #000;
    transform: rotateX(90deg) translateZ(28px);
}

.ground-shadow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 240px;
    height: 130px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(0, 0, 0, 0.35), transparent 70%);
    transform: translate(-50%, -50%) rotateX(90deg) translateZ(-48px);
    transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 60ms;
}

.exploded .ground-shadow {
    transform: translate(-50%, -50%) rotateX(90deg) translateZ(-95px) scale(1.25);
}

.callout {
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease;
}

.exploded .callout {
    opacity: 1;
    transition: opacity 300ms ease 350ms;
}

@media (prefers-reduced-motion: reduce) {
    .turntable {
        animation: none;
        transform: rotateY(-30deg);
    }
}
</style>
