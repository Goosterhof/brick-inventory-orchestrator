<script setup lang="ts">
import type {Part} from '@app/types/part';

import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import BackButton from '@shared/components/BackButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import CameraCapture from '@shared/components/scanner/CameraCapture.vue';
import {ref} from 'vue';

const {t} = familyTranslationService;
const identifiedPart = ref<Part | null>(null);
const isIdentifying = ref(false);
const error = ref('');
const showCamera = ref(true);

const onCapture = async (imageData: Blob) => {
    isIdentifying.value = true;
    error.value = '';
    showCamera.value = false;

    const formData = new FormData();
    formData.append('image', imageData, 'brick.jpg');

    try {
        const response = await familyHttpService.postRequest<Part>('/identify-brick', formData);
        identifiedPart.value = response.data;
    } catch {
        error.value = t('sets.identifyError').value;
    } finally {
        isIdentifying.value = false;
    }
};

const tryAgain = () => {
    identifiedPart.value = null;
    error.value = '';
    showCamera.value = true;
};

const goBack = async () => {
    await familyRouterService.goToRoute('sets');
};
</script>

<template>
    <div max-w="md" m="x-auto">
        <PageHeader :title="t('sets.identifyBrick').value">
            <BackButton @click="goBack">{{ t('sets.backToOverview').value }}</BackButton>
        </PageHeader>

        <p text="[var(--brick-muted-text)]" m="b-4">{{ t('sets.identifyDescription').value }}</p>

        <CameraCapture
            v-if="showCamera"
            :loading-text="t('sets.startingCamera').value"
            :retry-text="t('sets.retry').value"
            :capture-text="t('sets.capturePhoto').value"
            @capture="onCapture"
            @error="() => {}"
        />

        <div v-if="isIdentifying" m="t-6">
            <p text="[var(--brick-muted-text)]">{{ t('sets.identifying').value }}</p>
        </div>

        <div v-else-if="identifiedPart" m="t-6" flex="~ col" gap="4">
            <div flex gap="4" items="center" p="4" bg="[var(--brick-card-bg)]" class="brick-border brick-shadow">
                <img
                    v-if="identifiedPart.imageUrl"
                    :src="identifiedPart.imageUrl"
                    :alt="identifiedPart.name"
                    w="20"
                    h="20"
                    object="contain"
                />
                <div flex="1">
                    <p font="bold" text="lg">{{ identifiedPart.name }}</p>
                    <p text="sm [var(--brick-muted-text)]">{{ identifiedPart.partNum }}</p>
                </div>
            </div>

            <PrimaryButton @click="tryAgain">{{ t('sets.identifyAgain').value }}</PrimaryButton>
        </div>

        <div v-else-if="error" m="t-6" flex="~ col" gap="4">
            <p text="red-600" font="bold">{{ error }}</p>
            <PrimaryButton @click="tryAgain">{{ t('sets.identifyAgain').value }}</PrimaryButton>
        </div>
    </div>
</template>
