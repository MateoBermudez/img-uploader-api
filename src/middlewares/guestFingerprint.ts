import { Request, Response, NextFunction } from "express";
import config from "../config/env.config.ts";

function generateFingerprint() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function guestFingerprint(req: Request, res: Response, next: NextFunction) {
    const cookieName = "guest_fp";
    const fp = (req as any).cookies?.[cookieName];
    if (!fp) {
        const newFp = generateFingerprint();
        res.cookie(cookieName, newFp, {
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        (req as any).guest_fp = newFp;
    } else {
        (req as any).guest_fp = fp;
    }
    next();
}
