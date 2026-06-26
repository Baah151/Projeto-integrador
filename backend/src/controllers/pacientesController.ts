import type { Request, Response } from 'express';
import * as pacientesService from '../services/pacientesService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const profissionalId = req.profissional!.id;
    const data = await pacientesService.findAll(profissionalId);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const profissionalId = req.profissional!.id;
    const data = await pacientesService.findById(id, profissionalId);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(404).json(errorResponse(msg, 'NOT_FOUND'));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = await pacientesService.create(req.body as Parameters<typeof pacientesService.create>[0]);
    res.status(201).json(successResponse(data, 'Paciente cadastrado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    const status = msg.includes('ja cadastrado') ? 409 : 400;
    res.status(status).json(errorResponse(msg, 'CREATE_ERROR'));
  }
}

export async function updateById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const data = await pacientesService.update(id, req.body as Record<string, unknown>);
    res.status(200).json(successResponse(data, 'Paciente atualizado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'UPDATE_ERROR'));
  }
}

export async function deleteById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    await pacientesService.deleteById(id);
    res.status(200).json(successResponse(null, 'Paciente removido com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(404).json(errorResponse(msg, 'NOT_FOUND'));
  }
}

export async function getHistorico(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const profissionalId = req.profissional!.id;
    const data = await pacientesService.getHistorico(id, profissionalId);
    res.status(200).json(successResponse(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}
