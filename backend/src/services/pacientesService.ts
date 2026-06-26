import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { isValidEmail } from '../utils/validators.js';

interface PacienteData {
  nome: string;
  cpf: string;
  nascimento: string;
  email: string;
  telefone: string;
  senha?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
}

export async function findAll(_profissionalId: number) {
  const result = await pool.query(
    `SELECT id_paciente, nome, cpf, email, telefone, cidade, estado, nascimento
     FROM paciente
     ORDER BY nome`
  );
  return result.rows;
}

export async function findById(id: number, _profissionalId: number) {
  const result = await pool.query(
    `SELECT id_paciente, nome, cpf, email, telefone,
            nascimento, cep, logradouro, numero, bairro, complemento, cidade, estado
     FROM paciente
     WHERE id_paciente = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) throw new Error('Paciente nao encontrado');
  return row;
}

export async function create(data: PacienteData) {
  if (!isValidEmail(data.email)) throw new Error('Email invalido');
  if (!data.senha || data.senha.length < 8) throw new Error('Senha deve ter no minimo 8 caracteres');

  const exists = await pool.query(
    'SELECT id_paciente FROM paciente WHERE email = $1 OR cpf = $2',
    [data.email, data.cpf]
  );
  if ((exists.rowCount ?? 0) > 0) throw new Error('Email ou CPF ja cadastrado');

  const hash = await bcrypt.hash(data.senha, 12);

  const result = await pool.query(
    `INSERT INTO paciente
      (nome, cpf, nascimento, email, telefone, senha, cep, logradouro, numero, bairro, complemento, cidade, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id_paciente, nome, email`,
    [
      data.nome, data.cpf, data.nascimento, data.email, data.telefone, hash,
      data.cep ?? null, data.logradouro ?? null, data.numero ?? null,
      data.bairro ?? null, data.complemento ?? null, data.cidade ?? null, data.estado ?? null,
    ]
  );
  const row = result.rows[0];
  if (!row) throw new Error('Erro ao criar paciente');
  return row;
}

export async function update(id: number, data: Record<string, unknown>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = ['nome', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'complemento', 'cidade', 'estado', 'nascimento'];
  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) throw new Error('Nenhum campo valido para atualizar');

  values.push(id);
  const result = await pool.query(
    `UPDATE paciente SET ${fields.join(', ')} WHERE id_paciente = $${idx}
     RETURNING id_paciente, nome, email`,
    values
  );
  const row = result.rows[0];
  if (!row) throw new Error('Paciente nao encontrado');
  return row;
}

export async function deleteById(id: number) {
  const result = await pool.query(
    'DELETE FROM paciente WHERE id_paciente = $1 RETURNING id_paciente',
    [id]
  );
  if ((result.rowCount ?? 0) === 0) throw new Error('Paciente nao encontrado');
}

export async function getHistorico(id: number, profissionalId: number) {
  const result = await pool.query(
    `SELECT h.id_historico, h.descricao, h.data_registro,
            c.diagnostico, c.prescricao, a.data_consulta, a.horario
     FROM historico h
     JOIN consulta c ON h.id_consulta = c.id_consulta
     JOIN agendamento a ON c.id_agendamento = a.id_agendamento
     WHERE h.id_paciente = $1 AND a.id_profissional = $2
     ORDER BY h.data_registro DESC`,
    [id, profissionalId]
  );
  return result.rows;
}
