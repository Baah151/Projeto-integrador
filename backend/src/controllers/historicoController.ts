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
    const { status, busca, ordem } = req.query as { status?: string; busca?: string; ordem?: string };

    const outerConditions: string[] = [];
    const values: unknown[] = [profissionalId];
    let idx = 2;

    if (status === 'em_andamento') {
      outerConditions.push(`n.status IN ('Agendado', 'Confirmado', 'Pendente')`);
    } else if (status === 'finalizada') {
      outerConditions.push(`n.status = 'Finalizado'`);
    } else if (status === 'cancelada') {
      outerConditions.push(`n.status = 'Cancelado'`);
    } else if (status === 'reagendada') {
      outerConditions.push(`n.id_reagendado_de IS NOT NULL`);
    }

    if (busca) {
      outerConditions.push(
        `(LOWER(p.nome) LIKE $${idx} OR LOWER('CON-' || LPAD(n.num_consulta::text, 4, '0')) LIKE $${idx})`
      );
      values.push(`%${(busca as string).toLowerCase()}%`);
      idx++;
    }

    const whereExtra = outerConditions.length > 0 ? `AND ${outerConditions.join(' AND ')}` : '';

    const orderBy =
      ordem === 'data_asc'      ? 'n.num_consulta ASC' :
      ordem === 'tramites_desc' ? 'COUNT(t.id_tramite) DESC, n.num_consulta DESC' :
      ordem === 'tramites_asc'  ? 'COUNT(t.id_tramite) ASC, n.num_consulta DESC' :
      /* padrão / data_desc */    'n.num_consulta DESC';

    const result = await pool.query(
      `WITH numerados AS (
         SELECT
           a.id_agendamento, a.data_consulta, a.horario, a.status,
           a.observacoes, a.id_reagendado_de, a.id_paciente,
           ROW_NUMBER() OVER (ORDER BY a.id_agendamento ASC) AS num_consulta
         FROM agendamento a
         WHERE a.id_profissional = $1
       )
       SELECT
         n.id_agendamento,
         'CON-' || LPAD(n.num_consulta::text, 4, '0') AS codigo,
         n.data_consulta, n.horario, n.status, n.observacoes,
         n.id_reagendado_de,
         nr.num_consulta AS num_reagendado_de,
         p.id_paciente, p.nome AS nome_paciente, p.telefone AS telefone_paciente,
         COUNT(t.id_tramite) AS num_tramites,
         MAX(t.criado_em) AS ultimo_tramite_em,
         s.id_sessao, s.valor_sessao, s.forma_pagamento, s.status_pagamento,
         s.descricao_realizada, s.prescricao_texto
       FROM numerados n
       JOIN paciente p ON n.id_paciente = p.id_paciente
       LEFT JOIN numerados nr ON nr.id_agendamento = n.id_reagendado_de
       LEFT JOIN tramite t ON t.id_agendamento = n.id_agendamento
       LEFT JOIN sessao_consulta s ON s.id_agendamento = n.id_agendamento
       WHERE 1=1 ${whereExtra}
       GROUP BY n.id_agendamento, n.data_consulta, n.horario, n.status,
                n.observacoes, n.id_reagendado_de, n.num_consulta,
                nr.num_consulta,
                p.id_paciente, p.nome, p.telefone,
                s.id_sessao, s.valor_sessao, s.forma_pagamento, s.status_pagamento,
                s.descricao_realizada, s.prescricao_texto
       ORDER BY ${orderBy}`,
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
