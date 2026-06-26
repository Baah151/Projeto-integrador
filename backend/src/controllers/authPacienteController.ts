import type { Request, Response } from 'express';
import * as authPacienteService from '../services/authPacienteService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = await authPacienteService.register(req.body as Parameters<typeof authPacienteService.register>[0]);
    res.status(201).json(successResponse(data, 'Paciente cadastrado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao cadastrar';
    const status = msg.includes('ja cadastrado') ? 409 : 400;
    res.status(status).json(errorResponse(msg, 'REGISTER_ERROR'));
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body as { email: string; senha: string };
    const data = await authPacienteService.login(email, senha);
    res.status(200).json(successResponse(data, 'Login realizado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
    res.status(401).json(errorResponse(msg, 'LOGIN_ERROR'));
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(null, 'Logout realizado com sucesso'));
}
