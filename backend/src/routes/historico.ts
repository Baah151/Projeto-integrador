import { Router } from 'express';
import * as historicoController from '../controllers/historicoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/consultas', historicoController.getConsultas);
router.get('/', historicoController.getAll);
router.post('/', historicoController.create);
router.get('/paciente/:id', historicoController.getByPaciente);

export default router;
