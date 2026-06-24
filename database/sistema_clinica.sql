CREATE TABLE paciente (
    id_paciente     SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    cpf             VARCHAR(14)  UNIQUE NOT NULL,
    nascimento      DATE         NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    telefone        VARCHAR(20)  NOT NULL,
    senha           VARCHAR(255) NOT NULL,
    cep             VARCHAR(9),
    logradouro      VARCHAR(120),
    numero          VARCHAR(10),
    bairro          VARCHAR(80),
    complemento     VARCHAR(120),
    cidade          VARCHAR(80),
    estado          CHAR(2)
);

CREATE TABLE profissional (
    id_profissional SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    cpf             VARCHAR(14)  UNIQUE NOT NULL,
    nascimento      DATE         NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    telefone        VARCHAR(20)  NOT NULL,
    senha           VARCHAR(255) NOT NULL,
    cep             VARCHAR(9),
    logradouro      VARCHAR(120),
    numero          VARCHAR(10),
    bairro          VARCHAR(80),
    complemento     VARCHAR(120),
    cidade          VARCHAR(80),
    estado          CHAR(2)
);

CREATE TABLE agendamento (
    id_agendamento  SERIAL PRIMARY KEY,
    id_paciente     INT NOT NULL,
    id_profissional INT NOT NULL,
    data_consulta   DATE NOT NULL,
    horario         TIME NOT NULL,
    status          VARCHAR(30),
    observacoes     TEXT,
    exame_anexo     VARCHAR(255),
    CONSTRAINT fk_agendamento_paciente
        FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_agendamento_profissional
        FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional)
);

CREATE TABLE consulta (
    id_consulta      SERIAL PRIMARY KEY,
    id_agendamento   INT NOT NULL,
    diagnostico      TEXT,
    prescricao       TEXT,
    observacoes      TEXT,
    data_finalizacao TIMESTAMP,
    CONSTRAINT fk_consulta_agendamento
        FOREIGN KEY (id_agendamento) REFERENCES agendamento(id_agendamento)
);

CREATE TABLE documento (
    id_documento  SERIAL PRIMARY KEY,
    id_paciente   INT NOT NULL,
    nome_arquivo  VARCHAR(255),
    tipo_arquivo  VARCHAR(50),
    data_upload   TIMESTAMP,
    arquivo       VARCHAR(255),
    CONSTRAINT fk_documento_paciente
        FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
);

CREATE TABLE financeiro (
    id_financeiro    SERIAL PRIMARY KEY,
    id_consulta      INT NOT NULL,
    valor            DECIMAL(10,2),
    forma_pagamento  VARCHAR(50),
    status_pagamento VARCHAR(30),
    data_pagamento   TIMESTAMP,
    CONSTRAINT fk_financeiro_consulta
        FOREIGN KEY (id_consulta) REFERENCES consulta(id_consulta)
);

CREATE TABLE historico (
    id_historico  SERIAL PRIMARY KEY,
    id_paciente   INT NOT NULL,
    id_consulta   INT NOT NULL,
    descricao     TEXT,
    data_registro TIMESTAMP,
    CONSTRAINT fk_historico_paciente
        FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_historico_consulta
        FOREIGN KEY (id_consulta) REFERENCES consulta(id_consulta)
);

CREATE TABLE disponibilidade_agenda (
    id_disponibilidade SERIAL PRIMARY KEY,
    id_profissional    INT NOT NULL,
    data_disponivel    DATE,
    horario            TIME,
    vagas              INT,
    CONSTRAINT fk_disponibilidade_profissional
        FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional)
);

CREATE TABLE tratamentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER,
    valor NUMERIC(10,2)
);

CREATE TABLE paciente_tratamento (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tratamento_id INTEGER NOT NULL REFERENCES tratamentos(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'em andamento'
        CHECK (status IN ('em andamento', 'concluido', 'cancelado')),
    observacoes TEXT
);

CREATE INDEX idx_paciente_tratamento_paciente ON paciente_tratamento(paciente_id);
CREATE INDEX idx_paciente_tratamento_tratamento ON paciente_tratamento(tratamento_id);

INSERT INTO paciente (nome, cpf, nascimento, email, telefone, senha, cidade, estado)
VALUES ('Ana Carolina', '123.456.789-00', '2005-08-15', 'ana@email.com', '(48)99999-9999', '123456', 'Araranguá', 'SC');

INSERT INTO profissional (nome, cpf, nascimento, email, telefone, senha, cidade, estado)
VALUES ('Dra. Luana', '987.654.321-00', '1980-05-10', 'luana@email.com', '(48)98888-7777', '654321', 'Criciúma', 'SC');

INSERT INTO agendamento (id_paciente, id_profissional, data_consulta, horario, status)
VALUES (1, 1, '2026-06-15', '14:00:00', 'Agendado');

SELECT * FROM paciente;
SELECT * FROM profissional;
SELECT * FROM agendamento;

UPDATE paciente SET telefone = '(48)98888-0000' WHERE id_paciente = 1;
