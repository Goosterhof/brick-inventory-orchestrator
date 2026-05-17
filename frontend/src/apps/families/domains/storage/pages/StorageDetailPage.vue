<script setup lang="ts">
import type {StorageOptionPart} from '@app/types/part';
import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import BackButton from '@shared/components/BackButton.vue';
import DetailRow from '@shared/components/DetailRow.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {onMounted, ref} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<StorageOption> | null>(null);
const storageParts = ref<StorageOptionPart[]>([]);
const loading = ref(true);

onMounted(async () => {
    const id = familyRouterService.currentRouteId.value;
    // Direct navigation (refresh, deep link, e2e test) lands here without the overview having
    // hydrated the store. retrieveAll guarantees the item is loaded; only run it on the fallback
    // path so the normal overview-then-detail flow keeps its single round-trip.
    let storageOption: Adapted<StorageOption>;
    try {
        storageOption = await storageOptionStoreModule.getOrFailById(id);
    } catch (error) {
        if (!(error instanceof EntryNotFoundError)) throw error;
        await storageOptionStoreModule.retrieveAll();
        storageOption = await storageOptionStoreModule.getOrFailById(id);
    }
    const partsResponse = await familyHttpService.getRequest<StorageOptionPart[]>(`/storage-options/${id}/parts`);
    adapted.value = storageOption;
    storageParts.value = partsResponse.data;
    loading.value = false;
});

const goToEdit = async () => {
    if (!adapted.value) return;
    await familyRouterService.goToRoute('storage-edit', adapted.value.id);
};

const goBack = async () => {
    await familyRouterService.goToRoute('storage');
};
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <LoadingState v-if="loading" :message="t('common.loading').value" />

        <template v-else-if="adapted">
            <div m="b-6">
                <BackButton @click="goBack">&larr; {{ t('storage.backToOverview').value }}</BackButton>
            </div>

            <div flex="~ col" gap="3">
                <h1 text="2xl" font="bold" uppercase tracking="wide">{{ adapted.name }}</h1>

                <DetailRow v-if="adapted.description" :label="t('storage.description').value">
                    {{ adapted.description }}
                </DetailRow>
                <DetailRow v-if="adapted.row !== null" :label="t('storage.row').value">
                    {{ adapted.row }}
                </DetailRow>
                <DetailRow v-if="adapted.column !== null" :label="t('storage.column').value">
                    {{ adapted.column }}
                </DetailRow>
                <DetailRow v-if="adapted.childIds.length > 0" :label="t('storage.subLocations').value">
                    {{ adapted.childIds.length }}
                </DetailRow>

                <div m="t-4">
                    <PrimaryButton @click="goToEdit">{{ t('storage.edit').value }}</PrimaryButton>
                </div>
            </div>

            <div m="t-8">
                <h2 text="xl" font="bold" uppercase tracking="wide" m="b-4">
                    {{ t('storage.parts').value }} ({{ storageParts.length }})
                </h2>

                <EmptyState v-if="storageParts.length === 0" :message="t('storage.noParts').value" />

                <div v-else flex="~ col" gap="2">
                    <PartListItem
                        v-for="storagePart in storageParts"
                        :key="storagePart.id"
                        :name="storagePart.part.name"
                        :part-num="storagePart.part.partNum"
                        :quantity="storagePart.quantity"
                        :image-url="storagePart.part.imageUrl"
                        :color-name="storagePart.color?.name ?? null"
                        :color-rgb="storagePart.color?.rgb ?? null"
                    />
                </div>
            </div>
        </template>
    </div>
</template>
