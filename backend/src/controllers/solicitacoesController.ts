import type { Request, Response } from 'express';
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

// Retorna agendamentos com status='Agendado' (solicitações pendentes dos pacientes)
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;

    const result = await pool.query(
      `SELECT a.id_agendamento AS id_solicitacao,
              a.data_consulta,
              a.horario,
              a.status,
              a.observacoes AS descricao,
              a.exame_anexo,
              a.data_consulta AS data_criacao,
              p.id_paciente,
              p.nome AS nome_paciente,
              p.telefone AS telefone_paciente
       FROM agendamento a
       JOIN paciente p ON a.id_paciente = p.id_paciente
       WHERE a.id_profissional = $1 AND a.status = 'Agendado'
       ORDER BY a.data_consulta ASC, a.horario ASC`,
      [profissionalId]
    );

    res.status(200).json(successResponse(result.rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

// Aprovação, pendência ou rejeição de uma solicitação
export async function responder(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const profissionalId = req.profissional!.id;
    const { status, motivo } = req.body as { status: string; motivo?: string };

    if (!status) {
      res.status(400).json(errorResponse('Status e obrigatorio', 'VALIDATION_ERROR'));
      return;
    }

    let novoStatus: string;
    let msgSucesso: string;

    if (status === 'Aprovado') {
      novoStatus = 'Confirmado';
      msgSucesso = 'Solicitacao aprovada com sucesso';
    } else if (status === 'Pendente') {
      novoStatus = 'Pendente';
      msgSucesso = 'Paciente notificado sobre informações pendentes';
    } else {
      novoStatus = 'Cancelado';
      msgSucesso = 'Solicitacao cancelada com sucesso';
    }

    const result = await pool.query(
      `UPDATE agendamento
       SET status = $1, motivo_pendencia = $2
       WHERE id_agendamento = $3 AND id_profissional = $4 AND status IN ('Agendado','Pendente')
       RETURNING id_agendamento`,
      [novoStatus, motivo ?? null, id, profissionalId]
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json(errorResponse('Agendamento nao encontrado ou ja processado', 'NOT_FOUND'));
      return;
    }

    res.status(200).json(successResponse(null, msgSucesso));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'RESPOND_ERROR'));
  }
}

// Mantidos para compatibilidade mas não utilizados no fluxo principal
export async function create(req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(null, 'Nao utilizado'));
}

export async function updateById(req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(null, 'Nao utilizado'));
}

export async function deleteById(req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(null, 'Nao utilizado'));
}
