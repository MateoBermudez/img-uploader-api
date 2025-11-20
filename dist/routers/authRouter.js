"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const authenticate_1 = __importDefault(require("../middlewares/authenticate"));
function authRouter() {
    const router = (0, express_1.Router)();
    router.post('/login', authController_1.default.login);
    router.post('/signup', authController_1.default.signUp);
    router.post('/logout', authenticate_1.default, authController_1.default.logout);
    router.post('/refresh', authController_1.default.refreshToken);
    router.get('/me', authenticate_1.default, authController_1.default.me);
    return router;
}
exports.default = authRouter;
