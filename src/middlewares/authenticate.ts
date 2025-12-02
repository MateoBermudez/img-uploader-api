import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import config from "../config/env.config";
import {AppError} from "./handleError";
import {User} from "../types/dto/user";

function authenticate (req: Request, _res: Response, next: NextFunction) {
    const { authorization: token } = req.headers;

    if (!token) {
        throw new AppError("No access token provided, you do not have access to this resource", 401);
    }

    const replacedToken: string = token.replace('Bearer ', '');

    try {
        const payload = jwt.verify(replacedToken, config.jwt.accessSecret, {
            algorithms: [config.jwt.signAlgorithmJwtType],
            ignoreExpiration: false
        }) as JwtPayload & { sub?: string; email?: string; username?: string };

        req.appUser = {
            email: payload.email,
            username: payload.username
        } as User;

        next();
    } catch (error) {
        throw new AppError("Invalid or expired token", 401);
    }
}

export default authenticate;