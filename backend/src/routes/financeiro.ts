import { Router } from 'express';
import * as financeiroController from '../controllers/financeiroController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', financeiroController.getResumo);
router.get('/receitas', financeiroController.getReceitas);
router.get('/despesas', financeiroController.getDespesas);
router.get('/saldo', financeiroController.getSaldo);
router.post('/registrar', financeiroController.registrar);

export default router;
