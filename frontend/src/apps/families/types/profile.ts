export interface Profile {
    id: number;
    familyId: number;
    name: string;
    email: string;
    emailVerifiedAt: string | null;
}

export interface FamilyMember {
    id: number;
    name: string;
    email: string;
    isHead: boolean;
}
