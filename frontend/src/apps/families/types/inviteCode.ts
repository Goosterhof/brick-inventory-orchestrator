export interface InviteCode {
    id: number;
    code: string;
    expiresAt: string;
    createdAt: string;
}

export interface EmailInviteCodeRequest {
    recipientEmail: string;
    recipientName?: string;
}
