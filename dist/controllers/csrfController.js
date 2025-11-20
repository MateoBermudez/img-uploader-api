"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CsrfController {
    static async getCsrfToken(req, res) {
        const token = req.csrfToken();
        res.json({ csrfToken: token });
    }
}
exports.default = CsrfController;
