import { createKoreanTokenizer } from '../tokenizer.js';
/**
 * A tokenizer for Orama's `components.tokenizer`.
 *
 * Note: a custom tokenizer replaces Orama's built-in one, so Orama's English
 * stemming and stop words are not applied.
 *
 * @example
 * const db = create({ schema, components: { tokenizer: oramaTokenizer() } });
 */
export function oramaTokenizer(options = {}) {
    const { tokenize } = createKoreanTokenizer(options);
    return {
        language: 'korean',
        normalizationCache: new Map(),
        tokenize: (raw) => tokenize(raw),
    };
}
