import { Request, Response } from "express";

class HealthController {
    public static async getHealth(_req: Request, res: Response): Promise<void> {
        res.json({ state: 'ok' });
    }
}

export default HealthController;