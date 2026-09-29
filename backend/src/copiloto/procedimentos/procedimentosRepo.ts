import { readFile } from 'node:fs/promises';
import pool from '../../config/database.js';

export interface Procedimento {
  id: string;
  codigo_rbpf: string;
  area: string;
  nome: string;
  descricao: string;
  indicacoes: string[];
  contraindicacoes_absolutas: string[];
  contraindicacoes_relativas: string[];
  pre_requisitos: string[];
  escalas_sugeridas: string[];
  regras_validacao: string[];
  fontes: string[];
}

export interface RegraGeral {
  id: string;
  tipo: 'bloqueio' | 'alerta';
  regra: string;
  fonte: string;
}

export interface CondicaoClinicaDataset {
  id: string;
  nome: string;
  cid10: string;
  area: string;
  prevalencia_idosos: string;
  sinais_alerta: string[];
  avaliacao: string[];
  procedimentos_recomendados: string[];
  precaucoes: string[];
  metas: string[];
  criterios_encaminhamento: string[];
  fontes: string[];
}

export interface Catalogo {
  procedimentos: Procedimento[];
  regrasGerais: RegraGeral[];
  condicoes: CondicaoClinicaDataset[];
}

interface Dataset {
  meta: { versao: string };
  regras_gerais: RegraGeral[];
  procedimentos: Procedimento[];
}

// Funciona tanto em src/ (tsx) quanto em dist/ (build): ambos ficam 2 níveis abaixo de backend/.
const CAMINHO_DATASET = new URL('../../../dados/procedimentos_fisioterapia.json', import.meta.url);
const CAMINHO_CONDICOES = new URL('../../../dados/condicoes_clinicas_fisioterapia.csv', import.meta.url);

let cache: Catalogo | null = null;

/** Divide uma linha CSV separada por ";" respeitando campos entre aspas. */
function dividirLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i]!;
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas;
    } else if (ch === ';' && !aspas) {
      campos.push(atual); atual = '';
    } else {
      atual += ch;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

const lista = (campo: string | undefined) => (campo ?? '').split('|').map((s) => s.trim()).filter(Boolean);

export function lerCondicoesCsv(conteudo: string): CondicaoClinicaDataset[] {
  const linhas = conteudo.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const cabecalho = dividirLinhaCsv(linhas[0] ?? '');
  const esperado = ['id', 'nome', 'cid10', 'area', 'prevalencia_idosos', 'sinais_alerta', 'avaliacao',
    'procedimentos_recomendados', 'precaucoes_idosos', 'metas_mensuraveis', 'criterios_encaminhamento', 'fontes'];
  if (esperado.some((col, i) => cabecalho[i] !== col)) {
    throw new Error(`Cabecalho inesperado no CSV de condicoes: ${cabecalho.join(';')}`);
  }
  return linhas.slice(1).map((linha, n) => {
    const c = dividirLinhaCsv(linha);
    if (c.length !== esperado.length) throw new Error(`Linha ${n + 2} do CSV tem ${c.length} colunas (esperado ${esperado.length})`);
    return {
      id: c[0]!, nome: c[1]!, cid10: c[2]!, area: c[3]!, prevalencia_idosos: c[4]!,
      sinais_alerta: lista(c[5]), avaliacao: lista(c[6]), procedimentos_recomendados: lista(c[7]),
      precaucoes: lista(c[8]), metas: lista(c[9]), criterios_encaminhamento: lista(c[10]), fontes: lista(c[11]),
    };
  });
}

/**
 * Sincroniza o JSON versionado com o banco (upsert). O JSON é a fonte da verdade editável
 * pela equipe clínica; o banco é o que o copiloto consulta em tempo de execução.
 */
export async function sincronizarDataset(): Promise<void> {
  const dataset = JSON.parse(await readFile(CAMINHO_DATASET, 'utf8')) as Dataset;
  const versao = dataset.meta.versao;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of dataset.procedimentos) {
      await client.query(
        `INSERT INTO copiloto_procedimento
           (id, codigo_rbpf, area, nome, descricao, indicacoes, contraindicacoes_absolutas,
            contraindicacoes_relativas, pre_requisitos, escalas_sugeridas, regras_validacao, fontes,
            versao_dataset, atualizado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
         ON CONFLICT (id) DO UPDATE SET
           codigo_rbpf = EXCLUDED.codigo_rbpf, area = EXCLUDED.area, nome = EXCLUDED.nome,
           descricao = EXCLUDED.descricao, indicacoes = EXCLUDED.indicacoes,
           contraindicacoes_absolutas = EXCLUDED.contraindicacoes_absolutas,
           contraindicacoes_relativas = EXCLUDED.contraindicacoes_relativas,
           pre_requisitos = EXCLUDED.pre_requisitos, escalas_sugeridas = EXCLUDED.escalas_sugeridas,
           regras_validacao = EXCLUDED.regras_validacao, fontes = EXCLUDED.fontes,
           versao_dataset = EXCLUDED.versao_dataset, atualizado_em = NOW()`,
        [
          p.id, p.codigo_rbpf || null, p.area, p.nome, p.descricao,
          JSON.stringify(p.indicacoes), JSON.stringify(p.contraindicacoes_absolutas),
          JSON.stringify(p.contraindicacoes_relativas), JSON.stringify(p.pre_requisitos),
          JSON.stringify(p.escalas_sugeridas), JSON.stringify(p.regras_validacao),
          JSON.stringify(p.fontes), versao,
        ],
      );
    }
    for (const r of dataset.regras_gerais) {
      await client.query(
        `INSERT INTO copiloto_regra_geral (id, tipo, regra, fonte, versao_dataset, atualizado_em)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (id) DO UPDATE SET tipo = EXCLUDED.tipo, regra = EXCLUDED.regra,
           fonte = EXCLUDED.fonte, versao_dataset = EXCLUDED.versao_dataset, atualizado_em = NOW()`,
        [r.id, r.tipo, r.regra, r.fonte, versao],
      );
    }
    const condicoes = lerCondicoesCsv(await readFile(CAMINHO_CONDICOES, 'utf8'));
    const idsProc = new Set(dataset.procedimentos.map((p) => p.id));
    for (const cond of condicoes) {
      const invalidos = cond.procedimentos_recomendados.filter((id) => !idsProc.has(id));
      if (invalidos.length) console.warn(`[Copiloto] ${cond.id} referencia procedimentos inexistentes: ${invalidos.join(', ')}`);
      await client.query(
        `INSERT INTO copiloto_condicao
           (id, nome, cid10, area, prevalencia_idosos, sinais_alerta, avaliacao, procedimentos_recomendados,
            precaucoes, metas, criterios_encaminhamento, fontes, atualizado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
         ON CONFLICT (id) DO UPDATE SET
           nome = EXCLUDED.nome, cid10 = EXCLUDED.cid10, area = EXCLUDED.area,
           prevalencia_idosos = EXCLUDED.prevalencia_idosos, sinais_alerta = EXCLUDED.sinais_alerta,
           avaliacao = EXCLUDED.avaliacao, procedimentos_recomendados = EXCLUDED.procedimentos_recomendados,
           precaucoes = EXCLUDED.precaucoes, metas = EXCLUDED.metas,
           criterios_encaminhamento = EXCLUDED.criterios_encaminhamento, fontes = EXCLUDED.fontes,
           atualizado_em = NOW()`,
        [
          cond.id, cond.nome, cond.cid10, cond.area, cond.prevalencia_idosos,
          JSON.stringify(cond.sinais_alerta), JSON.stringify(cond.avaliacao),
          JSON.stringify(cond.procedimentos_recomendados), JSON.stringify(cond.precaucoes),
          JSON.stringify(cond.metas), JSON.stringify(cond.criterios_encaminhamento), JSON.stringify(cond.fontes),
        ],
      );
    }
    await client.query('COMMIT');
    cache = null;
    console.log(`[Copiloto] Dataset v${versao} sincronizado: ${dataset.procedimentos.length} procedimentos, ${dataset.regras_gerais.length} regras gerais, ${condicoes.length} condicoes clinicas.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Carrega do banco (com cache em memória; o catálogo muda raramente). */
export async function carregarCatalogo(): Promise<Catalogo> {
  if (cache) return cache;
  const [procs, regras, conds] = await Promise.all([
    pool.query(`SELECT id, COALESCE(codigo_rbpf, '') AS codigo_rbpf, area, nome, descricao, indicacoes,
                       contraindicacoes_absolutas, contraindicacoes_relativas, pre_requisitos,
                       escalas_sugeridas, regras_validacao, fontes
                  FROM copiloto_procedimento ORDER BY id`),
    pool.query('SELECT id, tipo, regra, fonte FROM copiloto_regra_geral ORDER BY id'),
    pool.query(`SELECT id, nome, cid10, area, prevalencia_idosos, sinais_alerta, avaliacao, procedimentos_recomendados,
                       precaucoes, metas, criterios_encaminhamento, fontes
                  FROM copiloto_condicao ORDER BY id`),
  ]);
  cache = {
    procedimentos: procs.rows as Procedimento[],
    regrasGerais: regras.rows as RegraGeral[],
    condicoes: conds.rows as CondicaoClinicaDataset[],
  };
  return cache;
}
