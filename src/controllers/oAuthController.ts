import {NextFunction, Request, Response} from 'express';
import AuthService from '../services/authService.ts';
import config from '../config/env.config.ts';
import passport from '../config/passport.ts';
import {OAuthProvider, OAuthProviderUser} from "../types/oAuthProviderUser.ts";
import AuthController from "./authController.ts";


class OAuthController {
    public static async loginSuccess(req: Request, res: Response) {
        if (req.user) {
            res.json({
                success: true,
                message: 'Successfully authenticated',
                user: req.user,
            });
        } else {
            res.status(401).json({ success: false, message: 'Not authenticated' });
        }
    };

    public static async loginFailed(_req: Request, res: Response) {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    };

    public static async logout(req: Request, res: Response) {
        req.logout(() => {
            res.json(
                {
                    success: true,
                    message: 'Logged out successfully',
                }
            );
        });
    };

    public static initiateOAuth(provider: OAuthProvider) {
        return (req: Request, res: Response, next: NextFunction) => {
            const scopes =
                provider === 'google'
                    ? (config.oauth2.google.scope || 'profile email')
                    : (config.oauth2.github.scope || 'read:user user:email');

            const middleware = passport.authenticate(provider, { scope: scopes } as any);
            return middleware(req, res, next);
        };
    };

    public static oauthCallbackHandler(provider: OAuthProvider){
        return (req: Request, res: Response, next: NextFunction) => {
            const middleware = passport.authenticate(provider, { failureRedirect: '/v1/auth/oauth/failed' });
            return middleware(req, res, (err?: any) => {
                if (err) return next(err);
                return OAuthController.oauthCallback(provider)(req, res, next);
            });
        };
    };

    public static oauthCallback(_provider: OAuthProvider) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!req.user) {
                    return res.redirect('/v1/auth/oauth/failed');
                }

                const providerUser = req.user as OAuthProviderUser;

                const userAgent = req.get('User-Agent') ?? null;
                const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;

                const {refreshToken, email} = await AuthService.oauthUpsertAndLogin(
                    providerUser,
                    userAgent,
                    ipAddress
                );

                const frontendUrl = new URL(config.app.frontendUrl);
                const redirectTo = new URL('/', frontendUrl).toString();

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: config.refresh.expiration * 24 * 60 * 60 * 1000,
                    domain: 'localhost',
                });

                await AuthController.linkToUser(req, email, res);

                return res.redirect(redirectTo);
            } catch (err) {
                next(err);
            }
        };
    }
}

export default OAuthController;