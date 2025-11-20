import pool from "../config/dbConfig.ts";
import {User} from "../types/user.ts";
import {AppError} from "../middlewares/handleError.ts";

class AuthRepo {
    public static async findUserByEmailOrUsername(emailOrUsername: string) {
        const result = await pool.query(
            "SELECT * FROM users WHERE users.email = $1 OR users.username = $1",
            [emailOrUsername]
        );
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            username: row.username,
            passwordHash: row.password_hash
        } as User;
    }

    public static async getUserInfo (emailOrUsername: string) {
        const result = await pool.query(
            "SELECT id, first_name, last_name, date_of_birth, email, username, created_at, is_active, updated_at FROM users " +
            "WHERE users.email = $1 OR users.username = $1",
            [emailOrUsername]
        );
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
        } as User;
    }

    public static async createUser(user: User) {
        const {firstName, lastName, dateOfBirth, email, username, passwordHash} = user;
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, date_of_birth, email, username, password_hash) VALUES 
            ($1, $2, $3, $4, $5, $6) RETURNING id, email, username`,
            [firstName, lastName, dateOfBirth, email, username, passwordHash]
        );
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            username: row.username,
        } as User;
    }

    public static async logoutUser(token: string) {
        try {
            await pool.query(
                "INSERT INTO revoked_tokens (jti, reason) VALUES " +
                "($1, $2)",
                [token, 'User logout']
            );
            return true;
        } catch (err) {
            throw new AppError("Error logging out user", 500);
        }
    }

    public static async saveRefreshToken(id: number, refreshToken: string, expiration: Date, userAgent: string | null, ipAddress: string | null) {
        try {
            await pool.query(
                "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address) VALUES " +
                "($1, $2, $3, $4, $5)",
                [id, refreshToken, expiration, userAgent, ipAddress]
            );
            return true;
        } catch (err) {
            throw new AppError("Error saving refresh token", 500);
        }
    }

    public static async revokeRefreshToken(refreshToken: string) {
        let result;
        try {
            result = await pool.query(
                "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1",
                [refreshToken]
            );
        } catch (err) {
            throw new AppError("Error revoking refresh token", 500);
        }

        if (result.rowCount === 0) {
            throw new AppError("Refresh token not found", 404);
        }

        return true;
    }

    public static async findRefreshToken(refreshToken: string) {
        try {
            const result = await pool.query(
                "SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE",
                [refreshToken]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                userId: row.user_id,
                tokenHash: row.token_hash,
                expiresAt: row.expires_at
            };
        } catch (err) {
            throw new AppError("Error finding refresh token", 500);
        }
    }

    public static async findUserById(userId: string) {
        try {
            const result = await pool.query(
                "SELECT * FROM users WHERE id = $1",
                [userId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                email: row.email,
                username: row.username,
            } as User;
        } catch (err) {
            throw new AppError("Error finding user by ID", 500);
        }
    }

    public static async searchOAuthUser(provider: string, providerId: string) {
        try {
            const { rows: accRows } = await pool.query(
                `SELECT user_id FROM user_providers WHERE provider_name = $1 AND provider_user_id = $2`,
                [provider, providerId]
            );

            if (accRows.length === 0) {
                return null;
            }

            return accRows[0].user_id as string;
        }
        catch (err) {
            throw new AppError("Error searching OAuth user", 500);
        }
    }

    public static async createOAuthUser(user: {
        firstName: string;
        lastName: string;
        email: string;
        username: string;
        provider: string;
        providerId: string;
    }) {
        const userResult = await pool.query(
            `INSERT INTO users (first_name, last_name, date_of_birth, email, username)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, username`,
            [user.firstName, user.lastName, null, user.email, user.username]
        );

        if (userResult.rows.length === 0) {
            throw new AppError("Error creating OAuth user", 500);
        }

        const userId = userResult.rows[0].id as string;

        await pool.query(
            `INSERT INTO user_providers (user_id, provider_name, provider_user_id)
             VALUES ($1, $2, $3)`,
            [userId, user.provider, user.providerId]
        );


        return { id: userId, email: userResult.rows[0].email, username: userResult.rows[0].username };
    }
}

export default AuthRepo;