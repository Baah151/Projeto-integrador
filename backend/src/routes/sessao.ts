import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as sessaoController from '../controllers/sessaoController.js';

const router = Router();
router.use(authMiddleware);

router.post('/', sessaoController.criar);
router.get('/', sessaoController.listarPorProfissional);
router.get('/dashboard', sessaoController.dashboard);
router.get('/paciente/:pacienteId', sessaoController.listarPorPaciente);
router.put('/:id', sessaoController.atualizar);
router.post('/:id/pagamento', sessaoController.confirmarPagamento);

export default router;
