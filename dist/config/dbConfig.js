"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolStats = getPoolStats;
exports.getPgActivityCount = getPgActivityCount;
const pg_1 = __importDefault(require("pg"));
const env_config_1 = __importDefault(require("./env.config"));
const { Pool } = pg_1.default;
const pool = new Pool({
    host: env_config_1.default.db.host,
    port: env_config_1.default.db.port,
    user: env_config_1.default.db.user,
    password: env_config_1.default.db.password,
    database: env_config_1.default.db.name,
    max: env_config_1.default.db.pool_max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('error', (err) => {
    console.error('DB connection error:', err, err.message);
});
function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
}
async function getPgActivityCount() {
    const res = await pool.query('SELECT COUNT(*) FROM pg_stat_activity WHERE datname = $1', [env_config_1.default.db.name]);
    return parseInt(res.rows[0].count, 10);
}
exports.default = pool;
