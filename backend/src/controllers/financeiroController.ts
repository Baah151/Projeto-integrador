import type { Request, Response } from 'express';
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function getResumo(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN f.status_pagamento = 'Pago' THEN f.valor ELSE 0 END), 0) AS receita,
         COALESCE(SUM(CASE WHEN f.status_pagamento = 'Pendente' THEN f.valor ELSE 0 END), 0) AS pendente,
         COUNT(*) AS total_transacoes
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       WHERE a.id_profissional = $1`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows[0]));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getReceitas(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT f.id_financeiro, f.valor, f.forma_pagamento, f.status_pagamento, f.data_pagamento,
              p.nome AS nome_paciente, a.data_consulta
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       JOIN paciente p ON a.id_paciente = p.id_paciente
       WHERE a.id_profissional = $1 AND f.status_pagamento = 'Pago'
       ORDER BY f.data_pagamento DESC`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getDespesas(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT f.id_financeiro, f.valor, f.forma_pagamento, f.status_pagamento, f.data_pagamento,
              p.nome AS nome_paciente, a.data_consulta
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       JOIN paciente p ON a.id_paciente = p.id_paciente
       WHERE a.id_profissional = $1 AND f.status_pagamento = 'Pendente'
       ORDER BY f.data_pagamento DESC`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getSaldo(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN f.status_pagamento = 'Pago' THEN f.valor ELSE 0 END), 0) AS saldo
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       WHERE a.id_profissional = $1`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows[0]));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function registrar(req: Request, res: Response): Promise<void> {
  try {
    const { id_consulta, valor, forma_pagamento, status_pagamento } = req.body as {
      id_consulta: number;
      valor: number;
      forma_pagamento: string;
      status_pagamento: string;
    };

    if (!id_consulta || !valor || !forma_pagamento) {
      res.status(400).json(errorResponse('Campos obrigatorios: id_consulta, valor, forma_pagamento', 'VALIDATION_ERROR'));
      return;
    }

    const result = await pool.query(
      `INSERT INTO financeiro (id_consulta, valor, forma_pagamento, status_pagamento, data_pagamento)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [id_consulta, valor, forma_pagamento, status_pagamento ?? 'Pago']
    );

    res.status(201).json(successResponse(result.rows[0], 'Transacao registrada com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'CREATE_ERROR'));
  }
}
