import MiniSearch from 'minisearch';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { vitepressSearch } from '../dist/adapters/vitepress.js';
import { countMatched, probeDocs } from './probe-data.js';

const samples = [
  'API를 v2에서 호출하면 학생들이 먹었다',
  '검색엔진은 색인을 만든다',
  '学校で勉強する 検索エンジンを使う 搜索引擎',
  'HTTP를 쓰는 Docker에서 갔다 만났다',
  '',
];

// Evaluate a function from its source text in a brand-new context, the way a
// browser bundle would receive it: no imports, no closure over this module.
function revive<T extends (...args: never[]) => unknown>(fn: T): T {
  return vm.runInNewContext(`(${fn.toString()})`) as T;
}

const plain = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('VitePress adapter (AC-4)', () => {
  for (const options of [{}, { bigram: true }, { keepOriginal: true, noStrip: ['수도'] }]) {
    it(`serialized functions behave like the originals (${JSON.stringify(options)})`, () => {
      const config = vitepressSearch(options);
      const tokenize = revive(config.options.tokenize);
      const processTerm = revive(config.options.processTerm);
      for (const text of samples) {
        expect(plain(tokenize(text))).toEqual(config.options.tokenize(text));
      }
      for (const term of ['API', '학교', '', 'Ａ']) {
        expect(processTerm(term)).toEqual(config.options.processTerm(term));
      }
      const prefix = revive(config.searchOptions.prefix);
      const fuzzy = revive(config.searchOptions.fuzzy);
      for (const term of ['a', '학', 'api', '학교', 'markdown']) {
        expect(prefix(term)).toBe(config.searchOptions.prefix(term));
        expect(fuzzy(term)).toBe(config.searchOptions.fuzzy(term));
      }
    });
  }

  it('functions do not reference the surrounding module', () => {
    const { options } = vitepressSearch();
    expect(options.tokenize.toString()).not.toMatch(/\bimport\b|require\(/);
    // A bare context has no module scope; this would throw ReferenceError otherwise.
    expect(() => revive(options.tokenize)('학교를')).not.toThrow();
  });

  it('splits Japanese and Chinese runs with Intl.Segmenter like the VitePress default', () => {
    const { tokenize } = vitepressSearch().options;
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
    for (const text of ['検索エンジンを使う', '搜索引擎']) {
      const expected = Array.from(segmenter.segment(text))
        .filter((part) => part.isWordLike)
        .map((part) => part.segment.toLowerCase());
      expect(tokenize(text)).toEqual(expected);
      expect(tokenize(text).length).toBeGreaterThan(1);
    }
  });

  it('can switch off CJK segmentation', () => {
    const { tokenize } = vitepressSearch({ cjkSegmenter: false }).options;
    expect(tokenize('搜索引擎')).toEqual(['搜索引擎']);
  });

  it('turns prefix off for one-character terms and fuzzy off for Hangul', () => {
    const { searchOptions } = vitepressSearch();
    expect(searchOptions.prefix('먹')).toBe(false);
    expect(searchOptions.prefix('학교')).toBe(true);
    expect(searchOptions.fuzzy('학교생활')).toBe(false);
    expect(searchOptions.fuzzy('markdown')).toBe(0.2);
  });

  it('works end to end with MiniSearch using the serialized functions', () => {
    const config = vitepressSearch();
    const options = {
      tokenize: revive(config.options.tokenize),
      processTerm: revive(config.options.processTerm),
    };
    const engine = new MiniSearch({ fields: ['text'], ...options });
    engine.addAll(probeDocs);
    const found = (query: string) => engine.search(query, config.searchOptions).map((hit) => Number(hit.id));
    expect(countMatched(found)).toBe(9);
    // One-character stems must not pull in unrelated words by prefix.
    const prefixEngine = new MiniSearch({ fields: ['text'], ...options });
    prefixEngine.addAll([
      { id: 1, text: '밥을 먹었다' },
      { id: 2, text: '서버가 먹통이 되었다' },
    ]);
    expect(prefixEngine.search('먹다', config.searchOptions).map((hit) => Number(hit.id))).toEqual([1]);
  });
});
