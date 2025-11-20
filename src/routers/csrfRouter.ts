import { Router } from 'express';
import { csrfProtection } from '../middlewares/csrf.ts';
import CsrfController from "../controllers/csrfController.ts";

function csrfRouter() {
    const router = Router();
    router.get('/csrf-token', csrfProtection, CsrfController.getCsrfToken);
    return router;
}

export default csrfRouter;