import { avaliarAnamnese, estaNegado, normalizar } from '../redFlags/redFlagEngine.js';
import type { AnamneseInput, ResultadoTriagem } from '../redFlags/types.js';
import { carregarCatalogo, type Procedimento, type RegraGeral } from '../procedimentos/procedimentosRepo.js';
import { CONDICOES, GATILHOS_CONDICOES, MENCOES_PROCEDIMENTOS, QUADROS } from './conhecimento.js';

export type StatusProcedimento = 'INDICADO' | 'CAUTELA' | 'CONTRAINDICADO';

export interface QuadroIdentificado {
  id: string;
  nome: string;
  sistemaCbdf: string;
  possiveisCausas: { causa: string; sustentada: boolean; racional?: string }[];
  perguntasPendentes: string[];
  testes: string[];
}

export interface ProcedimentoAvaliado {
  id: string;
  nome: string;
  area: string;
  status: StatusProcedimento;
  motivos: string[];
  escalas: string[];
  preRequisitos: string[];
  regras: string[];
  fontes: string[];
}

/** Condição clínica do CSV reconhecida no relato, com o conteúdo de conduta. */
export interface CondicaoReconhecida {
  id: string;
  nome: string;
  cid10: string;
  area: string;
  sinaisAlerta: string[];
  avaliacao: string[];
  procedimentosRecomendados: { id: string; nome: string }[];
  precaucoes: string[];
  metas: string[];
  encaminharSe: string[];
  fontes: string[];
}

export interface ResultadoAnalise {
  triagem: ResultadoTriagem;
  condicoesClinicas: CondicaoReconhecida[];
  quadros: QuadroIdentificado[];
  condicoesDetectadas: string[];
  procedimentos: ProcedimentoAvaliado[];
  proximosPassos: string[];
  regrasGerais: RegraGeral[];
  limitacoes: string;
  /** Resposta da IA generativa (quando habilitada). Ausente quando a IA está desligada. */
  ia?: { resposta?: string; modelo?: string; erro?: string };
}

const LIMITACOES =
  'Análise por regras e palavras-chave a partir do dataset validado. Não interpreta frases livres ' +
  'fora do vocabulário cadastrado e não substitui o raciocínio clínico da fisioterapeuta.';

/** Casa o padrão em algum ponto do texto que NÃO esteja negado ("nega", "sem"...). */
function presente(textoNorm: string, re: RegExp): boolean {
  for (const m of textoNorm.matchAll(new RegExp(re.source, 'g'))) {
    if (!estaNegado(textoNorm, m.index!)) return true;
  }
  return false;
}

function condicoesDoContexto(anamnese: AnamneseInput): string[] {
  const c = anamnese.contexto ?? {};
  const ids: string[] = [];
  if (c.historicoCancer) ids.push('neoplasia');
  if (c.imunossuprimido) ids.push('imunossupressao');
  if (c.usoCorticoideProlongado) ids.push('corticoide');
  return ids;
}

// Red flags também implicam condições que contraindicam procedimentos.
const CONDICAO_POR_RED_FLAG: Record<string, string> = {
  NEU_CAUDA_EQUINA: 'caudaEquina',
  CAR_TVP: 'tvp',
  ONC_DOR_ONCOLOGICA: 'neoplasia',
  CTX_HISTORICO_CANCER: 'neoplasia',
  INF_FEBRE_DOR: 'infeccao',
  CTX_FEBRE: 'infeccao',
  FRA_TRAUMA: 'fratura',
  CTX_IDADE_FRATURA: 'fratura',
  RES_DISPNEIA_SUBITA: 'hemoptise',
};

function avaliarProcedimento(
  p: Procedimento,
  condicoes: Set<string>,
  anamnese: AnamneseInput,
  triagem: ResultadoTriagem,
): ProcedimentoAvaliado {
  const motivos: string[] = [];
  let status: StatusProcedimento = 'INDICADO';
  const rebaixar = (s: StatusProcedimento) => {
    if (s === 'CONTRAINDICADO' || (s === 'CAUTELA' && status === 'INDICADO')) status = s;
  };

  if (triagem.status === 'INTERROMPIDO' && p.id !== 'P001') {
    rebaixar('CONTRAINDICADO');
    motivos.push('Red flag crítica ativa: encaminhar antes de qualquer conduta terapêutica.');
  }

  for (const cond of CONDICOES) {
    if (!condicoes.has(cond.id)) continue;
    const abs = p.contraindicacoes_absolutas.filter((ci) => cond.naContraindicacao.test(normalizar(ci)));
    const rel = p.contraindicacoes_relativas.filter((ci) => cond.naContraindicacao.test(normalizar(ci)));
    if (abs.length) {
      rebaixar('CONTRAINDICADO');
      motivos.push(`${cond.nome} no relato → contraindicação absoluta: ${abs.join('; ')}`);
    }
    if (rel.length) {
      rebaixar('CAUTELA');
      motivos.push(`${cond.nome} no relato → contraindicação relativa: ${rel.join('; ')}`);
    }
  }

  // Limiares numéricos do dataset (P015 / P008 aplicam regras cardiovasculares).
  const ctx = anamnese.contexto ?? {};
  if (['P015', 'P008', 'P016'].includes(p.id)) {
    if (ctx.pressaoSistolica !== undefined && ctx.pressaoSistolica >= 180) {
      rebaixar('CONTRAINDICADO');
      motivos.push(`PA sistólica ${ctx.pressaoSistolica} mmHg ≥ 180: não realizar a sessão hoje (regra P015).`);
    }
    if (ctx.frequenciaCardiaca !== undefined && ctx.frequenciaCardiaca > 120) {
      rebaixar('CONTRAINDICADO');
      motivos.push(`FC de repouso ${ctx.frequenciaCardiaca} bpm > 120: não realizar a sessão hoje (regra P015).`);
    }
    if (ctx.saturacaoO2 !== undefined && ctx.saturacaoO2 < 90) {
      rebaixar('CAUTELA');
      motivos.push(`SpO2 ${ctx.saturacaoO2}% < 90%: monitorar e reavaliar antes do esforço.`);
    }
  }

  return {
    id: p.id,
    nome: p.nome,
    area: p.area,
    status,
    motivos,
    escalas: p.escalas_sugeridas,
    preRequisitos: p.pre_requisitos,
    regras: p.regras_validacao,
    fontes: p.fontes,
  };
}

export async function analisarConsulta(anamnese: AnamneseInput): Promise<ResultadoAnalise> {
  const triagem = avaliarAnamnese(anamnese);
  const { procedimentos: catalogo, regrasGerais, condicoes: catalogoCondicoes } = await carregarCatalogo();
  const porId = new Map(catalogo.map((p) => [p.id, p]));

  const texto = [anamnese.queixaPrincipal, anamnese.hfa, anamnese.hfp, anamnese.observacoes]
    .filter(Boolean).join('\n');
  const norm = normalizar(texto);

  // 1. Quadros clínicos e possíveis causas
  const quadros: QuadroIdentificado[] = QUADROS.filter((q) => presente(norm, q.gatilho)).map((q) => {
    const causas = q.possiveisCausas.map((c) => {
      const sustentada = c.sustentadaPor ? presente(norm, c.sustentadaPor) : false;
      return { causa: c.causa, sustentada, ...(sustentada && c.racional ? { racional: c.racional } : {}) };
    });
    causas.sort((a, b) => Number(b.sustentada) - Number(a.sustentada));
    return {
      id: q.id,
      nome: q.nome,
      sistemaCbdf: q.sistemaCbdf,
      possiveisCausas: causas,
      perguntasPendentes: q.perguntas.filter((p) => !p.respondidaSe.test(norm)).map((p) => p.texto),
      testes: q.testes,
    };
  });

  // 1b. Condições clínicas do CSV (conteúdo de conduta baseado em diretrizes)
  const ctxPa = anamnese.contexto?.pressaoSistolica;
  const condicoesClinicas: CondicaoReconhecida[] = catalogoCondicoes
    .filter((c) => {
      const re = GATILHOS_CONDICOES[c.id];
      if (re && presente(norm, re)) return true;
      return c.id === 'C023' && ctxPa !== undefined && ctxPa >= 140; // PA elevada informada nos sinais vitais
    })
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      cid10: c.cid10,
      area: c.area,
      sinaisAlerta: c.sinais_alerta,
      avaliacao: c.avaliacao,
      procedimentosRecomendados: c.procedimentos_recomendados.map((id) => ({ id, nome: porId.get(id)?.nome ?? id })),
      precaucoes: c.precaucoes,
      metas: c.metas,
      encaminharSe: c.criterios_encaminhamento,
      fontes: c.fontes,
    }));

  // 2. Condições que afetam contraindicações
  const condicoes = new Set<string>([
    ...CONDICOES.filter((c) => presente(norm, c.noRelato)).map((c) => c.id),
    ...condicoesDoContexto(anamnese),
    ...triagem.alertas.map((a) => CONDICAO_POR_RED_FLAG[a.regraId]).filter((c): c is string => Boolean(c)),
  ]);

  // 3. Procedimentos candidatos (sempre começa pela avaliação P001)
  // Recomendações das condições clínicas (diretrizes) vêm antes das dos quadros.
  const ids = new Set<string>(['P001']);
  for (const cc of condicoesClinicas) cc.procedimentosRecomendados.forEach((p) => ids.add(p.id));
  for (const q of QUADROS) if (quadros.some((x) => x.id === q.id)) q.procedimentos.forEach((id) => ids.add(id));
  // Procedimentos citados diretamente pela profissional (ex.: "posso usar laser?").
  for (const [id, re] of Object.entries(MENCOES_PROCEDIMENTOS)) if (re.test(norm)) ids.add(id);
  const procedimentos = [...ids]
    .map((id) => porId.get(id))
    .filter((p): p is Procedimento => Boolean(p))
    .map((p) => avaliarProcedimento(p, condicoes, anamnese, triagem));

  // 4. Próximos passos, em ordem de prioridade
  const passos: string[] = [];
  for (const a of triagem.alertas.filter((x) => x.severidade === 'CRITICA')) {
    passos.push(`🚨 ${a.descricao}: ${a.conduta}`);
  }
  if (triagem.status !== 'INTERROMPIDO') {
    for (const a of triagem.alertas.filter((x) => x.severidade !== 'CRITICA')) {
      passos.push(`Investigue antes de tratar — ${a.descricao}: ${a.conduta}`);
    }
    const perguntas = [...new Set(quadros.flatMap((q) => q.perguntasPendentes))].slice(0, 3);
    if (perguntas.length) passos.push(`Complete a anamnese: ${perguntas.join(' / ')}`);
    const testes = [...new Set(quadros.flatMap((q) => q.testes))].slice(0, 5);
    if (testes.length) passos.push(`No exame físico-funcional, considere: ${testes.join(', ')}.`);
    for (const cc of condicoesClinicas) {
      passos.push(`Avalie (${cc.nome}): ${cc.avaliacao.join(', ')}.`);
    }
    if (quadros.length) {
      passos.push(`Defina o diagnóstico CBDF com qualificadores 0–4: ${quadros.map((q) => q.sistemaCbdf).join(' | ')}.`);
    } else if (condicoesClinicas.length) {
      passos.push('Defina o diagnóstico CBDF (sistema + qualificadores 0–4) com base nos achados do exame.');
    } else {
      passos.push('Descreva a queixa (região, tempo, o que piora/melhora) para eu relacionar a um quadro clínico.');
    }
    const indicados = procedimentos.filter((p) => p.id !== 'P001' && p.status === 'INDICADO').map((p) => p.nome);
    if (indicados.length) passos.push(`Procedimentos compatíveis após o diagnóstico: ${indicados.slice(0, 4).join(', ')}.`);
    const bloqueados = procedimentos.filter((p) => p.status === 'CONTRAINDICADO').map((p) => p.nome);
    if (bloqueados.length) passos.push(`Evite por ora: ${bloqueados.join(', ')}.`);
    for (const cc of condicoesClinicas) {
      if (cc.precaucoes.length) passos.push(`Precauções (${cc.nome}): ${cc.precaucoes.join('; ')}.`);
      if (cc.metas.length) passos.push(`Metas mensuráveis (${cc.nome}): ${cc.metas.join('; ')}.`);
    }
    const encaminhar = [...new Set(condicoesClinicas.flatMap((cc) => cc.encaminharSe))];
    if (encaminhar.length) passos.push(`Encaminhe ao médico se: ${encaminhar.join('; ')}.`);
  }

  // 5. Regras gerais aplicáveis ao caso
  const ctx = anamnese.contexto ?? {};
  const aplicaveis = new Set(['G01', 'G02']);
  const grupoRisco = (ctx.idade ?? 0) >= 60 || quadros.some((q) => ['DISPNEIA_CARDIO', 'SECRECAO', 'UTI'].includes(q.id))
    || condicoesClinicas.some((cc) => /Cardiovascular|Respiratória|Gerontologia/.test(cc.area))
    || /anti.?hipertensiv|losartana|enalapril|captopril|hipertens/.test(norm);
  if (grupoRisco) aplicaveis.add('G04');
  if (procedimentos.some((p) => ['P011', 'P012'].includes(p.id) && p.status !== 'CONTRAINDICADO')) aplicaveis.add('G05');
  aplicaveis.add('G03');

  return {
    triagem,
    condicoesClinicas,
    quadros,
    condicoesDetectadas: CONDICOES.filter((c) => condicoes.has(c.id)).map((c) => c.nome),
    procedimentos,
    proximosPassos: passos,
    regrasGerais: regrasGerais.filter((r) => aplicaveis.has(r.id)),
    limitacoes: LIMITACOES,
  };
}
