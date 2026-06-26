import type { Request, Response } from 'express';
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function relatorioPacientes(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT p.id_paciente, p.nome, p.cpf, p.email, p.telefone, p.cidade, p.estado,
              COUNT(a.id_agendamento) AS total_consultas,
              MAX(a.data_consulta) AS ultima_consulta
       FROM paciente p
       JOIN agendamento a ON a.id_paciente = p.id_paciente
       WHERE a.id_profissional = $1
       GROUP BY p.id_paciente, p.nome, p.cpf, p.email, p.telefone, p.cidade, p.estado
       ORDER BY p.nome`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function relatorioAgendamentos(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const { inicio, fim } = req.query as { inicio?: string; fim?: string };

    const conditions: string[] = ['a.id_profissional = $1'];
    const values: unknown[] = [profissionalId];
    let idx = 2;

    if (inicio) {
      conditions.push(`a.data_consulta >= $${idx++}`);
      values.push(inicio);
    }
    if (fim) {
      conditions.push(`a.data_consulta <= $${idx++}`);
      values.push(fim);
    }

    const result = await pool.query(
      `SELECT a.id_agendamento, a.data_consulta, a.horario, a.status,
              p.nome AS nome_paciente,
              COUNT(*) OVER (PARTITION BY a.status) AS total_por_status
       FROM agendamento a
       JOIN paciente p ON a.id_paciente = p.id_paciente
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.data_consulta DESC`,
      values
    );

    const total = result.rows.length;
    const por_status: Record<string, number> = {};
    for (const row of result.rows) {
      const status = String((row as Record<string, unknown>)['status'] ?? 'Desconhecido');
      por_status[status] = (por_status[status] ?? 0) + 1;
    }

    res.status(200).json(successResponse({ total, por_status, agendamentos: result.rows }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function relatorioFinanceiro(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const { inicio, fim } = req.query as { inicio?: string; fim?: string };

    const conditions: string[] = ['a.id_profissional = $1'];
    const values: unknown[] = [profissionalId];
    let idx = 2;

    if (inicio) {
      conditions.push(`f.data_pagamento >= $${idx++}`);
      values.push(inicio);
    }
    if (fim) {
      conditions.push(`f.data_pagamento <= $${idx++}`);
      values.push(fim);
    }

    const result = await pool.query(
      `SELECT f.id_financeiro, f.valor, f.forma_pagamento, f.status_pagamento, f.data_pagamento,
              p.nome AS nome_paciente, a.data_consulta
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       JOIN paciente p ON a.id_paciente = p.id_paciente
       WHERE ${conditions.join(' AND ')}
       ORDER BY f.data_pagamento DESC`,
      values
    );

    const total_receita = result.rows.reduce(
      (acc, row) => acc + ((row as Record<string, unknown>)['status_pagamento'] === 'Pago' ? Number((row as Record<string, unknown>)['valor']) : 0),
      0
    );

    res.status(200).json(successResponse({ total_receita, transacoes: result.rows }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function exportar(req: Request, res: Response): Promise<void> {
  const { tipo } = req.params as { tipo: string };
  res.status(200).json(
    successResponse(
      { mensagem: `Exportacao do tipo '${tipo}' deve ser implementada com uma biblioteca como pdfkit ou csv-writer` },
      'Endpoint de exportacao configurado'
    )
  );
}
