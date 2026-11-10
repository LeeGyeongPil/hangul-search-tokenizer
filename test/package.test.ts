import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Paths are resolved from this file's location, never from the working directory or folder name.
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const SUBPATHS = ['.', './minisearch', './orama', './flexsearch', './vitepress'];

describe('package shape (AC-5)', () => {
  it('has no runtime dependencies and no install-time scripts', () => {
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([]);
    for (const hook of ['prepare', 'postinstall', 'preinstall', 'install']) {
      expect(pkg.scripts?.[hook]).toBeUndefined();
    }
  });

  it('exports five paths that point to real files in dist', () => {
    for (const subpath of SUBPATHS) {
      const entry = pkg.exports[subpath];
      expect(entry, subpath).toBeDefined();
      for (const target of [entry.default, entry.types]) {
        expect(target).toMatch(/^\.\/dist\//);
        expect(existsSync(new URL(target, root)), `${subpath} -> ${target}`).toBe(true);
      }
    }
  });

  it('can be imported through its own package name', async () => {
    const main = await import('hangul-search-tokenizer');
    expect(main.tokenize('학교를')).toEqual(['학교']);
    expect(typeof main.createKoreanTokenizer).toBe('function');
    expect(typeof (await import('hangul-search-tokenizer/minisearch')).miniSearchOptions).toBe('function');
    expect(typeof (await import('hangul-search-tokenizer/orama')).oramaTokenizer).toBe('function');
    expect(typeof (await import('hangul-search-tokenizer/flexsearch')).flexSearchEncoderOptions).toBe('function');
    expect(typeof (await import('hangul-search-tokenizer/vitepress')).vitepressSearch).toBe('function');
  });

  it('keeps the core small', () => {
    expect(statSync(new URL('dist/core.js', root)).size).toBeLessThan(30 * 1024);
  });

  it('publishes only dist and documentation files', () => {
    expect(pkg.files).toEqual(expect.arrayContaining(['dist', 'README.md', 'LICENSE']));
    expect(pkg.files).not.toContain('test');
    expect(pkg.files).not.toContain('bench');
  });

  it('does not import engines from library code', () => {
    for (const file of ['index', 'core', 'tokenizer', 'adapters/minisearch', 'adapters/orama', 'adapters/flexsearch', 'adapters/vitepress']) {
      const source = readFileSync(new URL(`dist/${file}.js`, root), 'utf8');
      expect(source, file).not.toMatch(/from ['"](minisearch|@orama\/orama|flexsearch|vitepress)['"]/);
    }
  });
});
