import type { Request, Response } from 'express';
import * as profissionalService from '../services/profissionalService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const data = await profissionalService.findById(id);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(404).json(errorResponse(msg, 'NOT_FOUND'));
  }
}

export async function updateById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const data = await profissionalService.update(id, req.body as Record<string, unknown>);
    res.status(200).json(successResponse(data, 'Dados atualizados com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'UPDATE_ERROR'));
  }
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const data = await profissionalService.getDashboard(id);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'DASHBOARD_ERROR'));
  }
}

export async function deleteById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    await profissionalService.deleteById(id);
    res.status(200).json(successResponse(null, 'Conta removida com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(404).json(errorResponse(msg, 'NOT_FOUND'));
  }
}
