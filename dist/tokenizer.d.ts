import type { AnalyzedToken, RuleTables } from './core.js';
export type { AnalyzedToken, RuleTables } from './core.js';
/** Options for {@link createKoreanTokenizer}. Every option is optional. */
export interface KoreanTokenizerOptions {
    /** Also index the word as written (e.g. both `학교` and `학교에`). Default `false`. */
    keepOriginal?: boolean;
    /** For Hangul stems of 3+ characters also emit every 2-character piece, so `엔진` finds `검색엔진`. Default `false`. */
    bigram?: boolean;
    /** A stem is never cut shorter than this many characters. Integer >= 1. Default `1`. */
    minStemLength?: number;
    /** Split runs of Han/Hiragana/Katakana into words with `Intl.Segmenter` when it exists. Default `true`. */
    cjkSegmenter?: boolean;
    /** Extra particles to cut off (e.g. `['이면']`). */
    extraJosa?: string[];
    /** Extra verb/adjective endings to cut off. */
    extraEomi?: string[];
    /** Words that must never be shortened (e.g. `['수도']`). Added to the built-in list. */
    noStrip?: string[];
    /** Words (after stemming) that are dropped from the index and queries. */
    stopwords?: string[];
}
/** A tokenizer produced by {@link createKoreanTokenizer}. All methods are synchronous. */
export interface KoreanTokenizer {
    /** Split text into index/query terms. Use the same function for both sides. */
    tokenize(text: string): string[];
    /** Normalize one term (NFC, lowercase). Returns `null` for empty or stop terms. */
    processTerm(term: string): string | null;
    /** Show, chunk by chunk, what was cut off and which terms result. For debugging. */
    analyze(text: string): AnalyzedToken[];
    /** The fully resolved options. */
    readonly options: Readonly<Required<KoreanTokenizerOptions>>;
}
/** Thrown when an option has the wrong type or value. The message says how to fix it. */
export declare class InvalidOptionError extends Error {
    constructor(message: string);
}
/**
 * Validate options and fill in defaults.
 * @throws {InvalidOptionError} on unknown keys, wrong types or out-of-range values.
 */
export declare function resolveOptions(options?: KoreanTokenizerOptions): Required<KoreanTokenizerOptions>;
/**
 * Create a tokenizer. The result is synchronous and has no runtime dependencies.
 * @throws {InvalidOptionError} when `options` is invalid.
 */
export declare function createKoreanTokenizer(options?: KoreanTokenizerOptions): KoreanTokenizer;
/** Tokenize with the default options. */
export declare function tokenize(text: string): string[];
/** The built-in particle, ending and exception tables (for documentation and tests). */
export declare function builtinRules(): RuleTables;
