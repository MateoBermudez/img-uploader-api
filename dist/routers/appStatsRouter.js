"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = __importDefault(require("../controllers/healthController"));
const metricsController_1 = __importDefault(require("../controllers/metricsController"));
const authenticate_1 = __importDefault(require("../middlewares/authenticate"));
function appStatsRouter() {
    const router = (0, express_1.Router)();
    router.get('/health', authenticate_1.default, healthController_1.default.getHealth);
    router.get('/metrics', authenticate_1.default, metricsController_1.default.getMetrics);
    return router;
}
exports.default = appStatsRouter;
