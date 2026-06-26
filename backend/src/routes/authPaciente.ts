import { Router } from 'express';
import * as authPacienteController from '../controllers/authPacienteController.js';

const router = Router();

router.post('/register', authPacienteController.register);
router.post('/login', authPacienteController.login);
router.post('/logout', authPacienteController.logout);

export default router;
