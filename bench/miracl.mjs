// Large benchmark on a MIRACL Korean subset: `npm run bench:miracl [-- --data <dir>]`.
// Without data it prints how to download it and exits with code 0.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderMarkdown, runBench } from './lib.mjs';

const DEFAULT_DIR = fileURLToPath(new URL('.data/miracl-ko', import.meta.url));

/** Read the files written by download-miracl.mjs. Returns null when they are missing. */
export function loadMiracl(dir) {
  const files = ['queries.json', 'qrels.json', 'corpus.jsonl'].map((name) => `${dir}/${name}`);
  if (!files.every((file) => existsSync(file))) return null;
  const [queryList, qrels] = files.slice(0, 2).map((file) => JSON.parse(readFileSync(file, 'utf8')));
  const docs = readFileSync(files[2], 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const passage = JSON.parse(line);
      return { id: passage.docid, text: `${passage.title} ${passage.text}` };
    });
  const present = new Set(docs.map((doc) => doc.id));
  const queries = queryList
    .map((query) => ({ id: query.id, text: query.text, relevant: (qrels[query.id] ?? []).filter((id) => present.has(id)) }))
    .filter((query) => query.relevant.length > 0);
  return { docs, queries };
}

function dataDirFromArgs(argv) {
  const at = argv.indexOf('--data');
  if (at === -1) return DEFAULT_DIR;
  if (!argv[at + 1]) throw new Error('--data needs a directory');
  return argv[at + 1];
}

async function main() {
  const dir = dataDirFromArgs(process.argv.slice(2));
  const corpus = loadMiracl(dir);
  if (!corpus) {
    console.log(`No MIRACL data found in ${dir}.`);
    console.log('The large benchmark needs a one-time download (about 230 MB of traffic, Apache-2.0 data).');
    console.log('Run: npm run bench:download');
    return;
  }
  console.log(`Running 6 configurations on ${corpus.docs.length} passages and ${corpus.queries.length} queries ...`);
  const result = await runBench(corpus);
  process.stdout.write(renderMarkdown(result, 'MIRACL ko subset benchmark'));
}

// Run only when started from the command line, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
