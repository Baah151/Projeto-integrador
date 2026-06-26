import pool from './database.js';

export async function runMigrations(): Promise<void> {
  const migrations: string[] = [
    `ALTER TABLE documento ADD COLUMN IF NOT EXISTS id_agendamento INT REFERENCES agendamento(id_agendamento) ON DELETE CASCADE`,
    `ALTER TABLE documento ADD COLUMN IF NOT EXISTS conteudo_base64 TEXT`,
    `ALTER TABLE documento ADD COLUMN IF NOT EXISTS tamanho_bytes INT`,
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS plano_proximo TEXT`,
    // sessao_consulta: tabela central de sessões por atendimento
    `CREATE TABLE IF NOT EXISTS sessao_consulta (
      id_sessao SERIAL PRIMARY KEY,
      id_agendamento INT REFERENCES agendamento(id_agendamento) ON DELETE SET NULL,
      id_paciente INT NOT NULL REFERENCES paciente(id_paciente) ON DELETE CASCADE,
      id_profissional INT NOT NULL REFERENCES profissional(id_profissional),
      numero_sessao INT DEFAULT 1,
      data_sessao DATE NOT NULL,
      hora_sessao TIME,
      descricao_realizada TEXT,
      observacoes_internas TEXT,
      prescricao_texto TEXT,
      medicamentos TEXT,
      orientacoes_paciente TEXT,
      proxima_sessao_data DATE,
      proxima_sessao_hora TIME,
      valor_sessao DECIMAL(10,2) DEFAULT 0,
      forma_pagamento VARCHAR(50),
      status_pagamento VARCHAR(30) DEFAULT 'Pendente',
      pago_na_sessao BOOLEAN DEFAULT FALSE,
      pago_apos_sessao BOOLEAN DEFAULT FALSE,
      data_pagamento TIMESTAMP,
      status VARCHAR(30) DEFAULT 'Realizada',
      data_criacao TIMESTAMP DEFAULT NOW()
    )`,
    // índices de performance
    `CREATE INDEX IF NOT EXISTS idx_sessao_paciente ON sessao_consulta(id_paciente)`,
    `CREATE INDEX IF NOT EXISTS idx_sessao_profissional ON sessao_consulta(id_profissional)`,
    `CREATE INDEX IF NOT EXISTS idx_sessao_agendamento ON sessao_consulta(id_agendamento)`,
    `CREATE INDEX IF NOT EXISTS idx_paciente_nome ON paciente(nome)`,
    // campo de motivo para solicitações pendentes
    `ALTER TABLE agendamento ADD COLUMN IF NOT EXISTS motivo_pendencia TEXT`,
    // colunas extras em consulta para plano de tratamento
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS id_paciente INT REFERENCES paciente(id_paciente)`,
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS tipo_consulta VARCHAR(50)`,
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS objetivo_tratamento TEXT`,
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS total_sessoes_planejadas INT DEFAULT 0`,
    `ALTER TABLE consulta ADD COLUMN IF NOT EXISTS status_consulta VARCHAR(30) DEFAULT 'Ativa'`,
    // tramite: registro de tramites por agendamento (linha do tempo de processo)
    `CREATE TABLE IF NOT EXISTS tramite (
      id_tramite SERIAL PRIMARY KEY,
      id_agendamento INT NOT NULL REFERENCES agendamento(id_agendamento) ON DELETE CASCADE,
      numero_tramite INT NOT NULL,
      tipo VARCHAR(30) DEFAULT 'informacao',
      descricao TEXT NOT NULL,
      usuario_nome VARCHAR(150) DEFAULT 'Sistema',
      criado_em TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tramite_agendamento ON tramite(id_agendamento)`,
    // rastreamento de reagendamento: id_reagendado_de aponta para o agendamento original
    `ALTER TABLE agendamento ADD COLUMN IF NOT EXISTS id_reagendado_de INT REFERENCES agendamento(id_agendamento)`,
    // observações clínicas do profissional sobre o paciente
    `ALTER TABLE paciente ADD COLUMN IF NOT EXISTS observacoes TEXT`,
    // foto de perfil do paciente (base64)
    `ALTER TABLE paciente ADD COLUMN IF NOT EXISTS foto_base64 TEXT`,
  ];

  // Executa migrations em série com um único cliente para não abrir múltiplas conexões
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      try {
        await client.query(sql);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('already exists')) console.error('Migration error:', msg);
      }
    }
  } finally {
    client.release();
  }
  console.log('[DB] Migrations verificadas.');
}
