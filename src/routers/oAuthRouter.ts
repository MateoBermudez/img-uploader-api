import { Router } from 'express';
import OAuthController from '../controllers/oAuthController.ts';
import guestFingerprint from "../middlewares/guestFingerprint.ts";

function oauthRouter() {
    const router = Router();

    router.get('/google', guestFingerprint, OAuthController.initiateOAuth('google'));
    router.get('/google/callback', guestFingerprint, OAuthController.oauthCallbackHandler('google'));

    router.get('/github', guestFingerprint, OAuthController.initiateOAuth('github'));
    router.get('/github/callback', guestFingerprint, OAuthController.oauthCallbackHandler('github'));

    router.get('/success', OAuthController.loginSuccess);
    router.get('/failed', OAuthController.loginFailed);
    router.get('/logout', OAuthController.logout);

    return router;
}

export default oauthRouter;
