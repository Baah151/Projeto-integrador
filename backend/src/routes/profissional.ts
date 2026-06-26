import { Router } from 'express';
import * as profissionalController from '../controllers/profissionalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/:id', profissionalController.getById);
router.put('/:id', profissionalController.updateById);
router.get('/:id/dashboard', profissionalController.getDashboard);
router.delete('/:id', profissionalController.deleteById);

export default router;
