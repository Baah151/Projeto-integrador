// Base de conhecimento do raciocínio clínico por regras.
// Padrões aplicados sobre texto NORMALIZADO (minúsculo, sem acentos) — escreva sem acento.
// ⚠️ Conteúdo técnico inicial: deve ser revisado e validado pela equipe clínica.

export interface CausaPossivel {
  causa: string;
  /** Achados do relato que tornam esta causa mais provável. */
  sustentadaPor?: RegExp;
  /** Por que o achado sustenta a causa (exibido quando `sustentadaPor` casar). */
  racional?: string;
}

export interface PerguntaChave {
  texto: string;
  /** Se o relato já casar com este padrão, a pergunta é considerada respondida. */
  respondidaSe: RegExp;
}

export interface Quadro {
  id: string;
  nome: string;
  gatilho: RegExp;
  sistemaCbdf: string;
  possiveisCausas: CausaPossivel[];
  perguntas: PerguntaChave[];
  /** Testes físicos a considerar no exame físico-funcional. */
  testes: string[];
  /** Procedimentos do dataset (ids P0xx) relacionados, em ordem de prioridade. */
  procedimentos: string[];
}

export const QUADROS: Quadro[] = [
  {
    id: 'LOMBALGIA',
    nome: 'Dor lombar',
    gatilho: /dor (na |nas |em )?(lombar|lombo|costas|coluna lombar)|lombalgia|lombociatalgia|ciatica/,
    sistemaCbdf: 'D03 (musculoesquelética) — D03.00 se sem lesão estrutural; considerar D01 se houver componente radicular',
    possiveisCausas: [
      { causa: 'Dor lombar inespecífica (mecânica/miofascial)', sustentadaPor: /piora (ao|com|quando) (sentar|abaixar|carregar|levantar|flexionar|movimento)|melhora (com|em) repouso|mecanica/, racional: 'dor que varia com posição e carga sugere origem mecânica' },
      { causa: 'Radiculopatia lombar (ex.: hérnia discal)', sustentadaPor: /irradia\w* (para|pra|ate) (a |o )?(perna|pe|gluteo|coxa|panturrilha)|ciatica|formigamento na perna|choque na perna|lombociatalgia/, racional: 'dor irradiada abaixo do joelho / parestesia sugere compressão radicular' },
      { causa: 'Estenose do canal lombar', sustentadaPor: /piora (ao|com|quando) (andar|caminhar|ficar em pe)|melhora (ao|quando) sentar|claudicacao/, racional: 'claudicação neurogênica (piora andando, alivia sentado) é típica de estenose' },
      { causa: 'Espondilolistese / instabilidade segmentar', sustentadaPor: /piora (ao|com) (estender|extensao|inclinar para tras)|travamento|falseio (na|da) coluna/ },
      { causa: 'Causa não mecânica (visceral, inflamatória, oncológica) — ver red flags', sustentadaPor: /rigidez matinal (prolongada|mais de|> ?30)|dor noturna|nao melhora com (nada|repouso)/, racional: 'rigidez matinal prolongada ou dor noturna sugerem causa inflamatória/sistêmica' },
    ],
    perguntas: [
      { texto: 'A dor irradia para a perna? Até onde (acima ou abaixo do joelho)?', respondidaSe: /irradia|nao irradia|localizada|ciatica/ },
      { texto: 'O que piora e o que melhora a dor (sentar, andar, deitar)?', respondidaSe: /piora|melhora|alivia/ },
      { texto: 'Há formigamento, dormência ou fraqueza nas pernas?', respondidaSe: /formig|dormen|fraqueza|parestesia|sensibilidade/ },
      { texto: 'Alguma alteração urinária/intestinal ou dormência na região genital?', respondidaSe: /urin|intestin|sela|genital|esfincter/ },
      { texto: 'Há quanto tempo começou (aguda < 6 semanas, crônica > 12 semanas)?', respondidaSe: /\b(ha|faz|desde)\b.{0,20}(dia|semana|mes|ano)/ },
    ],
    testes: ['Elevação da perna retificada (Lasègue) e Slump', 'Exame neurológico (dermátomos, miótomos, reflexos)', 'Mobilidade lombar e testes de provocação por direção', 'STarT Back (estratificação)'],
    procedimentos: ['P001', 'P020', 'P008', 'P009', 'P010', 'P011', 'P002', 'P005'],
  },
  {
    id: 'CERVICALGIA',
    nome: 'Dor cervical',
    gatilho: /dor (no |na )?(pescoco|cervical|nuca)|cervicalgia|torcicolo/,
    sistemaCbdf: 'D03 (musculoesquelética); D01 se radiculopatia cervical',
    possiveisCausas: [
      { causa: 'Cervicalgia mecânica/postural', sustentadaPor: /(computador|celular|postura|trabalho sentado)|piora (ao|com) (movimento|virar)/, racional: 'relação com postura e movimento sugere origem mecânica' },
      { causa: 'Radiculopatia cervical', sustentadaPor: /irradia\w* (para|pra|ate) (o |a )?(braco|mao|dedos|ombro)|formigamento (no|na) (braco|mao)/, racional: 'sintomas irradiados para o membro superior' },
      { causa: 'Cefaleia cervicogênica', sustentadaPor: /dor de cabeca|cefaleia/ },
      { causa: 'Lesão em chicote (whiplash)', sustentadaPor: /acidente de (carro|moto|transito)|batida de carro|chicote/ },
      { causa: 'Causa vascular/instabilidade — ver red flags (5 Ds)', sustentadaPor: /tontura|vertigem|diplopia|disfagia|disartria/ },
    ],
    perguntas: [
      { texto: 'A dor irradia para o braço ou mão? Há formigamento?', respondidaSe: /irradia|formig|nao irradia/ },
      { texto: 'Tem tontura, visão dupla ou dificuldade para engolir/falar ao mover o pescoço?', respondidaSe: /tontura|vertigem|diplopia|disfagia|disartria/ },
      { texto: 'Houve trauma (acidente, queda)?', respondidaSe: /trauma|acidente|queda|caiu|batida/ },
    ],
    testes: ['Teste de Spurling e distração cervical', 'ULTT (tensão neural do membro superior)', 'Triagem vascular cervical (IFOMPT)', 'NDI (Neck Disability Index)'],
    procedimentos: ['P001', 'P010', 'P009', 'P008', 'P011', 'P002'],
  },
  {
    id: 'OMBRO',
    nome: 'Dor no ombro',
    gatilho: /dor (no |nos )?ombros?|ombro doloroso|manguito/,
    sistemaCbdf: 'D03 — segmento: ombro (Bloco C = 3)',
    possiveisCausas: [
      { causa: 'Tendinopatia do manguito rotador / síndrome do impacto', sustentadaPor: /piora (ao|com|quando) (levantar|elevar) o braco|arco doloroso|acima da cabeca/, racional: 'dor na elevação do braço (arco doloroso) é típica' },
      { causa: 'Capsulite adesiva ("ombro congelado")', sustentadaPor: /(rigidez|travado|nao consegue mexer|perda de movimento)|diabet/, racional: 'perda global de movimento passivo, comum em diabéticos' },
      { causa: 'Ruptura do manguito rotador', sustentadaPor: /fraqueza (para|ao) (levantar|elevar)|nao consegue levantar o braco|queda sobre o braco/ },
      { causa: 'Instabilidade glenoumeral / luxação prévia', sustentadaPor: /luxa|deslocou|saiu do lugar|instabilidade/ },
      { causa: 'Dor referida cervical', sustentadaPor: /pescoco|cervical/ },
    ],
    perguntas: [
      { texto: 'Consegue elevar o braço acima da cabeça? Dói em algum ponto do arco?', respondidaSe: /levant|elev|arco|acima da cabeca/ },
      { texto: 'A perda de movimento é também passiva (quando outra pessoa move)?', respondidaSe: /passiv|rigidez|travado/ },
      { texto: 'Dói à noite ao deitar sobre o ombro?', respondidaSe: /noite|dormir|deitar/ },
    ],
    testes: ['Neer, Hawkins-Kennedy e arco doloroso', 'Jobe (supraespinal) e drop arm', 'Goniometria ativa x passiva', 'SPADI ou DASH'],
    procedimentos: ['P001', 'P009', 'P008', 'P010', 'P007', 'P004', 'P006'],
  },
  {
    id: 'QUADRIL',
    nome: 'Dor no quadril',
    // "cadeiras" é o termo popular para quadril; exclui "cadeira de rodas".
    gatilho: /(dor|doi|doem|doendo|dolorid)\w*.{0,30}\b(quadril|quadris|virilha|cadeiras?(?! de rodas)|trocanter)\b|\b(quadril|quadris|virilha|cadeiras?(?! de rodas)|trocanter)\b.{0,30}(dor|doi|doem|doendo|dolorid)|coxalgia|quadril (travando|estalando)/,
    sistemaCbdf: 'D03 — segmento: quadril direito/esquerdo (Bloco C = 3) ou ambos (4)',
    possiveisCausas: [
      { causa: 'Osteoartrite do quadril', sustentadaPor: /rigidez matinal|dor (na|para a) virilha|dificuldade (para|de) (calcar|colocar) (meia|sapato)|artrose|([5-9]\d) anos/, racional: 'dor na virilha com rigidez e perda de rotação interna, típica acima dos 50 anos' },
      { causa: 'Síndrome dolorosa do trocanter maior (tendinopatia glútea / bursite)', sustentadaPor: /(dor|doi) (na|no) (lateral|lado de fora)|trocanter|deitar (de lado|sobre o lado)|subir escada/, racional: 'dor lateral que piora ao deitar sobre o lado e ao subir escadas' },
      { causa: 'Impacto femoroacetabular / lesão do lábio acetabular', sustentadaPor: /estalo|trava|agachar|(muito tempo|longos periodos) sentad|sentad\w* (muito tempo|por muito)|esporte|jovem|atleta/, racional: 'dor na virilha ao agachar/flexionar, com estalo ou travamento, em adulto jovem ativo' },
      { causa: 'Dor referida da coluna lombar ou sacroilíaca', sustentadaPor: /lombar|costas|nadega|gluteo|irradia/, racional: 'dor glútea/posterior que acompanha a coluna sugere origem lombar' },
      { causa: 'Fratura do colo do fêmur (idoso após queda) — ver red flags', sustentadaPor: /(queda|caiu).{0,60}(nao consegue|incapaz de) (apoiar|pisar|andar)|(nao consegue|incapaz de) (apoiar|pisar|andar).{0,60}(queda|caiu)|perna (encurtada|virada para fora)/, racional: 'queda + incapacidade de apoiar em idoso exige descartar fratura antes de qualquer conduta' },
      { causa: 'Necrose avascular da cabeça femoral', sustentadaPor: /corticoide|prednisona|alcool|etilis|anemia falciforme/, racional: 'uso de corticoide/álcool é fator de risco' },
      { causa: 'Pubalgia / lesão de adutores', sustentadaPor: /pubis|pubalgia|adutor|chute|futebol/ },
    ],
    perguntas: [
      { texto: 'Onde exatamente dói: virilha, lateral (trocanter) ou nádega?', respondidaSe: /virilha|lateral|lado de fora|trocanter|nadega|gluteo/ },
      { texto: 'Houve queda ou trauma? Consegue apoiar o peso na perna?', respondidaSe: /queda|caiu|trauma|apoi|pisa|nao houve/ },
      { texto: 'Tem rigidez ao acordar ou dificuldade para calçar meia/sapato?', respondidaSe: /rigidez|meia|sapato/ },
      { texto: 'A dor piora ao deitar de lado, subir escada ou agachar?', respondidaSe: /deitar|escada|agach/ },
      { texto: 'Usa ou usou corticoide por tempo prolongado?', respondidaSe: /corticoide|prednisona|nao usa/ },
    ],
    testes: ['FABER (Patrick) e FADIR (impacto)', 'Rotação interna passiva / goniometria do quadril', 'Palpação do trocanter e teste de apoio unipodal 30 s', 'Trendelenburg', 'HOOS ou Lequesne'],
    procedimentos: ['P001', 'P008', 'P009', 'P010', 'P017', 'P007', 'P004', 'P005'],
  },
  {
    id: 'JOELHO',
    nome: 'Dor no joelho',
    gatilho: /dor (no |nos )?joelhos?|gonalgia|joelho (inchado|travando|falseando)/,
    sistemaCbdf: 'D03 — segmento: joelho (Bloco C = 3, ou 4 se bilateral)',
    possiveisCausas: [
      { causa: 'Dor patelofemoral', sustentadaPor: /piora (ao|com|quando) (subir|descer) escada|agachar|ficar muito tempo sentado/, racional: 'dor anterior ao agachar/usar escadas' },
      { causa: 'Osteoartrite de joelho', sustentadaPor: /rigidez matinal (curta|rapida)|crepita|artrose|([5-9]\d) anos/, racional: 'idade > 50 com rigidez curta e crepitação' },
      { causa: 'Lesão meniscal', sustentadaPor: /travamento|trava|estalo|torceu o joelho/, racional: 'travamento mecânico após torção' },
      { causa: 'Lesão ligamentar (ex.: LCA)', sustentadaPor: /falseio|falseia|instabilidade|estalo na hora|entorse do joelho/, racional: 'falseio/instabilidade após trauma torcional' },
      { causa: 'Tendinopatia patelar', sustentadaPor: /salto|pular|abaixo da patela/ },
    ],
    perguntas: [
      { texto: 'Houve trauma ou torção? Ouviu estalo?', respondidaSe: /trauma|torc|estalo|entorse|caiu|nao houve trauma/ },
      { texto: 'O joelho trava ou falseia?', respondidaSe: /trava|false|instabil/ },
      { texto: 'Incha após atividade?', respondidaSe: /inch|edema|derrame/ },
    ],
    testes: ['Lachman e gaveta anterior', 'McMurray / Thessaly', 'Teste de compressão patelar', 'KOOS ou Lysholm'],
    procedimentos: ['P001', 'P008', 'P009', 'P006', 'P003', 'P010', 'P004'],
  },
  {
    id: 'LCA_POS_OP',
    nome: 'Pós-operatório de reconstrução do LCA',
    gatilho: /\blca\b|cruzado anterior|reconstrucao ligamentar/,
    sistemaCbdf: 'D03.01 (lesão estrutural aguda) ou D03.02 (crônica) — segmento joelho',
    possiveisCausas: [
      { causa: 'Déficit de ativação/força do quadríceps pós-cirúrgico', sustentadaPor: /fraqueza|atrofia|nao consegue estender|quadriceps/ },
      { causa: 'Perda de ADM (artrofibrose)', sustentadaPor: /nao dobra|nao estica|rigidez|perda de (movimento|amplitude)/ },
      { causa: 'Complicação: TVP ou infecção de ferida — ver red flags', sustentadaPor: /panturrilha|vermelh|secrecao na ferida|febre/ },
    ],
    perguntas: [
      { texto: 'Qual a data da cirurgia e há restrições do cirurgião (ex.: reparo meniscal)?', respondidaSe: /cirurgia (foi|ha|em)|semanas de pos|restric|menisc/ },
      { texto: 'Como está a extensão completa do joelho e a flexão?', respondidaSe: /extens|flex|graus|amplitude/ },
    ],
    testes: ['Goniometria', 'Perimetria (edema)', 'Elevação da perna estendida (lag de quadríceps)', 'IKDC / Lysholm; Hop tests e LSI na fase final'],
    procedimentos: ['P019', 'P003', 'P008', 'P009', 'P006'],
  },
  {
    id: 'TORNOZELO',
    nome: 'Entorse / dor no tornozelo',
    gatilho: /torceu o (pe|tornozelo)|entorse (de|do) tornozelo|dor no tornozelo|virou o pe/,
    sistemaCbdf: 'D03.01 (lesão estrutural aguda) — segmento tornozelo',
    possiveisCausas: [
      { causa: 'Entorse lateral (ligamento talofibular anterior)', sustentadaPor: /virou (o pe )?para dentro|inversao|lateral/ },
      { causa: 'Fratura (aplicar Regras de Ottawa)', sustentadaPor: /nao consegue (apoiar|pisar|andar)|dor no osso|maleolo/, racional: 'incapacidade de apoiar exige descartar fratura (Ottawa)' },
      { causa: 'Instabilidade crônica do tornozelo', sustentadaPor: /varias vezes|de novo|recorrente|sempre torce/ },
    ],
    perguntas: [
      { texto: 'Conseguiu apoiar o pé e dar 4 passos logo após e na consulta?', respondidaSe: /apoi|pisa|andar|passos/ },
      { texto: 'Há quanto tempo foi (menos de 72 h)?', respondidaSe: /ontem|hoje|dias?|semana|horas/ },
    ],
    testes: ['Regras de Ottawa para tornozelo', 'Gaveta anterior e inclinação talar', 'Perimetria em 8', 'CAIT (instabilidade)'],
    procedimentos: ['P001', 'P006', 'P008', 'P017', 'P009'],
  },
  {
    id: 'AVC',
    nome: 'Sequela de AVC / hemiparesia',
    gatilho: /\bavc\b|derrame(?!\s+(articular|pleural|sinovial|pericardico|no joelho|na articulacao))|hemipares|hemipleg|acidente vascular/,
    sistemaCbdf: 'D02 (neurocentral) — status conforme tônus (D02.02/D02.03 se hipertonia); segmento hemicorpo (2)',
    possiveisCausas: [
      { causa: 'Déficit de controle motor e força no hemicorpo', sustentadaPor: /fraqueza|nao mexe|dificuldade (de|para) mexer|hemipares/ },
      { causa: 'Espasticidade', sustentadaPor: /espastic|rigido|duro|tonus aumentado/ },
      { causa: 'Alteração de equilíbrio e marcha com risco de quedas', sustentadaPor: /queda|desequilibr|marcha|andar/ },
      { causa: 'Ombro doloroso hemiplégico / subluxação', sustentadaPor: /dor no ombro|ombro caido|subluxa/ },
    ],
    perguntas: [
      { texto: 'Há quanto tempo foi o AVC e há liberação médica para mobilização?', respondidaSe: /(ha|faz) .{0,15}(dia|mes|ano)|liberad|liberacao/ },
      { texto: 'Como está a marcha (independente, com dispositivo, cadeira)?', respondidaSe: /anda|marcha|bengala|andador|cadeira/ },
    ],
    testes: ['Fugl-Meyer', 'Ashworth modificada', 'Velocidade de marcha 10 m', 'Berg / TUG', 'Barthel ou MIF'],
    procedimentos: ['P001', 'P018', 'P017', 'P003', 'P008', 'P009'],
  },
  {
    id: 'QUEDAS',
    nome: 'Risco de quedas / desequilíbrio',
    gatilho: /quedas?|caiu|desequilibr|tontura|vertigem|equilibrio/,
    sistemaCbdf: 'D02 (controle do movimento) ou S02.01 se ainda sem deficiência instalada',
    possiveisCausas: [
      { causa: 'Fraqueza de membros inferiores / sarcopenia', sustentadaPor: /fraqueza|dificuldade (de|para) levantar|perdeu massa/ },
      { causa: 'Disfunção vestibular (ex.: VPPB)', sustentadaPor: /vertigem|gira|rodando|ao (deitar|virar na cama)/, racional: 'vertigem posicional sugere VPPB' },
      { causa: 'Hipotensão ortostática', sustentadaPor: /ao levantar|escurece a vista|pressao baixa/ },
      { causa: 'Polifarmácia / efeitos de medicação', sustentadaPor: /remedios|medicamentos|calmante|benzodiazep|remedio para dormir/ },
      { causa: 'Déficit visual ou sensorial', sustentadaPor: /enxerga mal|catarata|neuropatia|dormencia nos pes/ },
    ],
    perguntas: [
      { texto: 'Quantas quedas nos últimos 12 meses? Houve lesão?', respondidaSe: /(uma|duas|tres|\d+) (queda|vez)|nunca caiu|primeira queda/ },
      { texto: 'Tem tontura ao levantar ou ao virar a cabeça/deitar?', respondidaSe: /tontura|vertigem|ao levantar/ },
      { texto: 'Quais medicamentos usa?', respondidaSe: /remedio|medicament|usa \w+|nao usa/ },
    ],
    testes: ['TUG', 'Berg (BBS) ou Mini-BESTest', 'Sentar-levantar 30 s', 'Dix-Hallpike (se vertigem posicional)', 'FES-I (medo de cair)'],
    procedimentos: ['P001', 'P017', 'P008'],
  },
  {
    id: 'SECRECAO',
    nome: 'Hipersecreção pulmonar',
    gatilho: /secrecao|catarro|expector|tosse produtiva|escarro/,
    sistemaCbdf: 'D04.00 ou D04.01 (obstrutiva, componente secretivo)',
    possiveisCausas: [
      { causa: 'Exacerbação de DPOC / bronquite crônica', sustentadaPor: /dpoc|fumante|tabagis|bronquite/ },
      { causa: 'Pneumonia / infecção respiratória', sustentadaPor: /febre|catarro (amarelo|verde)|purulent/, racional: 'secreção purulenta com febre sugere infecção' },
      { causa: 'Bronquiectasia', sustentadaPor: /bronquiectasia|catarro todos os dias|grande quantidade/ },
      { causa: 'Tosse ineficaz por fraqueza muscular', sustentadaPor: /tosse fraca|nao consegue tossir|neuromuscular/ },
    ],
    perguntas: [
      { texto: 'Aspecto e quantidade da secreção? Tem febre?', respondidaSe: /amarel|verde|clara|purulent|febre|quantidade/ },
      { texto: 'SpO2 e frequência respiratória em repouso?', respondidaSe: /spo2|sat|fr\b|frequencia respiratoria/ },
    ],
    testes: ['Ausculta pulmonar', 'SpO2 e FR', 'Pico de fluxo de tosse', 'Borg dispneia / mMRC'],
    procedimentos: ['P001', 'P013', 'P014'],
  },
  {
    id: 'DISPNEIA_CARDIO',
    nome: 'Cardiopatia / baixa tolerância ao esforço',
    gatilho: /infarto|\biam\b|cardiopat|insuficiencia cardiaca|revasculariza|ponte de safena|angioplastia|stent|cansaco (aos|ao|com) esforc/,
    sistemaCbdf: 'D05 (cardiovascular) — D05.01 se alteração estrutural',
    possiveisCausas: [
      { causa: 'Baixa capacidade aeróbica pós-evento cardíaco', sustentadaPor: /infarto|iam|revasculariza|safena|stent/ },
      { causa: 'Insuficiência cardíaca (compensada?)', sustentadaPor: /insuficiencia cardiaca|incha (as|a) pernas?|falta de ar deitado|ortopneia/ },
      { causa: 'Descondicionamento físico', sustentadaPor: /sedentari|parado|acamado|internado/ },
    ],
    perguntas: [
      { texto: 'Há liberação médica / teste ergométrico recente?', respondidaSe: /liberad|ergometr|cardiopulmonar|teste de esforco/ },
      { texto: 'PA, FC e SpO2 em repouso hoje?', respondidaSe: /\bpa\b|pressao|\bfc\b|spo2|sat/ },
      { texto: 'Tem dor no peito, palpitação ou falta de ar desproporcional ao esforço?', respondidaSe: /dor no peito|palpita|falta de ar|angina/ },
    ],
    testes: ['TC6 (teste de caminhada de 6 min)', 'Borg', 'FC de reserva (Karvonen)', 'Sinais vitais pré e pós'],
    procedimentos: ['P001', 'P015', 'P008', 'P014'],
  },
  {
    id: 'INCONTINENCIA',
    nome: 'Incontinência urinária',
    gatilho: /incontinencia|perde urina|perda de urina|escapa (xixi|urina)|vazamento de urina/,
    sistemaCbdf: 'D07.00 (urinária de armazenamento)',
    possiveisCausas: [
      { causa: 'Incontinência de esforço', sustentadaPor: /(tosse|espirr|rir|pular|carregar peso|esforco)/, racional: 'perda aos esforços (tosse, espirro) = esforço' },
      { causa: 'Incontinência de urgência (bexiga hiperativa)', sustentadaPor: /urgencia|nao da tempo|vontade (forte|subita)/, racional: 'urgência súbita sem esforço = urgência' },
      { causa: 'Incontinência mista', sustentadaPor: /(tosse|espirr).{0,60}(urgencia|nao da tempo)|(urgencia|nao da tempo).{0,60}(tosse|espirr)/ },
      { causa: 'Pós-prostatectomia / pós-parto', sustentadaPor: /prostat|parto|gestac/ },
    ],
    perguntas: [
      { texto: 'Perde urina ao tossir/espirrar, ou sente urgência e não dá tempo?', respondidaSe: /tosse|espirr|urgencia|nao da tempo|esforco/ },
      { texto: 'Quantas vezes urina por dia e à noite?', respondidaSe: /vezes (por|ao) dia|noctur|a noite/ },
      { texto: 'Há dor/ardência ao urinar ou sangramento?', respondidaSe: /ardencia|dor ao urinar|sangr|infeccao urinaria/ },
    ],
    testes: ['Oxford modificada / PERFECT', 'ICIQ-SF', 'Diário miccional (3 dias)', 'Pad test'],
    procedimentos: ['P001', 'P021'],
  },
  {
    id: 'LINFEDEMA',
    nome: 'Linfedema',
    gatilho: /linfedema|mastectomia|esvaziamento axilar|braco inchado/,
    sistemaCbdf: 'D06.02 (tegumentar com edema crônico) ou D05 (funções dos vasos — linfático)',
    possiveisCausas: [
      { causa: 'Linfedema secundário pós-tratamento oncológico', sustentadaPor: /mastectomia|esvaziamento|radioterapia|cancer de mama/ },
      { causa: 'Infecção (erisipela/celulite) — contraindica drenagem', sustentadaPor: /vermelh|quente|febre|erisipela|celulite/, racional: 'calor/rubor/febre contraindicam DLM até tratar' },
      { causa: 'TVP — descartar antes de drenar', sustentadaPor: /dor na panturrilha|edema subito|inchou de repente/ },
    ],
    perguntas: [
      { texto: 'O membro está quente, vermelho ou houve febre?', respondidaSe: /quente|vermelh|febre|sem sinais/ },
      { texto: 'Perimetria/volumetria inicial registrada?', respondidaSe: /perimetria|volumetria|cm/ },
    ],
    testes: ['Perimetria / volumetria', 'Sinal de Stemmer', 'ITB antes de enfaixamento compressivo'],
    procedimentos: ['P001', 'P022', 'P008'],
  },
  {
    id: 'MIOFASCIAL',
    nome: 'Dor miofascial',
    gatilho: /ponto.?gatilho|miofascial|contratura|no muscular|trigger/,
    sistemaCbdf: 'D03.00 (sem lesão de estrutura)',
    possiveisCausas: [
      { causa: 'Síndrome dolorosa miofascial', sustentadaPor: /ponto.?gatilho|dor referida|banda tensa/ },
      { causa: 'Sobrecarga postural/ocupacional', sustentadaPor: /trabalho|postura|computador|estresse/ },
    ],
    perguntas: [
      { texto: 'A palpação reproduz a dor referida do paciente?', respondidaSe: /palpa|reproduz|referida/ },
      { texto: 'Usa anticoagulante? Tem medo de agulha? (antes de agulhamento seco)', respondidaSe: /anticoag|agulha/ },
    ],
    testes: ['Palpação de pontos-gatilho', 'Algometria de pressão', 'EVA/END'],
    procedimentos: ['P001', 'P012', 'P009', 'P002', 'P005', 'P008'],
  },
  {
    id: 'UTI',
    nome: 'Paciente crítico (UTI)',
    gatilho: /\buti\b|intubad|ventilacao mecanica|terapia intensiva|sedad/,
    sistemaCbdf: 'D04 (respiratória) e/ou D02/D03 (fraqueza adquirida na UTI)',
    possiveisCausas: [
      { causa: 'Fraqueza adquirida na UTI', sustentadaPor: /fraqueza|acamado|dias de uti|imobilidade/ },
      { causa: 'Hipersecreção / hipoventilação', sustentadaPor: /secrecao|atelectasia|hipoventil/ },
    ],
    perguntas: [
      { texto: 'Checklist de segurança (Hodgson): drogas vasoativas, FiO2, PEEP, FC, PAM?', respondidaSe: /noradrenalina|vasoativa|fio2|peep|pam/ },
      { texto: 'Nível de sedação (RASS)?', respondidaSe: /rass/ },
    ],
    testes: ['RASS', 'MRC-SS', 'Perme / IMS', 'Critérios de Hodgson (semáforo)'],
    procedimentos: ['P016', 'P013', 'P014', 'P003'],
  },
  {
    id: 'PEDIATRIA',
    nome: 'Desenvolvimento motor infantil',
    gatilho: /bebe|prematur|paralisia cerebral|atraso (do|no) desenvolvimento|crianca/,
    sistemaCbdf: 'D02 (neurocentral) — conforme tônus',
    possiveisCausas: [
      { causa: 'Atraso do desenvolvimento neuropsicomotor', sustentadaPor: /nao senta|nao anda|nao engatinha|atraso/ },
      { causa: 'Paralisia cerebral', sustentadaPor: /paralisia cerebral|espastic|hipoxia/ },
      { causa: 'Efeito da prematuridade (usar idade corrigida)', sustentadaPor: /prematur|semanas de gestacao/ },
    ],
    perguntas: [
      { texto: 'Idade cronológica e idade corrigida (se prematuro)?', respondidaSe: /idade corrigida|meses|anos/ },
      { texto: 'Quais marcos motores já atingiu?', respondidaSe: /senta|engatinha|anda|rola/ },
    ],
    testes: ['AIMS (0–18 meses)', 'GMFM', 'GMFCS (paralisia cerebral)'],
    procedimentos: ['P001', 'P023'],
  },
];

/**
 * Condições que, se presentes no relato, casam com contraindicações dos procedimentos.
 * `noRelato` detecta no texto do paciente; `naContraindicacao` casa com o texto da contraindicação.
 */
export interface CondicaoClinica {
  id: string;
  nome: string;
  noRelato: RegExp;
  naContraindicacao: RegExp;
}

export const CONDICOES: CondicaoClinica[] = [
  { id: 'marcapasso', nome: 'Marca-passo / CDI', noRelato: /marca.?passo|cardiodesfibrilador|\bcdi\b/, naContraindicacao: /marca-passo|cdi|cardiodesfibrilador/ },
  { id: 'gestacao', nome: 'Gestação', noRelato: /gestante|gravida|gestacao|gravidez/, naContraindicacao: /gestan|gravidic|gestacao/ },
  { id: 'tvp', nome: 'TVP / trombose', noRelato: /\btvp\b|trombose|tromboflebite|\btep\b/, naContraindicacao: /tvp|trombose|tromboflebite|\btep\b/ },
  { id: 'neoplasia', nome: 'Neoplasia', noRelato: /cancer|tumor|neoplasia|metastase|oncologic/, naContraindicacao: /neoplasia|tumor/ },
  { id: 'fratura', nome: 'Fratura', noRelato: /fratura|quebrou (o|a) \w+/, naContraindicacao: /fratura/ },
  { id: 'infeccao', nome: 'Infecção ativa', noRelato: /infeccao|infeccionad|erisipela|celulite|febre/, naContraindicacao: /infec|erisipela|celulite|bandeiras vermelhas/ },
  { id: 'caudaEquina', nome: 'Sinais de cauda equina', noRelato: /anestesia em sela|cauda equina|retencao urinaria/, naContraindicacao: /cauda equina|bandeiras vermelhas/ },
  { id: 'anticoagulante', nome: 'Anticoagulação', noRelato: /anticoagula|varfarina|marevan|rivaroxabana|xarelto|apixabana|eliquis|heparina/, naContraindicacao: /anticoag|coagulopatia/ },
  { id: 'osteoporose', nome: 'Osteoporose', noRelato: /osteoporose/, naContraindicacao: /osteoporose/ },
  { id: 'epilepsia', nome: 'Epilepsia', noRelato: /epilep|convuls/, naContraindicacao: /epilepsia/ },
  { id: 'sensibilidade', nome: 'Alteração de sensibilidade', noRelato: /(perda|alteracao|diminuicao) (de |da )?sensibilidade|dormencia|anestesia|neuropatia|formigamento nos pes|pe diabetico/, naContraindicacao: /alteracao de sensibilidade/ },
  { id: 'raynaud', nome: 'Raynaud / urticária ao frio', noRelato: /raynaud|urticaria (ao|com) frio|alergia (ao|a) frio/, naContraindicacao: /raynaud|urticaria|frio/ },
  { id: 'pneumotorax', nome: 'Pneumotórax', noRelato: /pneumotorax/, naContraindicacao: /pneumotorax/ },
  { id: 'hemoptise', nome: 'Hemoptise / sangramento', noRelato: /hemoptise|tosse com sangue|sangramento ativo/, naContraindicacao: /hemoptise|sangramento ativo/ },
  { id: 'instabilidade', nome: 'Instabilidade clínica/hemodinâmica', noRelato: /instabilidade (hemodinamica|clinica)|droga vasoativa|noradrenalina|angina instavel/, naContraindicacao: /instabilidade (hemodinamica|clinica)|angina instavel/ },
  { id: 'icDescompensada', nome: 'IC descompensada', noRelato: /(ic|insuficiencia cardiaca) descompensada/, naContraindicacao: /ic descompensada/ },
  { id: 'lesaoAguda', nome: 'Lesão/inflamação aguda (< 72 h)', noRelato: /(entorse|torceu|lesao|pancada|machucou|virou o pe).{0,40}(ontem|hoje|anteontem|ha (1|2|3|um|dois|tres) dias?)|(ontem|hoje).{0,40}(entorse|torceu|machucou|virou o pe)/, naContraindicacao: /inflamacao aguda|lesao aguda/ },
  { id: 'pele', nome: 'Lesão de pele / ferida', noRelato: /ferida|lesao de pele|ulcera|escara/, naContraindicacao: /pele lesionada|lesao de pele|feridas abertas/ },
  { id: 'linfedema', nome: 'Linfedema', noRelato: /linfedema/, naContraindicacao: /linfedema/ },
  { id: 'imunossupressao', nome: 'Imunossupressão', noRelato: /imunossuprimid|imunossupress|\bhiv\b|transplantad|quimioterapia/, naContraindicacao: /imunossupress/ },
  { id: 'corticoide', nome: 'Corticoide prolongado', noRelato: /corticoide|prednisona|dexametasona/, naContraindicacao: /corticoide/ },
  { id: 'medoAgulha', nome: 'Medo de agulha', noRelato: /medo de agulha|fobia de agulha/, naContraindicacao: /fobia de agulha/ },
  { id: 'fotossensibilidade', nome: 'Fotossensibilidade', noRelato: /fotossensib/, naContraindicacao: /fotossensib/ },
];

/**
 * Gatilhos de reconhecimento das condições do CSV (backend/dados/condicoes_clinicas_fisioterapia.csv).
 * O CSV traz o conteúdo clínico; aqui ficam só as palavras que indicam cada condição no relato.
 */
export const GATILHOS_CONDICOES: Record<string, RegExp> = {
  C001: /(artrose|osteoartrite|gonartrose|desgaste).{0,25}joelho|joelhos?.{0,30}(artrose|osteoartrite|desgaste|crepita)|gonartrose/,
  C002: /(artrose|osteoartrite|coxartrose|desgaste).{0,25}quadril|quadril.{0,30}(artrose|osteoartrite|desgaste)|coxartrose/,
  C003: /(artroplastia|protese)( total)? (de |do )?joelho|\batj\b/,
  C004: /(artroplastia|protese)( total)? (de |do )?quadril|\batq\b/,
  C005: /fratura (de |do |no )?(femur|colo do femur|quadril|transtrocanter\w*)|fraturou o (femur|quadril)/,
  C006: /osteoporose|osteopenia/,
  C007: /fratura (vertebral|de vertebra|por compressao|na coluna|da coluna)|achatamento (de )?vertebra/,
  C008: /estenose (do canal|lombar|de canal)|claudicacao neurogenica|lombalgia cronica|dor lombar (cronica|ha (anos|\d+ anos|varios meses))/,
  C009: /cervicalgia|espondiloartrose|artrose cervical|bico de papagaio|dor (no |na )?(pescoco|cervical)/,
  C010: /(tendinite|tendinopatia|capsulite|bursite).{0,20}ombro|manguito|ombro congelado|dor (no |nos )?ombros?/,
  C011: /sarcopenia|perda de massa muscular|perdeu (massa|forca) muscular|musculos? fracos?/,
  C012: /fragilidade|idos[oa] fragil|\bfragil\b/,
  C013: /quedas|caiu|medo de cair|risco de queda|tropeca/,
  C014: /\bavc\b|derrame(?!\s+(articular|pleural|sinovial|pericardico|no joelho|na articulacao))|hemipares|hemipleg|acidente vascular/,
  C015: /parkinson/,
  C016: /demencia|alzheimer|declinio cognitivo/,
  C017: /\bvppb\b|vertigem|tontura|labirintite|tudo girando/,
  C018: /neuropatia|pe diabetico|(dormencia|formigamento|queimacao) nos pes/,
  C019: /\bdpoc\b|enfisema|bronquite cronica/,
  C020: /pneumonia|pos.?covid|covid|internacao respiratoria|internad\w* (por|com) (pneumonia|infeccao respiratoria)/,
  C021: /insuficiencia cardiaca|\bicc\b/,
  C022: /infarto|\biam\b|revasculariza|safena|angioplastia|\bstent\b|coronari/,
  C023: /hipertens|pressao alta|\bhas\b/,
  C024: /claudicacao intermitente|doenca arterial periferica|\bdap\b|dor na panturrilha (ao|quando) (andar|caminhar)/,
  C025: /diabet|\bdm ?2?\b|insulina|glicemia alta/,
  C026: /artrite reumatoide/,
  C027: /incontinencia|perde urina|perda de urina|escapa (xixi|urina)|vazamento de urina/,
  C028: /linfedema|mastectomia|esvaziamento axilar/,
  C029: /acamad|imobilis|restrit[oa] ao leito|nao sai da cama/,
  C030: /amputa|\bcoto\b/,
  C031: /fibromialgia|dor (no corpo todo|generalizada|difusa|em todo o corpo)/,
  C032: /tendinopatia glutea|bursite (trocanter\w*|no quadril)|(dor|doi|doem)\w*.{0,15}lateral do quadril|trocanter/,
};

/**
 * Menções diretas a procedimentos do dataset (ex.: "posso fazer agulhamento?").
 * Quando citado, o procedimento entra na análise e passa pela checagem de contraindicações,
 * mesmo que não esteja ligado ao quadro identificado.
 */
export const MENCOES_PROCEDIMENTOS: Record<string, RegExp> = {
  P002: /\btens\b|eletroanalgesia/,
  P003: /\b(fes|nmes)\b|eletroestimula|estimulacao eletrica neuromuscular|corrente russa/,
  P004: /ultrass?om/,
  P005: /termoterapia|\bcalor\b|bolsa (termica|quente)|infravermelho|parafina/,
  P006: /crioterapia|\bgelo\b|compressa fria|imersao em agua fria/,
  P007: /\blaser|fotobiomodula/,
  P008: /fortalec|exercicio resistido|musculacao/,
  P009: /alongament|ganho de (adm|amplitude)|\bfnp\b/,
  P010: /mobiliza\w* articular|maitland/,
  P011: /manipula|thrust|quiropraxia|estalar a coluna/,
  P012: /agulhamento|dry needling|agulha/,
  P013: /higiene bronquica|drenagem postural|vibrocompress|eltgol|\bafe\b|aspiracao/,
  P014: /reexpansao|incentivador|treino muscular inspiratorio|\btmi\b|epap/,
  P015: /reabilitacao cardio|treino aerobic|exercicio aerobic|esteira|bicicleta ergometrica/,
  P016: /mobilizacao precoce|sedestacao|ortostatismo/,
  P017: /treino de equilibrio|prevencao de quedas/,
  P018: /\bcimt\b|restricao e inducao|treino orientado a tarefa/,
  P019: /protocolo (de |do )?lca/,
  P021: /assoalho pelvico|perineo|kegel|biofeedback/,
  P022: /drenagem linfatica|enfaixamento|terapia descongestiva/,
  P023: /neurodesenvolvimento|bobath|estimulacao precoce/,
};
