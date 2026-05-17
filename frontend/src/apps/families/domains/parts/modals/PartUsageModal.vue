<script setup lang="ts">
import type {FamilySetStatus} from '@app/types/familySet';
import type {FamilyPartUsageEntry, FamilyPartUsageResponse} from '@app/types/part';

import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {ref, watch} from 'vue';

const {open, partNum, colorId} = defineProps<{open: boolean; partNum: string; colorId: number}>();
const emit = defineEmits<{close: []}>();

const {t} = familyTranslationService;

const data = ref<FamilyPartUsageResponse | null>(null);
const loading = ref(false);
const loadError = ref(false);

const statusKey: Record<
    FamilySetStatus,
    'sets.sealed' | 'sets.built' | 'sets.inProgress' | 'sets.inStorage' | 'sets.incomplete' | 'sets.wishlist'
> = {
    sealed: 'sets.sealed',
    built: 'sets.built',
    in_progress: 'sets.inProgress',
    in_storage: 'sets.inStorage',
    incomplete: 'sets.incomplete',
    wishlist: 'sets.wishlist',
};

const fetchUsage = async (): Promise<void> => {
    loading.value = true;
    loadError.value = false;
    data.value = null;
    try {
        const response = await familyHttpService.getRequest<FamilyPartUsageResponse>(
            `/family/parts/${partNum}/${colorId}/usage`,
        );
        data.value = response.data;
    } catch {
        loadError.value = true;
    } finally {
        loading.value = false;
    }
};

watch(
    () => [open, partNum, colorId] as const,
    ([isOpen]) => {
        if (isOpen) {
            void fetchUsage();
        }
    },
    {immediate: true},
);

const handleClose = () => {
    emit('close');
};

const goToSet = async (entry: FamilyPartUsageEntry): Promise<void> => {
    emit('close');
    await familyRouterService.goToRoute('sets-detail', entry.familySetId);
};

const renderNeeded = (count: number) => t('parts.usageNeeded').value.replace('{count}', String(count));
const renderStored = (count: number) => t('parts.usageStored').value.replace('{count}', String(count));
const renderShortfall = (count: number) => t('parts.usageShortfall').value.replace('{count}', String(count));
</script>

<template>
    <ModalDialog :open="open" @close="handleClose">
        <template #title>{{ t('parts.usageTitle').value }}</template>

        <div flex="~ col" gap="4">
            <div
                v-if="data"
                flex
                gap="3"
                items="center"
                p="3"
                bg="[var(--brick-surface-subtle)]"
                class="brick-border"
                data-testid="usage-part-header"
            >
                <div
                    v-if="data.colorHex"
                    w="6"
                    h="6"
                    shrink="0"
                    class="brick-border"
                    :style="{backgroundColor: '#' + data.colorHex}"
                />
                <img
                    v-if="data.partImageUrl"
                    :src="data.partImageUrl"
                    :alt="data.partName ?? data.partNum"
                    w="10"
                    h="10"
                    object="contain"
                    shrink="0"
                />
                <div flex="1" min-w="0">
                    <p font="bold" truncate>{{ data.partName ?? data.partNum }}</p>
                    <p text="sm [var(--brick-muted-text)]">
                        {{ data.partNum }}<template v-if="data.colorName"> · {{ data.colorName }}</template>
                    </p>
                </div>
            </div>

            <p v-if="loading" text="[var(--brick-muted-text)]" data-testid="usage-loading">
                {{ t('common.loading').value }}
            </p>

            <div
                v-else-if="loadError"
                flex="~ col"
                gap="3"
                p="4"
                bg="red-100"
                class="brick-border brick-shadow"
                data-testid="usage-error"
            >
                <p font="bold" text="[var(--brick-page-text)]">{{ t('parts.usageLoadError').value }}</p>
                <PrimaryButton data-testid="usage-retry" @click="fetchUsage">{{
                    t('parts.usageRetry').value
                }}</PrimaryButton>
            </div>

            <EmptyState
                v-else-if="data && data.usages.length === 0"
                :message="t('parts.usageEmpty').value"
                data-testid="usage-empty"
            />

            <div v-else-if="data && data.usages.length > 0" flex="~ col" gap="2" data-testid="usage-list">
                <ListItemButton
                    v-for="entry in data.usages"
                    :key="entry.familySetId"
                    :data-testid="`usage-set-${entry.familySetId}`"
                    @click="goToSet(entry)"
                >
                    <div flex="1" min-w="0">
                        <p font="bold" truncate>{{ entry.setName }}</p>
                        <p text="sm [var(--brick-muted-text)]">{{ entry.setNum }}</p>
                        <div flex gap="2" m="t-1" items="center" flex-wrap="wrap">
                            <BadgeLabel :variant="entry.status === 'wishlist' ? 'muted' : 'default'">{{
                                t(statusKey[entry.status]).value
                            }}</BadgeLabel>
                            <span text="xs [var(--brick-muted-text)]">{{ renderNeeded(entry.quantityNeeded) }}</span>
                            <span text="xs [var(--brick-muted-text)]">{{ renderStored(entry.quantityStored) }}</span>
                            <span
                                v-if="entry.shortfall > 0"
                                text="xs"
                                p="x-2 y-0.5"
                                bg="red-200"
                                font="bold"
                                class="brick-border"
                                border="1"
                            >
                                {{ renderShortfall(entry.shortfall) }}
                            </span>
                        </div>
                    </div>
                </ListItemButton>
            </div>
        </div>
    </ModalDialog>
</template>
