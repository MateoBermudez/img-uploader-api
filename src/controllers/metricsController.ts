import { Request, Response } from "express";
import { getPgActivityCount, getPoolStats } from "../config/dbConfig.ts";

class MetricsController {
    public static async getMetrics(_req: Request, res: Response) {
        const dbStats = getPoolStats();
        const pgStatsCount = await getPgActivityCount();
        res.json({
            db: {
                totalConnections: dbStats.total,
                idleConnections: dbStats.idle,
                waitingRequests: dbStats.waiting
            },
            stats: {
                activeConnections: pgStatsCount
            }
        });
    }
}

export default MetricsController;