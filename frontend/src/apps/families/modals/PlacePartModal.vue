<script setup lang="ts">
import type {StorageMapEntry} from '@app/types/part';
import type {StorageOption} from '@app/types/storageOption';

import {familyHttpService, familyTranslationService} from '@app/services';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, onMounted, ref} from 'vue';

export interface PartIdentity {
    partId: number;
    partNum: string;
    partName: string;
    colorId: number;
    colorName: string;
    colorHex: string;
    partImageUrl: string | null;
}

export interface PlacedDetail {
    storageOptionId: number;
    storageOptionName: string;
    quantity: number;
}

const NEEDED_BY_INLINE_LIMIT = 5;

const {
    partIdentity,
    defaultQuantity = 1,
    maxQuantity,
    neededBySetNums = [],
    existingLocations = [],
    title,
} = defineProps<{
    open: boolean;
    partIdentity: PartIdentity;
    /** Pre-fills the quantity field. Defaults to 1. */
    defaultQuantity?: number;
    /** Clamps the NumberInput's `max`. Optional — omit for unbounded. */
    maxQuantity?: number;
    /** Renders a "Needed by" panel listing LEGO set numbers (e.g. "75313-1"). Empty hides the panel. */
    neededBySetNums?: string[];
    /** Renders the "already stored in" panel — same shape SetDetailPage uses. */
    existingLocations?: StorageMapEntry[];
    /** Modal title override. Defaults to `parts.placeTitle`. */
    title?: string;
}>();
const emit = defineEmits<{close: []; assigned: [PlacedDetail]}>();

const {t} = familyTranslationService;

const storageOptions = ref<StorageOption[]>([]);
const selectedStorageId = ref('');
const quantity = ref<number | null>(defaultQuantity);
const saving = ref(false);
const error = ref('');
const loadingOptions = ref(true);

const resolvedTitle = computed(() => title ?? t('parts.placeTitle').value);

const inlineNeededBy = computed(() => neededBySetNums.slice(0, NEEDED_BY_INLINE_LIMIT));
const overflowNeededByCount = computed(() => Math.max(0, neededBySetNums.length - NEEDED_BY_INLINE_LIMIT));

onMounted(async () => {
    try {
        const response = await familyHttpService.getRequest<StorageOption[]>('/storage-options');
        storageOptions.value = response.data;
    } catch {
        storageOptions.value = [];
    } finally {
        loadingOptions.value = false;
    }
});

const findStorageOptionById = (id: number): StorageOption | undefined =>
    storageOptions.value.find((option) => option.id === id);

const handleSubmit = async () => {
    const storageId = Number(selectedStorageId.value);
    if (!storageId) return;

    saving.value = true;
    error.value = '';

    const submittedQuantity = quantity.value ?? 1;

    try {
        await familyHttpService.postRequest(`/storage-options/${storageId}/parts`, {
            partId: partIdentity.partId,
            colorId: partIdentity.colorId,
            quantity: submittedQuantity,
        });
        const storage = findStorageOptionById(storageId);
        emit('assigned', {
            storageOptionId: storageId,
            storageOptionName: storage?.name ?? '',
            quantity: submittedQuantity,
        });
        emit('close');
    } catch {
        error.value = t('sets.assignError').value;
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <ModalDialog :open="open" @close="emit('close')">
        <template #title>{{ resolvedTitle }}</template>

        <div flex="~ col" gap="4">
            <div flex gap="3" items="center" p="3" bg="[var(--brick-surface-subtle)]" class="brick-border">
                <div
                    v-if="partIdentity.colorHex"
                    w="6"
                    h="6"
                    shrink="0"
                    class="brick-border"
                    :style="{backgroundColor: '#' + partIdentity.colorHex}"
                />
                <div flex="1" min-w="0">
                    <p font="bold" truncate>{{ partIdentity.partName }}</p>
                    <p text="sm [var(--brick-muted-text)]">{{ partIdentity.partNum }} · {{ partIdentity.colorName }}</p>
                </div>
            </div>

            <div v-if="existingLocations.length > 0" p="3" bg="yellow-100" class="brick-border" border="1">
                <p text="sm" font="bold" m="b-1">{{ t('sets.alreadyStored').value }}</p>
                <div flex gap="1" flex-wrap="wrap">
                    <span
                        v-for="loc in existingLocations"
                        :key="loc.storageOptionId"
                        text="xs"
                        p="x-2 y-0.5"
                        bg="yellow-300"
                        font="bold"
                        class="brick-border"
                        border="1"
                    >
                        {{ loc.storageOptionName }} ({{ loc.quantity }}x)
                    </span>
                </div>
            </div>

            <div
                v-if="neededBySetNums.length > 0"
                data-testid="place-needed-by"
                p="3"
                bg="red-100"
                class="brick-border"
                border="1"
            >
                <p text="sm" font="bold" m="b-1">{{ t('parts.placeNeededByLabel').value }}</p>
                <div flex gap="1" flex-wrap="wrap">
                    <span
                        v-for="setNum in inlineNeededBy"
                        :key="setNum"
                        text="xs"
                        p="x-2 y-0.5"
                        bg="red-200"
                        font="bold"
                        class="brick-border"
                        border="1"
                    >
                        {{ setNum }}
                    </span>
                    <span
                        v-if="overflowNeededByCount > 0"
                        data-testid="place-needed-by-overflow"
                        text="xs"
                        p="x-2 y-0.5"
                        bg="red-200"
                        font="bold"
                        class="brick-border"
                        border="1"
                    >
                        {{ t('parts.placeNeededByMore').value.replace('{count}', String(overflowNeededByCount)) }}
                    </span>
                </div>
            </div>

            <form flex="~ col" gap="4" @submit.prevent="handleSubmit">
                <p v-if="loadingOptions" text="[var(--brick-muted-text)]">{{ t('common.loading').value }}</p>

                <template v-else>
                    <SelectInput v-model="selectedStorageId" :label="t('sets.selectStorage').value" :error="error">
                        <option value="" disabled>{{ t('sets.selectStoragePlaceholder').value }}</option>
                        <option v-for="option in storageOptions" :key="option.id" :value="option.id">
                            {{ option.name }}
                        </option>
                    </SelectInput>

                    <NumberInput v-model="quantity" :label="t('sets.quantity').value" :min="1" :max="maxQuantity" />

                    <PrimaryButton type="submit" :disabled="saving || !selectedStorageId">
                        {{ t('parts.placeAction').value }}
                    </PrimaryButton>
                </template>
            </form>
        </div>
    </ModalDialog>
</template>
