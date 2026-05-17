export type FamilySetStatus = 'sealed' | 'built' | 'in_progress' | 'in_storage' | 'incomplete' | 'wishlist';

export interface SetSummary {
    id: number;
    setNum: string;
    name: string;
    year: number | null;
    theme: string | null;
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
