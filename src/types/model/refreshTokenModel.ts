export interface RefreshTokenModel {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    created_at: Date;
    revoked: boolean;
    user_agent: string;
    ip_address: string;
}