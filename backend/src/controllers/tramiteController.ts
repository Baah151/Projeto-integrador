import type { Request, Response } from 'express';
import * as tramiteService from '../services/tramiteService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function listarPorAgendamento(req: Request, res: Response): Promise<void> {
  try {
    const id_agendamento = Number(req.params['id']);
    const tramites = await tramiteService.listarPorAgendamento(id_agendamento);
    res.status(200).json(successResponse(tramites));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const id_agendamento = Number(req.params['id']);
    const profissionalId = req.profissional!.id;
    const { tipo, descricao, usuario_nome } = req.body as {
      tipo?: string;
      descricao: string;
      usuario_nome?: string;
    };

    if (!descricao?.trim()) {
      res.status(400).json(errorResponse('Descrição é obrigatória', 'VALIDATION_ERROR'));
      return;
    }

    const tramites = await tramiteService.criar(
      id_agendamento,
      { tipo, descricao, usuario_nome },
      profissionalId
    );
    res.status(201).json(successResponse(tramites, 'Trâmite adicionado'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'CREATE_ERROR'));
  }
}
