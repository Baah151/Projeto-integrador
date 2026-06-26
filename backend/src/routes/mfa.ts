import { Router } from 'express';
import * as mfaController from '../controllers/mfaController.js';

const router = Router();

router.post('/enviar', mfaController.enviarCodigo);
router.post('/verificar', mfaController.verificarCodigo);

export default router;
