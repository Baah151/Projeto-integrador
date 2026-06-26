import { Router } from 'express';
import * as pacientesController from '../controllers/pacientesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', pacientesController.getAll);
router.post('/', pacientesController.create);
router.get('/:id', pacientesController.getById);
router.put('/:id', pacientesController.updateById);
router.delete('/:id', pacientesController.deleteById);
router.get('/:id/historico', pacientesController.getHistorico);

export default router;
