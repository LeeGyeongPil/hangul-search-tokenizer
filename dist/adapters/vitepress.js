import { coreTokenize } from '../core.js';
import { resolveOptions } from '../tokenizer.js';
/**
 * Build a VitePress `search.options.miniSearch` value.
 *
 * @example
 * // .vitepress/config.mts
 * themeConfig: { search: { provider: 'local', options: { miniSearch: vitepressSearch() } } }
 */
export function vitepressSearch(options = {}) {
    const resolved = resolveOptions(options);
    const json = JSON.stringify(resolved);
    const key = JSON.stringify(json);
    const coreSource = coreTokenize.toString();
    // Each function embeds the core source, so `fn.toString()` is evaluable on its own.
    const tokenizeSource = `function (text) { return (${coreSource})(text, ${json}, ${key}, 0); }`;
    const processTermSource = `function (term) { var t = String(term).normalize('NFC').toLowerCase(); ` +
        `return t.length === 0 || ${JSON.stringify(resolved.stopwords)}.indexOf(t) !== -1 ? null : t; }`;
    // One-character terms would pull in unrelated words by prefix (먹 -> 먹이, 먹통).
    const prefixSource = `function (term) { return term.length > 1; }`;
    // Edit distance counts syllables, which is too coarse for Hangul; keep it for Latin words.
    const fuzzySource = `function (term) { return /\\p{Script=Hangul}/u.test(term) || term.length < 4 ? false : 0.2; }`;
    const make = (source) => new Function(`return ${source}`)();
    return {
        options: { tokenize: make(tokenizeSource), processTerm: make(processTermSource) },
        searchOptions: { prefix: make(prefixSource), fuzzy: make(fuzzySource) },
    };
}
