import type { ResultadoAnalise } from '../raciocinio/raciocinioEngine.js';
import { anonimizar, configIA, ErroIA, gerarResposta } from './geminiClient.js';

export interface ResultadoIA {
  resposta?: string;
  modelo?: string;
  erro?: string;
}

const INSTRUCAO_SISTEMA = `Você é o Auxiliar de Casos, um assistente de apoio ao raciocínio de fisioterapeutas.

Seu papel:
- Ajudar a estudante/fisioterapeuta a raciocinar sobre o caso: possíveis causas, o que perguntar, como avaliar e como seguir.
- Responder perguntas livres sobre o caso (ex.: "por que não usar TENS?").

Regras obrigatórias:
1. A seção ANÁLISE DO SISTEMA foi gerada por regras de segurança e pelos datasets validados da clínica. Ela TEM PRIORIDADE sobre você.
   - Nunca sugira um procedimento marcado como CONTRAINDICADO e nunca minimize uma red flag.
   - Se houver red flag CRÍTICA, sua resposta deve começar reforçando o encaminhamento.
2. Só cite procedimentos do catálogo fornecido, pelo nome e código (ex.: P008). Se algo útil não estiver no catálogo, diga que "não consta no dataset".
3. Use a CBDF (sistemas D01–D10, qualificadores 0–4, 8, 9) ao falar de diagnóstico fisioterapêutico.
4. Não dê diagnóstico médico, não prescreva medicamentos, não invente dados do paciente. Se faltar informação, pergunte.
5. Se houver FICHA DO PACIENTE, use-a (idade, observações, consultas e sessões anteriores) para personalizar a orientação e compare com a evolução registrada.
6. Seja objetivo: no máximo ~180 palavras, em português do Brasil, com tópicos curtos. Não repita a lista inteira da análise; acrescente raciocínio.
7. Termine lembrando, em uma linha curta, que a decisão é da fisioterapeuta.`;

function resumoAnalise(a: ResultadoAnalise): string {
  const linhas: string[] = [];
  linhas.push(`Status de triagem: ${a.triagem.status}`);
  for (const al of a.triagem.alertas) {
    linhas.push(`RED FLAG [${al.severidade}] ${al.descricao} — conduta: ${al.conduta}`);
  }
  if (a.triagem.termosNegados.length) {
    linhas.push(`Negado pelo paciente: ${[...new Set(a.triagem.termosNegados.map((t) => t.termo))].join(', ')}`);
  }
  for (const c of a.condicoesClinicas) {
    linhas.push(`CONDIÇÃO ${c.id} ${c.nome} (CID ${c.cid10}). Avaliação: ${c.avaliacao.join('; ')}. ` +
      `Precauções: ${c.precaucoes.join('; ')}. Metas: ${c.metas.join('; ')}. Encaminhar se: ${c.encaminharSe.join('; ')}.`);
  }
  for (const q of a.quadros) {
    const causas = q.possiveisCausas.map((c) => `${c.causa}${c.sustentada ? ' [sustentada pelo relato]' : ''}`).join('; ');
    linhas.push(`QUADRO ${q.nome} (CBDF: ${q.sistemaCbdf}). Possíveis causas: ${causas}. ` +
      `Perguntas pendentes: ${q.perguntasPendentes.join('; ') || 'nenhuma'}. Testes: ${q.testes.join('; ')}.`);
  }
  if (a.condicoesDetectadas.length) linhas.push(`Condições que afetam contraindicações: ${a.condicoesDetectadas.join(', ')}`);
  linhas.push('CATÁLOGO DE PROCEDIMENTOS RELEVANTES:');
  for (const p of a.procedimentos) {
    linhas.push(`- ${p.id} ${p.nome} → ${p.status}${p.motivos.length ? ` (${p.motivos.join('; ')})` : ''}. Escalas: ${p.escalas.join(', ')}.`);
  }
  return linhas.join('\n');
}

/**
 * Gera a resposta da IA para a conversa. Nunca lança: em falha, retorna { erro },
 * e o copiloto por regras continua funcionando normalmente.
 */
export async function responderComIA(
  mensagens: string[],
  analise: ResultadoAnalise,
  fichaPaciente?: string,
  pedidoPersonalizado?: string,
): Promise<ResultadoIA | undefined> {
  const cfg = configIA();
  if (!cfg.habilitada) return undefined;

  const historico = mensagens.slice(0, -1).map(anonimizar);
  const atual = mensagens.length ? anonimizar(mensagens[mensagens.length - 1]!) : '';
  const pedido = pedidoPersonalizado
    ?? (atual
      ? `NOVA MENSAGEM DA FISIOTERAPEUTA:\n${atual}`
      : 'NOVA SOLICITAÇÃO: o paciente acabou de ser encaminhado para atendimento. Com base na ficha e na análise, ' +
        'dê a orientação inicial: o que priorizar na avaliação de hoje, cuidados e como seguir.');
  const prompt =
    (fichaPaciente ? `FICHA DO PACIENTE (sem identificação):\n${anonimizar(fichaPaciente)}\n\n` : '') +
    (historico.length ? `RELATO ANTERIOR NESTA CONSULTA:\n${historico.map((m) => `- ${m}`).join('\n')}\n\n` : '') +
    `${pedido}\n\n` +
    `ANÁLISE DO SISTEMA (regras + datasets, prioridade máxima):\n${resumoAnalise(analise)}`;

  try {
    const r = await gerarResposta(INSTRUCAO_SISTEMA, [{ role: 'user', parts: [{ text: prompt }] }]);
    return { resposta: r.texto, modelo: r.modelo };
  } catch (err) {
    const msg = err instanceof ErroIA ? err.message : 'Falha inesperada ao consultar a IA.';
    if (!(err instanceof ErroIA)) console.error('[Copiloto IA]', err);
    return { erro: msg };
  }
}
