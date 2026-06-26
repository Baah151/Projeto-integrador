import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import mfaRoutes from './routes/mfa.js';
import authPacienteRoutes from './routes/authPaciente.js';
import pacienteAreaRoutes from './routes/pacienteArea.js';
import profissionalRoutes from './routes/profissional.js';
import pacientesRoutes from './routes/pacientes.js';
import agendamentosRoutes from './routes/agendamentos.js';
import financeiroRoutes from './routes/financeiro.js';
import relatoriosRoutes from './routes/relatorios.js';
import solicitacoesRoutes from './routes/solicitacoes.js';
import historicoRoutes from './routes/historico.js';
import documentosRoutes from './routes/documentos.js';
import consultasRoutes from './routes/consultas.js';
import sessaoRoutes from './routes/sessao.js';
import tramitesRoutes from './routes/tramites.js';
import { errorHandler } from './middleware/errorHandler.js';
import { runMigrations } from './config/migrations.js';
import { limparSlotsExpirados } from './services/agendamentosService.js';

const app = express();

const corsOrigins = process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check antes do rate limiter para nunca ser bloqueado
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API funcionando', timestamp: new Date().toISOString() });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisicoes. Tente novamente em 15 minutos.', error: 'RATE_LIMIT' },
  skip: (req) => req.path === '/api/health',
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/paciente/auth', authPacienteRoutes);
app.use('/api/paciente', pacienteAreaRoutes);
app.use('/api/profissional', profissionalRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/sessao', sessaoRoutes);
app.use('/api/tramites', tramitesRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota nao encontrada', error: 'NOT_FOUND', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = Number(process.env['SERVER_PORT'] ?? 3000);
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  await runMigrations();
  await limparSlotsExpirados();
  console.log('Slots expirados removidos da agenda.');
});

export default app;
