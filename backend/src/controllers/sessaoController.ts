import type { Request, Response } from 'express';
import * as sessaoService from '../services/sessaoService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function criar(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const body = req.body as sessaoService.SessaoInput;
    if (!body.id_paciente || !body.data_sessao) {
      res.status(400).json(errorResponse('id_paciente e data_sessao são obrigatórios', 'VALIDATION_ERROR'));
      return;
    }
    body.id_profissional = profissionalId;
    const sessao = await sessaoService.criar(body);
    res.status(201).json(successResponse(sessao, 'Sessão registrada com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'CREATE_ERROR'));
  }
}

export async function listarPorProfissional(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const mes = req.query['mes'] as string | undefined;
    const status = req.query['status'] as string | undefined;
    const lista = await sessaoService.listarPorProfissional(profissionalId, { mes, status });
    res.status(200).json(successResponse(lista));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function listarPorPaciente(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const pacienteId = Number(req.params['pacienteId']);
    const lista = await sessaoService.listarPorPacienteProfissional(pacienteId, profissionalId);
    res.status(200).json(successResponse(lista));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const mes = req.query['mes'] as string | undefined;
    const data = await sessaoService.dashboardFinanceiro(profissionalId, mes);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function confirmarPagamento(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const sessaoId = Number(req.params['id']);
    const { forma_pagamento } = req.body as { forma_pagamento?: string };
    const sessao = await sessaoService.confirmarPagamento(sessaoId, profissionalId, forma_pagamento);
    res.status(200).json(successResponse(sessao, 'Pagamento confirmado'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'PAYMENT_ERROR'));
  }
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const sessaoId = Number(req.params['id']);
    const sessao = await sessaoService.atualizar(sessaoId, profissionalId, req.body as Partial<sessaoService.SessaoInput>);
    res.status(200).json(successResponse(sessao, 'Sessão atualizada'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'UPDATE_ERROR'));
  }
}
