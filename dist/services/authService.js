"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authRepo_1 = __importDefault(require("../repositories/authRepo"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../config/env.config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const handleError_1 = require("../middlewares/handleError");
class AuthService {
    static async login(identifier, password, userAgent, ipAddress) {
        if (!identifier || !password) {
            throw new handleError_1.AppError("Identifier and password are required", 400);
        }
        const user = await authRepo_1.default.findUserByEmailOrUsername(identifier);
        if (!user) {
            throw new handleError_1.AppError("User not found", 404);
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new handleError_1.AppError("Invalid password", 401);
        }
        const { accessToken, refreshToken, expiration } = await AuthService.createTokens(user);
        await authRepo_1.default.saveRefreshToken(user.id, refreshToken, expiration, userAgent, ipAddress);
        return { accessToken, refreshToken };
    }
    static async signUp(user, userAgent, ipAddress) {
        const saltRounds = env_config_1.default.security.saltRounds;
        if (!user) {
            throw new handleError_1.AppError("User data is required", 400);
        }
        if (!user.email || !user.username || !user.passwordHash) {
            throw new handleError_1.AppError("Email, username, and password are required", 400);
        }
        const searchUser = await authRepo_1.default.findUserByEmailOrUsername(user.email);
        if (searchUser) {
            throw new handleError_1.AppError("User with this email or username already exists", 409);
        }
        user.passwordHash = await bcrypt_1.default.hash(user.passwordHash, saltRounds);
        const createdUser = await authRepo_1.default.createUser(user);
        const { accessToken, refreshToken, expiration } = await AuthService.createTokens(user);
        await authRepo_1.default.saveRefreshToken(createdUser.id, refreshToken, expiration, userAgent, ipAddress);
        return { accessToken, refreshToken };
    }
    static async logout(accessToken, refreshToken) {
        await authRepo_1.default.revokeRefreshToken(refreshToken);
        return authRepo_1.default.logoutUser(accessToken);
    }
    static async refreshToken(refreshToken, userAgent, ipAddress) {
        const storedToken = await authRepo_1.default.findRefreshToken(refreshToken);
        if (!storedToken) {
            throw new handleError_1.AppError("Invalid refresh token", 401);
        }
        if (new Date() > storedToken.expiresAt) {
            throw new handleError_1.AppError("Refresh token has expired", 401);
        }
        const user = await authRepo_1.default.findUserById(storedToken.userId);
        if (!user) {
            throw new handleError_1.AppError("User not found", 404);
        }
        await authRepo_1.default.revokeRefreshToken(refreshToken);
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiration } = await AuthService.createTokens(user);
        await authRepo_1.default.saveRefreshToken(user.id, newRefreshToken, expiration, userAgent, ipAddress);
        return { accessToken: newAccessToken, newRefreshToken: newRefreshToken };
    }
    static async createTokens(user) {
        const accessToken = jsonwebtoken_1.default.sign({ username: user.username, email: user.email }, env_config_1.default.jwt.accessSecret, {
            expiresIn: env_config_1.default.jwt.accessExpiration,
            algorithm: env_config_1.default.jwt.signAlgorithm
        });
        const refreshToken = crypto_1.default.randomBytes(64).toString('hex');
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + env_config_1.default.refresh.expiration);
        return { accessToken, refreshToken, expiration };
    }
    static async me(accessToken) {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(accessToken, env_config_1.default.jwt.accessSecret, {
                algorithms: [env_config_1.default.jwt.signAlgorithmJwtType],
                ignoreExpiration: false
            });
        }
        catch (error) {
            throw new handleError_1.AppError("Invalid or expired token", 401);
        }
        const user = await authRepo_1.default.getUserInfo(decoded.email);
        if (!user) {
            throw new handleError_1.AppError("User not found", 404);
        }
        return user;
    }
}
exports.default = AuthService;
