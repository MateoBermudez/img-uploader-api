import { RequestHandler } from 'express';
import { csrfProtection } from './csrf.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requireCsrfForUnsafeMethods: RequestHandler = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    return csrfProtection(req, res, next);
};

export default requireCsrfForUnsafeMethods;