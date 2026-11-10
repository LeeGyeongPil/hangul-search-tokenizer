// Small offline benchmark: `npm run bench`.
// Prints the comparison table and writes bench/results.json and bench/results.md.
import { writeFileSync } from 'node:fs';
import { loadFixtures, renderMarkdown, runBench } from './lib.mjs';

const result = await runBench(loadFixtures());
const markdown = renderMarkdown(result, 'Small corpus benchmark (hand-written Korean documents)');

writeFileSync(new URL('results.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
writeFileSync(new URL('results.md', import.meta.url), markdown);

process.stdout.write(markdown);
console.log('Wrote bench/results.json and bench/results.md');
