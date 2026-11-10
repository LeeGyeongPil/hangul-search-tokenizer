import { create, insert, search } from '@orama/orama';
import { describe, expect, it } from 'vitest';
import { oramaTokenizer } from '../dist/adapters/orama.js';
import { countMatched, probeDocs } from './probe-data.js';

function build(components?: object) {
  const db = create({ schema: { id: 'string', text: 'string' } as const, ...(components ? { components } : {}) });
  for (const doc of probeDocs) insert(db, { id: String(doc.id), text: doc.text });
  return (query: string) => search(db, { term: query }).hits.map((hit) => Number(hit.document.id));
}

describe('Orama adapter (AC-3)', () => {
  it('matches 9 of 9 probe queries with components.tokenizer', () => {
    expect(countMatched(build({ tokenizer: oramaTokenizer() }))).toBe(9);
  });

  it('beats the default tokenizer', () => {
    expect(countMatched(build())).toBeLessThan(9);
  });

  it('has the fields Orama requires', () => {
    const tokenizer = oramaTokenizer();
    expect(tokenizer.language).toBe('korean');
    expect(tokenizer.normalizationCache).toBeInstanceOf(Map);
    expect(tokenizer.tokenize('학교를')).toEqual(['학교']);
  });
});
