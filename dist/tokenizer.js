import { coreTokenize } from './core.js';
/** Thrown when an option has the wrong type or value. The message says how to fix it. */
export class InvalidOptionError extends Error {
    constructor(message) {
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
];
function booleanOption(name, value, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value !== 'boolean') {
        throw new InvalidOptionError(`Option "${name}" must be a boolean (true or false), got ${describe(value)}.`);
    }
    return value;
}
function listOption(name, value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.length === 0)) {
        throw new InvalidOptionError(`Option "${name}" must be an array of non-empty strings, e.g. ${name}: ['example'], got ${describe(value)}.`);
    }
    return Array.from(new Set(value.map((v) => v.normalize('NFC').toLowerCase())));
}
function describe(value) {
    return typeof value === 'string' ? JSON.stringify(value) : String(typeof value === 'object' ? JSON.stringify(value) : value);
}
/**
 * Validate options and fill in defaults.
 * @throws {InvalidOptionError} on unknown keys, wrong types or out-of-range values.
 */
export function resolveOptions(options = {}) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new InvalidOptionError(`Options must be an object such as { bigram: true }, got ${describe(options)}.`);
    }
    for (const key of Object.keys(options)) {
        if (!KNOWN_KEYS.includes(key)) {
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
export function createKoreanTokenizer(options = {}) {
    const resolved = resolveOptions(options);
    const core = resolved;
    const key = JSON.stringify(resolved);
    const stop = new Set(resolved.stopwords);
    return {
        tokenize: (text) => {
            if (typeof text !== 'string') {
                throw new TypeError(`tokenize() expects a string, got ${describe(text)}.`);
            }
            return coreTokenize(text, core, key, 0);
        },
        processTerm: (term) => {
            const t = String(term).normalize('NFC').toLowerCase();
            return t.length === 0 || stop.has(t) ? null : t;
        },
        analyze: (text) => {
            if (typeof text !== 'string') {
                throw new TypeError(`analyze() expects a string, got ${describe(text)}.`);
            }
            return coreTokenize(text, core, key, 1);
        },
        options: Object.freeze(resolved),
    };
}
const defaultTokenizer = createKoreanTokenizer();
/** Tokenize with the default options. */
export function tokenize(text) {
    return defaultTokenizer.tokenize(text);
}
/** The built-in particle, ending and exception tables (for documentation and tests). */
export function builtinRules() {
    return coreTokenize('', resolveOptions(), JSON.stringify(resolveOptions()), 2);
}
