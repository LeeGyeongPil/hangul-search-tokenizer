// Benchmark core: six tokenizer configurations, all running on the same MiniSearch engine,
// scored with Recall@5/10, MRR@10, P@5 and the serialized index size.
// Everything is offline. Paths are resolved from this file's location only.
import { readFileSync } from 'node:fs';
import MiniSearch from 'minisearch';
import { miniSearchOptions } from '../dist/adapters/minisearch.js';

const here = new URL('.', import.meta.url);

/** Load the bundled small corpus (documents and labelled queries). */
export function loadFixtures() {
  const docs = readFileSync(new URL('fixtures/docs.jsonl', here), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const queries = JSON.parse(readFileSync(new URL('fixtures/queries.json', here), 'utf8'));
  return { docs, queries };
}

// ---- Baseline tokenizers -------------------------------------------------

// MiniSearch's own default split (same pattern as MiniSearch uses internally).
const SPACE_OR_PUNCTUATION = /[\n\r\p{Z}\p{P}]+/u;
const CJK_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu;
const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

/** Re-implementation of VitePress's default local-search tokenizer (CJK runs go through Intl.Segmenter). */
function vitepressTokenize(text) {
  const terms = [];
  for (const term of text.split(SPACE_OR_PUNCTUATION)) {
    let last = 0;
    for (const match of term.matchAll(CJK_RUN)) {
      if (match.index > last) terms.push(term.slice(last, match.index));
      for (const part of segmenter.segment(match[0])) if (part.isWordLike) terms.push(part.segment);
      last = match.index + match[0].length;
    }
    if (last < term.length) terms.push(term.slice(last));
  }
  return terms;
}

/** Overlapping two-character pieces for Hangul/CJK runs (a single character stays alone); Latin words stay whole. */
function charBigramTokenize(text) {
  const terms = [];
  for (const match of text.normalize('NFC').matchAll(/([\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+)|([\p{L}\p{N}]+)/gu)) {
    if (match[2]) {
      terms.push(match[2]);
      continue;
    }
    const run = Array.from(match[1]);
    if (run.length === 1) terms.push(run[0]);
    for (let i = 0; i + 2 <= run.length; i++) terms.push(run[i] + run[i + 1]);
  }
  return terms;
}

async function loadGaru() {
  const { createTokenizer } = await import('garu-minisearch-tokenizer');
  return createTokenizer();
}

/** The six configurations. `prepare` may be async (garu loads a WASM model). */
export const CONFIGS = [
  {
    name: 'minisearch-default',
    description: 'MiniSearch defaults (split on spaces/punctuation, exact match)',
    prepare: async () => ({ options: {}, searchOptions: {} }),
  },
  {
    name: 'vitepress-default',
    description: 'VitePress local search defaults (CJK segmenter, prefix, fuzzy 0.2)',
    prepare: async () => ({
      options: { tokenize: vitepressTokenize },
      searchOptions: { prefix: true, fuzzy: 0.2 },
    }),
  },
  {
    name: 'char-bigram',
    description: 'Overlapping 2-character pieces, no linguistic rules',
    prepare: async () => ({ options: { tokenize: charBigramTokenize }, searchOptions: {} }),
  },
  {
    name: 'hst',
    description: 'hangul-search-tokenizer, default options',
    prepare: async () => {
      const { searchOptions, ...options } = miniSearchOptions();
      return { options, searchOptions: {} };
    },
  },
  {
    name: 'hst+bigram',
    description: 'hangul-search-tokenizer with bigram: true',
    prepare: async () => {
      const { searchOptions, ...options } = miniSearchOptions({ bigram: true });
      return { options, searchOptions: {} };
    },
  },
  {
    name: 'garu',
    description: 'garu-minisearch-tokenizer (morphological analysis, WASM)',
    prepare: async () => ({ options: { tokenize: await loadGaru() }, searchOptions: {} }),
  },
];

// ---- Metrics ---------------------------------------------------------------

const round = (value) => Math.round(value * 10000) / 10000;
const mean = (values) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

/** Score one ranked id list against the relevant set. P@5 is the share of returned top-5 hits that are relevant. */
export function scoreRanking(rankedIds, relevant) {
  const relevantSet = new Set(relevant);
  const top5 = rankedIds.slice(0, 5);
  const top10 = rankedIds.slice(0, 10);
  const hits = (list) => list.filter((id) => relevantSet.has(id)).length;
  const firstRank = top10.findIndex((id) => relevantSet.has(id));
  return {
    recall5: hits(top5) / relevantSet.size,
    recall10: hits(top10) / relevantSet.size,
    mrr10: firstRank === -1 ? 0 : 1 / (firstRank + 1),
    p5: top5.length === 0 ? 0 : hits(top5) / top5.length,
  };
}

/**
 * Run configurations over a corpus.
 * @param {{docs: {id: string, text: string}[], queries: {id: string, text: string, type?: string, relevant: string[]}[]}} corpus
 * @param {{configs?: typeof CONFIGS}} [options]
 */
export async function runBench(corpus, options = {}) {
  const configs = options.configs ?? CONFIGS;
  const types = [...new Set(corpus.queries.map((q) => q.type ?? 'all'))];
  const rows = [];
  for (const config of configs) {
    let prepared;
    try {
      prepared = await config.prepare();
    } catch (error) {
      rows.push({ name: config.name, description: config.description, skipped: String(error?.message ?? error) });
      continue;
    }
    const engine = new MiniSearch({ fields: ['text'], storeFields: [], ...prepared.options });
    const indexStart = performance.now();
    engine.addAll(corpus.docs);
    const indexMs = performance.now() - indexStart;

    const perQuery = [];
    const queryStart = performance.now();
    for (const query of corpus.queries) {
      const ranked = engine.search(query.text, prepared.searchOptions).map((hit) => hit.id);
      perQuery.push({ type: query.type ?? 'all', ...scoreRanking(ranked, query.relevant) });
    }
    const queryMs = performance.now() - queryStart;

    const byType = {};
    for (const type of types) {
      byType[type] = round(mean(perQuery.filter((q) => q.type === type).map((q) => q.recall10)));
    }
    rows.push({
      name: config.name,
      description: config.description,
      metrics: {
        recall5: round(mean(perQuery.map((q) => q.recall5))),
        recall10: round(mean(perQuery.map((q) => q.recall10))),
        mrr10: round(mean(perQuery.map((q) => q.mrr10))),
        p5: round(mean(perQuery.map((q) => q.p5))),
      },
      byType,
      index: { bytes: Buffer.byteLength(JSON.stringify(engine)), terms: engine.termCount },
      timings: { indexMs: Math.round(indexMs * 10) / 10, queryMsPerQuery: Math.round((queryMs / corpus.queries.length) * 100) / 100 },
    });
  }
  return {
    corpus: { documents: corpus.docs.length, queries: corpus.queries.length, queryTypes: types },
    rows,
  };
}

/** Drop the timing fields, leaving only values that must be identical between runs. */
export function withoutTimings(result) {
  return { ...result, rows: result.rows.map(({ timings, ...rest }) => rest) };
}

// ---- Rendering -------------------------------------------------------------

/** Markdown tables: overall metrics and per-query-type Recall@10. */
export function renderMarkdown(result, title = 'Benchmark') {
  const lines = [`# ${title}`, ''];
  lines.push(`Documents: ${result.corpus.documents}, queries: ${result.corpus.queries}. All configurations run on MiniSearch 7.`);
  lines.push('P@5 = relevant share of the returned top-5 hits (0 when nothing is returned).', '');
  lines.push('| config | Recall@5 | Recall@10 | MRR@10 | P@5 | index bytes | terms | index ms |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const row of result.rows) {
    if (row.skipped) {
      lines.push(`| ${row.name} | skipped: ${row.skipped} | | | | | | |`);
      continue;
    }
    const m = row.metrics;
    lines.push(
      `| ${row.name} | ${m.recall5.toFixed(3)} | ${m.recall10.toFixed(3)} | ${m.mrr10.toFixed(3)} | ${m.p5.toFixed(3)} | ${row.index.bytes} | ${row.index.terms} | ${row.timings.indexMs} |`,
    );
  }
  const types = result.corpus.queryTypes;
  if (types.length > 1) {
    lines.push('', 'Recall@10 by query type:', '', `| config | ${types.join(' | ')} |`, `|---|${types.map(() => '---').join('|')}|`);
    for (const row of result.rows) {
      if (row.skipped) continue;
      lines.push(`| ${row.name} | ${types.map((type) => row.byType[type].toFixed(3)).join(' | ')} |`);
    }
  }
  return lines.join('\n') + '\n';
}
