import { describe, expect, it } from 'vitest';
import { InvalidOptionError, builtinRules, createKoreanTokenizer, tokenize } from '../dist/index.js';

describe('tokenize (AC-1)', () => {
  it('cuts particles and endings and splits mixed scripts', () => {
    const terms = tokenize('API를 v2에서 호출하면 학생들이 먹었다');
    expect(terms).toEqual(expect.arrayContaining(['api', 'v2', '학생', '먹']));
    for (const gone of ['를', '에서', '학생들이', '먹었다']) expect(terms).not.toContain(gone);
  });

  it('maps particle variants to one stem', () => {
    for (const word of ['학교에', '학교를', '학교에서는', '학교가', '학교의']) {
      expect(tokenize(word)).toEqual(['학교']);
    }
    expect(tokenize('공부한다')).toEqual(['공부']);
    expect(tokenize('설치했다')).toEqual(tokenize('설치하면'));
  });

  it('treats the dictionary form and conjugations alike', () => {
    expect(tokenize('먹다')).toEqual(tokenize('먹었다'));
    expect(tokenize('가다')).toEqual(tokenize('갔다'));
    expect(tokenize('만나다')).toEqual(tokenize('만났다'));
  });

  it('keeps built-in exceptions and user noStrip words intact', () => {
    expect(tokenize('아이')).toEqual(['아이']);
    expect(tokenize('아이가')).toEqual(['아이']);
    expect(tokenize('수도')).toEqual(['수']);
    expect(createKoreanTokenizer({ noStrip: ['수도'] }).tokenize('수도는')).toEqual(['수도']);
  });

  it('returns a plain array synchronously', () => {
    const result = tokenize('학교');
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBeInstanceOf(Promise);
  });

  it('handles empty, punctuation-only and NFD input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('  ... !!! ')).toEqual([]);
    expect(tokenize('학교를'.normalize('NFD'))).toEqual(['학교']);
  });

  it('lowercases Latin and drops particles glued to Latin words', () => {
    expect(tokenize('HTTP를')).toEqual(['http']);
    expect(tokenize('Docker에서')).toEqual(['docker']);
  });

  it('honors keepOriginal, bigram, stopwords and minStemLength', () => {
    expect(createKoreanTokenizer({ keepOriginal: true }).tokenize('학교에')).toEqual(['학교', '학교에']);
    expect(createKoreanTokenizer({ bigram: true }).tokenize('검색엔진')).toEqual(['검색엔진', '검색', '색엔', '엔진']);
    expect(createKoreanTokenizer({ stopwords: ['학교'] }).tokenize('학교에 갔다')).toEqual(['가']);
    expect(createKoreanTokenizer({ minStemLength: 3 }).tokenize('학교에')).toEqual(['학교에']);
    expect(createKoreanTokenizer({ extraJosa: ['이면'] }).tokenize('학교이면')).toEqual(['학교']);
  });

  it('exposes analyze() for debugging', () => {
    const [api, josa, verb] = createKoreanTokenizer().analyze('API를 먹었다');
    expect(api).toMatchObject({ surface: 'API', stem: 'api', script: 'latin' });
    expect(josa).toMatchObject({ surface: '를', removed: ['를'], terms: [] });
    expect(verb).toMatchObject({ surface: '먹었다', stem: '먹', removed: ['었다'], terms: ['먹'] });
  });

  it('exposes the built-in rule tables', () => {
    const rules = builtinRules();
    expect(rules.josa).toContain('에서는');
    expect(rules.eomi).toContain('었다');
    expect(rules.noStrip).toContain('아이');
  });
});

describe('option validation (AC-1)', () => {
  it('rejects a negative minStemLength with a fix hint', () => {
    expect(() => createKoreanTokenizer({ minStemLength: -1 })).toThrow(InvalidOptionError);
    expect(() => createKoreanTokenizer({ minStemLength: -1 })).toThrow(/integer >= 1/);
  });

  it('rejects wrong types and unknown keys', () => {
    expect(() => createKoreanTokenizer({ minStemLength: 1.5 })).toThrow(InvalidOptionError);
    expect(() => createKoreanTokenizer({ bigram: 'yes' as unknown as boolean })).toThrow(/boolean/);
    expect(() => createKoreanTokenizer({ noStrip: '수도' as unknown as string[] })).toThrow(/array of non-empty strings/);
    expect(() => createKoreanTokenizer({ bigrams: true } as never)).toThrow(/Valid options/);
    expect(() => createKoreanTokenizer(null as never)).toThrow(InvalidOptionError);
  });

  it('rejects non-string input to tokenize()', () => {
    expect(() => tokenize(42 as unknown as string)).toThrow(TypeError);
  });
});
