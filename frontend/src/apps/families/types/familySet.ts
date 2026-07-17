export type FamilySetStatus = 'sealed' | 'built' | 'in_progress' | 'in_storage' | 'incomplete' | 'wishlist';

/**
 * Mirrors `App\Http\Resources\ThemeResourceData` — the backend serializes a
 * set's theme as a nested object (`{id, name, parent_id}`), camelCased at the
 * HTTP boundary by the response middleware (ADR-0029).
 */
export interface Theme {
    id: number;
    name: string;
    parentId: number | null;
}

export interface SetSummary {
    id: number;
    setNum: string;
    name: string;
    year: number | null;
    theme: Theme | null;
    numParts: number;
    imageUrl: string | null;
}

/**
 * Mirrors `App\Http\Resources\FamilySetResourceData` — the fetched wire shape
 * carries `id, set_id, quantity, status, purchase_date, notes, set` and the
 * set number lives NESTED at `set.set_num` (camelized: `set.setNum`).
 *
 * Top-level `setNum` is optional because it only exists on create-form drafts
 * (see {@link FamilySetDraft}); fetched resources never carry it. Read it via
 * the `familySet.set?.setNum ?? familySet.setNum` fallback.
 */
export interface FamilySet {
    id: number;
    setId: number;
    setNum?: string;
    quantity: number;
    status: FamilySetStatus;
    purchaseDate: string | null;
    notes: string | null;
    set?: SetSummary;
}

/**
 * The create-form draft shape seeded by `familySetStoreModule.generateNew()`.
 * Unlike the fetched resource, the draft always carries a top-level `setNum`
 * (the backend accepts `set_num` on POST and resolves the nested set itself).
 */
export type FamilySetDraft = Omit<FamilySet, 'id' | 'set' | 'setNum'> & {setNum: string};

export interface FamilySetCompletion {
    familySetId: number;
    setNum: string;
    totalParts: number | null;
    storedParts: number | null;
    percentage: number | null;
}
