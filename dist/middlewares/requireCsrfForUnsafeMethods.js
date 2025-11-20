"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCsrfForUnsafeMethods = void 0;
const csrf_1 = require("./csrf");
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const requireCsrfForUnsafeMethods = (req, res, next) => {
    if (SAFE_METHODS.has(req.method))
        return next();
    return (0, csrf_1.csrfProtection)(req, res, next);
};
exports.requireCsrfForUnsafeMethods = requireCsrfForUnsafeMethods;
exports.default = exports.requireCsrfForUnsafeMethods;
