import csurf from 'csurf';

export const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        domain: 'localhost'
    },
});