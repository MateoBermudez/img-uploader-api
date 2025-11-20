"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = oauthRouter;
const express_1 = __importDefault(require("express"));
const openid = __importStar(require("openid-client"));
const env_config_1 = __importDefault(require("../config/env.config"));
const isProd = env_config_1.default.app.env === 'production';
const appBaseUrl = env_config_1.default.app.url;
const { Issuer, generators } = openid;
const providers = {
    google: {
        issuerUrl: env_config_1.default.oauth2.google.issuerUrl,
        clientId: env_config_1.default.oauth2.google.clientId,
        clientSecret: env_config_1.default.oauth2.google.clientSecret,
        redirectUri: env_config_1.default.oauth2.google.redirectUri || `${appBaseUrl}/v1/auth/oauth/google/callback`,
        scope: env_config_1.default.oauth2.google.scope || 'openid email profile',
    },
    github: {
        issuerUrl: env_config_1.default.oauth2.github.issuerUrl, // discovery may not be supported by GitHub
        clientId: env_config_1.default.oauth2.github.clientId,
        clientSecret: env_config_1.default.oauth2.github.clientSecret,
        redirectUri: env_config_1.default.oauth2.github.redirectUri || `${appBaseUrl}/v1/auth/oauth/github/callback`,
        scope: env_config_1.default.oauth2.github.scope || 'read:user user:email',
    }
};
const clientCache = {};
async function getClient(provider) {
    if (clientCache[provider])
        return clientCache[provider];
    const p = providers[provider];
    if (!p.issuerUrl)
        throw new Error(`Issuer URL not configured for provider '${provider}'`);
    const issuer = await Issuer.discover(p.issuerUrl);
    clientCache[provider] = new issuer.Client({
        client_id: p.clientId,
        client_secret: p.clientSecret,
        redirect_uris: [p.redirectUri],
        response_types: ['code'],
    });
    return clientCache[provider];
}
function setTempCookie(res, name, value) {
    res.cookie(name, value, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 5 * 60 * 1000,
        path: '/v1/auth/oauth',
    });
}
function clearTempCookies(res) {
    for (const name of ['oauth_state', 'oauth_code_verifier', 'oauth_nonce']) {
        res.clearCookie(name, { path: '/v1/auth/oauth' });
    }
}
function oauthRouter() {
    const router = express_1.default.Router();
    router.get('/:provider', async (req, res, next) => {
        try {
            const providerParam = req.params.provider;
            if (!providerParam)
                return res.status(400).json({ error: 'Provider param missing' });
            const provider = providerParam;
            if (!(provider in providers))
                return res.status(404).json({ error: 'Unsupported provider' });
            const client = await getClient(provider);
            const state = generators.state();
            const nonce = generators.nonce();
            const code_verifier = generators.codeVerifier();
            const code_challenge = generators.codeChallenge(code_verifier);
            setTempCookie(res, 'oauth_state', state);
            setTempCookie(res, 'oauth_nonce', nonce);
            setTempCookie(res, 'oauth_code_verifier', code_verifier);
            const authUrl = client.authorizationUrl({
                scope: providers[provider].scope,
                redirect_uri: providers[provider].redirectUri,
                response_type: 'code',
                code_challenge,
                code_challenge_method: 'S256',
                state,
                nonce,
            });
            return res.redirect(authUrl);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:provider/callback', async (req, res, next) => {
        try {
            const providerParam = req.params.provider;
            if (!providerParam)
                return res.status(400).json({ error: 'Provider param missing' });
            const provider = providerParam;
            if (!(provider in providers))
                return res.status(404).json({ error: 'Unsupported provider' });
            const client = await getClient(provider);
            const params = client.callbackParams(req);
            const sentState = req.cookies['oauth_state'];
            const nonce = req.cookies['oauth_nonce'];
            const code_verifier = req.cookies['oauth_code_verifier'];
            if (!params.state || !sentState || params.state !== sentState) {
                return res.status(400).json({ error: 'Invalid state' });
            }
            if (!code_verifier || !nonce) {
                return res.status(400).json({ error: 'Missing PKCE/nonce parameters' });
            }
            const tokenSet = await client.callback(providers[provider].redirectUri, params, { state: sentState, nonce, code_verifier });
            // If you need user profile info, you can extract OIDC claims like this:
            // const claims = tokenSet.claims(); // e.g., claims.sub, claims.email, claims.name
            // TODO: Find or create local user using claims.sub/email.
            // const user = await usersRepo.findOrCreateFromOAuth({ provider, sub: claims.sub, email: claims.email });
            // TODO: Issue internal access/refresh tokens and set them as cookies.
            // const { accessToken, refreshToken } = await issueTokens(user.id);
            // res.cookie('access_token', accessToken, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 15 * 60 * 1000 });
            // res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 30 * 24 * 60 * 60 * 1000 });
            clearTempCookies(res);
            const frontendUrl = env_config_1.default.app.frontendUrl;
            return res.redirect(frontendUrl);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
