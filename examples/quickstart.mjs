// Quick start: plain MiniSearch vs MiniSearch with hangul-search-tokenizer, side by side.
// Run with: npm run example
import MiniSearch from 'minisearch';
import { miniSearchOptions } from 'hangul-search-tokenizer/minisearch';

const docs = [
  { id: 1, text: '학교에 가서 친구를 만났다' },
  { id: 2, text: 'API를 v2에서 호출하면 토큰이 필요하다' },
  { id: 3, text: '검색엔진은 색인을 만든다' },
  { id: 4, text: '우리는 어제 밥을 먹었다' },
  { id: 5, text: '학생들이 도서관에서 공부한다' },
];

// query -> the document that should be found
const queries = [
  ['학교', 1], ['학교를', 1], ['API', 2], ['v2', 2], ['색인', 3],
  ['먹다', 4], ['학생', 5], ['도서관', 5], ['친구', 1],
];

// 1) MiniSearch as it ships: splits on spaces only
const plain = new MiniSearch({ fields: ['text'] });
plain.addAll(docs);

// 2) Same engine, one extra line: the Korean tokenizer for indexing and queries
const korean = new MiniSearch({ fields: ['text'], ...miniSearchOptions() });
korean.addAll(docs);

const found = (engine, query, expected) => engine.search(query).some((hit) => hit.id === expected);

console.log(['query', 'default', 'hangul-search-tokenizer'].join('\t'));
let plainCount = 0;
let koreanCount = 0;
for (const [query, expected] of queries) {
  const a = found(plain, query, expected);
  const b = found(korean, query, expected);
  plainCount += a ? 1 : 0;
  koreanCount += b ? 1 : 0;
  console.log([query, a ? 'found' : 'MISSED', b ? 'found' : 'MISSED'].join('\t'));
}
console.log(`matched: default ${plainCount}/${queries.length}, hangul-search-tokenizer ${koreanCount}/${queries.length}`);
