import passport from 'passport';
import {Profile, Strategy as GoogleStrategy, VerifyCallback} from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import config from "./env.config";
import {GithubEmail, GitHubProfileWithEmails} from "../types/dto/githubEmail";
const GOOGLE_CLIENT_ID = config.oauth2.google.clientId
const GOOGLE_CLIENT_SECRET = config.oauth2.google.clientSecret;

passport.serializeUser((user: Express.User, done): void => {
    done(null, user);
});

passport.deserializeUser((user: Express.User, done): void => {
    done(null, user);
});

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: '/v1/auth/oauth/google/callback',
        },
        async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> => {
            const user = {
                provider: 'google',
                providerId: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatar: profile.photos?.[0]?.value,
            };
            return done(null, user);
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: config.oauth2.github.clientId,
            clientSecret: config.oauth2.github.clientSecret,
            callbackURL: '/v1/auth/oauth/github/callback',
        },
        async (
            accessToken: string,
            _refreshToken: string,
            profile: GitHubProfile,
            done: (error: unknown, user?: Express.User | false | null) => void
        ): Promise<void> => {
            const profileWithEmails = profile as GitHubProfileWithEmails;
            let email: string | undefined;
            if (profileWithEmails.emails?.[0]?.value) {
                email = profileWithEmails.emails[0].value;
            } else {
                try {
                    const resp: Response = await fetch('https://api.github.com/user/emails', {
                        headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'oauth-app' }
                    });
                    if (resp.ok) {
                        const list: GithubEmail[] = await resp.json();
                        const primaryEmail: GithubEmail | undefined = list.find(e => e.primary && e.verified);
                        email = primaryEmail?.email || list[0]?.email;
                    }
                } catch {
                }
            }
            done(null, {
                provider: 'github',
                providerId: profile.id,
                name: profile.displayName || profile.username || '',
                email,
                avatar: profile.photos?.[0]?.value || '',
            });
        }
    )
);

export default passport;
