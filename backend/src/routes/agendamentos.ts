import { Router } from 'express';
import * as agendamentosController from '../controllers/agendamentosController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// Rotas estáticas ANTES dos wildcards /:id
router.get('/agenda/calendario', agendamentosController.getCalendario);
router.post('/reagendar', agendamentosController.reagendar);
router.get('/slots', agendamentosController.getSlotsParaData);
router.get('/disponibilidade', agendamentosController.getDisponibilidade);
router.post('/disponibilidade', agendamentosController.addDisponibilidade);
router.delete('/disponibilidade/:id', agendamentosController.removeDisponibilidade);

// Rotas com wildcard /:id por último
router.get('/', agendamentosController.getAll);
router.post('/', agendamentosController.create);
router.get('/:id', agendamentosController.getById);
router.put('/:id', agendamentosController.updateById);
router.delete('/:id', agendamentosController.cancelar);
router.post('/:id/confirmar', agendamentosController.confirmar);
router.post('/:id/finalizar', agendamentosController.finalizar);

export default router;
