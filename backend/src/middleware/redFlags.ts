import type { Request, Response, NextFunction } from 'express';
import { avaliarAnamnese } from '../copiloto/redFlags/redFlagEngine.js';
import type { AnamneseInput, ResultadoTriagem } from '../copiloto/redFlags/types.js';
import { errorResponse } from '../utils/helpers.js';

declare global {
  namespace Express {
    interface Request {
      triagemRedFlags?: ResultadoTriagem;
    }
  }
}

const TAMANHO_MAXIMO_CAMPO = 20_000;
const CAMPOS_TEXTO = ['queixaPrincipal', 'hfa', 'hfp', 'observacoes'] as const;

function validarAnamnese(body: unknown): { ok: true; anamnese: AnamneseInput } | { ok: false; erro: string } {
  if (!body || typeof body !== 'object') return { ok: false, erro: 'Corpo da requisicao deve ser um objeto JSON' };
  const b = body as Record<string, unknown>;

  for (const campo of CAMPOS_TEXTO) {
    const v = b[campo];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string') return { ok: false, erro: `Campo "${campo}" deve ser texto` };
    if (v.length > TAMANHO_MAXIMO_CAMPO) return { ok: false, erro: `Campo "${campo}" excede ${TAMANHO_MAXIMO_CAMPO} caracteres` };
  }
  if (!CAMPOS_TEXTO.some((c) => typeof b[c] === 'string' && (b[c] as string).trim())) {
    return { ok: false, erro: 'Informe ao menos um campo da anamnese (queixaPrincipal, hfa, hfp ou observacoes)' };
  }
  if (b['contexto'] !== undefined && (typeof b['contexto'] !== 'object' || b['contexto'] === null)) {
    return { ok: false, erro: 'Campo "contexto" deve ser um objeto' };
  }
  return { ok: true, anamnese: b as AnamneseInput };
}

/**
 * Middleware de Red Flags.
 *
 * - modo "gate" (padrão): usado ANTES de rotas do copiloto (ex.: sugestões RAG). Se houver
 *   red flag CRÍTICA e o profissional ainda não reconheceu o alerta (header
 *   `X-RedFlags-Reconhecido: true`), responde 409 com os alertas e NÃO chama o próximo handler.
 * - modo "anotar": sempre segue o fluxo, apenas anexa o resultado em `req.triagemRedFlags`
 *   (útil para salvar a anamnese sem bloquear o registro em prontuário).
 */
export function redFlagsMiddleware(modo: 'gate' | 'anotar' = 'gate') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validacao = validarAnamnese(req.body);
    if (!validacao.ok) {
      res.status(400).json(errorResponse(validacao.erro, 'ANAMNESE_INVALIDA'));
      return;
    }

    const resultado = avaliarAnamnese(validacao.anamnese);
    req.triagemRedFlags = resultado;
    res.setHeader('X-RedFlags-Status', resultado.status);

    const reconhecido = req.headers['x-redflags-reconhecido'] === 'true';
    if (modo === 'gate' && resultado.status === 'INTERROMPIDO' && !reconhecido) {
      res.status(409).json({
        success: false,
        message: 'Red flag crítica detectada. Sugestões do copiloto suspensas até o profissional reconhecer o alerta.',
        error: 'RED_FLAG_CRITICA',
        data: resultado,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
