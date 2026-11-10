import { coreTokenize } from './core.js';
import type { AnalyzedToken, CoreOptions, RuleTables } from './core.js';

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
export class InvalidOptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOptionError';
  }
}

const KNOWN_KEYS = [
  'keepOriginal',
  'bigram',
  'minStemLength',
  'cjkSegmenter',
  'extraJosa',
  'extraEomi',
  'noStrip',
  'stopwords',
] as const;

function booleanOption(name: string, value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    throw new InvalidOptionError(`Option "${name}" must be a boolean (true or false), got ${describe(value)}.`);
  }
  return value;
}

function listOption(name: string, value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.length === 0)) {
    throw new InvalidOptionError(
      `Option "${name}" must be an array of non-empty strings, e.g. ${name}: ['example'], got ${describe(value)}.`,
    );
  }
  return Array.from(new Set((value as string[]).map((v) => v.normalize('NFC').toLowerCase())));
}

function describe(value: unknown): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(typeof value === 'object' ? JSON.stringify(value) : value);
}

/**
 * Validate options and fill in defaults.
 * @throws {InvalidOptionError} on unknown keys, wrong types or out-of-range values.
 */
export function resolveOptions(options: KoreanTokenizerOptions = {}): Required<KoreanTokenizerOptions> {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new InvalidOptionError(`Options must be an object such as { bigram: true }, got ${describe(options)}.`);
  }
  for (const key of Object.keys(options)) {
    if (!(KNOWN_KEYS as readonly string[]).includes(key)) {
      throw new InvalidOptionError(`Unknown option "${key}". Valid options: ${KNOWN_KEYS.join(', ')}.`);
    }
  }
  const min = options.minStemLength === undefined ? 1 : options.minStemLength;
  if (typeof min !== 'number' || !Number.isInteger(min) || min < 1) {
    throw new InvalidOptionError(`Option "minStemLength" must be an integer >= 1 (default 1), got ${describe(min)}.`);
  }
  return {
    keepOriginal: booleanOption('keepOriginal', options.keepOriginal, false),
    bigram: booleanOption('bigram', options.bigram, false),
    minStemLength: min,
    cjkSegmenter: booleanOption('cjkSegmenter', options.cjkSegmenter, true),
    extraJosa: listOption('extraJosa', options.extraJosa),
    extraEomi: listOption('extraEomi', options.extraEomi),
    noStrip: listOption('noStrip', options.noStrip),
    stopwords: listOption('stopwords', options.stopwords),
  };
}

/**
 * Create a tokenizer. The result is synchronous and has no runtime dependencies.
 * @throws {InvalidOptionError} when `options` is invalid.
 */
export function createKoreanTokenizer(options: KoreanTokenizerOptions = {}): KoreanTokenizer {
  const resolved = resolveOptions(options);
  const core: CoreOptions = resolved;
  const key = JSON.stringify(resolved);
  const stop = new Set(resolved.stopwords);
  return {
    tokenize: (text) => {
      if (typeof text !== 'string') {
        throw new TypeError(`tokenize() expects a string, got ${describe(text)}.`);
      }
      return coreTokenize(text, core, key, 0) as string[];
    },
    processTerm: (term) => {
      const t = String(term).normalize('NFC').toLowerCase();
      return t.length === 0 || stop.has(t) ? null : t;
    },
    analyze: (text) => {
      if (typeof text !== 'string') {
        throw new TypeError(`analyze() expects a string, got ${describe(text)}.`);
      }
      return coreTokenize(text, core, key, 1) as AnalyzedToken[];
    },
    options: Object.freeze(resolved),
  };
}

const defaultTokenizer = createKoreanTokenizer();

/** Tokenize with the default options. */
export function tokenize(text: string): string[] {
  return defaultTokenizer.tokenize(text);
}

/** The built-in particle, ending and exception tables (for documentation and tests). */
export function builtinRules(): RuleTables {
  return coreTokenize('', resolveOptions(), JSON.stringify(resolveOptions()), 2) as RuleTables;
}
