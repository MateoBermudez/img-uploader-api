import {Request, Response, NextFunction} from "express";
import AuthRepo from "../repositories/authRepo.ts";
import TemporalUserRepo from "../repositories/temporalUserRepo.ts";
import {AppError} from "./handleError.ts";

export async function resolveUploadOwner(req: Request, _res: Response, next: NextFunction) {
    const userEmail = (req as any).user?.email;
    if (userEmail) {
        const user = await AuthRepo.findUserByEmailOrUsername(userEmail);
        if (!user) throw new AppError("User not found", 404);
        (req as any).uploadContext = { userId: user.id };
        return next();
    }

    const fingerprint = (req as any).guest_fp || (req as any).cookies?.guest_fp;
    if (!fingerprint) throw new AppError("Guest fingerprint missing", 400);

    let temp = await TemporalUserRepo.findByFingerprint(fingerprint);
    if (!temp) temp = await TemporalUserRepo.create(fingerprint);

    if (temp.has_uploaded) {
        throw new AppError("Free limit reached. Please login to upload more.", 403);
    }

    (req as any).uploadContext = { tempUserId: temp.id };
    (req as any).tempRecord = temp;
    next();
}