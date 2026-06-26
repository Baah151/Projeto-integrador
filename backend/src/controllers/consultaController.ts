import type { Request, Response } from 'express';
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const { diagnostico, prescricao, observacoes, plano_proximo } = req.body as {
      diagnostico?: string;
      prescricao?: string;
      observacoes?: string;
      plano_proximo?: string;
    };

    const result = await pool.query(
      `UPDATE consulta SET
         diagnostico   = COALESCE($1, diagnostico),
         prescricao    = COALESCE($2, prescricao),
         observacoes   = COALESCE($3, observacoes),
         plano_proximo = COALESCE($4, plano_proximo)
       WHERE id_consulta = $5
       RETURNING id_consulta, id_agendamento, diagnostico, prescricao, observacoes, plano_proximo, data_finalizacao`,
      [diagnostico ?? null, prescricao ?? null, observacoes ?? null, plano_proximo ?? null, id]
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json(errorResponse('Consulta nao encontrada', 'NOT_FOUND'));
      return;
    }

    res.status(200).json(successResponse(result.rows[0], 'Tramite atualizado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'UPDATE_ERROR'));
  }
}
