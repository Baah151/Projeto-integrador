// Script one-shot: reseta a senha da Luana
// Uso: node reset-senha.mjs <nova-senha>
// Ex:  node reset-senha.mjs Luana@2025

import bcrypt from 'bcryptjs';
import pg from 'pg';
import { readFileSync } from 'fs';

// Carrega .env manualmente
try {
  const env = readFileSync(new URL('./.env', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

const novaSenha = process.argv[2];
if (!novaSenha) {
  console.error('Uso: node reset-senha.mjs <nova-senha>');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const hash = await bcrypt.hash(novaSenha, 12);

const result = await pool.query(
  `UPDATE profissional SET senha = $1 RETURNING id_profissional, nome, email`,
  [hash]
);

if (result.rowCount === 0) {
  console.error('Nenhum profissional encontrado no banco.');
} else {
  const p = result.rows[0];
  console.log(`✓ Senha atualizada para: ${p.nome} (${p.email})`);
  console.log(`  Nova senha: ${novaSenha}`);
}

await pool.end();
