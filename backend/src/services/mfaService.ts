import crypto from 'crypto';
import pool from '../config/database.js';
import { enviarCodigoMFA } from './emailService.js';

function gerarCodigo6Digitos(): string {
  return String(crypto.randomInt(100000, 999999));
}

function gerarTokenDispositivo(): string {
  return crypto.randomBytes(48).toString('hex');
}

export async function gerarEEnviarCodigo(profissionalId: number): Promise<void> {
  const profResult = await pool.query(
    'SELECT nome, email FROM profissional WHERE id_profissional = $1',
    [profissionalId]
  );
  const prof = profResult.rows[0];
  if (!prof) throw new Error('Profissional nao encontrado');

  await pool.query(
    'UPDATE mfa_codigo SET usado = TRUE WHERE id_profissional = $1 AND usado = FALSE',
    [profissionalId]
  );

  const codigo = gerarCodigo6Digitos();
  const expira = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    'INSERT INTO mfa_codigo (id_profissional, codigo, expira_em) VALUES ($1, $2, $3)',
    [profissionalId, codigo, expira]
  );

  await enviarCodigoMFA(prof.email as string, codigo, prof.nome as string);
}

export async function verificarCodigo(profissionalId: number, codigo: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT id_codigo FROM mfa_codigo
     WHERE id_profissional = $1 AND codigo = $2 AND usado = FALSE AND expira_em > NOW()
     ORDER BY criado_em DESC LIMIT 1`,
    [profissionalId, codigo]
  );

  if ((result.rowCount ?? 0) === 0) return false;

  const row = result.rows[0];
  await pool.query('UPDATE mfa_codigo SET usado = TRUE WHERE id_codigo = $1', [row.id_codigo]);
  return true;
}

export async function registrarDispositivo(profissionalId: number): Promise<string> {
  const token = gerarTokenDispositivo();
  const expira = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO dispositivo_confiavel (id_profissional, token, expira_em) VALUES ($1, $2, $3)',
    [profissionalId, token, expira]
  );

  return token;
}

export async function verificarDispositivo(profissionalId: number, token: string): Promise<boolean> {
  if (!token) return false;

  const result = await pool.query(
    `SELECT id_dispositivo FROM dispositivo_confiavel
     WHERE id_profissional = $1 AND token = $2 AND expira_em > NOW()`,
    [profissionalId, token]
  );

  return (result.rowCount ?? 0) > 0;
}
