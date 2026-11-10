// The "Quick start" snippet of the README. Run with: node examples/readme-start.mjs
import MiniSearch from 'minisearch';
import { miniSearchOptions } from 'hangul-search-tokenizer/minisearch';

const docs = [
  { id: 1, text: '학교에 가서 친구를 만났다' },
  { id: 4, text: '우리는 어제 밥을 먹었다' },
];

const search = new MiniSearch({ fields: ['text'], ...miniSearchOptions() });
search.addAll(docs);

console.log(search.search('학교를').map((hit) => hit.id)); // [ 1 ]
console.log(search.search('먹다').map((hit) => hit.id));   // [ 4 ]
