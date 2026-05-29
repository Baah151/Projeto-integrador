import pg from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

const { Pool } = pg;

// Configura a conexão usando a URI do Supabase que está no seu arquivo .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obrigatório para funcionar com o Supabase
  }
});

// Testa a conexão assim que o banco inicia
pool.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no Supabase:', err.message);
  } else {
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
  }
});

export default pool;