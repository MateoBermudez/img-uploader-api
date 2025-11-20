"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig_1 = require("../config/dbConfig");
class MetricsController {
    static async getMetrics(_req, res) {
        const dbStats = (0, dbConfig_1.getPoolStats)();
        const pgStatsCount = await (0, dbConfig_1.getPgActivityCount)();
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
exports.default = MetricsController;
