"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
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
        accessSecret: process.env.JWT_ACCESS_SECRET,
        accessExpiration: (process.env.JWT_ACCESS_EXPIRATION ?? '5m'),
        signAlgorithm: process.env.JWT_SIGN_ALGORITHM,
        signAlgorithmJwtType: process.env.JWT_SIGN_ALGORITHM
    },
    refresh: {
        expiration: (process.env.REFRESH_TOKEN_EXPIRATION ?? 7)
    },
    oauth2: {
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
    }
};
exports.default = config;
