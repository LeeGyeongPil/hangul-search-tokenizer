// Optional: download a MIRACL Korean subset for the large benchmark (`npm run bench:download`).
// Needs network access and about 230 MB of traffic (the corpus is streamed, only a subset is kept).
// MIRACL is Apache-2.0: https://huggingface.co/datasets/miracl/miracl (checked 2026-11-10).
// Nothing downloaded here is committed (bench/.data/ is git-ignored).
//
// Usage: node bench/download-miracl.mjs [--data <dir>] [--negatives <count>]
//   --data       target directory (default: bench/.data/miracl-ko)
//   --negatives  extra unjudged passages to add to the corpus (default: 20000)
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

const BASE = 'https://huggingface.co/datasets/miracl';
const TOPICS = `${BASE}/miracl/resolve/main/miracl-v1.0-ko/topics/topics.miracl-v1.0-ko-dev.tsv`;
const QRELS = `${BASE}/miracl/resolve/main/miracl-v1.0-ko/qrels/qrels.miracl-v1.0-ko-dev.tsv`;
const SHARDS = [0, 1, 2].map((n) => `${BASE}/miracl-corpus/resolve/main/miracl-corpus-v1.0-ko/docs-${n}.jsonl.gz`);

function parseArgs(argv) {
  const args = {
    data: fileURLToPath(new URL('.data/miracl-ko', import.meta.url)),
    negatives: 20000,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data') args.data = argv[++i];
    else if (argv[i] === '--negatives') args.negatives = Number(argv[++i]);
    else throw new Error(`Unknown argument "${argv[i]}". Usage: node bench/download-miracl.mjs [--data <dir>] [--negatives <count>]`);
  }
  if (!args.data) throw new Error('--data needs a directory');
  if (!Number.isInteger(args.negatives) || args.negatives < 0) throw new Error('--negatives needs a non-negative integer');
  return args;
}

async function fetchOk(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}) for ${url}. Check your network, or open the URL in a browser.`);
  return response;
}

async function main() {
  const { data, negatives } = parseArgs(process.argv.slice(2));
  mkdirSync(data, { recursive: true });

  console.log('Downloading queries and judgments...');
  const topics = (await (await fetchOk(TOPICS)).text()).split('\n').filter(Boolean);
  const qrelLines = (await (await fetchOk(QRELS)).text()).split('\n').filter(Boolean);

  const queries = topics.map((line) => {
    const [id, text] = line.split('\t');
    return { id, text };
  });
  const qrels = {};
  const judged = new Set();
  for (const line of qrelLines) {
    const [qid, , docid, rel] = line.split('\t');
    judged.add(docid);
    if (Number(rel) > 0) (qrels[qid] ??= []).push(docid);
  }
  writeFileSync(`${data}/queries.json`, JSON.stringify(queries));
  writeFileSync(`${data}/qrels.json`, JSON.stringify(qrels));

  const out = createWriteStream(`${data}/corpus.jsonl`);
  let kept = 0;
  let extra = 0;
  for (const [n, url] of SHARDS.entries()) {
    console.log(`Streaming corpus shard ${n + 1}/${SHARDS.length} ...`);
    const response = await fetchOk(url);
    const lines = createInterface({ input: Readable.fromWeb(response.body).pipe(createGunzip()), crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line) continue;
      const passage = JSON.parse(line);
      const isJudged = judged.has(passage.docid);
      if (!isJudged && extra >= negatives) continue;
      if (!isJudged) extra++;
      kept++;
      if (!out.write(JSON.stringify({ docid: passage.docid, title: passage.title, text: passage.text }) + '\n')) await once(out, 'drain');
    }
  }
  out.end();
  await once(out, 'finish');
  console.log(`Done: ${queries.length} queries, ${kept} passages (${judged.size} judged + ${extra} extra) in ${data}`);
  console.log('Now run: npm run bench:miracl');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
