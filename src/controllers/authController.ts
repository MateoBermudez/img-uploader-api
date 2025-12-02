import AuthService from "../services/authService";
import { Request, Response } from "express";
import {User} from "../types/dto/user";
import config from "../config/env.config";
import {AppError} from "../middlewares/handleError";
import TemporalUserRepo from "../repositories/temporalUserRepo";
import {AuthResponse} from "../types/dto/authResponse";
import {COOKIE_NAMES} from "../types/constants";

class AuthController {
    public static async login(req: Request, res: Response): Promise<void> {
        const {identifier, password} = req.body;
        const userAgent: string | null = req.get('User-Agent') ?? null;
        const ipAddress: string | null = req.ip ?? req.socket.remoteAddress ?? null;

        const authResponse: AuthResponse = await AuthService.login(identifier, password, userAgent, ipAddress);

        res.cookie(COOKIE_NAMES.REFRESH_TOKEN, authResponse.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        await AuthController.linkToUser(req, identifier, res);

        res.status(200).json({ token: authResponse.accessToken });
    }

    public static async signUp(req: Request, res: Response): Promise<void> {
        const user: User = req.body?.user;
        const userAgent: string | null = req.get('User-Agent') ?? null;
        const ipAddress: string | null = req.ip ?? req.socket.remoteAddress ?? null;

        const authResponse: AuthResponse = await AuthService.signUp(user, userAgent, ipAddress);

        res.cookie(COOKIE_NAMES.REFRESH_TOKEN, authResponse.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        await AuthController.linkToUser(req, user.email, res);

        res.status(200).json({ token: authResponse.accessToken });
    }

    public static async logout(req: Request, res: Response): Promise<void> {
        const authHeader: string | undefined = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError("No access token provided", 401);
        }

        const accessToken: string = authHeader.replace('Bearer ', '');

        const refreshToken: string = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

        if (!refreshToken) {
            throw new AppError("No refresh token provided", 401);
        }

        res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN , {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.clearCookie(COOKIE_NAMES.GUEST_FINGERPRINT, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        await AuthService.logout(accessToken, refreshToken);
        res.status(200).json({ message: "Logged out successfully" });
    }

    public static async refreshToken(req: Request, res: Response): Promise<void> {
        let refreshToken: string = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

        if (!refreshToken) {
            throw new AppError("No refresh token provided", 401)
        }

        const userAgent: string | null = req.get('User-Agent') ?? null;
        const ipAddress: string | null = req.ip ?? req.socket.remoteAddress ?? null;

        const { accessToken, newRefreshToken } = await AuthService.refreshToken(refreshToken, userAgent, ipAddress);

        res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        res.json({ token: accessToken });
    }

    public static async me(req: Request, res: Response): Promise<void> {
        let accessToken: string = req.headers.authorization?.replace('Bearer ', '') ?? '';

        if (!accessToken) {
            throw new AppError("No access token provided", 401)
        }

        const user: User = await AuthService.me(accessToken);
        res.json({ user });
    }

    public static async linkToUser(req: Request, userIdentifier: string, res: Response): Promise<void> {
        const fingerprint: string | undefined = req.guest_fp ?? req.cookies?.[COOKIE_NAMES.GUEST_FINGERPRINT];
        if (!fingerprint) return;

        await TemporalUserRepo.linkToUser(fingerprint, userIdentifier);

        res.clearCookie(COOKIE_NAMES.GUEST_FINGERPRINT, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
    }
}

export default AuthController;