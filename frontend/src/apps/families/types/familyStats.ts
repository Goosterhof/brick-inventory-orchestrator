export interface FamilyStats {
    totalSets: number;
    totalSetQuantity: number;
    setsByStatus: Record<string, number>;
    totalStorageLocations: number;
    totalUniqueParts: number;
    totalPartsQuantity: number;
}
