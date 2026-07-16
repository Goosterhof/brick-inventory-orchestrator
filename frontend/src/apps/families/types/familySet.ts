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

export interface FamilySet {
    id: number;
    setId: number;
    setNum: string;
    quantity: number;
    status: FamilySetStatus;
    purchaseDate: string | null;
    notes: string | null;
    set?: SetSummary;
}

export interface FamilySetCompletion {
    familySetId: number;
    setNum: string;
    totalParts: number | null;
    storedParts: number | null;
    percentage: number | null;
}
