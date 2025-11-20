import {User} from "../types/user.ts";
import AuthRepo from "../repositories/authRepo.ts";
import jwt from 'jsonwebtoken';
import config from "../config/env.config.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {AppError} from "../middlewares/handleError.ts";
import {OAuthProviderUser} from "../types/oAuthProviderUser.ts";

class AuthService {
    public static async login(identifier: string, password: string, userAgent: string | null, ipAddress: string | null) {
        if (!identifier || !password) {
            throw new AppError("Identifier and password are required", 400);
        }
        const user: User | null = await AuthRepo.findUserByEmailOrUsername(identifier);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError("Invalid password", 401);
        }

        const { accessToken, refreshToken, expiration } = await AuthService.createTokens(user);

        await AuthRepo.saveRefreshToken(user.id, refreshToken, expiration, userAgent, ipAddress);

        return { accessToken, refreshToken };
    }

    public static async signUp(user: User, userAgent: string | null, ipAddress: string | null) {
        const saltRounds: number = config.security.saltRounds;
        if (!user) {
            throw new AppError("User data is required", 400);
        }
        if (!user.email || !user.username || !user.passwordHash) {
            throw new AppError("Email, username, and password are required", 400);
        }
        const searchUser: User | null = await AuthRepo.findUserByEmailOrUsername(user.email);

        if (searchUser) {
            throw new AppError("User with this email or username already exists", 409);
        }

        user.passwordHash = await bcrypt.hash(user.passwordHash, saltRounds);

        const createdUser: User = await AuthRepo.createUser(user);

        const { accessToken, refreshToken, expiration } = await AuthService.createTokens(user);

        await AuthRepo.saveRefreshToken(createdUser.id, refreshToken, expiration, userAgent, ipAddress);

        return { accessToken, refreshToken };
    }

    public static async logout(accessToken: string, refreshToken: string) {
        await AuthRepo.revokeRefreshToken(refreshToken);
        return AuthRepo.logoutUser(accessToken);
    }

    public static async refreshToken(refreshToken: string, userAgent: string | null, ipAddress: string | null) {
        const storedToken = await AuthRepo.findRefreshToken(refreshToken);

        if (!storedToken) {
            throw new AppError("Invalid refresh token", 401);
        }

        if (new Date() > storedToken.expiresAt) {
            throw new AppError("Refresh token has expired", 401);
        }

        const user: User | null = await AuthRepo.findUserById(storedToken.userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        await AuthRepo.revokeRefreshToken(refreshToken);

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiration } = await AuthService.createTokens(user);

        await AuthRepo.saveRefreshToken(user.id, newRefreshToken, expiration, userAgent, ipAddress);

        return { accessToken: newAccessToken, newRefreshToken: newRefreshToken };
    }

    private static async createTokens (user: User) {
        const accessToken = jwt.sign(
            {username: user.username, email: user.email},
            config.jwt.accessSecret,
            {
                expiresIn: config.jwt.accessExpiration,
                algorithm: config.jwt.signAlgorithm
            }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + config.refresh.expiration);

        return { accessToken, refreshToken, expiration };
    }

    public static async me (accessToken: string) {
        let decoded: jwt.JwtPayload;
        try {
            decoded = jwt.verify(accessToken, config.jwt.accessSecret, {
                algorithms: [config.jwt.signAlgorithmJwtType],
                ignoreExpiration: false
            }) as jwt.JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired token", 401);
        }

            const user: User | null = await AuthRepo.getUserInfo(decoded.email);

            if (!user) {
                throw new AppError("User not found", 404);
            }

            return user;
    }

    public static async oauthUpsertAndLogin(
        p: OAuthProviderUser,
        userAgent: string | null,
        ipAddress: string | null
    ): Promise<{ accessToken: string; refreshToken: string, email: string }> {
        let userId: string | null = await AuthRepo.searchOAuthUser(p.provider, p.providerId);

        if (!userId) {
            const fullName = (p.name ?? '').trim();
            const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [''];
            const lastName = rest.join(' ');
            const email = p.email ?? `${p.provider}_${p.providerId}@placeholder.local`;

            const usernameBase = fullName.replace(' ', '');
            const username = await AuthService.generateUniqueUsername(usernameBase);

            const newUser = await AuthRepo.createOAuthUser({
                firstName,
                lastName,
                email,
                username,
                provider: p.provider,
                providerId: p.providerId
            });

            userId = String(newUser.id);
        }

        const user: User | null = await AuthRepo.findUserById(userId);

        if (!user) {
            throw new AppError("User not found after OAuth upsert", 500);
        }

        const { accessToken, refreshToken, expiration } = await AuthService.createTokens(user);

        await AuthRepo.saveRefreshToken(user.id, refreshToken, expiration, userAgent, ipAddress);

        return { accessToken, refreshToken, email: user.email };
    }

    private static usernameWithoutAccents(input: string) {
        const withoutAccents = input
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return withoutAccents || 'user';
    }

    private static async generateUniqueUsername(base: string) {
        const baseNorm = AuthService.usernameWithoutAccents(base);
        let candidate = baseNorm;
        let n = 0;
        while (await AuthRepo.findUserByEmailOrUsername(candidate)) {
            n += 1;
            candidate = `${baseNorm}${n}`;
        }
        return candidate;
    }
}

export default AuthService;