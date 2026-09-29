import pool from '../../config/database.js';

// Ficha clínica resumida de um paciente cadastrado, usada pelo Auxiliar de Casos.
// Contém SOMENTE dados clínicos + idade. Nome, CPF, endereço, e-mail e telefone
// nunca entram no texto (o nome é devolvido à parte, só para exibição na tela).

export interface FichaPaciente {
  idPaciente: number;
  nome: string;
  idade?: number;
  /** Texto clínico sem identificação, usado na análise por regras e na IA. */
  resumo: string;
  totalSessoes: number;
  ultimaSessao?: string;
}

const MAX_CONSULTAS = 3;
const MAX_SESSOES = 5;
const MAX_CAMPO = 400;

function idadeDe(nascimento: Date | string | null): number | undefined {
  if (!nascimento) return undefined;
  const n = new Date(nascimento);
  if (Number.isNaN(n.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
  return idade >= 0 && idade < 130 ? idade : undefined;
}

const corta = (t: unknown) => {
  const s = String(t ?? '').replace(/\s+/g, ' ').trim();
  return s.length > MAX_CAMPO ? `${s.slice(0, MAX_CAMPO - 1)}…` : s;
};

const dataBR = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '');

export async function carregarFichaPaciente(idPaciente: number): Promise<FichaPaciente | null> {
  const p = await pool.query('SELECT id_paciente, nome, nascimento, observacoes FROM paciente WHERE id_paciente = $1', [idPaciente]);
  if (!p.rowCount) return null;
  const pac = p.rows[0] as { id_paciente: number; nome: string; nascimento: Date | null; observacoes: string | null };

  const [consultas, sessoes, laudos, plano] = await Promise.all([
    pool.query(
      `SELECT c.diagnostico, c.objetivo_tratamento, c.plano_proximo, c.observacoes, c.prescricao, c.status_consulta,
              COALESCE(c.data_finalizacao, a.data_consulta::timestamp) AS data
         FROM consulta c
         LEFT JOIN agendamento a ON a.id_agendamento = c.id_agendamento
        WHERE c.id_paciente = $1 OR a.id_paciente = $1
        ORDER BY data DESC NULLS LAST
        LIMIT $2`,
      [idPaciente, MAX_CONSULTAS],
    ),
    pool.query(
      `SELECT numero_sessao, data_sessao, descricao_realizada, observacoes_internas, medicamentos, orientacoes_paciente,
              COUNT(*) OVER ()::int AS total
         FROM sessao_consulta
        WHERE id_paciente = $1
        ORDER BY data_sessao DESC, id_sessao DESC
        LIMIT $2`,
      [idPaciente, MAX_SESSOES],
    ),
    pool.query(
      `SELECT e.resumo, d.data_upload
         FROM copiloto_laudo_extracao e
         JOIN documento d ON d.id_documento = e.id_documento
        WHERE d.id_paciente = $1 AND e.resumo IS NOT NULL AND e.resumo NOT ILIKE 'Sem conteúdo clínico%'
        ORDER BY d.data_upload DESC NULLS LAST
        LIMIT 3`,
      [idPaciente],
    ),
    pool.query('SELECT anotacoes_profissional FROM copiloto_plano_paciente WHERE id_paciente = $1', [idPaciente]),
  ]);

  const idade = idadeDe(pac.nascimento);
  const linhas: string[] = [];
  linhas.push(`Paciente cadastrado${idade !== undefined ? `, ${idade} anos` : ''}.`);
  if (pac.observacoes?.trim()) linhas.push(`Observações clínicas da ficha: ${corta(pac.observacoes)}`);
  const anotacoes = (plano.rows[0] as { anotacoes_profissional?: string } | undefined)?.anotacoes_profissional;
  if (anotacoes?.trim()) linhas.push(`Avaliação/anotações da fisioterapeuta: ${anotacoes.trim().slice(0, 2000)}`);
  for (const l of laudos.rows as { resumo: string; data_upload: string }[]) {
    linhas.push(`Laudo enviado em ${dataBR(l.data_upload)} (achados extraídos): ${l.resumo.replace(/\s+/g, ' ').slice(0, 1500)}`);
  }

  for (const c of consultas.rows as Record<string, unknown>[]) {
    const partes = [
      c['diagnostico'] && `diagnóstico: ${corta(c['diagnostico'])}`,
      c['objetivo_tratamento'] && `objetivo: ${corta(c['objetivo_tratamento'])}`,
      c['prescricao'] && `prescrição: ${corta(c['prescricao'])}`,
      c['plano_proximo'] && `plano: ${corta(c['plano_proximo'])}`,
      c['observacoes'] && `obs.: ${corta(c['observacoes'])}`,
    ].filter(Boolean);
    if (partes.length) linhas.push(`Consulta ${dataBR(c['data'] as string)} (${c['status_consulta'] ?? 's/ status'}): ${partes.join('; ')}.`);
  }

  const sess = sessoes.rows as Record<string, unknown>[];
  for (const s of sess) {
    const partes = [
      s['descricao_realizada'] && `realizado: ${corta(s['descricao_realizada'])}`,
      s['observacoes_internas'] && `obs.: ${corta(s['observacoes_internas'])}`,
      s['medicamentos'] && `medicamentos: ${corta(s['medicamentos'])}`,
      s['orientacoes_paciente'] && `orientações: ${corta(s['orientacoes_paciente'])}`,
    ].filter(Boolean);
    if (partes.length) linhas.push(`Sessão ${s['numero_sessao'] ?? ''} em ${dataBR(s['data_sessao'] as string)}: ${partes.join('; ')}.`);
  }

  const totalSessoes = (sess[0]?.['total'] as number | undefined) ?? 0;
  return {
    idPaciente: pac.id_paciente,
    nome: pac.nome,
    ...(idade !== undefined ? { idade } : {}),
    resumo: linhas.join('\n'),
    totalSessoes,
    ...(sess[0] ? { ultimaSessao: dataBR(sess[0]['data_sessao'] as string) } : {}),
  };
}
