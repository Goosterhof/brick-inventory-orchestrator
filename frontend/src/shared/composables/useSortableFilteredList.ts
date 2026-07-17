import type {ComputedRef, Ref} from 'vue';

import {computed, ref, shallowRef} from 'vue';

/**
 * Configuration for {@link useSortableFilteredList}.
 * @public
 */
export interface SortableFilteredListOptions<Item, Field extends string, LabelKey extends string> {
    /** Source list — a ref or computed. The composable never mutates it. */
    items: Ref<Item[]> | ComputedRef<Item[]>;
    /** The sort fields, in the order their chips render. */
    fields: readonly Field[];
    /** The field active before the user picks a chip. */
    defaultField: Field;
    /** Translation key per field, used for the chip labels. */
    sortLabelKey: Readonly<Record<Field, LabelKey>>;
    /** Comparator invoked with the currently active sort field. */
    compare: (a: Item, b: Item, field: Field) => number;
    /** Text fragments matched case-insensitively against the search query. */
    searchText: (item: Item) => readonly string[];
    /** Optional extra predicate (e.g. color or orphan chips) applied alongside the search filter. */
    filter?: (item: Item) => boolean;
}

/**
 * The shape consumed by template bindings.
 * @public
 */
export interface UseSortableFilteredList<Item, Field extends string, LabelKey extends string> {
    /** Bind to the search input. Lowercased and trimmed before matching; blank means "no search filter". */
    searchQuery: Ref<string>;
    /** The currently active sort field. */
    activeSortField: Ref<Field>;
    /** Chip click handler — activates the given sort field. */
    setSortField: (field: Field) => void;
    /** The sort fields, in chip render order. */
    allSortFields: readonly Field[];
    /** Translation key per field, for the chip labels. */
    sortLabelKey: Readonly<Record<Field, LabelKey>>;
    /** The searched, filtered, and sorted list. */
    filteredItems: ComputedRef<Item[]>;
}

/**
 * Client-side sort-chip + search-filter scaffold for list pages.
 *
 * Owns the `activeSortField` / `setSortField` / `allSortFields` / `sortLabelKey`
 * chip apparatus and a comparator-driven `filteredItems` computed. The page
 * keeps ownership of what is domain-specific — the comparator, the searchable
 * text per item, and any extra filter predicates — and binds the rest.
 * @public
 */
export const useSortableFilteredList = <Item, Field extends string, LabelKey extends string>(
    options: SortableFilteredListOptions<Item, Field, LabelKey>,
): UseSortableFilteredList<Item, Field, LabelKey> => {
    const searchQuery = ref('');
    const activeSortField: Ref<Field> = shallowRef<Field>(options.defaultField);

    const setSortField = (field: Field): void => {
        activeSortField.value = field;
    };

    const filteredItems = computed((): Item[] => {
        let result = options.items.value;

        const query = searchQuery.value.toLowerCase().trim();
        if (query) {
            result = result.filter((item) =>
                options.searchText(item).some((text) => text.toLowerCase().includes(query)),
            );
        }

        const extraFilter = options.filter;
        if (extraFilter) {
            result = result.filter((item) => extraFilter(item));
        }

        return [...result].sort((a, b) => options.compare(a, b, activeSortField.value));
    });

    return {
        searchQuery,
        activeSortField,
        setSortField,
        allSortFields: options.fields,
        sortLabelKey: options.sortLabelKey,
        filteredItems,
    };
};
