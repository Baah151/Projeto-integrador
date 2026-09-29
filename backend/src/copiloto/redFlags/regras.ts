import type { ContextoPaciente, RegraRedFlag, Severidade, CategoriaRedFlag } from './types.js';

// Catálogo inicial de red flags. Os padrões são aplicados sobre texto NORMALIZADO
// (minúsculo, sem acentos), então escreva-os sem acento.
// IMPORTANTE: esta lista é um ponto de partida técnico e deve ser revisada/validada
// por fisioterapeutas responsáveis antes de uso clínico.

export const VERSAO_REGRAS = '2026.09.1';

export const REGRAS_TEXTO: RegraRedFlag[] = [
  // ---------------- ONCOLÓGICAS ----------------
  {
    id: 'ONC_PERDA_PESO',
    categoria: 'ONCOLOGICA',
    severidade: 'ALTA',
    descricao: 'Perda de peso inexplicada',
    padroes: [
      /perda de peso (inexplicad\w*|sem explicacao|involuntari\w*|sem motivo|repentin\w*|sem causa)/,
      /emagrec\w* (sem motivo|sem explicacao|inexplicad\w*|involuntari\w*|rapid\w*)/,
    ],
    conduta: 'Investigar causa sistêmica; considerar encaminhamento médico antes de iniciar conduta.',
  },
  {
    id: 'ONC_DOR_NOTURNA',
    categoria: 'ONCOLOGICA',
    severidade: 'ALTA',
    descricao: 'Dor noturna/em repouso que não alivia com posição',
    padroes: [
      /dor (noturna|a noite|de noite) (que )?(nao (alivia|melhora|passa)|constante|intensa)/,
      /dor (em|no) repouso (que )?nao (alivia|melhora|passa)/,
      /dor (que )?nao (alivia|melhora|muda) com (repouso|posicao|mudanca de posicao)/,
    ],
    conduta: 'Dor mecânica não se comporta assim; descartar causa não musculoesquelética com avaliação médica.',
  },
  {
    id: 'ONC_DOR_ONCOLOGICA',
    categoria: 'ONCOLOGICA',
    severidade: 'CRITICA',
    descricao: 'Dor com suspeita ou histórico oncológico / metástase',
    padroes: [/dor oncologica/, /metastase/, /tumor (osseo|na coluna|vertebral)/, /massa palpavel/],
    conduta: 'Suspender condutas de carga/manipulação no segmento e alinhar com a equipe médica/oncológica.',
  },

  // ---------------- NEUROLÓGICAS ----------------
  {
    id: 'NEU_CAUDA_EQUINA',
    categoria: 'NEUROLOGICA',
    severidade: 'CRITICA',
    descricao: 'Sinais sugestivos de síndrome da cauda equina',
    padroes: [
      /anestesia (em sela|perineal|na regiao (genital|perineal))/,
      /(perda|diminuicao|alteracao) (de )?sensibilidade (em sela|perineal|na regiao genital)/,
      /(retencao|incontinencia) (urinaria|fecal) (nova|recente|subita|de inicio recente)/,
      /(perdeu|perda do) controle (da bexiga|do intestino|urinario|esfincter)/,
      /disfuncao (esfincteriana|de esfincter)/,
    ],
    conduta: 'EMERGÊNCIA: encaminhamento médico imediato (pronto-socorro).',
    sistemaCbdf: 'D01/D02',
  },
  {
    id: 'NEU_DEFICIT_PROGRESSIVO',
    categoria: 'NEUROLOGICA',
    severidade: 'CRITICA',
    descricao: 'Déficit neurológico progressivo',
    padroes: [
      /(fraqueza|perda de forca) (progressiva|que piora|piorando|subita)/,
      /deficit (neurologico|motor) progressivo/,
      /(queda do pe|pe caido) (recente|subita|nova)/,
    ],
    conduta: 'Encaminhamento médico com urgência para investigação neurológica.',
    sistemaCbdf: 'D01/D02',
  },
  {
    id: 'NEU_AVC_SINAIS',
    categoria: 'NEUROLOGICA',
    severidade: 'CRITICA',
    descricao: 'Sinais agudos sugestivos de AVC',
    padroes: [
      /(boca torta|desvio de rima|paralisia facial) (subit\w*|repentin\w*|agud\w*)/,
      /(fala enrolada|dificuldade (subita|repentina) para falar)/,
      /(perda|fraqueza) subita (de forca )?(em um lado|de um lado|no braco|na perna)/,
    ],
    conduta: 'EMERGÊNCIA: acionar SAMU (192).',
    sistemaCbdf: 'D02',
  },
  {
    id: 'NEU_CERVICAL_VASCULAR',
    categoria: 'NEUROLOGICA',
    severidade: 'ALTA',
    descricao: 'Sinais de insuficiência vertebrobasilar / instabilidade cervical (5 Ds)',
    padroes: [/diplopia/, /disartria/, /disfagia/, /drop attack/, /(tontura|vertigem) ao (girar|virar|mover) (a cabeca|o pescoco)/],
    conduta: 'Contraindicar manipulação/mobilização cervical até avaliação médica.',
    sistemaCbdf: 'D02/D03',
  },

  // ---------------- CARDIOVASCULARES / RESPIRATÓRIAS ----------------
  {
    id: 'CAR_DOR_TORACICA',
    categoria: 'CARDIOVASCULAR',
    severidade: 'CRITICA',
    descricao: 'Dor torácica sugestiva de evento cardíaco',
    padroes: [
      /dor (no peito|toracica) (irradiando|que irradia|com irradiacao) (para|pro) (o )?(braco|mandibula|queixo)/,
      /(aperto|pressao) no peito/,
      /dor (no peito|toracica) (aos|com) (esforcos|esforco)/,
    ],
    conduta: 'EMERGÊNCIA: interromper atendimento e acionar SAMU (192).',
    sistemaCbdf: 'D05',
  },
  {
    id: 'CAR_TVP',
    categoria: 'CARDIOVASCULAR',
    severidade: 'CRITICA',
    descricao: 'Sinais sugestivos de trombose venosa profunda',
    padroes: [
      /panturrilha (inchada|edemaciada|quente|vermelha|dolorosa)/,
      /(inchaco|edema) (unilateral|em uma perna so|de uma perna) (com dor|doloros\w*)/,
      /suspeita de (tvp|trombose)/,
    ],
    conduta: 'Não mobilizar/massagear o membro; encaminhamento médico imediato.',
    sistemaCbdf: 'D05/D06',
  },
  {
    id: 'RES_DISPNEIA_SUBITA',
    categoria: 'RESPIRATORIA',
    severidade: 'CRITICA',
    descricao: 'Dispneia súbita / em repouso',
    padroes: [/(falta de ar|dispneia) (subita|repentina|em repouso|intensa)/, /hemoptise/, /(tosse com|escarrando) sangue/],
    conduta: 'EMERGÊNCIA: avaliar sinais vitais e acionar serviço de urgência.',
    sistemaCbdf: 'D04',
  },

  // ---------------- INFECCIOSAS / SISTÊMICAS ----------------
  {
    id: 'INF_FEBRE_DOR',
    categoria: 'INFECCIOSA',
    severidade: 'ALTA',
    descricao: 'Febre associada a dor (suspeita de infecção)',
    padroes: [/febre/, /calafrios?/, /sudorese noturna/],
    conduta: 'Investigar processo infeccioso (ex.: espondilodiscite, artrite séptica) antes de prosseguir.',
  },
  {
    id: 'SIS_MAL_ESTAR',
    categoria: 'SISTEMICA',
    severidade: 'MODERADA',
    descricao: 'Sintomas sistêmicos inespecíficos',
    padroes: [/mal estar (geral|constante)/, /fadiga (extrema|inexplicad\w*)/, /perda de apetite/],
    conduta: 'Registrar e correlacionar com os demais achados; considerar contato com médico assistente.',
  },

  // ---------------- FRATURA ----------------
  {
    id: 'FRA_TRAUMA',
    categoria: 'FRATURA',
    severidade: 'ALTA',
    descricao: 'Trauma significativo com suspeita de fratura',
    padroes: [
      /(queda|caiu) (de altura|da escada|do telhado)/,
      /acidente (de carro|de moto|automobilistico|de transito)/,
      /suspeita de fratura/,
      /(nao consegue|incapaz de) (apoiar|descarregar peso|pisar)/,
      /deformidade (visivel|aparente)/,
    ],
    conduta: 'Solicitar/verificar exame de imagem antes de condutas com carga ou mobilização.',
    sistemaCbdf: 'D03',
  },
];

interface RegraContexto {
  id: string;
  categoria: CategoriaRedFlag;
  severidade: Severidade;
  descricao: string;
  conduta: string;
  /** Retorna o texto de evidência quando a regra dispara, ou null. */
  avaliar: (ctx: ContextoPaciente) => string | null;
}

// Regras sobre dados estruturados (idade, sinais vitais, comorbidades).
export const REGRAS_CONTEXTO: RegraContexto[] = [
  {
    id: 'CTX_HISTORICO_CANCER',
    categoria: 'ONCOLOGICA',
    severidade: 'ALTA',
    descricao: 'Histórico prévio de câncer',
    conduta: 'Considerar metástase como diagnóstico diferencial para dor nova.',
    avaliar: (c) => (c.historicoCancer ? 'historicoCancer = true' : null),
  },
  {
    id: 'CTX_IDADE_FRATURA',
    categoria: 'FRATURA',
    severidade: 'ALTA',
    descricao: 'Risco aumentado de fratura (idade ≥ 70 ou corticoide prolongado) com trauma',
    conduta: 'Descartar fratura por fragilidade antes de condutas com carga.',
    avaliar: (c) =>
      c.traumaRecente && ((c.idade ?? 0) >= 70 || c.usoCorticoideProlongado)
        ? `traumaRecente com idade=${c.idade ?? '?'} / corticoide=${Boolean(c.usoCorticoideProlongado)}`
        : null,
  },
  {
    id: 'CTX_IMUNOSSUPRESSAO',
    categoria: 'INFECCIOSA',
    severidade: 'MODERADA',
    descricao: 'Paciente imunossuprimido',
    conduta: 'Maior risco de infecção; atenção a febre e dor não mecânica.',
    avaliar: (c) => (c.imunossuprimido ? 'imunossuprimido = true' : null),
  },
  {
    id: 'CTX_SPO2_BAIXA',
    categoria: 'RESPIRATORIA',
    severidade: 'CRITICA',
    descricao: 'Saturação de O2 abaixo de 90%',
    conduta: 'Interromper atendimento e acionar serviço de urgência.',
    avaliar: (c) => (c.saturacaoO2 !== undefined && c.saturacaoO2 < 90 ? `SpO2=${c.saturacaoO2}%` : null),
  },
  {
    id: 'CTX_FC_ALTERADA',
    categoria: 'CARDIOVASCULAR',
    severidade: 'ALTA',
    descricao: 'Frequência cardíaca de repouso fora da faixa segura (<40 ou >120 bpm)',
    conduta: 'Não iniciar exercício; reavaliar sinais vitais e contatar médico se persistir.',
    avaliar: (c) =>
      c.frequenciaCardiaca !== undefined && (c.frequenciaCardiaca < 40 || c.frequenciaCardiaca > 120)
        ? `FC=${c.frequenciaCardiaca} bpm`
        : null,
  },
  {
    id: 'CTX_PA_ELEVADA',
    categoria: 'CARDIOVASCULAR',
    severidade: 'ALTA',
    descricao: 'Pressão sistólica ≥ 180 mmHg',
    conduta: 'Contraindicar exercício até controle pressórico.',
    avaliar: (c) => (c.pressaoSistolica !== undefined && c.pressaoSistolica >= 180 ? `PAS=${c.pressaoSistolica} mmHg` : null),
  },
  {
    id: 'CTX_FEBRE',
    categoria: 'INFECCIOSA',
    severidade: 'ALTA',
    descricao: 'Temperatura ≥ 37,8 °C',
    conduta: 'Investigar processo infeccioso antes de prosseguir.',
    avaliar: (c) => (c.temperatura !== undefined && c.temperatura >= 37.8 ? `T=${c.temperatura} °C` : null),
  },
];
