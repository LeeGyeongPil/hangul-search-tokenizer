/**
 * Self-contained tokenizer core.
 *
 * IMPORTANT: `coreTokenize` must never reference anything outside its own body
 * (no imports, no module-level constants, no TypeScript helpers). VitePress
 * serializes theme-config functions with `fn.toString()` and evaluates them in
 * the browser, so the adapter embeds this function's source text verbatim.
 * Keep the compiled output free of helper calls (target ES2022).
 */
/** Normalized options as consumed by the core (see `createKoreanTokenizer`). */
export interface CoreOptions {
    keepOriginal: boolean;
    bigram: boolean;
    minStemLength: number;
    cjkSegmenter: boolean;
    extraJosa: string[];
    extraEomi: string[];
    noStrip: string[];
    stopwords: string[];
}
/** One chunk of the input (a run of one script) and what happened to it. */
export interface AnalyzedToken {
    /** The chunk as it appeared in the text (after NFC normalization). */
    surface: string;
    /** The chunk with trailing particles/endings removed. */
    stem: string;
    /** Particles/endings that were cut off, in the order they appear in the word. */
    removed: string[];
    /** Terms this chunk contributes to the index/query (may be empty). */
    terms: string[];
    script: 'hangul' | 'latin' | 'cjk' | 'other';
}
/** The built-in rule tables, exposed for documentation and tests. */
export interface RuleTables {
    josa: string[];
    josaShort: string[];
    eomi: string[];
    eomiShort: string[];
    noStrip: string[];
}
/**
 * mode 0 -> string[] terms, mode 1 -> AnalyzedToken[], mode 2 -> RuleTables.
 * `key` identifies the options for the table cache (any stable string).
 */
export declare function coreTokenize(text: string, opts: CoreOptions, key: string, mode: number): any;
