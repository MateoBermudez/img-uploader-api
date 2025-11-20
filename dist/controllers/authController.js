"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
const env_config_1 = __importDefault(require("../config/env.config"));
const handleError_1 = require("../middlewares/handleError");
class AuthController {
    static async login(req, res) {
        const { identifier, password } = req.body;
        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
        const { accessToken, refreshToken } = await authService_1.default.login(identifier, password, userAgent, ipAddress);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: env_config_1.default.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });
        res.json({ token: accessToken });
    }
    static async signUp(req, res) {
        const user = req.body.user;
        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
        const { accessToken, refreshToken } = await authService_1.default.signUp(user, userAgent, ipAddress);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: env_config_1.default.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });
        res.json({ token: accessToken });
    }
    static async logout(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new handleError_1.AppError("No access token provided", 401);
        }
        const accessToken = authHeader.replace('Bearer ', '');
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new handleError_1.AppError("No refresh token provided", 401);
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });
        await authService_1.default.logout(accessToken, refreshToken);
        res.json({ message: "Logged out successfully" });
    }
    static async refreshToken(req, res) {
        let refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new handleError_1.AppError("No refresh token provided", 401);
        }
        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
        const { accessToken, newRefreshToken } = await authService_1.default.refreshToken(refreshToken, userAgent, ipAddress);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: env_config_1.default.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });
        res.json({ token: accessToken });
    }
    static async me(req, res) {
        let accessToken = req.headers.authorization?.replace('Bearer ', '') ?? '';
        if (!accessToken) {
            throw new handleError_1.AppError("No access token provided", 401);
        }
        const user = await authService_1.default.me(accessToken);
        res.json({ user });
    }
}
exports.default = AuthController;
