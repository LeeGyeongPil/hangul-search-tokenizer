# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.2] - 2026-11-18

### Fixed
- Polite endings `-하세요`, `-해요`, `-해야` and `-하십시오` are now cut (`설치하세요` → `설치`), so queries such as `설치` and `실행` find those documents.
- `-ㅂ니다` after a stem without a final consonant now maps to the dictionary form: `봅니다` → `보`, `갑니다` → `가`, `만듭니다` → `만드` (previously `봅니`, `갑니`, `만듭니`). A stem that really ends in `ㅂ` (`좁니다`) becomes `조`; see Limitations.
- Re-index existing data to pick up the change: terms produced for these words are different.

## [0.1.1] - 2026-11-11

### Fixed
- A particle after a closing quote, bracket or symbol (`'설정'을`, `(API)를`, `[링크]를`) is no longer indexed as its own term, so `'도움말'을` no longer matches documents that lack the word. Re-index existing data to pick up the change.

## [0.1.0] - 2026-11-10

### Added
- `createKoreanTokenizer()` and `tokenize()`: synchronous Korean tokenizer that cuts particles (josa) and verb endings (eomi), splits mixed Hangul/Latin/digit words and keeps `Intl.Segmenter` word splitting for Chinese and Japanese runs.
- Options: `keepOriginal`, `bigram`, `minStemLength`, `cjkSegmenter`, `extraJosa`, `extraEomi`, `noStrip`, `stopwords`; invalid options throw `InvalidOptionError`.
- `analyze()` to inspect what was cut off, and `builtinRules()` for the built-in tables.
- Adapters: `hangul-search-tokenizer/minisearch`, `/orama`, `/flexsearch` and `/vitepress` (self-contained functions that survive VitePress `fn.toString()` serialization).
- Benchmark: six configurations on a small hand-written corpus (`npm run bench`) and an optional MIRACL Korean subset (`npm run bench:download`, `npm run bench:miracl`).
- Committed `dist/` so that installs from a git URL work without a build step.
