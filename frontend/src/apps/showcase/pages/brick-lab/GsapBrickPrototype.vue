<script setup lang="ts">
import {gsap} from 'gsap';
import {onMounted, onUnmounted, ref} from 'vue';

interface PhaseInfo {
    label: string;
    name: string;
    detail: string;
}

const phases: PhaseInfo[] = [
    {label: 'panels', name: '01 Shell glide', detail: '0.70s · power3.out'},
    {label: 'studs', name: '02 Stud rain', detail: '0.90s · bounce.out · stagger 60ms from center'},
    {label: 'clutch', name: '03 Clutch click', detail: '0.45s · back.out(2.5) / elastic.out(1, 0.4)'},
    {label: 'specs', name: '04 Spec stamp', detail: '0.80s · steps(24) · stagger 300ms'},
];

const stage = ref<HTMLElement | null>(null);
const progress = ref(0);
const phase = ref('');
const isPlaying = ref(false);
const reducedMotion = ref(false);

let ctx: gsap.Context | null = null;
let master: gsap.core.Timeline | null = null;
let idleTween: gsap.core.Tween | null = null;

const killIdle = (): void => {
    idleTween?.kill();
    idleTween = null;
};

const startIdle = (): void => {
    const brick = stage.value?.querySelector('.gsap-brick');
    if (reducedMotion.value || !brick) {
        return;
    }
    idleTween = gsap.to(brick, {y: -3, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1});
};

const setInitialState = (): void => {
    gsap.set('.gsap-brick', {transformOrigin: '50% 100%'});
    gsap.set('.gsap-spring', {transformOrigin: '50% 100%'});
    gsap.set('.gsap-baseplate', {opacity: 0, y: 16});
    gsap.set('.gsap-panel-left', {x: -190, opacity: 0});
    gsap.set('.gsap-panel-right', {x: 190, opacity: 0});
    gsap.set('.gsap-window', {opacity: 0});
    gsap.set('.gsap-stud', {y: -150, opacity: 0});
    gsap.set('.gsap-led', {backgroundColor: '#9CA3AF'});
    gsap.set('.gsap-engaged', {opacity: 0});
    gsap.set('.gsap-spec', {clipPath: 'inset(0 100% 0 0)'});
};

const addPanelsPhase = (tl: gsap.core.Timeline): void => {
    tl.addLabel('panels');
    tl.to('.gsap-baseplate', {opacity: 1, y: 0, duration: 0.4, ease: 'power2.out'});
    tl.to('.gsap-panel-left', {x: 0, opacity: 1, duration: 0.7, ease: 'power3.out'}, '<0.15');
    tl.to('.gsap-panel-right', {x: 0, opacity: 1, duration: 0.7, ease: 'power3.out'}, '<');
    tl.to('.gsap-window', {opacity: 1, duration: 0.3, ease: 'power1.out'}, '>-0.2');
};

const addStudsPhase = (tl: gsap.core.Timeline): void => {
    tl.addLabel('studs');
    tl.to('.gsap-stud', {y: 0, opacity: 1, duration: 0.9, ease: 'bounce.out', stagger: {each: 0.06, from: 'center'}});
};

const addClutchPhase = (tl: gsap.core.Timeline): void => {
    tl.addLabel('clutch');
    tl.to('.gsap-brick', {y: 5, scaleY: 0.95, duration: 0.12, ease: 'power2.in'});
    tl.to('.gsap-spring', {scaleY: 0.45, duration: 0.12, ease: 'power2.in'}, '<');
    tl.to('.gsap-brick', {y: 0, scaleY: 1, duration: 0.45, ease: 'back.out(2.5)'});
    tl.to('.gsap-spring', {scaleY: 1, duration: 0.45, ease: 'elastic.out(1, 0.4)'}, '<');
    tl.to('.gsap-led', {backgroundColor: '#237841', duration: 0.2, ease: 'none'}, '<0.1');
    tl.to('.gsap-engaged', {opacity: 1, duration: 0.25, ease: 'power1.out'}, '<');
};

const addSpecsPhase = (tl: gsap.core.Timeline): void => {
    tl.addLabel('specs');
    tl.to('.gsap-spec', {clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'steps(24)', stagger: 0.3});
};

const buildMaster = (): gsap.core.Timeline => {
    const tl = gsap.timeline({paused: true});
    tl.eventCallback('onUpdate', () => {
        progress.value = tl.progress();
        phase.value = tl.currentLabel();
    });
    tl.eventCallback('onComplete', () => {
        isPlaying.value = false;
        startIdle();
    });
    setInitialState();
    addPanelsPhase(tl);
    addStudsPhase(tl);
    addClutchPhase(tl);
    addSpecsPhase(tl);
    return tl;
};

const replay = (): void => {
    if (master === null) {
        return;
    }
    killIdle();
    if (reducedMotion.value) {
        master.progress(1).pause();
        return;
    }
    isPlaying.value = true;
    master.restart();
};

const togglePlay = (): void => {
    if (master === null || reducedMotion.value) {
        return;
    }
    if (isPlaying.value) {
        master.pause();
        isPlaying.value = false;
        return;
    }
    killIdle();
    if (master.progress() === 1) {
        master.restart();
    } else {
        master.play();
    }
    isPlaying.value = true;
};

const seekPhase = (label: string): void => {
    if (master === null) {
        return;
    }
    killIdle();
    if (reducedMotion.value) {
        master.pause(label);
        return;
    }
    isPlaying.value = true;
    master.play(label);
};

const scrub = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    killIdle();
    isPlaying.value = false;
    master?.pause().progress(Number(target.value) / 1000);
};

onMounted(() => {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctx = gsap.context(() => {
        master = buildMaster();
        if (reducedMotion.value) {
            master.progress(1).pause();
            return;
        }
        isPlaying.value = true;
        master.play();
    }, stage.value ?? undefined);
});

onUnmounted(() => {
    killIdle();
    master?.kill();
    master = null;
    ctx?.revert();
    ctx = null;
});
</script>

<template>
    <div>
        <div ref="stage" relative overflow="hidden" h="[400px]" bg="gray-50" border="3 black" class="brick-stud-grid">
            <!-- Spec labels — typewriter-stamped via clip-path steps() -->
            <div absolute left="4 md:6" top="4 md:6" font="mono" text="xs" flex="~ col" items="start" gap="2">
                <p class="gsap-spec" bg="white" border="2 black" p="x-2 y-1" font="bold">
                    PART 3001-X · 2×4 · THE BRICKWORKS
                </p>
                <p class="gsap-spec" bg="white" border="2 black" p="x-2 y-1">PITCH 8.0 MM · GRID-TRUE ±0.02</p>
                <p class="gsap-spec" bg="brick-yellow" border="2 black" p="x-2 y-1" font="bold">
                    CLUTCH-SPRING CORE · +38% GRIP
                </p>
            </div>

            <!-- Current timeline label -->
            <div absolute right="4 md:6" top="4 md:6" font="mono bold" text="xs white" bg="black" p="x-2 y-1">
                ▸ {{ phase === '' ? 'ready' : phase }}
            </div>

            <!-- The assembly -->
            <div absolute bottom="0" left="0" right="0" h="[320px]">
                <div
                    class="gsap-baseplate"
                    absolute
                    bottom="[34px]"
                    left="1/2"
                    m="l-[-180px]"
                    w="[360px]"
                    h="[18px]"
                    bg="baseplate-green"
                    border="3 black"
                />
                <div class="gsap-brick" absolute bottom="[52px]" left="1/2" m="l-[-140px]" w="[280px]">
                    <div flex justify="around" items="end" p="x-4" h="[24px]">
                        <div
                            v-for="stud in 4"
                            :key="stud"
                            class="gsap-stud"
                            w="[48px]"
                            h="[24px]"
                            bg="brick-yellow"
                            border="3 black b-0"
                            rounded="t-md"
                            flex
                            items="center"
                            justify="center"
                        >
                            <span text="[9px]" font="bold" tracking="wide">BW</span>
                        </div>
                    </div>
                    <div relative h="[96px]">
                        <div
                            class="gsap-panel-left"
                            absolute
                            inset-y="0"
                            left="0"
                            w="1/2"
                            bg="brick-yellow"
                            border="3 black"
                        />
                        <div
                            class="gsap-panel-right"
                            absolute
                            inset-y="0"
                            right="0"
                            w="1/2"
                            bg="brick-yellow"
                            border="3 black"
                        />
                        <!-- Cutaway window: the improved clutch-spring core -->
                        <div
                            class="gsap-window"
                            absolute
                            left="1/2"
                            top="1/2"
                            m="l-[-58px] t-[-36px]"
                            w="[116px]"
                            h="[72px]"
                            bg="black"
                            border="3 black"
                            flex="~ col"
                            items="center"
                            justify="end"
                            p="b-1"
                        >
                            <div
                                class="gsap-spring bg-[repeating-linear-gradient(180deg,#0055BF_0_5px,#7FB0E8_5px_9px)]"
                                w="[28px]"
                                h="[44px]"
                            />
                            <div flex items="center" gap="1" m="t-1">
                                <span
                                    class="gsap-led"
                                    inline-block
                                    w="[10px]"
                                    h="[10px]"
                                    rounded="full"
                                    border="2 white"
                                />
                                <span class="gsap-engaged" text="[8px] white" font="bold mono" tracking="wide"
                                    >ENGAGED</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Transport controls -->
        <div flex="~ wrap" items="center" gap="3" m="t-4">
            <button
                p="x-4 y-2"
                bg="black hover:brick-yellow"
                text="white hover:black"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="replay"
            >
                Replay
            </button>
            <button
                p="x-4 y-2"
                bg="white hover:brick-yellow"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                w="[100px]"
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                @click="togglePlay"
            >
                {{ isPlaying ? 'Pause' : 'Play' }}
            </button>
            <input
                type="range"
                min="0"
                max="1000"
                :value="Math.round(progress * 1000)"
                aria-label="Scrub the assembly timeline"
                flex="1"
                min-w="[160px]"
                accent="black"
                cursor="pointer"
                @input="scrub"
            />
            <span font="mono bold" text="sm" w="[48px]" text-right>{{ Math.round(progress * 100) }}%</span>
        </div>

        <!-- Phase chips: visible parameters, click to seek the labeled section -->
        <div flex="~ wrap" gap="2" m="t-3">
            <button
                v-for="entry in phases"
                :key="entry.label"
                p="x-3 y-2"
                border="2 black"
                text="left"
                cursor="pointer"
                :bg="phase === entry.label ? 'brick-yellow' : 'white hover:gray-100'"
                @click="seekPhase(entry.label)"
            >
                <span block font="bold" text="xs" uppercase tracking="wide">{{ entry.name }}</span>
                <span block font="mono" text="xs gray-600">{{ entry.detail }}</span>
            </button>
        </div>

        <p v-if="reducedMotion" m="t-3" font="mono" text="xs gray-600">
            prefers-reduced-motion detected — the timeline is pinned to its settled final frame. Scrubbing stays
            available; autoplay, replay and the idle loop are disabled.
        </p>
    </div>
</template>
