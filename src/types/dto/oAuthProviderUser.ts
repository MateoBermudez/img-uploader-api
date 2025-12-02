export interface OAuthProviderUser {
    provider: 'google' | 'github';
    providerId: string;
    name: string;
    email: string | null;
    avatar: string;
}

export type OAuthProvider = 'google' | 'github';