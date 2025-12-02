import { Request, Response } from 'express';

type CsrfRequest = Request & { csrfToken(): string };

class CsrfController {
    public static async getCsrfToken(req: CsrfRequest, res: Response): Promise<void> {
        const token: string = req.csrfToken();
        res.json({ csrfToken: token });
    }
}

export default CsrfController;