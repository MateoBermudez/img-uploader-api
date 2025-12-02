export const COOKIE_NAMES = {
    REFRESH_TOKEN: 'refreshToken',
    GUEST_FINGERPRINT: 'guest_fp',
} as const;

export const SAFE_URIS = {
    VIDEO_STATUS_UPDATE: '/media/video/update-status',
} as const;

export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);