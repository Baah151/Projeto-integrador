import { Router } from 'express';
import * as relatoriosController from '../controllers/relatoriosController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/pacientes', relatoriosController.relatorioPacientes);
router.get('/agendamentos', relatoriosController.relatorioAgendamentos);
router.get('/financeiro', relatoriosController.relatorioFinanceiro);
router.get('/export/:tipo', relatoriosController.exportar);

export default router;
