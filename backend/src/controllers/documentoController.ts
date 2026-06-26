import type { Request, Response } from 'express';
import * as documentoService from '../services/documentoService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function listarPorPaciente(req: Request, res: Response): Promise<void> {
  try {
    const pacienteId = Number(req.params['id']);
    const docs = await documentoService.listarPorPaciente(pacienteId);
    res.status(200).json(successResponse(docs));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function listarPorAgendamento(req: Request, res: Response): Promise<void> {
  try {
    const agendamentoId = Number(req.params['id']);
    const pacienteId = Number(req.query['pacienteId']);
    if (!pacienteId) {
      res.status(400).json(errorResponse('pacienteId requerido', 'VALIDATION_ERROR'));
      return;
    }
    const docs = await documentoService.listarPorAgendamento(agendamentoId, pacienteId);
    res.status(200).json(successResponse(docs));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const doc = await documentoService.buscarComConteudo(id);
    if (!doc) {
      res.status(404).json(errorResponse('Documento nao encontrado', 'NOT_FOUND'));
      return;
    }
    res.status(200).json(successResponse(doc));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}

export async function uploadPorProfissional(req: Request, res: Response): Promise<void> {
  try {
    const pacienteId = Number(req.params['id']);
    const { id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64 } = req.body as {
      id_agendamento?: number;
      nome_arquivo: string;
      tipo_arquivo: string;
      tamanho_bytes: number;
      conteudo_base64: string;
    };
    if (!nome_arquivo || !conteudo_base64) {
      res.status(400).json(errorResponse('nome_arquivo e conteudo_base64 sao obrigatorios', 'VALIDATION_ERROR'));
      return;
    }
    if (tamanho_bytes > 5 * 1024 * 1024) {
      res.status(400).json(errorResponse('Arquivo muito grande. Maximo 5MB.', 'FILE_TOO_LARGE'));
      return;
    }
    const doc = await documentoService.criar({ id_paciente: pacienteId, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64 });
    res.status(201).json(successResponse(doc, 'Documento enviado com sucesso'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(400).json(errorResponse(msg, 'UPLOAD_ERROR'));
  }
}

export async function deletar(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params['id']);
    const pacienteId = Number(req.query['pacienteId']);
    const ok = await documentoService.deletar(id, pacienteId);
    if (!ok) {
      res.status(404).json(errorResponse('Documento nao encontrado', 'NOT_FOUND'));
      return;
    }
    res.status(200).json(successResponse(null, 'Documento removido'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    res.status(500).json(errorResponse(msg, 'SERVER_ERROR'));
  }
}
