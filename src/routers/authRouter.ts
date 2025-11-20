import { Router } from "express";
import AuthController from "../controllers/authController.ts";
import authenticate from "../middlewares/authenticate.ts";

function authRouter() {
    const router = Router();

    router.post('/login', AuthController.login);
    router.post('/signup', AuthController.signUp);
    router.post('/logout', authenticate, AuthController.logout);
    router.post('/refresh', AuthController.refreshToken);
    router.get('/me', authenticate, AuthController.me);
    return router;
}

export default authRouter;