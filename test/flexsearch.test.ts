import FlexSearch from 'flexsearch';
import { describe, expect, it } from 'vitest';
import { flexSearchEncoderOptions } from '../dist/adapters/flexsearch.js';
import { countMatched, probeDocs } from './probe-data.js';

describe('FlexSearch adapter (AC-3)', () => {
  it('matches 9 of 9 probe queries with tokenize strict + Encoder', () => {
    const index = new FlexSearch.Index({
      tokenize: 'strict',
      encoder: new FlexSearch.Encoder(flexSearchEncoderOptions()),
    });
    for (const doc of probeDocs) index.add(doc.id, doc.text);
    expect(countMatched((query) => index.search(query) as number[])).toBe(9);
  });

  it('beats the default encoder', () => {
    const index = new FlexSearch.Index();
    for (const doc of probeDocs) index.add(doc.id, doc.text);
    expect(countMatched((query) => index.search(query) as number[])).toBeLessThan(9);
  });
});
