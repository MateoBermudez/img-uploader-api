import {Request, Response, NextFunction} from "express";
import AuthRepo from "../repositories/authRepo";
import TemporalUserRepo from "../repositories/temporalUserRepo";
import {AppError} from "./handleError";
import {TemporalUser} from "../types/dto/temporalUser";
import {User} from "../types/dto/user";

export async function resolveUploadOwner(req: Request, _res: Response, next: NextFunction) {
    const userEmail: string | undefined = req.appUser?.email;
    if (userEmail) {
        const user: User | null = await AuthRepo.findUserByEmailOrUsername(userEmail);
        if (!user) throw new AppError("User not found", 404);
        req.uploadContext = { userId: user.id };
        return next();
    }

    const fingerprint: string | undefined = req.guest_fp;
    if (!fingerprint) throw new AppError("Guest fingerprint missing", 400);

    let temp: TemporalUser | undefined = await TemporalUserRepo.findByFingerprint(fingerprint);
    if (!temp) temp = await TemporalUserRepo.create(fingerprint);

    if (temp.hasUploaded) {
        throw new AppError("Free limit reached. Please login to upload more.", 403);
    }

    req.uploadContext = { tempUserId: temp.userId };
    req.tempRecord = temp;
    next();
}