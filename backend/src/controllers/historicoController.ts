import type { Request, Response } from 'express';
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT h.id_historico, h.descricao, h.data_registro,
              p.id_paciente, p.nome AS nome_paciente,
              c.diagnostico, c.prescricao, a.data_consulta, a.horario
       FROM historico h
       JOIN paciente p ON h.id_paciente = p.id_paciente
       JOIN consulta c ON h.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       WHERE a.id_profissional = $1
       ORDER BY h.data_registro DESC`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getByPaciente(req: Request, res: Response): Promise<void> {
  try {
    const pacienteId = Number(req.params['id']);
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT h.id_historico, h.descricao, h.data_registro,
              c.id_consulta, c.diagnostico, c.prescricao, c.observacoes, c.plano_proximo,
              a.id_agendamento, a.data_consulta, a.horario
       FROM historico h
       JOIN consulta c ON h.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       WHERE h.id_paciente = $1 AND a.id_profissional = $2
       ORDER BY h.data_registro DESC`,
      [pacienteId, profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getConsultas(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const { status, busca } = req.query as { status?: string; busca?: string };

    const conditions: string[] = ['a.id_profissional = $1'];
    const values: unknown[] = [profissionalId];
    let idx = 2;

    if (status === 'em_andamento') {
      conditions.push(`a.status IN ('Agendado', 'Confirmado', 'Pendente')`);
    } else if (status === 'finalizada') {
      conditions.push(`a.status = 'Finalizado'`);
    } else if (status === 'cancelada') {
      conditions.push(`a.status = 'Cancelado'`);
    } else if (status === 'reagendada') {
      conditions.push(`a.id_reagendado_de IS NOT NULL`);
    }

    if (busca) {
      conditions.push(`(LOWER(p.nome) LIKE $${idx} OR LPAD(a.id_agendamento::text, 4, '0') LIKE $${idx})`);
      values.push(`%${(busca as string).toLowerCase()}%`);
      idx++;
    }

    const result = await pool.query(
      `SELECT
         a.id_agendamento,
         'CON-' || LPAD(a.id_agendamento::text, 4, '0') AS codigo,
         a.data_consulta, a.horario, a.status, a.observacoes,
         a.id_reagendado_de,
         p.id_paciente, p.nome AS nome_paciente, p.telefone AS telefone_paciente,
         COUNT(t.id_tramite) AS num_tramites,
         MAX(t.criado_em) AS ultimo_tramite_em,
         s.id_sessao, s.valor_sessao, s.forma_pagamento, s.status_pagamento,
         s.descricao_realizada, s.prescricao_texto
       FROM agendamento a
       JOIN paciente p ON a.id_paciente = p.id_paciente
       LEFT JOIN tramite t ON t.id_agendamento = a.id_agendamento
       LEFT JOIN sessao_consulta s ON s.id_agendamento = a.id_agendamento
       WHERE ${conditions.join(' AND ')}
       GROUP BY a.id_agendamento, a.data_consulta, a.horario, a.status, a.observacoes,
                a.id_reagendado_de,
                p.id_paciente, p.nome, p.telefone,
                s.id_sessao, s.valor_sessao, s.forma_pagamento, s.status_pagamento,
                s.descricao_realizada, s.prescricao_texto
       ORDER BY a.data_consulta DESC, a.horario ASC`,
      values
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { id_paciente, id_consulta, descricao } = req.body as {
      id_paciente: number;
      id_consulta: number;
      descricao?: string;
    };

    if (!id_paciente || !id_consulta) {
      res.status(400).json(errorResponse('id_paciente e id_consulta sao obrigatorios', 'VALIDATION_ERROR'));
      return;
    }

    const result = await pool.query(
      `INSERT INTO historico (id_paciente, id_consulta, descricao, data_registro)
       VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [id_paciente, id_consulta, descricao ?? null]
    );

    res.status(201).json(successResponse(result.rows[0], 'Historico registrado'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'CREATE_ERROR'));
  }
}
