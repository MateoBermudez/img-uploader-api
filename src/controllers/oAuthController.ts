import {NextFunction, Request, RequestHandler, Response} from 'express';
import AuthService from '../services/authService';
import config from '../config/env.config';
import passport from '../config/passport';
import {OAuthProvider, OAuthProviderUser} from "../types/dto/oAuthProviderUser";
import AuthController from "./authController";
import {COOKIE_NAMES} from "../types/constants";
import {AuthenticateOptions} from "../types/dto/authenticateOptions";


class OAuthController {
    public static async loginSuccess(req: Request, res: Response): Promise<void> {
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

    public static async loginFailed(_req: Request, res: Response): Promise<void> {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    };

    public static async logout(req: Request, res: Response): Promise<void> {
        req.logout((): void => {
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
            const scopes: string =
                provider === 'google'
                    ? (config.oauth2.google.scope || 'profile email')
                    : (config.oauth2.github.scope || 'read:user user:email');

            const options: AuthenticateOptions = { scope: scopes.split(' ') };
            const middleware: RequestHandler = passport.authenticate(provider, options);
            return middleware(req, res, next);
        };
    };

    public static oauthCallbackHandler(provider: OAuthProvider){
        return (req: Request, res: Response, next: NextFunction) => {
            const middleware: RequestHandler = passport.authenticate(provider, { failureRedirect: '/v1/auth/oauth/failed' });
            return middleware(req, res, (err?: unknown): void | Promise<void> => {
                if (err) return next(err);
                return OAuthController.oauthCallback(provider)(req, res, next);
            });
        };
    };

    public static oauthCallback(_provider: OAuthProvider) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                if (!req.user) {
                    return res.redirect('/v1/auth/oauth/failed');
                }

                const providerUser = req.user as OAuthProviderUser;

                const userAgent: string | null = req.get('User-Agent') ?? null;
                const ipAddress: string | null = req.ip ?? req.socket.remoteAddress ?? null;

                const {refreshToken, email} = await AuthService.oauthUpsertAndLogin(
                    providerUser,
                    userAgent,
                    ipAddress
                );

                const frontendUrl = new URL(config.app.frontendUrl);
                const redirectTo: string = new URL('/', frontendUrl).toString();

                res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
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