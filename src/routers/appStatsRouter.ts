import {Router} from "express";
import healthController from "../controllers/healthController.ts";
import metricsController from "../controllers/metricsController.ts";
import authenticate from "../middlewares/authenticate.ts";

function appStatsRouter () {
    const router = Router();

    router.get('/health', authenticate, healthController.getHealth);
    router.get('/metrics', authenticate, metricsController.getMetrics);

    return router
}

export default appStatsRouter;