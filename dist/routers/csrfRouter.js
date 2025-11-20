"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const csrf_1 = require("../middlewares/csrf");
const csrfController_1 = __importDefault(require("../controllers/csrfController"));
function csrfRouter() {
    const router = (0, express_1.Router)();
    router.get('/csrf-token', csrf_1.csrfProtection, csrfController_1.default.getCsrfToken);
    return router;
}
exports.default = csrfRouter;
