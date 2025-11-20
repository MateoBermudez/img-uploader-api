import express from "express";
import session from "express-session";
import config from './config/env.config.ts';
import http from "http";
import cors from "cors";
import pool from "./config/dbConfig.ts";
import appStatsRouter from "./routers/appStatsRouter.ts";
import authRouter from "./routers/authRouter.ts";
import cookieParser from "cookie-parser";
import {handleError} from "./middlewares/handleError.ts";
import {handleCsrfError} from "./middlewares/handleCsrfError.ts";
import csrfRouter from "./routers/csrfRouter.ts";
import requireCsrfForUnsafeMethods from "./middlewares/requireCsrfForUnsafeMethods.ts";
import OAuthRouter from "./routers/oAuthRouter.ts";
import passport from "./config/passport.ts";
import imagesRouter from "./routers/imagesRouter.ts";

class Server {
    public app: express.Application;
    public httpServer: http.Server;
    private readonly port: number;

    constructor() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.port = config.app.port;
        this.setup();
        this.listen();
        this.setupShutdownHandlers();
    }

    private setup() {
        this.useMiddleware();
        this.mountRoutes();
    }

    private useMiddleware() {
        this.app.use(cors({
            origin: config.app.env === 'production'
                ? ['https://deployed-app-domain.com']
                : ['http://localhost:3000'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
        }));
        this.app.use(cookieParser())
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private useSessionSecret() {
        return session({
            secret: config.oauth2.session || 'default_session_secret',
            resave: false,
            saveUninitialized: false,
        })
    }

    private mountRoutes() {
        this.app.use(this.useSessionSecret());

        const router = express.Router();

        router.use('/csrf', csrfRouter());

        router.use(requireCsrfForUnsafeMethods);

        router.use('/stats', appStatsRouter());
        router.use('/auth', authRouter());


        this.app.use(passport.initialize());
        this.app.use(passport.session());
        router.use('/auth/oauth', OAuthRouter());

        router.use('/images', imagesRouter());

        this.app.use('/v1', router);

        this.app.use(handleCsrfError);

        this.app.use(handleError);
    }

    private listen() {
        this.httpServer.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });

        this.httpServer.on('error', (err) => {
            console.error('HTTP server error:', err);
        });
    }

    private setupShutdownHandlers() {
        const shutdown = async (reason?: string) => {
            console.log(`\nShutdown initiated${reason ? `: ${reason}` : ''}`);
            try {
                await new Promise<void>((resolve, reject) => {
                    this.httpServer.close(err => err ? reject(err) : resolve());
                });
                await pool.end().catch(err => console.error("Error closing DB pool: ", err));
                console.log('HTTP server and DB pool closed.');
                process.exit(0);
            } catch (err) {
                console.error('Error during shutdown:', err);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => { void shutdown('SIGINT'); });
        process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
        process.on('uncaughtException', (err) => {
            console.error('Uncaught exception:', err);
            shutdown('uncaughtException').catch(e => console.error('Shutdown error:', e));
        });
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled rejection:', reason);
            shutdown('unhandledRejection').catch(e => console.error('Shutdown error:', e));
        });
    }
}

new Server();