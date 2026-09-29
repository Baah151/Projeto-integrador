import { REGRAS_CONTEXTO, REGRAS_TEXTO, VERSAO_REGRAS } from './regras.js';
import type {
  AlertaRedFlag,
  AnamneseInput,
  ResultadoTriagem,
  Severidade,
  StatusTriagem,
} from './types.js';

const CAMPOS_TEXTO = ['queixaPrincipal', 'hfa', 'hfp', 'observacoes'] as const;

const PESO_SEVERIDADE: Record<Severidade, number> = { CRITICA: 3, ALTA: 2, MODERADA: 1 };

// Negação no estilo NegEx simplificado: se um destes gatilhos aparecer
// até JANELA_NEGACAO palavras antes do termo, ele é considerado negado.
// Ex.: "paciente nega febre" / "sem perda de peso inexplicada".
const GATILHOS_NEGACAO = /\b(nega|negou|negando|sem|nao (ha|tem|apresenta|refere|relata|possui)|ausencia de|ausente|descarta\w*)\b/;
const JANELA_NEGACAO = 5;
// Pontuação/conjunções que encerram o escopo da negação ("nega febre, mas relata calafrios").
const FIM_ESCOPO = /[.;!?]|\b(mas|porem|entretanto|contudo|refere|relata)\b/;

const AVISO =
  'Ferramenta de apoio ao raciocínio clínico. Os alertas não constituem diagnóstico e ' +
  'não substituem o julgamento do fisioterapeuta responsável.';

/**
 * Normaliza para casamento: minúsculo e sem acentos.
 * NFD separa o acento da letra e o regex remove só as marcas diacríticas;
 * `avaliarAnamnese` mapeia os índices de volta para o texto original.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function estaNegado(textoNorm: string, inicio: number): boolean {
  const anterior = textoNorm.slice(0, inicio);
  const cortes = [...anterior.matchAll(new RegExp(FIM_ESCOPO, 'g'))];
  const ultimoCorte = cortes.length ? cortes[cortes.length - 1]! : undefined;
  const escopo = ultimoCorte ? anterior.slice(ultimoCorte.index! + ultimoCorte[0].length) : anterior;
  const janela = escopo.trim().split(/\s+/).slice(-JANELA_NEGACAO).join(' ');
  return GATILHOS_NEGACAO.test(janela);
}

function extrairTrecho(original: string, inicio: number, fim: number, margem = 40): string {
  const a = Math.max(0, inicio - margem);
  const b = Math.min(original.length, fim + margem);
  return `${a > 0 ? '…' : ''}${original.slice(a, b).trim()}${b < original.length ? '…' : ''}`;
}

export function avaliarAnamnese(anamnese: AnamneseInput): ResultadoTriagem {
  const alertas: AlertaRedFlag[] = [];
  const termosNegados: ResultadoTriagem['termosNegados'] = [];
  const jaDisparadas = new Set<string>();

  for (const campo of CAMPOS_TEXTO) {
    const original = anamnese[campo];
    if (!original?.trim()) continue;
    // NFD aumenta o tamanho do texto; reconstruímos o original na mesma forma para manter índices.
    const originalNfd = original.normalize('NFD');
    const norm = normalizar(original);
    // Mapeia índice no texto normalizado -> índice no NFD (removemos só diacríticos).
    const mapa: number[] = [];
    for (let i = 0; i < originalNfd.length; i++) {
      if (!/[̀-ͯ]/.test(originalNfd[i]!)) mapa.push(i);
    }
    mapa.push(originalNfd.length);

    for (const regra of REGRAS_TEXTO) {
      for (const padrao of regra.padroes) {
        const re = new RegExp(padrao.source, 'g');
        for (const m of norm.matchAll(re)) {
          const ini = m.index!;
          const fim = ini + m[0].length;
          const termoOriginal = originalNfd.slice(mapa[ini]!, mapa[fim]!).normalize('NFC');
          const trecho = extrairTrecho(originalNfd, mapa[ini]!, mapa[fim]!).normalize('NFC');

          if (estaNegado(norm, ini)) {
            termosNegados.push({ termo: termoOriginal, campo, trecho });
            continue;
          }
          // Uma regra gera no máximo um alerta por campo.
          const chave = `${regra.id}:${campo}`;
          if (jaDisparadas.has(chave)) continue;
          jaDisparadas.add(chave);

          alertas.push({
            regraId: regra.id,
            categoria: regra.categoria,
            severidade: regra.severidade,
            descricao: regra.descricao,
            termoDetectado: termoOriginal,
            campo,
            trecho,
            conduta: regra.conduta,
            ...(regra.sistemaCbdf ? { sistemaCbdf: regra.sistemaCbdf } : {}),
          });
        }
      }
    }
  }

  if (anamnese.contexto) {
    for (const regra of REGRAS_CONTEXTO) {
      const evidencia = regra.avaliar(anamnese.contexto);
      if (!evidencia) continue;
      alertas.push({
        regraId: regra.id,
        categoria: regra.categoria,
        severidade: regra.severidade,
        descricao: regra.descricao,
        termoDetectado: evidencia,
        campo: 'contexto',
        trecho: evidencia,
        conduta: regra.conduta,
      });
    }
  }

  alertas.sort((a, b) => PESO_SEVERIDADE[b.severidade] - PESO_SEVERIDADE[a.severidade]);

  const severidadeMaxima = alertas[0]?.severidade ?? null;
  const status: StatusTriagem =
    severidadeMaxima === 'CRITICA' ? 'INTERROMPIDO' : severidadeMaxima ? 'ATENCAO' : 'LIBERADO';

  return {
    status,
    fluxoLiberado: status !== 'INTERROMPIDO',
    requerReconhecimento: status === 'INTERROMPIDO',
    severidadeMaxima,
    totalAlertas: alertas.length,
    alertas,
    termosNegados,
    versaoRegras: VERSAO_REGRAS,
    avaliadoEm: new Date().toISOString(),
    aviso: AVISO,
  };
}
