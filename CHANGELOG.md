# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-10

### Added
- `createKoreanTokenizer()` and `tokenize()`: synchronous Korean tokenizer that cuts particles (josa) and verb endings (eomi), splits mixed Hangul/Latin/digit words and keeps `Intl.Segmenter` word splitting for Chinese and Japanese runs.
- Options: `keepOriginal`, `bigram`, `minStemLength`, `cjkSegmenter`, `extraJosa`, `extraEomi`, `noStrip`, `stopwords`; invalid options throw `InvalidOptionError`.
- `analyze()` to inspect what was cut off, and `builtinRules()` for the built-in tables.
- Adapters: `hangul-search-tokenizer/minisearch`, `/orama`, `/flexsearch` and `/vitepress` (self-contained functions that survive VitePress `fn.toString()` serialization).
- Benchmark: six configurations on a small hand-written corpus (`npm run bench`) and an optional MIRACL Korean subset (`npm run bench:download`, `npm run bench:miracl`).
- Committed `dist/` so that installs from a git URL work without a build step.
