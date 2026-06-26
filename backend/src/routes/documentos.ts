import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as documentoController from '../controllers/documentoController.js';

const router = Router();
router.use(authMiddleware);

router.get('/paciente/:id', documentoController.listarPorPaciente);
router.post('/paciente/:id', documentoController.uploadPorProfissional);
router.get('/agendamento/:id', documentoController.listarPorAgendamento);
router.get('/:id/download', documentoController.download);
router.delete('/:id', documentoController.deletar);

export default router;
