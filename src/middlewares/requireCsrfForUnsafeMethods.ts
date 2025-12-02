import { RequestHandler } from 'express';
import { csrfProtection } from './csrf';
import {SAFE_METHODS, SAFE_URIS} from "../types/constants";

export const requireCsrfForUnsafeMethods: RequestHandler = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (req.path.includes(SAFE_URIS.VIDEO_STATUS_UPDATE)) return next();
    return csrfProtection(req, res, next);
};

export default requireCsrfForUnsafeMethods;