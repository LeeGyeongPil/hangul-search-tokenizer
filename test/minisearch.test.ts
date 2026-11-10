import MiniSearch from 'minisearch';
import { describe, expect, it } from 'vitest';
import { miniSearchOptions } from '../dist/adapters/minisearch.js';
import { countMatched, probeDocs } from './probe-data.js';

function build(extra: object) {
  const engine = new MiniSearch({ fields: ['text'], ...extra });
  engine.addAll(probeDocs);
  return (query: string) => engine.search(query).map((hit) => Number(hit.id));
}

describe('MiniSearch adapter (AC-2)', () => {
  it('matches 9 of 9 probe queries; the default tokenizer matches fewer', () => {
    const korean = countMatched(build(miniSearchOptions()));
    const plain = countMatched(build({}));
    expect(korean).toBe(9);
    expect(plain).toBeLessThan(9);
  });

  it('is symmetric: the query 학교를 finds the document 학교에', () => {
    const search = build(miniSearchOptions());
    expect(search('학교를')).toContain(1);
    expect(search('학교')).toContain(1);
  });

  it('works when only the index-time options are given', () => {
    const { tokenize, processTerm } = miniSearchOptions();
    expect(countMatched(build({ tokenize, processTerm }))).toBe(9);
  });

  it('forwards tokenizer options', () => {
    const search = build(miniSearchOptions({ bigram: true }));
    expect(search('엔진')).toContain(3);
  });
});
