import type { Request, Response } from 'express';
import * as mfaService from '../services/mfaService.js';
import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function enviarCodigo(req: Request, res: Response): Promise<void> {
  try {
    const { profissionalId } = req.body as { profissionalId: number };
    if (!profissionalId) { res.status(400).json(errorResponse('profissionalId obrigatorio', 'MFA_ERROR')); return; }
    await mfaService.gerarEEnviarCodigo(Number(profissionalId));
    res.status(200).json(successResponse(null, 'Codigo enviado para o e-mail cadastrado'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao enviar codigo';
    res.status(400).json(errorResponse(msg, 'MFA_ERROR'));
  }
}

export async function verificarCodigo(req: Request, res: Response): Promise<void> {
  try {
    const { profissionalId, codigo, lembrarDispositivo } = req.body as {
      profissionalId: number;
      codigo: string;
      lembrarDispositivo?: boolean;
    };

    if (!profissionalId || !codigo) {
      res.status(400).json(errorResponse('profissionalId e codigo obrigatorios', 'MFA_ERROR'));
      return;
    }

    const valido = await mfaService.verificarCodigo(Number(profissionalId), String(codigo).trim());
    if (!valido) {
      res.status(401).json(errorResponse('Codigo invalido ou expirado', 'MFA_INVALID'));
      return;
    }

    const authData = await authService.gerarTokenParaProfissional(Number(profissionalId));

    let deviceToken: string | null = null;
    if (lembrarDispositivo) {
      deviceToken = await mfaService.registrarDispositivo(Number(profissionalId));
    }

    res.status(200).json(successResponse({ ...authData, deviceToken }, 'Autenticacao concluida com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro na verificacao';
    res.status(400).json(errorResponse(msg, 'MFA_ERROR'));
  }
}
