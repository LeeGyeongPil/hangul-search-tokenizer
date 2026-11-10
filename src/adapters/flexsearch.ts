import { createKoreanTokenizer } from '../tokenizer.js';
import type { KoreanTokenizerOptions } from '../tokenizer.js';

/** Options for `new Encoder(...)` (structural, no FlexSearch import needed). */
export interface FlexSearchEncoderOptions {
  normalize: false;
  split: false;
  dedupe: false;
  numeric: false;
  finalize: (terms: string[]) => string[];
}

/**
 * Encoder options for FlexSearch 0.8. Use together with `tokenize: 'strict'`.
 *
 * @example
 * const index = new Index({ tokenize: 'strict', encoder: new Encoder(flexSearchEncoderOptions()) });
 */
export function flexSearchEncoderOptions(options: KoreanTokenizerOptions = {}): FlexSearchEncoderOptions {
  const { tokenize } = createKoreanTokenizer(options);
  return {
    // The tokenizer does its own NFC normalization and splitting.
    normalize: false,
    split: false,
    dedupe: false,
    numeric: false,
    finalize: (terms) => terms.flatMap((term) => tokenize(term)),
  };
}
