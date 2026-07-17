import type {MasterShoppingListEntry, MasterShoppingListResponse} from '@app/types/part';
import type {HttpService} from '@script-development/fs-http';
import type {ComputedRef, Ref} from 'vue';

import {computed, ref} from 'vue';

/** Sort fields shared by the missing-parts and unsorted-parts pages. */
export type MissingPartsSortField = 'shortfall' | 'name' | 'color';

/** Chip render order shared by the missing-parts and unsorted-parts pages. */
export const MISSING_PARTS_SORT_FIELDS: readonly MissingPartsSortField[] = ['shortfall', 'name', 'color'];

/**
 * Comparator for master-shopping-list entries: shortfall descending,
 * part name ascending, or color name ascending.
 */
export const compareMissingPartsEntries = (
    a: MasterShoppingListEntry,
    b: MasterShoppingListEntry,
    field: MissingPartsSortField,
): number => {
    if (field === 'shortfall') {
        return b.shortfall - a.shortfall;
    }
    if (field === 'name') {
        return a.partName.localeCompare(b.partName);
    }
    return a.colorName.localeCompare(b.colorName);
};

/**
 * The feed state shared by the missing-parts and unsorted-parts pages.
 * @public
 */
export interface UseMissingPartsFeed {
    /** Shortfall rows from the master shopping list. */
    entries: Ref<MasterShoppingListEntry[]>;
    /** Family-set ids the backend could not resolve to a known set. */
    unknownFamilySetIds: Ref<string[]>;
    /** Whether a fetch is in flight. Starts `true` — pages fetch on mount. */
    loading: Ref<boolean>;
    /** Whether the last fetch failed. */
    loadError: Ref<boolean>;
    /** Fetch (or re-fetch) the master shopping list. */
    fetchMissingParts: () => Promise<void>;
    /** Total parts outstanding across all shortfall rows. */
    totalShortfall: ComputedRef<number>;
    /** Distinct LEGO set numbers affected by at least one shortfall. */
    affectedSetCount: ComputedRef<number>;
}

/**
 * Fetch/totals scaffold for `/family-sets/missing-parts` — the endpoint that
 * powers both PartsMissingPage (shortfall = parts to buy) and
 * PartsUnsortedPage (shortfall = parts to place into storage).
 */
export const useMissingPartsFeed = (httpService: HttpService): UseMissingPartsFeed => {
    const entries = ref<MasterShoppingListEntry[]>([]);
    const unknownFamilySetIds = ref<string[]>([]);
    const loading = ref(true);
    const loadError = ref(false);

    const fetchMissingParts = async (): Promise<void> => {
        loading.value = true;
        loadError.value = false;
        try {
            const response = await httpService.getRequest<MasterShoppingListResponse>('/family-sets/missing-parts');
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

    return {entries, unknownFamilySetIds, loading, loadError, fetchMissingParts, totalShortfall, affectedSetCount};
};
