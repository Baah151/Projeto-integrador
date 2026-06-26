import { Router } from 'express';
import * as tramiteController from '../controllers/tramiteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/agendamento/:id', tramiteController.listarPorAgendamento);
router.post('/agendamento/:id', tramiteController.criar);

export default router;
