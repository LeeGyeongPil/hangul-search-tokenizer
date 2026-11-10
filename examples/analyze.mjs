// See what gets cut off. Run with: node examples/analyze.mjs
import { createKoreanTokenizer, tokenize } from 'hangul-search-tokenizer';

const text = 'API를 v2에서 호출하면 학생들이 먹었다';
console.log(createKoreanTokenizer().analyze(text));
console.log('tokenize:', tokenize(text));
