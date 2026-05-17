<script setup lang="ts">
import type {CursorPaginatedParts, FamilyPartEntry, GroupedFamilyPart} from '@app/types/part';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {downloadCsv, toCsv} from '@shared/helpers/csv';
import {computed, onMounted, ref} from 'vue';

import PartUsageModal from '../modals/PartUsageModal.vue';

type SortField = 'name' | 'quantity' | 'color';

const {t} = familyTranslationService;
const entries = ref<FamilyPartEntry[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const nextCursor = ref<string | null>(null);
const searchQuery = ref('');
const activeColorFilter = ref<string | null>(null);
const showOrphansOnly = ref(false);
const activeSortField = ref<SortField>('name');

const fetchParts = async (cursor?: string): Promise<CursorPaginatedParts> => {
    const params = new URLSearchParams({per_page: '100'});
    if (cursor) {
        params.set('cursor', cursor);
    }
    const response = await familyHttpService.getRequest<CursorPaginatedParts>(`/family/parts?${params.toString()}`);
    return response.data;
};

onMounted(async () => {
    try {
        const envelope = await fetchParts();
        entries.value = envelope.data;
        nextCursor.value = envelope.nextCursor;
    } catch {
        entries.value = [];
    } finally {
        loading.value = false;
    }
});

const loadMore = async () => {
    if (!nextCursor.value || loadingMore.value) {
        return;
    }
    loadingMore.value = true;
    try {
        const envelope = await fetchParts(nextCursor.value);
        entries.value = [...entries.value, ...envelope.data];
        nextCursor.value = envelope.nextCursor;
    } finally {
        loadingMore.value = false;
    }
};

const groupedParts = computed((): GroupedFamilyPart[] => {
    const map = new Map<string, GroupedFamilyPart>();

    for (const entry of entries.value) {
        const key = `${entry.partId}_${entry.colorId}`;
        const existing = map.get(key);

        if (existing) {
            existing.totalQuantity += entry.quantity;
            existing.locations.push({
                storageOptionId: entry.storageOptionId,
                storageOptionName: entry.storageOptionName,
                quantity: entry.quantity,
            });
            if (entry.familySetId === null) {
                existing.isOrphan = true;
            }
        } else {
            map.set(key, {
                partId: entry.partId,
                partNum: entry.partNum,
                partName: entry.partName,
                partImageUrl: entry.partImageUrl,
                colorId: entry.colorId,
                colorName: entry.colorName,
                colorRgb: entry.colorRgb,
                totalQuantity: entry.quantity,
                isOrphan: entry.familySetId === null,
                locations: [
                    {
                        storageOptionId: entry.storageOptionId,
                        storageOptionName: entry.storageOptionName,
                        quantity: entry.quantity,
                    },
                ],
            });
        }
    }

    return [...map.values()];
});

const uniqueColors = computed(() => {
    const colors = new Map<string, string>();
    for (const part of groupedParts.value) {
        if (part.colorName !== null) {
            colors.set(part.colorName, part.colorName);
        }
    }
    return [...colors.values()].sort();
});

const toggleColorFilter = (color: string) => {
    activeColorFilter.value = activeColorFilter.value === color ? null : color;
};

const toggleOrphanFilter = () => {
    showOrphansOnly.value = !showOrphansOnly.value;
};

const setSortField = (field: SortField) => {
    activeSortField.value = field;
};

const compareParts = (a: GroupedFamilyPart, b: GroupedFamilyPart): number => {
    if (activeSortField.value === 'name') {
        return a.partName.localeCompare(b.partName);
    }
    if (activeSortField.value === 'quantity') {
        return b.totalQuantity - a.totalQuantity;
    }
    return (a.colorName ?? '').localeCompare(b.colorName ?? '');
};

const filteredParts = computed(() => {
    let result = groupedParts.value;

    const query = searchQuery.value.toLowerCase().trim();
    if (query) {
        result = result.filter(
            (p) => p.partName.toLowerCase().includes(query) || p.partNum.toLowerCase().includes(query),
        );
    }

    if (activeColorFilter.value) {
        result = result.filter((p) => p.colorName === activeColorFilter.value);
    }

    if (showOrphansOnly.value) {
        result = result.filter((p) => p.isOrphan);
    }

    return [...result].sort(compareParts);
});

const exportCsv = () => {
    const headers = ['Part Number', 'Name', 'Color', 'Total Quantity', 'Storage Locations'];
    const rows = filteredParts.value.map((p) => [
        p.partNum,
        p.partName,
        p.colorName ?? '',
        String(p.totalQuantity),
        p.locations.map((l) => `${l.storageOptionName} (${l.quantity}x)`).join('; '),
    ]);
    downloadCsv(toCsv(headers, rows), 'lego-parts.csv');
};

const sortLabelKey: Record<SortField, 'parts.sortName' | 'parts.sortQuantity' | 'parts.sortColor'> = {
    name: 'parts.sortName',
    quantity: 'parts.sortQuantity',
    color: 'parts.sortColor',
};
const allSortFields: SortField[] = ['name', 'quantity', 'color'];

const goToMissing = async () => {
    await familyRouterService.goToRoute('parts-missing');
};

const goToUnsorted = async () => {
    await familyRouterService.goToRoute('parts-unsorted');
};

const usageModalOpen = ref(false);
const usagePartNum = ref('');
const usageColorId = ref<number | null>(null);

const openUsageModal = (part: GroupedFamilyPart) => {
    if (part.colorId === null) return;
    usagePartNum.value = part.partNum;
    usageColorId.value = part.colorId;
    usageModalOpen.value = true;
};

const closeUsageModal = () => {
    usageModalOpen.value = false;
};

const usageButtonLabel = (part: GroupedFamilyPart) =>
    `${t('parts.usageOpenModalLabel').value}: ${part.partName ?? part.partNum}`;
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <PageHeader :title="t('parts.title').value">
            <div flex gap="2" flex-wrap="wrap">
                <PrimaryButton
                    :sound-service="familySoundService"
                    data-testid="parts-missing-cta"
                    @click="goToMissing"
                    >{{ t('parts.seeMissingCta').value }}</PrimaryButton
                >
                <PrimaryButton
                    :sound-service="familySoundService"
                    data-testid="parts-unsorted-cta"
                    @click="goToUnsorted"
                    >{{ t('parts.seeUnsortedCta').value }}</PrimaryButton
                >
                <PrimaryButton v-if="groupedParts.length > 0" :sound-service="familySoundService" @click="exportCsv">{{
                    t('common.export').value
                }}</PrimaryButton>
            </div>
        </PageHeader>

        <p v-if="loading" text="[var(--brick-muted-text)]">{{ t('common.loading').value }}</p>

        <EmptyState
            v-else-if="groupedParts.length === 0"
            :message="t('parts.noParts').value"
            show-brick
            brick-color="#C41A16"
        />

        <template v-else>
            <div flex="~ col" gap="4" m="b-4">
                <TextInput
                    v-model="searchQuery"
                    :label="t('common.search').value"
                    type="search"
                    :placeholder="t('parts.searchPlaceholder').value"
                    optional
                />

                <div flex="~ col" gap="2">
                    <div flex gap="2" flex-wrap="wrap">
                        <FilterChip
                            v-for="field in allSortFields"
                            :key="field"
                            :active="activeSortField === field"
                            @click="setSortField(field)"
                        >
                            {{ t(sortLabelKey[field]).value }}
                        </FilterChip>
                    </div>

                    <div flex gap="2" flex-wrap="wrap">
                        <FilterChip :active="!activeColorFilter" @click="activeColorFilter = null">
                            {{ t('parts.allColors').value }}
                        </FilterChip>
                        <FilterChip
                            v-for="color in uniqueColors"
                            :key="color"
                            :active="activeColorFilter === color"
                            @click="toggleColorFilter(color)"
                        >
                            {{ color }}
                        </FilterChip>
                    </div>

                    <div flex gap="2" flex-wrap="wrap">
                        <FilterChip :active="showOrphansOnly" @click="toggleOrphanFilter">
                            {{ t('parts.orphanParts').value }}
                        </FilterChip>
                    </div>
                </div>
            </div>

            <EmptyState v-if="filteredParts.length === 0" :message="t('parts.noResults').value" />

            <div v-else flex="~ col" gap="2">
                <button
                    v-for="part in filteredParts"
                    :key="`${part.partId}_${part.colorId}`"
                    type="button"
                    block
                    w="full"
                    p="0"
                    bg="transparent"
                    text="left"
                    border="0"
                    cursor="pointer"
                    outline="none"
                    focus-visible:brick-focus
                    :disabled="part.colorId === null"
                    :data-testid="`part-row-${part.partId}_${part.colorId}`"
                    :aria-label="usageButtonLabel(part)"
                    @click="openUsageModal(part)"
                >
                    <PartListItem
                        :name="part.partName"
                        :part-num="part.partNum"
                        :quantity="part.totalQuantity"
                        :image-url="part.partImageUrl"
                        :color-name="part.colorName"
                        :color-rgb="part.colorRgb"
                    >
                        <div flex gap="1" m="t-1" flex-wrap="wrap">
                            <span
                                v-for="loc in part.locations"
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
                            <span
                                v-if="part.isOrphan"
                                text="xs"
                                p="x-2 y-0.5"
                                bg="red-200"
                                font="bold"
                                class="brick-border"
                                border="1"
                            >
                                {{ t('parts.orphanParts').value }}
                            </span>
                        </div>
                    </PartListItem>
                </button>
            </div>

            <PartUsageModal
                v-if="usageColorId !== null"
                :open="usageModalOpen"
                :part-num="usagePartNum"
                :color-id="usageColorId"
                @close="closeUsageModal"
            />

            <div v-if="nextCursor" flex justify="center" m="t-6">
                <button
                    class="brick-border brick-shadow brick-transition"
                    bg="yellow-400 hover:yellow-300"
                    p="x-6 y-3"
                    font="bold"
                    text="[var(--brick-page-text)]"
                    :disabled="loadingMore"
                    hover="brick-shadow-hover"
                    active="brick-shadow-active"
                    data-testid="load-more-button"
                    @click="loadMore"
                >
                    {{ loadingMore ? t('parts.loadingMore').value : t('parts.loadMore').value }}
                </button>
            </div>
        </template>
    </div>
</template>
