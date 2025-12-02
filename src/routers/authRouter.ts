import { Router } from "express";
import AuthController from "../controllers/authController";
import authenticate from "../middlewares/authenticate";
import guestFingerprint from "../middlewares/guestFingerprint";

function authRouter() {
    const router = Router();

    router.post('/login', guestFingerprint, AuthController.login);
    router.post('/signup', guestFingerprint, AuthController.signUp);
    router.post('/logout', authenticate, AuthController.logout);
    router.post('/refresh', AuthController.refreshToken);
    router.get('/me', authenticate, AuthController.me);
    return router;
}

export default authRouter;