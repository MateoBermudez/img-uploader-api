import { Request, Response, NextFunction } from "express";
import config from "../config/env.config";
import {COOKIE_NAMES} from "../types/constants";

function generateFingerprint() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function guestFingerprint(req: Request, res: Response, next: NextFunction): void {
    const fp: string = req.cookies?.[COOKIE_NAMES.GUEST_FINGERPRINT];
    if (!fp) {
        const newFp: string = generateFingerprint();
        res.cookie(COOKIE_NAMES.GUEST_FINGERPRINT, newFp, {
            maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        req.guest_fp = newFp;
    } else {
        req.guest_fp = fp;
    }
    next();
}
