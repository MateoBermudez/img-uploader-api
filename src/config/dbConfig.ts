import pg, {QueryResult} from 'pg';
import config from './env.config';
import {PoolStats} from "../types/dto/poolStats";
import {AppError} from "../middlewares/handleError";

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

pool.on('error', (err: Error): void => {
    console.error('DB connection error:', err, err.message)
});

export function getPoolStats(): PoolStats {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
}

export async function getPgActivityCount(): Promise<number> {
    const res: QueryResult<{ count: string }> = await pool.query(
        'SELECT COUNT(*) FROM pg_stat_activity WHERE datname = $1',
        [config.db.name]
    );

    if (res.rows.length === 0) {
        return 0;
    }

    if (!res.rows[0]) {
        throw new AppError('Failed to retrieve pg_stat_activity count', 500);
    }

    return parseInt(res.rows[0].count, 10);
}

export default pool;
