// Tipos do módulo de Red Flags do copiloto clínico.
// O módulo NÃO diagnostica: apenas sinaliza achados que exigem avaliação/encaminhamento médico
// antes que o fluxo de sugestões (RAG / CBDF / RBPF) continue.

export type Severidade = 'CRITICA' | 'ALTA' | 'MODERADA';

export type CategoriaRedFlag =
  | 'ONCOLOGICA'
  | 'NEUROLOGICA'
  | 'CARDIOVASCULAR'
  | 'INFECCIOSA'
  | 'FRATURA'
  | 'RESPIRATORIA'
  | 'SISTEMICA';

/** Status do fluxo após a triagem. */
export type StatusTriagem =
  | 'LIBERADO'      // nenhum red flag: copiloto segue normalmente
  | 'ATENCAO'       // red flags ALTA/MODERADA: segue, mas com alertas visíveis
  | 'INTERROMPIDO'; // red flag CRITICA: sugestões suspensas até o profissional reconhecer o alerta

export interface RegraRedFlag {
  id: string;
  categoria: CategoriaRedFlag;
  severidade: Severidade;
  descricao: string;
  /** Padrões já normalizados (minúsculos, sem acento). Podem ser regex. */
  padroes: RegExp[];
  conduta: string;
  /** Sistema da CBDF relacionado (D01..D10), quando aplicável. */
  sistemaCbdf?: string;
}

/** Contexto estruturado opcional: permite regras que o texto livre sozinho não captura. */
export interface ContextoPaciente {
  idade?: number;
  historicoCancer?: boolean;
  imunossuprimido?: boolean;
  usoCorticoideProlongado?: boolean;
  traumaRecente?: boolean;
  frequenciaCardiaca?: number;
  saturacaoO2?: number;
  pressaoSistolica?: number;
  temperatura?: number;
}

export interface AnamneseInput {
  consultaId?: number;
  pacienteId?: number;
  queixaPrincipal?: string;
  /** História da Funcionalidade Atual (CBDF). */
  hfa?: string;
  /** História da Funcionalidade Pregressa (CBDF). */
  hfp?: string;
  observacoes?: string;
  contexto?: ContextoPaciente;
}

export interface AlertaRedFlag {
  regraId: string;
  categoria: CategoriaRedFlag;
  severidade: Severidade;
  descricao: string;
  /** Termo exatamente como encontrado no texto original. */
  termoDetectado: string;
  /** Campo da anamnese onde o termo apareceu, ou "contexto" para regras estruturadas. */
  campo: string;
  trecho: string;
  conduta: string;
  sistemaCbdf?: string;
}

export interface ResultadoTriagem {
  status: StatusTriagem;
  fluxoLiberado: boolean;
  requerReconhecimento: boolean;
  severidadeMaxima: Severidade | null;
  totalAlertas: number;
  alertas: AlertaRedFlag[];
  /** Termos encontrados, mas negados no texto (ex.: "nega febre"). Úteis para auditoria. */
  termosNegados: { termo: string; campo: string; trecho: string }[];
  versaoRegras: string;
  avaliadoEm: string;
  aviso: string;
}
