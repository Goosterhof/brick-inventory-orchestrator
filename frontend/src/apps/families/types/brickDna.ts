interface BrickDnaTopColor {
    colorId: number;
    name: string;
    rgb: string;
    isTransparent: boolean;
    totalQuantity: number;
}

interface BrickDnaTopPartType {
    partId: number;
    partNum: string;
    name: string;
    category: string | null;
    totalQuantity: number;
}

interface BrickDnaRarePart {
    partId: number;
    partNum: string;
    partName: string;
    colorId: number | null;
    colorName: string | null;
    colorRgb: string | null;
    quantity: number;
}

export interface BrickDna {
    topColors: BrickDnaTopColor[];
    topPartTypes: BrickDnaTopPartType[];
    rarestParts: BrickDnaRarePart[];
    diversityScore: number;
    totalUniqueParts: number;
    totalPartsQuantity: number;
}
