// FlexSearch 0.8 with the Korean tokenizer. Run with: node examples/flexsearch.mjs
import FlexSearch from 'flexsearch';
import { flexSearchEncoderOptions } from 'hangul-search-tokenizer/flexsearch';

const index = new FlexSearch.Index({
  tokenize: 'strict',
  encoder: new FlexSearch.Encoder(flexSearchEncoderOptions()),
});
index.add(1, '학교에 가서 친구를 만났다');
index.add(2, '학생들이 도서관에서 공부한다');

for (const query of ['학교를', '학생', '공부하다']) {
  console.log(query, '->', index.search(query));
}
