<script setup lang="ts">
import {ensureRefValueExists} from '@shared/helpers/type-check';
import {BarcodeDetector} from 'barcode-detector';
import {ref, watch, onMounted, onUnmounted} from 'vue';

const {resetKey} = defineProps<{resetKey?: number; loadingText: string; retryText: string}>();
const emit = defineEmits<{detect: [barcode: string]; error: [message: string]}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const stream = ref<MediaStream | null>(null);
const cameraError = ref('');
const isLoading = ref(true);
const isCameraActive = ref(false);
const isStarting = ref(false);
const detectedCode = ref('');
let scanInterval: ReturnType<typeof setInterval> | undefined;
let isUnmounted = false;

const stopCamera = () => {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = undefined;
    }
    if (stream.value) {
        for (const track of stream.value.getTracks()) {
            track.stop();
        }
        stream.value = null;
    }
    if (videoRef.value) {
        videoRef.value.srcObject = null;
    }
    isCameraActive.value = false;
};

const startScanning = () => {
    const detector = new BarcodeDetector({formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']});

    scanInterval = setInterval(async () => {
        if (!videoRef.value || !isCameraActive.value || detectedCode.value) {
            return;
        }

        try {
            const barcodes = await detector.detect(videoRef.value);
            if (barcodes.length > 0 && barcodes[0]?.rawValue) {
                detectedCode.value = barcodes[0].rawValue;
                emit('detect', detectedCode.value);
            }
        } catch {
            // Detection frame failed — ignore and retry on next interval
        }
    }, 250);
};

const startCamera = async () => {
    if (isStarting.value) {
        return;
    }

    isStarting.value = true;
    stopCamera();
    detectedCode.value = '';

    isLoading.value = true;
    cameraError.value = '';

    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}},
        });

        if (isUnmounted) {
            for (const track of mediaStream.getTracks()) {
                track.stop();
            }
            return;
        }

        stream.value = mediaStream;
        const video = ensureRefValueExists(videoRef);
        video.srcObject = mediaStream;
        await video.play();

        if (isUnmounted) {
            return;
        }

        isCameraActive.value = true;
        startScanning();
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                cameraError.value = 'Camera access denied. Please allow camera access and try again.';
            } else if (err.name === 'NotFoundError') {
                cameraError.value = 'No camera found. Please connect a camera and try again.';
            } else {
                cameraError.value = `Failed to access camera: ${err.message}`;
            }
        } else {
            cameraError.value = 'An unexpected error occurred while accessing the camera.';
        }
    } finally {
        isLoading.value = false;
        isStarting.value = false;
    }
};

const resetScanner = () => {
    detectedCode.value = '';
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = undefined;
    }
    if (isCameraActive.value) {
        startScanning();
    }
};

watch(
    () => resetKey,
    () => {
        resetScanner();
    },
);

onMounted(() => {
    startCamera();
});

onUnmounted(() => {
    isUnmounted = true;
    stopCamera();
});
</script>

<template>
    <div flex="~ col" gap="4">
        <div
            relative
            overflow="hidden"
            bg="gray-900"
            role="region"
            aria-label="Barcode scanner viewfinder"
            class="brick-border brick-shadow"
        >
            <video
                ref="videoRef"
                autoplay
                playsinline
                muted
                w="full"
                block
                aria-label="Live camera feed for scanning barcodes"
                :class="{'opacity-0': !isCameraActive}"
            />

            <div
                v-if="isLoading"
                absolute
                inset="0"
                flex
                items="center"
                justify="center"
                bg="gray-900"
                text="white"
                role="status"
                aria-live="polite"
            >
                <span font="bold">{{ loadingText }}</span>
            </div>

            <div
                v-else-if="cameraError"
                absolute
                inset="0"
                flex="~ col"
                items="center"
                justify="center"
                gap="4"
                bg="gray-900"
                p="4"
                role="alert"
                aria-live="assertive"
            >
                <span text="white center" font="bold">{{ cameraError }}</span>
                <button
                    type="button"
                    p="x-4 y-2"
                    bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
                    text="[var(--brick-page-text)] hover:brick-ink focus:brick-ink"
                    font="bold"
                    uppercase
                    tracking="wide"
                    cursor="pointer"
                    outline="none"
                    focus-visible:brick-focus
                    aria-label="Retry camera access"
                    class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
                    @click="startCamera"
                >
                    {{ retryText }}
                </button>
            </div>

            <div
                v-else-if="detectedCode"
                absolute
                inset="0"
                flex
                items="center"
                justify="center"
                bg="black/60"
                role="status"
                aria-live="polite"
            >
                <span text="white 2xl" font="bold">{{ detectedCode }}</span>
            </div>
        </div>
    </div>
</template>
