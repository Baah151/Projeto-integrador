import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as consultaController from '../controllers/consultaController.js';

const router = Router();
router.use(authMiddleware);

router.put('/:id', consultaController.atualizar);

export default router;
