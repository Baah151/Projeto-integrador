import pool from '../config/database.js';
import { inserirTramite } from './tramiteService.js';

export interface SessaoInput {
  id_agendamento?: number;
  id_paciente: number;
  id_profissional: number;
  data_sessao: string;
  hora_sessao?: string;
  descricao_realizada?: string;
  observacoes_internas?: string;
  prescricao_texto?: string;
  medicamentos?: string;
  orientacoes_paciente?: string;
  proxima_sessao_data?: string;
  proxima_sessao_hora?: string;
  valor_sessao?: number;
  forma_pagamento?: string;
  status_pagamento?: string;
  pago_na_sessao?: boolean;
  pago_apos_sessao?: boolean;
}

export async function criar(data: SessaoInput) {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM sessao_consulta WHERE id_paciente = $1 AND id_profissional = $2',
    [data.id_paciente, data.id_profissional]
  );
  const numero_sessao = parseInt((countResult.rows[0] as { count: string }).count) + 1;

  const statusPag = data.pago_na_sessao ? 'Pago' : (data.status_pagamento ?? 'Pendente');
  const dataPag = data.pago_na_sessao ? 'NOW()' : 'NULL';

  const result = await pool.query(
    `INSERT INTO sessao_consulta (
      id_agendamento, id_paciente, id_profissional, numero_sessao,
      data_sessao, hora_sessao, descricao_realizada, observacoes_internas,
      prescricao_texto, medicamentos, orientacoes_paciente,
      proxima_sessao_data, proxima_sessao_hora,
      valor_sessao, forma_pagamento, status_pagamento,
      pago_na_sessao, pago_apos_sessao, data_pagamento
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,${dataPag})
    RETURNING *`,
    [
      data.id_agendamento ?? null,
      data.id_paciente,
      data.id_profissional,
      numero_sessao,
      data.data_sessao,
      data.hora_sessao ?? null,
      data.descricao_realizada ?? null,
      data.observacoes_internas ?? null,
      data.prescricao_texto ?? null,
      data.medicamentos ?? null,
      data.orientacoes_paciente ?? null,
      data.proxima_sessao_data ?? null,
      data.proxima_sessao_hora ?? null,
      data.valor_sessao ?? 0,
      data.forma_pagamento ?? null,
      statusPag,
      data.pago_na_sessao ?? false,
      data.pago_apos_sessao ?? false,
    ]
  );

  if (data.id_agendamento) {
    await pool.query(
      "UPDATE agendamento SET status = 'Finalizado' WHERE id_agendamento = $1",
      [data.id_agendamento]
    );

    const valor = data.valor_sessao ? `R$ ${Number(data.valor_sessao).toFixed(2).replace('.', ',')}` : '—';
    const forma = data.forma_pagamento || 'Não informado';
    const statusPag = data.pago_na_sessao ? 'Pago na sessão' : (data.pago_apos_sessao ? 'A pagar após sessão' : 'Pendente');
    try {
      await inserirTramite(
        data.id_agendamento,
        'solucao',
        `Sessão realizada e registrada. Valor: ${valor} — Pagamento: ${forma} — Status: ${statusPag}`
      );
    } catch { /* não bloqueia */ }
  }

  return result.rows[0];
}

export async function listarPorPacienteProfissional(pacienteId: number, profissionalId: number) {
  const result = await pool.query(
    `SELECT s.*, p.nome AS nome_paciente, p.email AS email_paciente
     FROM sessao_consulta s
     JOIN paciente p ON s.id_paciente = p.id_paciente
     WHERE s.id_paciente = $1 AND s.id_profissional = $2
     ORDER BY s.data_sessao DESC, s.hora_sessao DESC`,
    [pacienteId, profissionalId]
  );
  return result.rows;
}

export async function listarPorProfissional(profissionalId: number, params: { mes?: string; status?: string } = {}) {
  const conditions: string[] = ['s.id_profissional = $1'];
  const values: unknown[] = [profissionalId];
  let idx = 2;

  if (params.mes) {
    conditions.push(`TO_CHAR(s.data_sessao, 'YYYY-MM') = $${idx++}`);
    values.push(params.mes);
  }
  if (params.status) {
    conditions.push(`s.status_pagamento = $${idx++}`);
    values.push(params.status);
  }

  const result = await pool.query(
    `SELECT s.*, p.nome AS nome_paciente, p.email AS email_paciente
     FROM sessao_consulta s
     JOIN paciente p ON s.id_paciente = p.id_paciente
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.data_sessao DESC, s.hora_sessao DESC`,
    values
  );
  return result.rows;
}

export async function listarPorPacienteParaPaciente(pacienteId: number) {
  const result = await pool.query(
    `SELECT s.id_sessao, s.numero_sessao, s.data_sessao, s.hora_sessao,
            s.prescricao_texto, s.medicamentos, s.orientacoes_paciente,
            s.proxima_sessao_data, s.proxima_sessao_hora,
            s.valor_sessao, s.forma_pagamento, s.status_pagamento,
            s.pago_na_sessao, s.pago_apos_sessao, s.status,
            s.id_agendamento
     FROM sessao_consulta s
     WHERE s.id_paciente = $1
     ORDER BY s.data_sessao DESC`,
    [pacienteId]
  );
  return result.rows;
}

export async function dashboardFinanceiro(profissionalId: number, mes?: string) {
  const values: unknown[] = [profissionalId];
  const cond = mes ? `AND TO_CHAR(s.data_sessao, 'YYYY-MM') = $2` : '';
  if (mes) values.push(mes);

  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_sessoes,
       COUNT(*) FILTER (WHERE s.status_pagamento = 'Pago') AS total_pagas,
       COUNT(*) FILTER (WHERE s.status_pagamento = 'Pendente' AND s.pago_apos_sessao = true) AS total_apos_sessao,
       COUNT(*) FILTER (WHERE s.status_pagamento = 'Pendente' AND s.pago_apos_sessao = false) AS total_pendentes,
       COALESCE(SUM(s.valor_sessao), 0) AS total_faturado,
       COALESCE(SUM(s.valor_sessao) FILTER (WHERE s.status_pagamento = 'Pago'), 0) AS total_pago,
       COALESCE(SUM(s.valor_sessao) FILTER (WHERE s.status_pagamento = 'Pendente'), 0) AS total_a_receber
     FROM sessao_consulta s
     WHERE s.id_profissional = $1 ${cond}`,
    values
  );
  return result.rows[0];
}

export async function confirmarPagamento(sessaoId: number, profissionalId: number, forma_pagamento?: string) {
  const result = await pool.query(
    `UPDATE sessao_consulta
     SET status_pagamento = 'Pago', pago_na_sessao = true, data_pagamento = NOW(),
         forma_pagamento = COALESCE($3, forma_pagamento)
     WHERE id_sessao = $1 AND id_profissional = $2
     RETURNING *`,
    [sessaoId, profissionalId, forma_pagamento ?? null]
  );
  if ((result.rowCount ?? 0) === 0) throw new Error('Sessão não encontrada');
  return result.rows[0];
}

export async function atualizar(sessaoId: number, profissionalId: number, data: Partial<SessaoInput>) {
  const allowed = [
    'descricao_realizada', 'observacoes_internas', 'prescricao_texto', 'medicamentos',
    'orientacoes_paciente', 'proxima_sessao_data', 'proxima_sessao_hora',
    'valor_sessao', 'forma_pagamento', 'status_pagamento',
  ];
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx++}`);
      values.push((data as Record<string, unknown>)[key]);
    }
  }
  if (fields.length === 0) throw new Error('Nenhum campo para atualizar');

  values.push(sessaoId, profissionalId);
  const result = await pool.query(
    `UPDATE sessao_consulta SET ${fields.join(', ')}
     WHERE id_sessao = $${idx} AND id_profissional = $${idx + 1}
     RETURNING *`,
    values
  );
  if ((result.rowCount ?? 0) === 0) throw new Error('Sessão não encontrada');
  return result.rows[0];
}
