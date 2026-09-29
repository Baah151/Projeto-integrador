import pool from '../../config/database.js';
import { analisarConsulta } from '../raciocinio/raciocinioEngine.js';
import { responderComIA } from '../ia/copilotoIA.js';
import { configIA } from '../ia/geminiClient.js';
import { carregarFichaPaciente } from './fichaPaciente.js';
import { lerLaudosPaciente } from './laudoService.js';
import { PacienteNaoEncontrado } from './historicoService.js';

// Orientação de conduta por paciente: o que deve ser realizado, montado a partir de
// (1) anotações/avaliação da fisioterapeuta, (2) laudos enviados (lidos pela IA),
// (3) histórico de consultas e sessões, cruzados com os datasets (regras) e a IA.

const MAX_ANOTACOES = 4000;

const PEDIDO_PLANO =
  'NOVA SOLICITAÇÃO: monte a ORIENTAÇÃO DE CONDUTA deste paciente — o que deve ser realizado. ' +
  'Considere a avaliação da fisioterapeuta, os achados dos laudos e o histórico. Estruture em: ' +
  '**Resumo do caso**, **Prioridades da avaliação**, **Conduta sugerida (procedimentos do catálogo)**, ' +
  '**Cuidados e contraindicações**, **Metas e reavaliação**. Se o laudo trouxer restrição médica, destaque-a.';

export async function obterPlano(idPaciente: number) {
  const r = await pool.query(
    `SELECT anotacoes_profissional, analise, ia, laudos_considerados, gerado_em, atualizado_em
       FROM copiloto_plano_paciente WHERE id_paciente = $1`,
    [idPaciente],
  );
  const docs = await pool.query(
    `SELECT d.id_documento, d.nome_arquivo, d.data_upload, e.resumo, e.erro
       FROM documento d LEFT JOIN copiloto_laudo_extracao e ON e.id_documento = d.id_documento
      WHERE d.id_paciente = $1 ORDER BY d.data_upload DESC NULLS LAST LIMIT 3`,
    [idPaciente],
  );
  return {
    plano: r.rows[0] ?? null,
    laudos: docs.rows.map((d: { id_documento: number; nome_arquivo: string; data_upload: string; resumo: string | null; erro: string | null }) => ({
      idDocumento: d.id_documento,
      nomeArquivo: d.nome_arquivo,
      dataUpload: d.data_upload ? new Date(d.data_upload).toLocaleDateString('pt-BR') : '',
      lido: Boolean(d.resumo),
      ...(d.resumo ? { resumo: d.resumo } : {}),
      ...(d.erro && !d.resumo ? { erro: d.erro } : {}),
    })),
    iaHabilitada: configIA().habilitada,
  };
}

/** Salva as anotações e (re)gera a orientação de conduta do paciente. */
export async function gerarPlano(idProfissional: number, idPaciente: number, anotacoes: string | undefined) {
  const existe = await pool.query('SELECT 1 FROM paciente WHERE id_paciente = $1', [idPaciente]);
  if (!existe.rowCount) throw new PacienteNaoEncontrado('Paciente nao encontrado');

  const texto = (anotacoes ?? '').trim().slice(0, MAX_ANOTACOES);
  await pool.query(
    `INSERT INTO copiloto_plano_paciente (id_paciente, anotacoes_profissional, id_profissional, atualizado_em)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id_paciente) DO UPDATE SET anotacoes_profissional = EXCLUDED.anotacoes_profissional,
       id_profissional = EXCLUDED.id_profissional, atualizado_em = NOW()`,
    [idPaciente, texto || null, idProfissional],
  );

  // 1. Lê os laudos pendentes (IA) → 2. monta a ficha (já com laudos e anotações) → 3. regras → 4. IA
  const laudos = await lerLaudosPaciente(idPaciente);
  const ficha = await carregarFichaPaciente(idPaciente);
  if (!ficha) throw new PacienteNaoEncontrado('Paciente nao encontrado');

  const analise = await analisarConsulta({
    hfp: ficha.resumo,
    ...(ficha.idade !== undefined ? { contexto: { idade: ficha.idade } } : {}),
  });
  const ia = await responderComIA([], analise, ficha.resumo, PEDIDO_PLANO);
  const lidos = laudos.filter((l) => l.resumo).length;

  await pool.query(
    `UPDATE copiloto_plano_paciente
        SET analise = $2, ia = $3, laudos_considerados = $4, gerado_em = NOW(), atualizado_em = NOW()
      WHERE id_paciente = $1`,
    [idPaciente, JSON.stringify(analise), ia ? JSON.stringify(ia) : null, lidos],
  );
  return obterPlano(idPaciente);
}
