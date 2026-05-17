export interface StorageOption {
    id: number;
    name: string;
    description: string | null;
    parentId: number | null;
    row: number | null;
    column: number | null;
    childIds: number[];
}
