// Compound words: bigram and keepOriginal. Run with: node examples/bigram.mjs
import MiniSearch from 'minisearch';
import { createKoreanTokenizer } from 'hangul-search-tokenizer';
import { miniSearchOptions } from 'hangul-search-tokenizer/minisearch';

const text = '검색엔진은 학교에';
console.log('default      ', createKoreanTokenizer().tokenize(text));
console.log('bigram+orig  ', createKoreanTokenizer({ bigram: true, keepOriginal: true }).tokenize(text));

const docs = [{ id: 1, text: '검색엔진은 색인을 만든다' }];
for (const bigram of [false, true]) {
  const engine = new MiniSearch({ fields: ['text'], ...miniSearchOptions({ bigram }) });
  engine.addAll(docs);
  const hits = engine.search('엔진').length;
  const bytes = JSON.stringify(engine.toJSON()).length;
  console.log(`bigram=${bigram}: query "엔진" -> ${hits} hit(s), index JSON ${bytes} bytes`);
}
