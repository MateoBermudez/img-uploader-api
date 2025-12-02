import { Router } from 'express';
import { csrfProtection } from '../middlewares/csrf';
import CsrfController from "../controllers/csrfController";

function csrfRouter() {
    const router = Router();
    router.get('/csrf-token', csrfProtection, CsrfController.getCsrfToken);
    return router;
}

export default csrfRouter;