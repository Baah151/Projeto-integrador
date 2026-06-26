import pool from '../config/database.js';
import { inserirTramite } from './tramiteService.js';

export interface DocumentoInput {
  id_paciente: number;
  id_agendamento?: number | null;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  conteudo_base64: string;
}

export async function listarPorPaciente(pacienteId: number) {
  const result = await pool.query(
    `SELECT id_documento, id_paciente, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, data_upload
     FROM documento WHERE id_paciente = $1 ORDER BY data_upload DESC`,
    [pacienteId]
  );
  return result.rows;
}

export async function listarPorAgendamento(agendamentoId: number, pacienteId: number) {
  const result = await pool.query(
    `SELECT id_documento, id_paciente, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, data_upload
     FROM documento WHERE id_agendamento = $1 AND id_paciente = $2 ORDER BY data_upload DESC`,
    [agendamentoId, pacienteId]
  );
  return result.rows;
}

export async function buscarComConteudo(id: number) {
  const result = await pool.query(
    `SELECT id_documento, id_paciente, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64, data_upload
     FROM documento WHERE id_documento = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function criar(data: DocumentoInput) {
  const result = await pool.query(
    `INSERT INTO documento (id_paciente, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, conteudo_base64, data_upload)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     RETURNING id_documento, id_paciente, id_agendamento, nome_arquivo, tipo_arquivo, tamanho_bytes, data_upload`,
    [data.id_paciente, data.id_agendamento ?? null, data.nome_arquivo, data.tipo_arquivo, data.tamanho_bytes, data.conteudo_base64]
  );

  const doc = result.rows[0] as { id_agendamento?: number } | undefined;
  if (doc?.id_agendamento) {
    try {
      await inserirTramite(
        doc.id_agendamento,
        'documento',
        `Documento encaminhado pelo paciente: ${data.nome_arquivo}`
      );
    } catch { /* não bloqueia o upload */ }
  }

  return result.rows[0];
}

export async function deletar(id: number, pacienteId: number) {
  const result = await pool.query(
    `DELETE FROM documento WHERE id_documento = $1 AND id_paciente = $2 RETURNING id_documento`,
    [id, pacienteId]
  );
  return (result.rowCount ?? 0) > 0;
}
