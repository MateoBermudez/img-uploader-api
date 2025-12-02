import { Request, Response } from "express";
import { getPgActivityCount, getPoolStats } from "../config/dbConfig";
import {PoolStats} from "../types/dto/poolStats";
import {Metrics} from "../types/dto/metrics";

class MetricsController {
    public static async getMetrics(_req: Request, res: Response): Promise<void> {
        const dbStats: PoolStats = getPoolStats();
        const pgStatsCount: number = await getPgActivityCount();
        const metrics: Metrics = {
            db: dbStats,
            connections: pgStatsCount,
        }
        res.status(200).send(metrics);
    }
}

export default MetricsController;