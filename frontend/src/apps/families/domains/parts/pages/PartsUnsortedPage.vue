<script setup lang="ts">
import type {PartIdentity, PlacedDetail} from '@app/modals/PlacePartModal.vue';
import type {MasterShoppingListEntry, MasterShoppingListResponse} from '@app/types/part';

import PlacePartModal from '@app/modals/PlacePartModal.vue';
import {
    familyHttpService,
    familyRouterService,
    familySoundService,
    familyToastService,
    familyTranslationService,
} from '@app/services';
import BackButton from '@shared/components/BackButton.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {downloadCsv, toCsv} from '@shared/helpers/csv';
import {computed, onMounted, ref} from 'vue';

type SortField = 'shortfall' | 'name' | 'color';

const {t} = familyTranslationService;
const entries = ref<MasterShoppingListEntry[]>([]);
const unknownFamilySetIds = ref<string[]>([]);
const loading = ref(true);
const loadError = ref(false);
const searchQuery = ref('');
const activeSortField = ref<SortField>('shortfall');
const selectedEntry = ref<MasterShoppingListEntry | null>(null);
const showPlaceModal = ref(false);

/**
 * Reuses `/family-sets/missing-parts` — the same endpoint that powers
 * PartsMissingPage. The shortfall field doubles as "parts to place" for
 * a family that already owns the set but hasn't sorted into storage yet.
 */
const fetchUnsortedParts = async (): Promise<void> => {
    loading.value = true;
    loadError.value = false;
    try {
        const response = await familyHttpService.getRequest<MasterShoppingListResponse>('/family-sets/missing-parts');
        entries.value = response.data.shortfalls;
        unknownFamilySetIds.value = response.data.unknownFamilySetIds;
    } catch {
        entries.value = [];
        unknownFamilySetIds.value = [];
        loadError.value = true;
    } finally {
        loading.value = false;
    }
};

onMounted(fetchUnsortedParts);

const toPartIdentity = (entry: MasterShoppingListEntry): PartIdentity => ({
    partId: entry.partId,
    partNum: entry.partNum,
    partName: entry.partName,
    colorId: entry.colorId,
    colorName: entry.colorName,
    colorHex: entry.colorHex,
    partImageUrl: entry.partImageUrl,
});

const openPlaceModal = (entry: MasterShoppingListEntry) => {
    selectedEntry.value = entry;
    showPlaceModal.value = true;
};

const closePlaceModal = () => {
    showPlaceModal.value = false;
    selectedEntry.value = null;
};

const handlePlaced = async (detail: PlacedDetail) => {
    const partName = selectedEntry.value?.partName ?? '';
    showPlaceModal.value = false;
    selectedEntry.value = null;
    familyToastService.show({
        message: t('parts.placeSuccessToast')
            .value.replace('{quantity}', String(detail.quantity))
            .replace('{name}', partName)
            .replace('{location}', detail.storageOptionName),
        variant: 'success',
    });
    await fetchUnsortedParts();
};

const goBackToParts = async () => {
    await familyRouterService.goToRoute('parts');
};

const goToSettings = async () => {
    await familyRouterService.goToRoute('settings');
};

const totalToPlace = computed(() => entries.value.reduce((sum, entry) => sum + entry.shortfall, 0));

const affectedSetCount = computed(() => {
    const setNums = new Set<string>();
    for (const entry of entries.value) {
        for (const setNum of entry.neededBySetNums) {
            setNums.add(setNum);
        }
    }
    return setNums.size;
});

const setSortField = (field: SortField) => {
    activeSortField.value = field;
};

const compareEntries = (a: MasterShoppingListEntry, b: MasterShoppingListEntry): number => {
    if (activeSortField.value === 'shortfall') {
        return b.shortfall - a.shortfall;
    }
    if (activeSortField.value === 'name') {
        return a.partName.localeCompare(b.partName);
    }
    return a.colorName.localeCompare(b.colorName);
};

const filteredEntries = computed(() => {
    let result = entries.value;

    const query = searchQuery.value.toLowerCase().trim();
    if (query) {
        result = result.filter(
            (e) => e.partName.toLowerCase().includes(query) || e.partNum.toLowerCase().includes(query),
        );
    }

    return [...result].sort(compareEntries);
});

const exportCsvFile = () => {
    const headers = ['Part Number', 'Part Name', 'Color', 'To Place', 'Already Stored', 'Across Sets'];
    const rows = filteredEntries.value.map((e) => [
        e.partNum,
        e.partName,
        e.colorName,
        String(e.shortfall),
        String(e.quantityStored),
        String(e.neededBySetNums.length),
    ]);
    downloadCsv(toCsv(headers, rows), 'parts-to-place.csv');
};

const sortLabelKey: Record<
    SortField,
    'parts.unsortedSortShortfall' | 'parts.unsortedSortName' | 'parts.unsortedSortColor'
> = {shortfall: 'parts.unsortedSortShortfall', name: 'parts.unsortedSortName', color: 'parts.unsortedSortColor'};
const allSortFields: SortField[] = ['shortfall', 'name', 'color'];
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <BackButton data-testid="unsorted-back" @click="goBackToParts">{{
            t('parts.unsortedBackToParts').value
        }}</BackButton>

        <PageHeader :title="t('parts.unsortedTitle').value">
            <div flex gap="2" flex-wrap="wrap">
                <PrimaryButton
                    v-if="filteredEntries.length > 0"
                    :sound-service="familySoundService"
                    data-testid="export-csv"
                    @click="exportCsvFile"
                    >{{ t('parts.unsortedExportCsv').value }}</PrimaryButton
                >
            </div>
        </PageHeader>

        <p v-if="loading" text="[var(--brick-muted-text)]" data-testid="unsorted-loading">
            {{ t('common.loading').value }}
        </p>

        <template v-else>
            <div
                v-if="loadError"
                p="4"
                m="b-4"
                bg="red-100"
                class="brick-border brick-shadow"
                data-testid="unsorted-error"
            >
                <p font="bold" text="[var(--brick-page-text)]">{{ t('parts.unsortedLoadError').value }}</p>
            </div>

            <EmptyState
                v-else-if="entries.length === 0 && unknownFamilySetIds.length === 0"
                :message="t('parts.unsortedEmpty').value"
                show-brick
                brick-color="#237841"
            />

            <template v-else>
                <div flex="~ col" gap="2" m="b-4" data-testid="unsorted-summary">
                    <p
                        v-if="entries.length > 0"
                        font="bold"
                        text="lg"
                        :data-total-to-place="totalToPlace"
                        :data-affected-sets="affectedSetCount"
                    >
                        {{
                            t('parts.unsortedSummary')
                                .value.replace('{parts}', String(totalToPlace))
                                .replace('{sets}', String(affectedSetCount))
                        }}
                    </p>
                    <div
                        v-if="unknownFamilySetIds.length > 0"
                        p="3"
                        bg="[var(--brick-surface-highlight)]"
                        class="brick-border"
                        data-testid="unsorted-unknown-sets"
                        :data-unknown-count="unknownFamilySetIds.length"
                    >
                        <p text="sm [var(--brick-highlight-text)]">
                            {{
                                t('parts.unsortedUnknownSets').value.replace(
                                    '{count}',
                                    String(unknownFamilySetIds.length),
                                )
                            }}
                            <button
                                text="sm [var(--brick-highlight-text)]"
                                underline
                                font="bold"
                                cursor="pointer"
                                data-testid="unsorted-unknown-sets-link"
                                @click="goToSettings"
                            >
                                {{ t('parts.unsortedUnknownSetsLink').value }}
                            </button>
                        </p>
                    </div>
                </div>

                <template v-if="entries.length > 0">
                    <div flex="~ col" gap="4" m="b-4">
                        <TextInput
                            v-model="searchQuery"
                            :label="t('common.search').value"
                            type="search"
                            :placeholder="t('parts.unsortedSearchPlaceholder').value"
                            optional
                        />

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
                    </div>

                    <EmptyState v-if="filteredEntries.length === 0" :message="t('parts.unsortedNoResults').value" />

                    <div v-else flex="~ col" gap="2">
                        <ListItemButton
                            v-for="entry in filteredEntries"
                            :key="`${entry.partNum}_${entry.colorId}`"
                            data-testid="unsorted-place-trigger"
                            @click="openPlaceModal(entry)"
                        >
                            <PartListItem
                                :name="entry.partName"
                                :part-num="entry.partNum"
                                :quantity="entry.shortfall"
                                :image-url="entry.partImageUrl"
                                :color-name="entry.colorName"
                                :color-rgb="entry.colorHex"
                            >
                                <div flex gap="1" m="t-1" flex-wrap="wrap" text="xs">
                                    <span
                                        p="x-2 y-0.5"
                                        bg="yellow-300"
                                        font="bold"
                                        class="brick-border"
                                        border="1"
                                        text="[var(--brick-page-text)]"
                                    >
                                        {{
                                            t('parts.unsortedToPlaceLabel').value.replace(
                                                '{count}',
                                                String(entry.shortfall),
                                            )
                                        }}
                                    </span>
                                    <span
                                        p="x-2 y-0.5"
                                        bg="red-200"
                                        font="bold"
                                        class="brick-border"
                                        border="1"
                                        text="[var(--brick-page-text)]"
                                        :title="entry.neededBySetNums.join(', ')"
                                    >
                                        {{
                                            t('parts.unsortedNeededBy').value.replace(
                                                '{count}',
                                                String(entry.neededBySetNums.length),
                                            )
                                        }}
                                    </span>
                                </div>
                            </PartListItem>
                        </ListItemButton>
                    </div>
                </template>
            </template>
        </template>

        <PlacePartModal
            v-if="selectedEntry"
            :open="showPlaceModal"
            :part-identity="toPartIdentity(selectedEntry)"
            :default-quantity="selectedEntry.shortfall"
            :max-quantity="selectedEntry.shortfall"
            :needed-by-set-nums="selectedEntry.neededBySetNums"
            @close="closePlaceModal"
            @assigned="handlePlaced"
        />
    </div>
</template>
