export interface InviteCode {
    id: number;
    code: string;
    expiresAt: string | null;
    createdAt: string | null;
}

export interface EmailInviteCodeRequest {
    recipientEmail: string;
    recipientName?: string;
}
