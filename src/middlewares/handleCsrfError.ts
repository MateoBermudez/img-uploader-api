import { Request, Response, NextFunction } from 'express';

type CsrfError = Error & { code: 'EBADCSRFTOKEN' };

const isCsrfError = (err: unknown): err is CsrfError => {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as Record<string, unknown>).code === 'EBADCSRFTOKEN'
    );
};

export const handleCsrfError = (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    if (isCsrfError(err)) {
        return res.status(403).json({
            error: 'csrf',
            message: 'CSRF token validation failed',
        });
    }
    return next(err as Error);
};
