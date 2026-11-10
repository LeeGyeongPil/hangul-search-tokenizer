// Shared fixtures for the engine adapter tests: five documents, nine queries.
export const probeDocs = [
  { id: 1, text: '학교에 가서 친구를 만났다' },
  { id: 2, text: 'API를 v2에서 호출하면 토큰이 필요하다' },
  { id: 3, text: '검색엔진은 색인을 만든다' },
  { id: 4, text: '우리는 어제 밥을 먹었다' },
  { id: 5, text: '학생들이 도서관에서 공부한다' },
];

export const probeQueries: Array<{ query: string; expected: number }> = [
  { query: '학교', expected: 1 },
  { query: '학교를', expected: 1 },
  { query: 'API', expected: 2 },
  { query: 'v2', expected: 2 },
  { query: '색인', expected: 3 },
  { query: '먹다', expected: 4 },
  { query: '학생', expected: 5 },
  { query: '도서관', expected: 5 },
  { query: '친구', expected: 1 },
];

/** Count queries whose expected document is among the returned ids. */
export function countMatched(run: (query: string) => number[]): number {
  return probeQueries.filter(({ query, expected }) => run(query).includes(expected)).length;
}
