import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module without type declarations
import { CONFIGS, loadFixtures, renderMarkdown, runBench, scoreRanking, withoutTimings } from '../bench/lib.mjs';
// @ts-expect-error plain JavaScript module without type declarations
import { loadMiracl } from '../bench/miracl.mjs';

const NAMES = ['minisearch-default', 'vitepress-default', 'char-bigram', 'hst', 'hst+bigram', 'garu'];

const fixtures = loadFixtures();
const first = await runBench(fixtures);
const second = await runBench(fixtures);
const row = (name: string) => first.rows.find((r: { name: string }) => r.name === name);

describe('fixtures', () => {
  it('are large enough and consistent with the text', () => {
    expect(fixtures.docs.length).toBeGreaterThanOrEqual(60);
    expect(fixtures.queries.length).toBeGreaterThanOrEqual(60);
    const ids = new Set(fixtures.docs.map((d: { id: string }) => d.id));
    expect(ids.size).toBe(fixtures.docs.length);
    for (const q of fixtures.queries) {
      const mentions = (d: { text: string }) => q.variants.some((v: string) => d.text.includes(v));
      for (const id of q.relevant) {
        const doc = fixtures.docs.find((d: { id: string }) => d.id === id);
        expect(doc, `${q.id} -> ${id}`).toBeDefined();
        expect(mentions(doc), `${q.id} (${q.text}) should appear in ${id}`).toBe(true);
      }
      // Outside trap queries, every document that mentions the word must be judged relevant.
      if (q.type !== 'trap') {
        for (const d of fixtures.docs) {
          if (mentions(d)) expect(q.relevant, `${q.id} misses ${d.id}`).toContain(d.id);
        }
      }
    }
  });
});

describe('small benchmark (AC-6)', () => {
  it('reports the six configurations with all metrics', () => {
    expect(first.rows.map((r: { name: string }) => r.name)).toEqual(NAMES);
    expect(CONFIGS.map((c: { name: string }) => c.name)).toEqual(NAMES);
    for (const r of first.rows) {
      // A skipped row (for example garu failing to load) must fail the test, not vanish.
      expect(r.skipped, `${r.name} skipped`).toBeUndefined();
      for (const key of ['recall5', 'recall10', 'mrr10', 'p5']) {
        expect(r.metrics[key]).toBeGreaterThanOrEqual(0);
        expect(r.metrics[key]).toBeLessThanOrEqual(1);
      }
      expect(r.index.bytes).toBeGreaterThan(0);
      expect(Object.keys(r.byType)).toEqual(first.corpus.queryTypes);
    }
  });

  it('gives identical metrics on a second run (timings aside)', () => {
    expect(withoutTimings(second)).toEqual(withoutTimings(first));
  });

  it('hst finds more than plain MiniSearch', () => {
    expect(row('hst').metrics.recall10).toBeGreaterThan(row('minisearch-default').metrics.recall10);
  });

  it('bigram trades index size for recall on compound words', () => {
    expect(row('hst+bigram').byType.compound).toBeGreaterThan(row('hst').byType.compound);
    expect(row('hst+bigram').index.bytes).toBeGreaterThan(row('hst').index.bytes);
  });
});

describe('metrics', () => {
  it('computes recall, MRR and precision for a known ranking', () => {
    const score = scoreRanking(['x', 'a', 'y', 'b', 'z', 'c'], ['a', 'b', 'q']);
    expect(score.recall5).toBeCloseTo(2 / 3);
    expect(score.recall10).toBeCloseTo(2 / 3);
    expect(score.mrr10).toBeCloseTo(1 / 2);
    expect(score.p5).toBeCloseTo(2 / 5);
    expect(scoreRanking([], ['a'])).toEqual({ recall5: 0, recall10: 0, mrr10: 0, p5: 0 });
  });

  it('renders a markdown table with every configuration', () => {
    const md = renderMarkdown(first);
    for (const name of NAMES) expect(md).toContain(`| ${name} |`);
    expect(md).toContain('Recall@10 by query type');
  });
});

describe('MIRACL loader', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hst-miracl-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('returns null when the data is missing', () => {
    expect(loadMiracl(join(dir, 'none'))).toBeNull();
  });

  it('reads the downloaded file layout and runs a configuration on it', async () => {
    const data = join(dir, 'ko');
    mkdirSync(data);
    writeFileSync(join(data, 'queries.json'), JSON.stringify([{ id: '1', text: '학교를' }, { id: '2', text: '없는질문' }]));
    writeFileSync(join(data, 'qrels.json'), JSON.stringify({ 1: ['a#0'], 2: ['zzz#9'] }));
    writeFileSync(
      join(data, 'corpus.jsonl'),
      [
        { docid: 'a#0', title: '학교', text: '학교에 가서 공부했다' },
        { docid: 'b#0', title: '바다', text: '바다를 건넌다' },
      ].map((line) => JSON.stringify(line)).join('\n') + '\n',
    );
    const corpus = loadMiracl(data);
    expect(corpus.docs).toHaveLength(2);
    expect(corpus.queries).toEqual([{ id: '1', text: '학교를', relevant: ['a#0'] }]);
    const result = await runBench(corpus, { configs: CONFIGS.filter((c: { name: string }) => c.name === 'hst') });
    expect(result.rows[0].metrics.recall10).toBe(1);
  });
});
