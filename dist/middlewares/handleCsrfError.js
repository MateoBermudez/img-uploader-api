"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCsrfError = void 0;
const isCsrfError = (err) => {
    return (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 'EBADCSRFTOKEN');
};
const handleCsrfError = (err, _req, res, next) => {
    if (isCsrfError(err)) {
        return res.status(403).json({
            error: 'csrf',
            message: 'CSRF token validation failed',
        });
    }
    next(err);
};
exports.handleCsrfError = handleCsrfError;
