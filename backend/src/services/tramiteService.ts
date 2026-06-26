import pool from '../config/database.js';

export async function inserirTramite(
  id_agendamento: number,
  tipo: string,
  descricao: string,
  usuario_nome = 'Sistema'
): Promise<void> {
  const countResult = await pool.query(
    `SELECT COALESCE(MAX(numero_tramite), 0) AS max_num FROM tramite WHERE id_agendamento = $1`,
    [id_agendamento]
  );
  const proximo = Number((countResult.rows[0] as { max_num: string }).max_num) + 1;

  await pool.query(
    `INSERT INTO tramite (id_agendamento, numero_tramite, tipo, descricao, usuario_nome)
     VALUES ($1, $2, $3, $4, $5)`,
    [id_agendamento, proximo, tipo, descricao, usuario_nome]
  );
}

export async function listarPorAgendamento(id_agendamento: number) {
  const result = await pool.query(
    `SELECT id_tramite, numero_tramite, tipo, descricao, usuario_nome, criado_em
     FROM tramite
     WHERE id_agendamento = $1
     ORDER BY numero_tramite ASC`,
    [id_agendamento]
  );
  return result.rows;
}

export async function criar(
  id_agendamento: number,
  dados: { tipo?: string; descricao: string; usuario_nome?: string },
  profissionalId: number
) {
  const check = await pool.query(
    `SELECT id_agendamento FROM agendamento WHERE id_agendamento = $1 AND id_profissional = $2`,
    [id_agendamento, profissionalId]
  );
  if ((check.rowCount ?? 0) === 0) throw new Error('Agendamento não encontrado');

  await inserirTramite(id_agendamento, dados.tipo ?? 'informacao', dados.descricao, dados.usuario_nome ?? 'Profissional');
  return listarPorAgendamento(id_agendamento);
}
