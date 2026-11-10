import type { KoreanTokenizerOptions } from '../tokenizer.js';
/**
 * The `miniSearch` block of VitePress local search.
 * VitePress ships these functions to the browser with `fn.toString()`, so every
 * function here is self-contained (it only uses its own body and baked-in JSON).
 */
export interface VitePressSearchConfig {
    options: {
        tokenize: (text: string) => string[];
        processTerm: (term: string) => string | null;
    };
    searchOptions: {
        prefix: (term: string) => boolean;
        fuzzy: (term: string) => number | false;
    };
}
/**
 * Build a VitePress `search.options.miniSearch` value.
 *
 * @example
 * // .vitepress/config.mts
 * themeConfig: { search: { provider: 'local', options: { miniSearch: vitepressSearch() } } }
 */
export declare function vitepressSearch(options?: KoreanTokenizerOptions): VitePressSearchConfig;
