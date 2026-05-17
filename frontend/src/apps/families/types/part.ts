import type {FamilySetStatus} from './familySet';

export interface Part {
    id: number;
    partNum: string;
    name: string;
    category: string | null;
    imageUrl: string | null;
}

export interface Color {
    id: number;
    name: string;
    rgb: string;
    isTransparent: boolean;
}

export interface SetPart {
    id: number;
    quantity: number;
    isSpare: boolean;
    elementId: string | null;
    part: Part;
    color: Color;
}

export interface SetWithParts {
    id: number;
    setNum: string;
    name: string;
    year: number | null;
    theme: string | null;
    numParts: number;
    imageUrl: string | null;
    parts: SetPart[];
}

export interface StorageMapEntry {
    partId: number;
    colorId: number | null;
    storageOptionId: number;
    storageOptionName: string;
    quantity: number;
}

export interface StorageMapResponse {
    entries: StorageMapEntry[];
}

export interface FamilyPartEntry {
    partId: number;
    partNum: string;
    partName: string;
    partImageUrl: string | null;
    colorId: number | null;
    colorName: string | null;
    colorRgb: string | null;
    storageOptionId: number;
    storageOptionName: string;
    quantity: number;
    familySetId: number | null;
}

export interface GroupedFamilyPart {
    partId: number;
    partNum: string;
    partName: string;
    partImageUrl: string | null;
    colorId: number | null;
    colorName: string | null;
    colorRgb: string | null;
    totalQuantity: number;
    isOrphan: boolean;
    locations: {storageOptionId: number; storageOptionName: string; quantity: number}[];
}

export interface CursorPaginatedParts {
    data: FamilyPartEntry[];
    nextCursor: string | null;
    prevCursor: string | null; // API returns prevCursor but pagination is forward-only; retained for type accuracy
    path: string;
    perPage: number;
}

export interface StorageOptionPart {
    id: number;
    storageOptionId: number;
    quantity: number;
    part: Part;
    color: Color | null;
}

/**
 * One row of the master shopping list — a (part_num, color_id) pair the
 * family is short on across all non-wishlist owned sets.
 *
 * Shape mirrors `App\Http\Resources\FamilyMissingPartsResourceData`'s
 * `shortfalls` array (camelCased at the HTTP boundary by the response
 * middleware on `familyHttpService` — see ADR-016). The backend ships both
 * the LEGO catalog `part_num` string id AND an internal numeric `part_id`
 * (sourced from `parts.id`, added in backend PR #178). The numeric `partId`
 * is what the storage-options POST endpoint expects — see PlacePartModal.
 * The backend also ships `color_hex` (hex RGB) from `colors.rgb`, not a
 * separate `color_rgb` column.
 */
export interface MasterShoppingListEntry {
    partId: number;
    partNum: string;
    colorId: number;
    partName: string;
    colorName: string;
    colorHex: string;
    partImageUrl: string | null;
    quantityNeeded: number;
    quantityStored: number;
    shortfall: number;
    /**
     * LEGO set numbers (e.g. "75313-1", "10497-1") that need this part —
     * NOT family_set ids. Matches `needed_by_set_nums: list<string>` in the
     * backend Resource.
     */
    neededBySetNums: string[];
}

/**
 * `unknownFamilySetIds` is `string[]` because the backend casts each
 * family_set id with `(string)` before serializing — see
 * `GetFamilyMissingPartsAction::execute()` line 178. Treat as opaque ids.
 */
export interface MasterShoppingListResponse {
    shortfalls: MasterShoppingListEntry[];
    unknownFamilySetIds: string[];
}

export interface FamilyPartUsageEntry {
    familySetId: number;
    setNum: string;
    setName: string;
    status: FamilySetStatus;
    quantityNeeded: number;
    quantityStored: number;
    shortfall: number;
}

export interface FamilyPartUsageResponse {
    partNum: string;
    partName: string | null;
    partImageUrl: string | null;
    colorId: number;
    colorName: string | null;
    colorHex: string | null;
    usages: FamilyPartUsageEntry[];
}
