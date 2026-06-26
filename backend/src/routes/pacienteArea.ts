import { Router } from 'express';
import * as pacienteAreaController from '../controllers/pacienteAreaController.js';
import { authPacienteMiddleware } from '../middleware/authPaciente.js';

const router = Router();

router.use(authPacienteMiddleware);

router.get('/me', pacienteAreaController.getMe);
router.put('/me', pacienteAreaController.updateMe);
router.delete('/me', pacienteAreaController.deleteMe);

router.get('/disponibilidade', pacienteAreaController.getDisponibilidade);

router.get('/agendamentos', pacienteAreaController.getAgendamentos);
router.post('/agendamentos', pacienteAreaController.createAgendamento);
router.put('/agendamentos/:id/reenviar', pacienteAreaController.reenviarSolicitacao);
router.delete('/agendamentos/:id', pacienteAreaController.cancelarAgendamento);

router.get('/historico', pacienteAreaController.getHistorico);

router.get('/financeiro', pacienteAreaController.getFinanceiro);

router.get('/documentos', pacienteAreaController.listarDocumentos);
router.post('/documentos', pacienteAreaController.uploadDocumento);
router.delete('/documentos/:id', pacienteAreaController.deletarDocumento);

router.get('/sessoes', pacienteAreaController.getSessoes);

export default router;
