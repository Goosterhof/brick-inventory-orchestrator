import type {StorageService} from '@script-development/fs-storage';
import type {ComputedRef} from 'vue';

import {computed, ref} from 'vue';

/** @public */
export type SoundType = 'snap' | 'pull' | 'cascade' | 'thud';

export interface SoundService {
    isEnabled: ComputedRef<boolean>;
    toggle: () => void;
    play: (sound: SoundType) => void;
}

const STORAGE_KEY = 'sound-enabled';
const VOLUME = 0.3;

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const createNoiseBuffer = (context: AudioContext, duration: number): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const bufferSize = Math.ceil(sampleRate * duration);
    const buffer = context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

type SoundSynthesizer = (context: AudioContext) => void;

const synthesizeSnap: SoundSynthesizer = (context) => {
    const buffer = createNoiseBuffer(context, 0.06);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(VOLUME, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.06);

    source.start(context.currentTime);
    source.stop(context.currentTime + 0.06);
};

const synthesizePull: SoundSynthesizer = (context) => {
    const buffer = createNoiseBuffer(context, 0.1);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(VOLUME, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

    source.start(context.currentTime);
    source.stop(context.currentTime + 0.1);
};

const synthesizeCascade: SoundSynthesizer = (context) => {
    for (let i = 0; i < 4; i++) {
        const offset = i * 0.04;
        const buffer = createNoiseBuffer(context, 0.06);
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();

        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 1;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        gain.gain.setValueAtTime(VOLUME, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.06);

        source.start(context.currentTime + offset);
        source.stop(context.currentTime + offset + 0.06);
    }
};

const synthesizeThud: SoundSynthesizer = (context) => {
    const buffer = createNoiseBuffer(context, 0.05);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(VOLUME * 1.2, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);

    source.start(context.currentTime);
    source.stop(context.currentTime + 0.05);
};

const synthesizers: Record<SoundType, SoundSynthesizer> = {
    snap: synthesizeSnap,
    pull: synthesizePull,
    cascade: synthesizeCascade,
    thud: synthesizeThud,
};

export const createSoundService = (storageService: StorageService): SoundService => {
    const userEnabled = ref<boolean>(storageService.get<boolean>(STORAGE_KEY) ?? false);
    let audioContext: AudioContext | null = null;

    const isEnabled = computed(() => userEnabled.value && !prefersReducedMotion());

    const toggle = (): void => {
        userEnabled.value = !userEnabled.value;
        storageService.put(STORAGE_KEY, userEnabled.value);
    };

    const play = (sound: SoundType): void => {
        if (!isEnabled.value) return;

        if (audioContext) {
            void audioContext.close();
        }

        audioContext = new AudioContext();
        synthesizers[sound](audioContext);
    };

    return {isEnabled, toggle, play};
};
