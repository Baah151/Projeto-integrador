import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = await authService.register(req.body as Parameters<typeof authService.register>[0]);
    res.status(201).json(successResponse(data, 'Profissional cadastrado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao cadastrar';
    const status = msg.includes('ja cadastrado') ? 409 : 400;
    res.status(status).json(errorResponse(msg, 'REGISTER_ERROR'));
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body as { email: string; senha: string };
    const data = await authService.login(email, senha);
    res.status(200).json(successResponse(data, 'Login realizado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
    res.status(401).json(errorResponse(msg, 'LOGIN_ERROR'));
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(null, 'Logout realizado com sucesso'));
}

export async function verify(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
      res.status(401).json(errorResponse('Token nao fornecido', 'UNAUTHORIZED'));
      return;
    }
    const data = await authService.verifyToken(token);
    res.status(200).json(successResponse(data, 'Token valido'));
  } catch {
    res.status(401).json(errorResponse('Token invalido', 'INVALID_TOKEN'));
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const data = await authService.forgotPassword(email);
    res.status(200).json(successResponse(data, 'Token de recuperacao gerado. Em producao, enviar por email.'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'FORGOT_PASSWORD_ERROR'));
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, novaSenha } = req.body as { token: string; novaSenha: string };
    await authService.resetPassword(token, novaSenha);
    res.status(200).json(successResponse(null, 'Senha redefinida com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'RESET_PASSWORD_ERROR'));
  }
}
