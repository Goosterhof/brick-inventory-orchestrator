<script setup lang="ts">
import type {FamilySetCompletion, FamilySetStatus} from '@app/types/familySet';

import {
    familyHttpService,
    familyLoadingService,
    familyRouterService,
    familySoundService,
    familyTranslationService,
} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import CollapsibleSection from '@shared/components/CollapsibleSection.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {downloadCsv, toCsv} from '@shared/helpers/csv';
import {computed, onMounted, ref} from 'vue';

import SetListItem from '../components/SetListItem.vue';

type ViewMode = 'grouped' | 'flat';

const {t} = familyTranslationService;
const {isLoading} = familyLoadingService;
const {getAll, retrieveAll} = familySetStoreModule;

const searchQuery = ref('');
const activeStatusFilter = ref<FamilySetStatus | null>(null);
const activeThemeFilters = ref<Set<string>>(new Set());
const expandedThemes = ref<Set<string>>(new Set());
const viewMode = ref<ViewMode>('grouped');
const completionByFamilySetId = ref<Map<number, FamilySetCompletion>>(new Map());
const completionLoading = ref(true);

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

const allStatuses: FamilySetStatus[] = ['sealed', 'in_progress', 'built', 'in_storage', 'incomplete', 'wishlist'];

const UNKNOWN_THEME = 'Unknown';

const filteredSets = computed(() => {
    let result = getAll.value;

    if (activeStatusFilter.value) {
        result = result.filter((s) => s.status === activeStatusFilter.value);
    }

    if (activeThemeFilters.value.size > 0) {
        result = result.filter((s) => activeThemeFilters.value.has(s.set?.theme ?? UNKNOWN_THEME));
    }

    const query = searchQuery.value.toLowerCase().trim();
    if (query) {
        result = result.filter((s) => {
            const name = (s.set?.name ?? '').toLowerCase();
            const setNum = (s.set?.setNum ?? s.setNum).toLowerCase();
            return name.includes(query) || setNum.includes(query);
        });
    }

    return result;
});

const allThemes = computed(() => {
    const themes = new Set<string>();
    for (const s of getAll.value) {
        themes.add(s.set?.theme ?? UNKNOWN_THEME);
    }
    return [...themes].sort();
});

const groupedSets = computed(() => {
    const groups: {theme: string; sets: typeof filteredSets.value}[] = [];
    const map = new Map<string, typeof filteredSets.value>();

    for (const s of filteredSets.value) {
        const theme = s.set?.theme ?? UNKNOWN_THEME;
        const existing = map.get(theme);
        if (existing) {
            existing.push(s);
        } else {
            const arr = [s];
            map.set(theme, arr);
        }
    }

    for (const [theme, sets] of map) {
        groups.push({theme, sets});
    }

    return groups.sort((a, b) => a.theme.localeCompare(b.theme));
});

const flatSets = computed(() =>
    [...filteredSets.value].sort((a, b) => (a.set?.name ?? a.setNum).localeCompare(b.set?.name ?? b.setNum)),
);

const toggleStatusFilter = (status: FamilySetStatus) => {
    activeStatusFilter.value = activeStatusFilter.value === status ? null : status;
};

const toggleThemeFilter = (theme: string) => {
    const next = new Set(activeThemeFilters.value);
    if (next.has(theme)) {
        next.delete(theme);
    } else {
        next.add(theme);
    }
    activeThemeFilters.value = next;
};

const toggleThemeExpanded = (theme: string) => {
    const next = new Set(expandedThemes.value);
    if (next.has(theme)) {
        next.delete(theme);
    } else {
        next.add(theme);
    }
    expandedThemes.value = next;
};

const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode;
};

const fetchCompletion = async (): Promise<void> => {
    completionLoading.value = true;
    try {
        const response = await familyHttpService.getRequest<FamilySetCompletion[]>('/family-sets/completion');
        const next = new Map<number, FamilySetCompletion>();
        for (const entry of response.data) {
            next.set(entry.familySetId, entry);
        }
        completionByFamilySetId.value = next;
    } catch {
        completionByFamilySetId.value = new Map();
    } finally {
        completionLoading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([retrieveAll(), fetchCompletion()]);
});

const goToAdd = async () => {
    await familyRouterService.goToRoute('sets-add');
};

const goToScan = async () => {
    await familyRouterService.goToRoute('sets-scan');
};

const goToDetail = async (id: number) => {
    await familyRouterService.goToRoute('sets-detail', id);
};

type AdaptedSet = (typeof getAll)['value'][number];

const orEmpty = (value: string | number | null | undefined): string => String(value ?? '');

const toCsvRow = (s: AdaptedSet): string[] => {
    const set = s.set;
    return [
        set?.setNum ?? s.setNum,
        orEmpty(set?.name),
        orEmpty(set?.year),
        orEmpty(set?.theme),
        orEmpty(set?.numParts),
        String(s.quantity),
        s.status,
        orEmpty(s.purchaseDate),
        orEmpty(s.notes),
    ];
};

const completionFor = (familySetId: number): number | null =>
    completionByFamilySetId.value.get(familySetId)?.percentage ?? null;

const exportCsv = () => {
    const headers = ['Set Number', 'Name', 'Year', 'Theme', 'Parts', 'Quantity', 'Status', 'Purchase Date', 'Notes'];
    downloadCsv(toCsv(headers, filteredSets.value.map(toCsvRow)), 'lego-sets.csv');
};
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <PageHeader :title="t('sets.title').value">
            <div flex gap="2" flex-wrap="wrap">
                <PrimaryButton :sound-service="familySoundService" @click="goToScan">{{
                    t('sets.scanSet').value
                }}</PrimaryButton>
                <PrimaryButton :sound-service="familySoundService" @click="goToAdd">{{
                    t('sets.addSet').value
                }}</PrimaryButton>
                <PrimaryButton v-if="getAll.length > 0" :sound-service="familySoundService" @click="exportCsv">{{
                    t('common.export').value
                }}</PrimaryButton>
            </div>
        </PageHeader>

        <p v-if="isLoading" text="[var(--brick-muted-text)]">{{ t('common.loading').value }}</p>

        <EmptyState
            v-else-if="getAll.length === 0"
            :message="t('sets.noSets').value"
            show-brick
            brick-color="#F5C518"
        />

        <template v-else>
            <div flex="~ col" gap="4" m="b-4">
                <TextInput
                    v-model="searchQuery"
                    :label="t('common.search').value"
                    type="search"
                    :placeholder="t('sets.searchPlaceholder').value"
                    optional
                />

                <div flex gap="2" flex-wrap="wrap">
                    <FilterChip :active="viewMode === 'grouped'" @click="setViewMode('grouped')">
                        {{ t('sets.viewByTheme').value }}
                    </FilterChip>
                    <FilterChip :active="viewMode === 'flat'" @click="setViewMode('flat')">
                        {{ t('sets.viewAllSets').value }}
                    </FilterChip>
                </div>

                <div flex gap="2" flex-wrap="wrap">
                    <FilterChip
                        v-for="status in allStatuses"
                        :key="status"
                        :active="activeStatusFilter === status"
                        @click="toggleStatusFilter(status)"
                    >
                        {{ t(statusKey[status]).value }}
                    </FilterChip>
                </div>

                <div v-if="allThemes.length > 1" flex gap="2" flex-wrap="wrap">
                    <FilterChip
                        v-for="theme in allThemes"
                        :key="theme"
                        :active="activeThemeFilters.has(theme)"
                        @click="toggleThemeFilter(theme)"
                    >
                        {{ theme }}
                    </FilterChip>
                </div>
            </div>

            <EmptyState v-if="filteredSets.length === 0" :message="t('common.noResults').value" />

            <div v-else-if="viewMode === 'grouped'" flex="~ col" gap="4">
                <CollapsibleSection
                    v-for="group in groupedSets"
                    :key="group.theme"
                    :title="group.theme"
                    :count="group.sets.length"
                    :expanded="expandedThemes.has(group.theme)"
                    @toggle="toggleThemeExpanded(group.theme)"
                >
                    <div flex="~ col" gap="4" p="t-4">
                        <SetListItem
                            v-for="familySet in group.sets"
                            :key="familySet.id"
                            :family-set="familySet"
                            :completion-percentage="completionFor(familySet.id)"
                            :completion-loading="completionLoading"
                            @click="goToDetail(familySet.id)"
                        />
                    </div>
                </CollapsibleSection>
            </div>

            <div v-else flex="~ col" gap="4">
                <SetListItem
                    v-for="familySet in flatSets"
                    :key="familySet.id"
                    :family-set="familySet"
                    :completion-percentage="completionFor(familySet.id)"
                    :completion-loading="completionLoading"
                    @click="goToDetail(familySet.id)"
                />
            </div>
        </template>
    </div>
</template>
