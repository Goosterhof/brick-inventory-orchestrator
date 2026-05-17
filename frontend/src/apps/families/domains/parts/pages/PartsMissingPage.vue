<script setup lang="ts">
import type {MasterShoppingListEntry, MasterShoppingListResponse} from '@app/types/part';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import BackButton from '@shared/components/BackButton.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {downloadBrickLinkWantedList, toBrickLinkWantedListXml} from '@shared/helpers/bricklinkWantedList';
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

const fetchMissingParts = async (): Promise<void> => {
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

onMounted(fetchMissingParts);

const goBackToParts = async () => {
    await familyRouterService.goToRoute('parts');
};

const goToSettings = async () => {
    await familyRouterService.goToRoute('settings');
};

const totalShortfall = computed(() => entries.value.reduce((sum, entry) => sum + entry.shortfall, 0));

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

const exportBrickLink = () => {
    // The backend does not yet ship a Rebrickable→BrickLink color mapping —
    // see the CAVEAT in `bricklinkWantedList.ts`. Until that mapping exists,
    // emit color-agnostic entries (the helper omits `<COLOR>` for null/undefined).
    const bricklinkEntries = filteredEntries.value.map((entry) => ({
        partNum: entry.partNum,
        brickLinkColorId: null,
        shortfall: entry.shortfall,
    }));
    const xml = toBrickLinkWantedListXml(bricklinkEntries);
    downloadBrickLinkWantedList(xml, 'bricklink-wanted-list.xml');
};

const exportCsvFile = () => {
    const headers = [
        'Part Number',
        'Part Name',
        'Color',
        'Quantity Needed',
        'Quantity Stored',
        'Shortfall',
        'Needed By Sets',
    ];
    const rows = filteredEntries.value.map((e) => [
        e.partNum,
        e.partName,
        e.colorName,
        String(e.quantityNeeded),
        String(e.quantityStored),
        String(e.shortfall),
        String(e.neededBySetNums.length),
    ]);
    downloadCsv(toCsv(headers, rows), 'master-shopping-list.csv');
};

const sortLabelKey: Record<
    SortField,
    'parts.missingSortShortfall' | 'parts.missingSortName' | 'parts.missingSortColor'
> = {shortfall: 'parts.missingSortShortfall', name: 'parts.missingSortName', color: 'parts.missingSortColor'};
const allSortFields: SortField[] = ['shortfall', 'name', 'color'];
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <BackButton data-testid="missing-back" @click="goBackToParts">{{
            t('parts.missingBackToParts').value
        }}</BackButton>

        <PageHeader :title="t('parts.missingTitle').value">
            <div flex gap="2" flex-wrap="wrap">
                <PrimaryButton
                    v-if="filteredEntries.length > 0"
                    :sound-service="familySoundService"
                    data-testid="export-bricklink"
                    @click="exportBrickLink"
                    >{{ t('parts.missingExportBrickLink').value }}</PrimaryButton
                >
                <PrimaryButton
                    v-if="filteredEntries.length > 0"
                    :sound-service="familySoundService"
                    data-testid="export-csv"
                    @click="exportCsvFile"
                    >{{ t('parts.missingExportCsv').value }}</PrimaryButton
                >
            </div>
        </PageHeader>

        <p v-if="loading" text="[var(--brick-muted-text)]" data-testid="missing-loading">
            {{ t('common.loading').value }}
        </p>

        <template v-else>
            <div
                v-if="loadError"
                p="4"
                m="b-4"
                bg="red-100"
                class="brick-border brick-shadow"
                data-testid="missing-error"
            >
                <p font="bold" text="[var(--brick-page-text)]">{{ t('parts.missingLoadError').value }}</p>
            </div>

            <EmptyState
                v-else-if="entries.length === 0 && unknownFamilySetIds.length === 0"
                :message="t('parts.missingEmpty').value"
                show-brick
                brick-color="#237841"
            />

            <template v-else>
                <div flex="~ col" gap="2" m="b-4" data-testid="missing-summary">
                    <p
                        v-if="entries.length > 0"
                        font="bold"
                        text="lg"
                        :data-total-shortfall="totalShortfall"
                        :data-affected-sets="affectedSetCount"
                    >
                        {{
                            t('parts.missingSummary')
                                .value.replace('{parts}', String(totalShortfall))
                                .replace('{sets}', String(affectedSetCount))
                        }}
                    </p>
                    <div
                        v-if="unknownFamilySetIds.length > 0"
                        p="3"
                        bg="yellow-100"
                        class="brick-border"
                        data-testid="missing-unknown-sets"
                        :data-unknown-count="unknownFamilySetIds.length"
                    >
                        <p text="sm [var(--brick-page-text)]">
                            {{
                                t('parts.missingUnknownSets').value.replace(
                                    '{count}',
                                    String(unknownFamilySetIds.length),
                                )
                            }}
                            <button
                                text="sm [var(--brick-page-text)]"
                                underline
                                font="bold"
                                cursor="pointer"
                                data-testid="missing-unknown-sets-link"
                                @click="goToSettings"
                            >
                                {{ t('parts.missingUnknownSetsLink').value }}
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
                            :placeholder="t('parts.missingSearchPlaceholder').value"
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

                    <EmptyState v-if="filteredEntries.length === 0" :message="t('parts.missingNoResults').value" />

                    <div v-else flex="~ col" gap="2">
                        <PartListItem
                            v-for="entry in filteredEntries"
                            :key="`${entry.partNum}_${entry.colorId}`"
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
                                    {{ t('parts.missingNeedLabel').value }}: {{ entry.quantityNeeded }}x
                                </span>
                                <span
                                    p="x-2 y-0.5"
                                    bg="green-200"
                                    font="bold"
                                    class="brick-border"
                                    border="1"
                                    text="[var(--brick-page-text)]"
                                >
                                    {{ t('parts.missingStoredLabel').value }}: {{ entry.quantityStored }}x
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
                                        t('parts.missingNeededBy').value.replace(
                                            '{count}',
                                            String(entry.neededBySetNums.length),
                                        )
                                    }}
                                </span>
                            </div>
                        </PartListItem>
                    </div>
                </template>
            </template>
        </template>
    </div>
</template>
