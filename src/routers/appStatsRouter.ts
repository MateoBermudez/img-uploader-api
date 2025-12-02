import {Router} from "express";
import healthController from "../controllers/healthController";
import metricsController from "../controllers/metricsController";
import authenticate from "../middlewares/authenticate";

function appStatsRouter (): Router {
    const router = Router();

    router.get('/health', authenticate, healthController.getHealth);
    router.get('/metrics', authenticate, metricsController.getMetrics);

    return router
}

export default appStatsRouter;