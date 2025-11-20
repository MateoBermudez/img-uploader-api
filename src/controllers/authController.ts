import AuthService from "../services/authService.ts";
import { Request, Response } from "express";
import {User} from "../types/user.ts";
import config from "../config/env.config.ts";
import {AppError} from "../middlewares/handleError.ts";
import TemporalUserRepo from "../repositories/temporalUserRepo.ts";

class AuthController {
    public static async login(req: Request, res: Response) {
        const {identifier, password} = req.body;
        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;

        const { accessToken, refreshToken } = await AuthService.login(identifier, password, userAgent, ipAddress);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        await AuthController.linkToUser(req, identifier, res);

        res.json({ token: accessToken });
    }

    public static async signUp(req: Request, res: Response) {
        const user: User = req.body.user;
        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;

        const { accessToken, refreshToken } = await AuthService.signUp(user, userAgent, ipAddress);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        await AuthController.linkToUser(req, user.email, res);

        res.json({ token: accessToken });
    }

    public static async logout(req: Request, res: Response) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError("No access token provided", 401);
        }

        const accessToken = authHeader.replace('Bearer ', '');

        const refreshToken: string = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new AppError("No refresh token provided", 401);
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        res.clearCookie('guest_fp', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        await AuthService.logout(accessToken, refreshToken);
        res.json({ message: "Logged out successfully" });
    }

    public static async refreshToken(req: Request, res: Response) {
        let refreshToken: string = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new AppError("No refresh token provided", 401)
        }

        const userAgent = req.get('User-Agent') ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;

        const { accessToken, newRefreshToken } = await AuthService.refreshToken(refreshToken, userAgent, ipAddress);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            domain: 'localhost'
        });

        res.json({ token: accessToken });
    }

    public static async me(req: Request, res: Response) {
        let accessToken: string = req.headers.authorization?.replace('Bearer ', '') ?? '';

        if (!accessToken) {
            throw new AppError("No access token provided", 401)
        }

        const user: User = await AuthService.me(accessToken);
        res.json({ user });
    }

    public static async linkToUser(req: Request, userIdentifier: string, res: Response) {
        const fingerprint = (req as any).cookies?.guest_fp || (req as any).guest_fp;
        if (!fingerprint) return;

        await TemporalUserRepo.linkToUser(fingerprint, userIdentifier);

        res.clearCookie('guest_fp', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
    }
}

export default AuthController;