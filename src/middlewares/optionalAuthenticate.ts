import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import config from "../config/env.config.ts";
import {User} from "../types/user.ts";
import {AppError} from "./handleError.ts";

function validateToken(token: string | undefined) {
    if (!token) {
        return null;
    }
    try {
        return jwt.verify(token, config.jwt.accessSecret, {
            algorithms: [config.jwt.signAlgorithmJwtType]
        }) as JwtPayload & { email?: string; username?: string };
    } catch {
        return null;
    }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }

    const payload = validateToken(authHeader?.replace("Bearer ", ""));

    if (payload) {
        (req as any).user = {
            email: payload.email,
            username: payload.username
        } as User;
        return next();
    }

    throw new AppError("Invalid access token", 401);
}
