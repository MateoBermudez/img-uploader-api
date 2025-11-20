"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HealthController {
    static async getHealth(_req, res) {
        res.json({ state: 'ok' });
    }
}
exports.default = HealthController;
