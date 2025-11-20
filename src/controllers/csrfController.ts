import { Request, Response } from 'express';

type CsrfRequest = Request & { csrfToken(): string };

class CsrfController {
    public static async getCsrfToken(req: Request, res: Response) {
        const token = (req as CsrfRequest).csrfToken();
        res.json({ csrfToken: token });
    }
}

export default CsrfController;