"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../config/env.config"));
const handleError_1 = require("./handleError");
function authenticate(req, _res, next) {
    const { authorization: token } = req.headers;
    if (!token) {
        throw new handleError_1.AppError("No access token provided, you do not have access to this resource", 401);
    }
    const replacedToken = token.replace('Bearer ', '');
    try {
        req.user = jsonwebtoken_1.default.verify(replacedToken, env_config_1.default.jwt.accessSecret, {
            algorithms: [env_config_1.default.jwt.signAlgorithmJwtType],
            ignoreExpiration: false
        });
        next();
    }
    catch (error) {
        throw new handleError_1.AppError("Invalid or expired token", 401);
    }
}
exports.default = authenticate;
