import { Router } from 'express';
import * as solicitacoesController from '../controllers/solicitacoesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', solicitacoesController.getAll);
router.post('/', solicitacoesController.create);
router.put('/:id', solicitacoesController.updateById);
router.delete('/:id', solicitacoesController.deleteById);
router.post('/:id/responder', solicitacoesController.responder);

export default router;
