import type { KoreanTokenizerOptions } from '../tokenizer.js';
/** Matches the shape of Orama's `Tokenizer` interface (structural, no Orama import needed). */
export interface OramaTokenizer {
    language: string;
    normalizationCache: Map<string, string>;
    tokenize: (raw: string, language?: string, prop?: string, withCache?: boolean) => string[];
}
/**
 * A tokenizer for Orama's `components.tokenizer`.
 *
 * Note: a custom tokenizer replaces Orama's built-in one, so Orama's English
 * stemming and stop words are not applied.
 *
 * @example
 * const db = create({ schema, components: { tokenizer: oramaTokenizer() } });
 */
export declare function oramaTokenizer(options?: KoreanTokenizerOptions): OramaTokenizer;
