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
export function coreTokenize(text: string, opts: CoreOptions, key: string, mode: number): any {
  var g: any = globalThis;
  var cache: any = g.__hangulSearchTokenizerCache || (g.__hangulSearchTokenizerCache = {});
  var t: any = cache[key];
  if (!t) {
    var keys = Object.keys(cache);
    if (keys.length >= 16) for (var ki = 0; ki < keys.length; ki++) delete cache[keys[ki]];
    t = cache[key] = (function build(): any {
      var words = function (s: string): string[] { return s.split(' ').filter(Boolean); };
      var byLengthDesc = function (a: string, b: string): number { return b.length - a.length; };
      // Particles (josa): removed when at least `minStemLength` characters stay.
      var josa = words(
        '에서는 에서도 에서의 에서만 에서부터 에게서 에게는 에게도 에게로 으로는 으로도 으로서 으로써 으로의 으로부터 로부터 ' +
        '이라고 이라는 이라면 이라도 까지는 까지도 까지의 부터는 부터도 한테서 한테는 입니다 이었다 이였다 이에요 ' +
        '에서 에게 으로 부터 까지 처럼 보다 마다 조차 밖에 한테 께서 이나 이란 이든 이라 이랑 하고 에는 에도 에만 에의 ' +
        '로는 로도 로서 로써 와의 과의 만의 만이 만을 만은 만도 이다 이며 이고 예요 라고 라는 ' +
        '은 는 이 가 을 를 에 의 도 만 와 과 로 랑 께'
      ).concat(opts.extraJosa);
      // Removed only when at least two characters stay (plural marker).
      var josaShort = words('들');
      // Verb/adjective endings (eomi): removed when at least `minStemLength` characters stay.
      var eomi = words(
        '했습니다 하였습니다 었습니다 았습니다 였습니다 겠습니다 했어요 었어요 았어요 하였다 었다고 았다고 했다고 한다고 ' +
        '합니다 됩니다 습니다 으면서 었으면 았으면 하였 했던 했고 했지만 했으며 했는데 했으나 했다 하는 하면 하고 하여 해서 하게 하며 하지 하기 하다 한다 ' +
        '되었다 되었 됐다 됐던 됐고 되는 되면 되고 되어 되지 되며 되다 된다 ' +
        '었다 았다 였다 겠다 었고 았고 었던 았던 었는 았는 었으 았으 으면 으며 으니 으나 으려 지만 는데 는다 면서 어서 아서 어도 아도 어요 아요 에요 ' +
        '다고 다는 다며 었 았 였 겠 했 됐 다'
      ).concat(opts.extraEomi);
      // Removed only when at least two characters stay (short, ambiguous endings).
      var eomiShort = words('한 할 함 된 될 됨 고 면 서 지 게 며 던 하 되');
      var builtinNoStrip = words(
        '아이 나이 차이 사이 오이 바다 미로 사과 결과 효과 성과 평가 추가 부가 작가 물가 단가 원가 대가 ' +
        '지도 시도 정도 속도 온도 강도 제도 태도 각도 밀도 농도 습도 회의 경로 도로 통로 회로 ' +
        '냉장고 보고서 아버지 어머니 컴퓨터 홈페이지'
      );
      var noStripSet = new Set(builtinNoStrip.concat(opts.noStrip));
      var stopSet = new Set(opts.stopwords);
      var josaAll = josa.concat(josaShort);
      var longest = function (list: string[]): number {
        var n = 1;
        for (var i = 0; i < list.length; i++) if (list[i].length > n) n = list[i].length;
        return n;
      };
      var segmenter: any = null;
      if (opts.cjkSegmenter && typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        segmenter = new (Intl as any).Segmenter('ja', { granularity: 'word' });
      }
      return {
        josaSet: new Set(josa),
        josaShortSet: new Set(josaShort),
        eomiSet: new Set(eomi),
        eomiShortSet: new Set(eomiShort),
        noStripSet: noStripSet,
        stopSet: stopSet,
        maxJosa: longest(josaAll),
        maxEomi: longest(eomi.concat(eomiShort)),
        segmenter: segmenter,
        rules: {
          josa: josa.slice().sort(byLengthDesc),
          josaShort: josaShort,
          eomi: eomi.slice().sort(byLengthDesc),
          eomiShort: eomiShort,
          noStrip: Array.from(noStripSet),
        },
      };
    })();
  }
  if (mode === 2) return t.rules;

  var minStem = Math.max(1, opts.minStemLength);
  var scriptRe = /(\p{Script=Hangul}+)|([\p{Script=Latin}\p{N}]+)|([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+)|([\p{L}\p{M}]+)/gu;

  // Cut particles/endings off the end of a Hangul chunk until nothing more applies.
  var stripHangul = function (word: string): { stem: string; removed: string[] } {
    var stem = word;
    var removed: string[] = [];
    var eomiCut = false;
    for (var round = 0; round < 4; round++) {
      if (t.noStripSet.has(stem)) break;
      var cut = '';
      var maxLen = Math.min(t.maxJosa, stem.length - minStem);
      for (var n = maxLen; n >= 1 && !cut; n--) {
        var tail = stem.slice(stem.length - n);
        if (t.josaSet.has(tail)) cut = tail;
        else if (n === 1 && t.josaShortSet.has(tail) && stem.length - n >= 2) cut = tail;
      }
      if (cut) eomiCut = false;
      if (!cut) {
        var maxE = Math.min(t.maxEomi, stem.length - minStem);
        for (var m = maxE; m >= 1 && !cut; m--) {
          var tail2 = stem.slice(stem.length - m);
          if (t.eomiSet.has(tail2)) cut = tail2;
          else if (t.eomiShortSet.has(tail2) && stem.length - m >= Math.max(2, minStem)) cut = tail2;
        }
        if (cut) eomiCut = true;
      }
      if (!cut) break;
      stem = stem.slice(0, stem.length - cut.length);
      removed.unshift(cut);
    }
    // Contracted past forms: 갔다 -> 갔 -> 가, 만났다 -> 만났 -> 만나 (but keep 있).
    if (eomiCut && stem.length > 0 && stem !== '있') {
      var code = stem.charCodeAt(stem.length - 1);
      if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 20) {
        stem = stem.slice(0, stem.length - 1) + String.fromCharCode(code - 20);
      }
    }
    return { stem: stem, removed: removed };
  };

  var out: AnalyzedToken[] = [];
  var normalized = String(text).normalize('NFC');
  var prevEnd = -1;
  var prevScript = '';
  for (var m2 of normalized.matchAll(scriptRe)) {
    var surface = m2[0];
    var index = m2.index as number;
    var adjacent = index === prevEnd;
    var script: 'hangul' | 'latin' | 'cjk' | 'other' = m2[1] ? 'hangul' : m2[2] ? 'latin' : m2[3] ? 'cjk' : 'other';
    var terms: string[] = [];
    var stem = surface;
    var removed: string[] = [];
    if (script === 'hangul') {
      if (
        (t.josaSet.has(surface) || t.josaShortSet.has(surface)) &&
        ((adjacent && prevScript !== 'hangul') ||
          (prevEnd >= 0 && normalized.slice(prevEnd, index) !== '' && !/\s/.test(normalized.slice(prevEnd, index))))
      ) {
        // A particle glued to a Latin/digit/CJK word (API를, v2에서), or following a closing
        // quote/bracket/symbol inside the same word ('설정'을, (API)를): drop it entirely.
        stem = '';
        removed = [surface];
      } else {
        var r = stripHangul(surface);
        stem = r.stem;
        removed = r.removed;
        if (!t.stopSet.has(stem) && !t.stopSet.has(surface)) {
          terms.push(stem);
          if (opts.keepOriginal && stem !== surface) terms.push(surface);
          if (opts.bigram && stem.length >= 3) {
            for (var b = 0; b + 2 <= stem.length; b++) terms.push(stem.slice(b, b + 2));
          }
        }
      }
    } else if (script === 'cjk' && t.segmenter) {
      for (var seg of t.segmenter.segment(surface)) {
        if (seg.isWordLike) terms.push(String(seg.segment).toLowerCase());
      }
    } else {
      var lower = surface.toLowerCase();
      stem = lower;
      if (!t.stopSet.has(lower)) terms.push(lower);
    }
    out.push({ surface: surface, stem: stem, removed: removed, terms: terms, script: script });
    prevEnd = index + surface.length;
    prevScript = script;
  }
  if (mode === 1) return out;
  var flat: string[] = [];
  for (var oi = 0; oi < out.length; oi++) for (var ti = 0; ti < out[oi].terms.length; ti++) flat.push(out[oi].terms[ti]);
  return flat;
}
