import { createKoreanTokenizer } from '../tokenizer.js';
/**
 * MiniSearch options that apply the Korean tokenizer to both indexing and queries.
 *
 * @example
 * const search = new MiniSearch({ fields: ['title', 'body'], ...miniSearchOptions() });
 */
export function miniSearchOptions(options = {}) {
    const { tokenize, processTerm } = createKoreanTokenizer(options);
    return { tokenize, processTerm, searchOptions: { tokenize, processTerm } };
}
