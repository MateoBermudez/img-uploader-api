import pg from 'pg';
import config from './env.config.ts';

const { Pool } = pg;

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    max: config.db.pool_max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('DB connection error:', err, err.message)
});

export function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
}

export async function getPgActivityCount(): Promise<number> {
    const res = await pool.query(
        'SELECT COUNT(*) FROM pg_stat_activity WHERE datname = $1',
        [config.db.name]
    );
    return parseInt(res.rows[0].count, 10);
}

export default pool;
