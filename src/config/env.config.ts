import dotenv from 'dotenv';
import path from 'path';
import {Algorithm, Secret, SignOptions} from "jsonwebtoken";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
    app: {
        port: parseInt(process.env.PORT ?? '4000', 10),
        env: process.env.NODE_ENV ?? 'development',
        url: process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`,
        frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000'
    },
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        pool_max: parseInt(process.env.DB_POOL_MAX ?? '20', 10)
    },
    security: {
        saltRounds: parseInt(process.env.SALT_ROUNDS ?? '12', 10)
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET as Secret,
        accessExpiration: (process.env.JWT_ACCESS_EXPIRATION ?? '5m') as SignOptions['expiresIn'],
        signAlgorithm: process.env.JWT_SIGN_ALGORITHM as SignOptions['algorithm'],
        signAlgorithmJwtType: process.env.JWT_SIGN_ALGORITHM as Algorithm
    },
    refresh: {
        expiration: (process.env.REFRESH_TOKEN_EXPIRATION ?? 7) as number
    },
    oauth2: {
        session: process.env.SESSION_SECRET,
        google: {
            issuerUrl: process.env.GOOGLE_ISSUER_URL ?? 'https://accounts.google.com',
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
            scope: process.env.GOOGLE_CLIENT_SCOPES ?? '',
        },
        github: {
            issuerUrl: process.env.GITHUB_ISSUER_URL ?? 'https://github.com',
            clientId: process.env.GITHUB_CLIENT_ID ?? '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
            redirectUri: process.env.GITHUB_REDIRECT_URI ?? '',
            scope: process.env.GITHUB_CLIENT_SCOPES ?? '',
        }
    },
    bunny: {
        apiKeyStorage: process.env.BUNNY_API_KEY_STORAGE ?? '',
        storageZone: process.env.BUNNY_STORAGE_ZONE ?? 'img-uploader-api',
        region: process.env.BUNNY_REGION ?? 'br',
        apiKeyLibrary: process.env.BUNNY_API_KEY_LIBRARY ?? '',
        videoLibraryId: process.env.BUNNY_VIDEO_LIBRARY_ID ?? ''
    }
};

export default config;