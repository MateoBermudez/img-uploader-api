"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const handleError_1 = require("../middlewares/handleError");
class AuthRepo {
    static async findUserByEmailOrUsername(emailOrUsername) {
        const result = await dbConfig_1.default.query("SELECT * FROM users WHERE users.email = $1 OR users.username = $1", [emailOrUsername]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            username: row.username,
            passwordHash: row.password_hash
        };
    }
    static async getUserInfo(emailOrUsername) {
        const result = await dbConfig_1.default.query("SELECT id, first_name, last_name, date_of_birth, email, username, created_at, is_active, updated_at FROM users " +
            "WHERE users.email = $1 OR users.username = $1", [emailOrUsername]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            dateOfBirth: row.date_of_birth,
            email: row.email,
            username: row.username,
            isActive: row.is_active,
            updatedAt: row.updated_at,
            createdAt: row.created_at
        };
    }
    static async createUser(user) {
        const { firstName, lastName, dateOfBirth, email, username, passwordHash } = user;
        const result = await dbConfig_1.default.query("INSERT INTO users (first_name, last_name, date_of_birth, email, username, password_hash) VALUES " +
            "($1, $2, $3, $4, $5, $6) RETURNING *", [firstName, lastName, dateOfBirth, email, username, passwordHash]);
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            username: row.username,
        };
    }
    static async logoutUser(token) {
        try {
            await dbConfig_1.default.query("INSERT INTO revoked_tokens (jti, reason) VALUES " +
                "($1, $2)", [token, 'User logout']);
            return true;
        }
        catch (err) {
            throw new handleError_1.AppError("Error logging out user", 500);
        }
    }
    static async saveRefreshToken(id, refreshToken, expiration, userAgent, ipAddress) {
        try {
            await dbConfig_1.default.query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address) VALUES " +
                "($1, $2, $3, $4, $5)", [id, refreshToken, expiration, userAgent, ipAddress]);
            return true;
        }
        catch (err) {
            throw new handleError_1.AppError("Error saving refresh token", 500);
        }
    }
    static async revokeRefreshToken(refreshToken) {
        let result;
        try {
            result = await dbConfig_1.default.query("UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1", [refreshToken]);
        }
        catch (err) {
            throw new handleError_1.AppError("Error revoking refresh token", 500);
        }
        if (result.rowCount === 0) {
            throw new handleError_1.AppError("Refresh token not found", 404);
        }
        return true;
    }
    static async findRefreshToken(refreshToken) {
        try {
            const result = await dbConfig_1.default.query("SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE", [refreshToken]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                userId: row.user_id,
                tokenHash: row.token_hash,
                expiresAt: row.expires_at
            };
        }
        catch (err) {
            throw new handleError_1.AppError("Error finding refresh token", 500);
        }
    }
    static async findUserById(userId) {
        try {
            const result = await dbConfig_1.default.query("SELECT * FROM users WHERE id = $1", [userId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                email: row.email,
                username: row.username,
            };
        }
        catch (err) {
            throw new handleError_1.AppError("Error finding user by ID", 500);
        }
    }
}
exports.default = AuthRepo;
