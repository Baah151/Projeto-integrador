import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import pool from './database.js';

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. ROTA DE TESTE (GET) - PROFISSIONAIS
// ==========================================
app.get('/profissionais', async (req: Request, res: Response): Promise<any> => {
  try {
    const resultado = await pool.query('SELECT * FROM profissional');
    return res.json(resultado.rows);
  } catch (error: any) {
    console.error('Erro ao buscar profissionais:', error);
    return res.status(500).json({ error: 'Erro no banco de dados' });
  }
});

// ==========================================
// 2. ROTA PARA CADASTRAR UM PACIENTE (POST)
// ==========================================
app.post('/pacientes', async (req: Request, res: Response): Promise<any> => {
  try {
    const corpo: any = req.body;

    const queryText = `
      INSERT INTO paciente (
        nome, cpf, nascimento, email, telephone, senha, 
        cep, logradouro, numero, bairro, complemento, cidade, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id_paciente, nome, email;
    `;
    
    const valores = [
      corpo.nome, 
      corpo.cpf, 
      corpo.nascimento, 
      corpo.email, 
      corpo.telefone, 
      corpo.senha, 
      corpo.cep || null, 
      corpo.logradouro || null, 
      corpo.numero || null, 
      corpo.bairro || null, 
      corpo.complemento || null, 
      corpo.cidade || null, 
      corpo.estado || null
    ];
    
    const resultado = await pool.query(queryText, valores);

    return res.status(201).json({
      mensagem: 'Paciente cadastrado com sucesso!',
      paciente: resultado.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar paciente:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Este CPF ou E-mail de paciente já está cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno no servidor ao salvar o paciente.' });
  }
});

// ==========================================
// 3. ROTA PARA CADASTRAR UM PROFISSIONAL (POST)
// ==========================================
app.post('/profissionais', async (req: Request, res: Response): Promise<any> => {
  try {
    const corpo: any = req.body;

    const queryText = `
      INSERT INTO profissional (
        nome, cpf, nascimento, email, telefone, senha, 
        cep, logradouro, numero, bairro, complemento, cidade, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id_profissional, nome, email;
    `;
    
    const valores = [
      corpo.nome,
      corpo.cpf,
      corpo.nascimento,
      corpo.email,
      corpo.telefone,
      corpo.senha,
      corpo.cep || null,
      corpo.logradouro || null,
      corpo.numero || null,
      corpo.bairro || null,
      corpo.complemento || null,
      corpo.cidade || null,
      corpo.estado || null
    ];
    
    const resultado = await pool.query(queryText, valores);

    return res.status(201).json({
      mensagem: 'Profissional cadastrado com sucesso!',
      profissional: resultado.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar profissional:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Este CPF ou E-mail já está cadastrado no sistema.' });
    }
    return res.status(500).json({ error: 'Erro interno ao salvar os dados do profissional.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend ativo e integrado ao Supabase na porta ${PORT}`);
});