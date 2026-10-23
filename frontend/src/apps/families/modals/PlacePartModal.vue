<script setup lang="ts">
import type {StorageMapEntry} from '@app/types/part';
import type {StorageOption} from '@app/types/storageOption';

import {familyHttpService, familyTranslationService} from '@app/services';
import {FormField, GroupSelect, NumberInput} from '@script-development/ui-inputs';
import ModalDialog from '@shared/components/ModalDialog.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, onMounted, ref, useId} from 'vue';

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
const selectedStorageId = ref<number | null>(null);
const quantity = ref<number | null>(defaultQuantity);
const saving = ref(false);
const error = ref('');
const loadingOptions = ref(true);

const storageFieldId = useId();
const quantityId = useId();

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

const byName = (a: StorageOption, b: StorageOption): number => a.name.localeCompare(b.name);

const PATH_SEPARATOR = ' › ';

// A storage on a parent cycle is named after the cycle walked up from itself, ending at itself.
const cyclePath = (cycle: StorageOption[], offset: number): string =>
    [...cycle.slice(offset), ...cycle.slice(0, offset)]
        .map((step) => step.name)
        .reverse()
        .join(PATH_SEPARATOR);

const pathResolver = (byId: Map<number, StorageOption>) => {
    const pathById = new Map<number, string>();

    const unresolvedTrail = (storage: StorageOption) => {
        const trail: StorageOption[] = [];
        const trailIndexById = new Map<number, number>();
        let node: StorageOption | undefined = storage;
        while (node && !pathById.has(node.id) && !trailIndexById.has(node.id)) {
            trailIndexById.set(node.id, trail.length);
            trail.push(node);
            node = node.parentId === null ? undefined : byId.get(node.parentId);
        }
        return {trail, cycleStart: node === undefined ? undefined : trailIndexById.get(node.id)};
    };

    return (storage: StorageOption): string => {
        const {trail, cycleStart = trail.length} = unresolvedTrail(storage);

        const cycle = trail.slice(cycleStart);
        for (const [offset, member] of cycle.entries()) pathById.set(member.id, cyclePath(cycle, offset));

        for (const step of trail.slice(0, cycleStart).reverse()) {
            const parentPath = step.parentId === null ? undefined : pathById.get(step.parentId);
            pathById.set(step.id, parentPath === undefined ? step.name : parentPath + PATH_SEPARATOR + step.name);
        }

        return pathById.get(storage.id) as string;
    };
};

const storageGroups = computed(() => {
    const byId = new Map(storageOptions.value.map((option) => [option.id, option]));
    const storagePath = pathResolver(byId);
    const isTopLevel = (option: StorageOption) => option.parentId === null || !byId.has(option.parentId);
    const childrenByParentId = new Map<number, StorageOption[]>();
    for (const option of storageOptions.value) {
        if (option.parentId === null) continue;
        const siblings = childrenByParentId.get(option.parentId);
        if (siblings) siblings.push(option);
        else childrenByParentId.set(option.parentId, [option]);
    }

    const parentGroups = storageOptions.value
        .flatMap((parent) => {
            const children = childrenByParentId.get(parent.id);
            if (!children) return [];
            return [{text: storagePath(parent), header: true, options: [...children].sort(byName)}];
        })
        .sort((a, b) => a.text.localeCompare(b.text));

    return [{text: '', header: false, options: storageOptions.value.filter(isTopLevel).sort(byName)}, ...parentGroups];
});

const handleSubmit = async () => {
    const storageId = selectedStorageId.value;
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
                    <FormField :id="storageFieldId" :label="t('sets.selectStorage').value" required :error="error">
                        <template #default="{controlId, required, invalid, describedby}">
                            <GroupSelect
                                :id="controlId"
                                v-model="selectedStorageId"
                                :groups="storageGroups"
                                label="name"
                                :options-label="t('sets.selectStorage').value"
                                :placeholder="t('sets.selectStoragePlaceholder').value"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>

                    <FormField :id="quantityId" :label="t('sets.quantity').value">
                        <template #default="{controlId, required, invalid, describedby}">
                            <NumberInput
                                :id="controlId"
                                v-model="quantity"
                                :min="1"
                                :max="maxQuantity"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>

                    <PrimaryButton type="submit" :disabled="saving || !selectedStorageId">
                        {{ t('parts.placeAction').value }}
                    </PrimaryButton>
                </template>
            </form>
        </div>
    </ModalDialog>
</template>
