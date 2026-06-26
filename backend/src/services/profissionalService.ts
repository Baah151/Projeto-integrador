import pool from '../config/database.js';

export async function findById(id: number) {
  const result = await pool.query(
    `SELECT id_profissional, nome, cpf, nascimento, email, telefone,
            cep, logradouro, numero, bairro, complemento, cidade, estado
     FROM profissional WHERE id_profissional = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) throw new Error('Profissional nao encontrado');
  return row;
}

export async function update(id: number, data: Record<string, unknown>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = ['nome', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado'];
  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) throw new Error('Nenhum campo valido para atualizar');

  values.push(id);
  const result = await pool.query(
    `UPDATE profissional SET ${fields.join(', ')} WHERE id_profissional = $${idx}
     RETURNING id_profissional, nome, email, telefone, cidade, estado`,
    values
  );
  const row = result.rows[0];
  if (!row) throw new Error('Profissional nao encontrado');
  return row;
}

export async function getDashboard(id: number) {
  const [agendados, finalizados, pacientes, receita] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total FROM agendamento WHERE id_profissional = $1 AND status = 'Agendado'`,
      [id]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM agendamento WHERE id_profissional = $1 AND status = 'Finalizado'`,
      [id]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT id_paciente) AS total FROM agendamento WHERE id_profissional = $1`,
      [id]
    ),
    pool.query(
      `SELECT COALESCE(SUM(f.valor), 0) AS total
       FROM financeiro f
       JOIN consulta c ON f.id_consulta = c.id_consulta
       JOIN agendamento a ON c.id_agendamento = a.id_agendamento
       WHERE a.id_profissional = $1 AND f.status_pagamento = 'Pago'`,
      [id]
    ),
  ]);

  return {
    consultas_agendadas: Number((agendados.rows[0] as { total: string } | undefined)?.total ?? 0),
    consultas_finalizadas: Number((finalizados.rows[0] as { total: string } | undefined)?.total ?? 0),
    total_pacientes: Number((pacientes.rows[0] as { total: string } | undefined)?.total ?? 0),
    receita_total: Number((receita.rows[0] as { total: string } | undefined)?.total ?? 0),
  };
}

export async function deleteById(id: number) {
  const result = await pool.query(
    'DELETE FROM profissional WHERE id_profissional = $1 RETURNING id_profissional',
    [id]
  );
  if ((result.rowCount ?? 0) === 0) throw new Error('Profissional nao encontrado');
}
