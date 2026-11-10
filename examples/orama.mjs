// Orama with the Korean tokenizer. Run with: node examples/orama.mjs
import { create, insert, search } from '@orama/orama';
import { oramaTokenizer } from 'hangul-search-tokenizer/orama';

const db = create({
  schema: { text: 'string' },
  components: { tokenizer: oramaTokenizer() },
});
insert(db, { text: '학교에 가서 친구를 만났다' });
insert(db, { text: '학생들이 도서관에서 공부한다' });

for (const term of ['학교를', '학생', '공부하다']) {
  const hits = search(db, { term }).hits.map((hit) => hit.document.text);
  console.log(term, '->', hits);
}
