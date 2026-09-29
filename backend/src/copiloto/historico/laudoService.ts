import pool from '../../config/database.js';
import { configIA, ErroIA, gerarResposta } from '../ia/geminiClient.js';

// Leitura de laudos pela IA: extrai os ACHADOS CLÍNICOS de cada documento enviado na ficha
// (PDF, imagem ou texto) e guarda o resultado. Cada laudo é lido uma única vez.

const TIPOS_SUPORTADOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'text/plain'];
const MAX_LAUDOS_POR_PACIENTE = 3;

const INSTRUCAO_EXTRACAO = `Você lê laudos e documentos clínicos para uma fisioterapeuta.
Extraia SOMENTE informações clínicas úteis para a fisioterapia, em português do Brasil, em tópicos curtos:
- Tipo de documento/exame e data (se houver)
- Diagnóstico ou hipótese diagnóstica (com CID se constar)
- Achados relevantes (ex.: imagem, testes, força, amplitude)
- Restrições, contraindicações ou recomendações médicas (ex.: carga permitida, repouso, cirurgia)
- Medicamentos citados
NÃO transcreva nome do paciente, CPF, RG, endereço, telefone, nome ou CRM de médicos.
Se o documento não tiver conteúdo clínico legível, responda apenas: "Sem conteúdo clínico legível."
No máximo 200 palavras.`;

export interface LaudoResumo {
  idDocumento: number;
  nomeArquivo: string;
  dataUpload: string;
  resumo?: string;
  erro?: string;
}

async function extrairUm(idDocumento: number, mime: string, base64: string): Promise<{ resumo?: string; erro?: string; modelo?: string }> {
  if (!TIPOS_SUPORTADOS.includes(mime)) return { erro: `Formato não suportado para leitura (${mime}).` };
  if (!base64) return { erro: 'Arquivo vazio.' };
  try {
    const parte = mime === 'text/plain'
      ? { text: Buffer.from(base64, 'base64').toString('utf8').slice(0, 20000) }
      : { inlineData: { mimeType: mime, data: base64 } };
    const r = await gerarResposta(INSTRUCAO_EXTRACAO, [{ role: 'user', parts: [parte, { text: 'Extraia os achados clínicos deste laudo.' }] }]);
    return { resumo: r.texto, modelo: r.modelo };
  } catch (err) {
    return { erro: err instanceof ErroIA ? err.message : 'Falha ao ler o laudo.' };
  }
}

/**
 * Garante que os laudos mais recentes do paciente foram lidos (lê os pendentes em paralelo)
 * e devolve os resumos. Sem IA habilitada, devolve apenas a lista de documentos.
 */
export async function lerLaudosPaciente(idPaciente: number): Promise<LaudoResumo[]> {
  const docs = await pool.query(
    `SELECT d.id_documento, d.nome_arquivo, d.tipo_arquivo, d.data_upload,
            e.resumo, e.erro, (e.id_documento IS NOT NULL) AS extraido
       FROM documento d
       LEFT JOIN copiloto_laudo_extracao e ON e.id_documento = d.id_documento
      WHERE d.id_paciente = $1
      ORDER BY d.data_upload DESC NULLS LAST, d.id_documento DESC
      LIMIT $2`,
    [idPaciente, MAX_LAUDOS_POR_PACIENTE],
  );
  const linhas = docs.rows as {
    id_documento: number; nome_arquivo: string; tipo_arquivo: string; data_upload: string;
    resumo: string | null; erro: string | null; extraido: boolean;
  }[];

  if (configIA().habilitada) {
    const pendentes = linhas.filter((l) => !l.extraido || (l.erro && !l.resumo));
    await Promise.all(pendentes.map(async (l) => {
      const arq = await pool.query('SELECT conteudo_base64 FROM documento WHERE id_documento = $1', [l.id_documento]);
      const r = await extrairUm(l.id_documento, (l.tipo_arquivo || '').toLowerCase(), arq.rows[0]?.conteudo_base64 ?? '');
      await pool.query(
        `INSERT INTO copiloto_laudo_extracao (id_documento, resumo, erro, modelo, extraido_em)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id_documento) DO UPDATE SET resumo = EXCLUDED.resumo, erro = EXCLUDED.erro,
           modelo = EXCLUDED.modelo, extraido_em = NOW()`,
        [l.id_documento, r.resumo ?? null, r.erro ?? null, r.modelo ?? null],
      );
      l.resumo = r.resumo ?? null;
      l.erro = r.erro ?? null;
    }));
  }

  return linhas.map((l) => ({
    idDocumento: l.id_documento,
    nomeArquivo: l.nome_arquivo,
    dataUpload: l.data_upload ? new Date(l.data_upload).toLocaleDateString('pt-BR') : '',
    ...(l.resumo ? { resumo: l.resumo } : {}),
    ...(l.erro && !l.resumo ? { erro: l.erro } : {}),
  }));
}
