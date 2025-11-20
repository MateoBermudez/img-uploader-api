"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_config_1 = __importDefault(require("./config/env.config"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dbConfig_1 = __importDefault(require("./config/dbConfig"));
const appStatsRouter_1 = __importDefault(require("./routers/appStatsRouter"));
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const handleError_1 = require("./middlewares/handleError");
const handleCsrfError_1 = require("./middlewares/handleCsrfError");
const csrfRouter_1 = __importDefault(require("./routers/csrfRouter"));
const requireCsrfForUnsafeMethods_1 = __importDefault(require("./middlewares/requireCsrfForUnsafeMethods"));
const oauthRouter_1 = __importDefault(require("./routers/oauthRouter"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.httpServer = http_1.default.createServer(this.app);
        this.port = env_config_1.default.app.port;
        this.setup();
        this.listen();
        this.setupShutdownHandlers();
    }
    setup() {
        this.useMiddleware();
        this.mountRoutes();
    }
    useMiddleware() {
        this.app.use((0, cors_1.default)({
            origin: env_config_1.default.app.env === 'production'
                ? ['https://deployed-app-domain.com']
                : ['http://localhost:3000'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
        }));
        this.app.use((0, cookie_parser_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    mountRoutes() {
        const router = express_1.default.Router();
        router.use('/csrf', (0, csrfRouter_1.default)());
        router.use(requireCsrfForUnsafeMethods_1.default);
        router.use('/stats', (0, appStatsRouter_1.default)());
        router.use('/auth', (0, authRouter_1.default)());
        router.use('/auth/oauth', (0, oauthRouter_1.default)());
        this.app.use('/v1', router);
        this.app.use(handleCsrfError_1.handleCsrfError);
        this.app.use(handleError_1.handleError);
    }
    listen() {
        this.httpServer.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
        this.httpServer.on('error', (err) => {
            console.error('HTTP server error:', err);
        });
    }
    setupShutdownHandlers() {
        const shutdown = async (reason) => {
            console.log(`\nShutdown initiated${reason ? `: ${reason}` : ''}`);
            try {
                await new Promise((resolve, reject) => {
                    this.httpServer.close(err => err ? reject(err) : resolve());
                });
                await dbConfig_1.default.end().catch(err => console.error("Error closing DB pool: ", err));
                console.log('HTTP server and DB pool closed.');
                process.exit(0);
            }
            catch (err) {
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
if (require.main === module) {
    new Server();
}
