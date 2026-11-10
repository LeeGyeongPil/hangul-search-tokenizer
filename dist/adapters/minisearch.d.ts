import type { KoreanTokenizerOptions } from '../tokenizer.js';
/** Options to spread into `new MiniSearch({ ... })`. Structural type, no MiniSearch import needed. */
export interface MiniSearchTokenizerOptions {
    tokenize: (text: string) => string[];
    processTerm: (term: string) => string | null;
    searchOptions: {
        tokenize: (text: string) => string[];
        processTerm: (term: string) => string | null;
    };
}
/**
 * MiniSearch options that apply the Korean tokenizer to both indexing and queries.
 *
 * @example
 * const search = new MiniSearch({ fields: ['title', 'body'], ...miniSearchOptions() });
 */
export declare function miniSearchOptions(options?: KoreanTokenizerOptions): MiniSearchTokenizerOptions;
