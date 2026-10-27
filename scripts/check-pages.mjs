// Kontrollerer, at hver side i content/*.txt følger tricket:
//  - alle 8 lange ord står præcis én gang på hver side
//  - alle andre ord har højst MAX_OTHER bogstaver (så der er et tydeligt hul
//    mellem de lange ord og resten), og kun få ord rammer MAX_OTHER
//  - ord med bindestreg (fx Klods-Hans) tælles som ét ord
//  - siden har en passende længde (så den kan være på én skærm)
//
// Brug:  node scripts/check-pages.mjs                 (alle bøger)
//        node scripts/check-pages.mjs content/fyrtojet.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/words.json'), 'utf8'));
const SET = words.sets[words.ownModeSet].words;
const MIN_LONG = words.minLong;          // lange ord: mindst så mange bogstaver
const MAX_OTHER = words.maxOther;        // alle andre ord: højst så mange bogstaver
const MAX_AT_MAX = words.maxAtMaxOther;  // højst så mange ord med præcis MAX_OTHER bogstaver pr. side
const MIN_CHARS = 450;
const MAX_CHARS = 820;

const formToBase = new Map();
for (const w of SET) for (const f of w.forms) formToBase.set(f.toLowerCase(), w.word);

export function tokens(text) {
  return text.match(/[A-Za-zÆØÅæøåÉéÈèÄäÖöÜü]+(?:-[A-Za-zÆØÅæøåÉéÈèÄäÖöÜü]+)*/g) || [];
}

export function parsePages(src) {
  const [, rest = ''] = src.split('## Forord');
  const [forord = '', tekst = ''] = rest.split('## Tekst');
  const split = (s, section) => s.split(/^\s*---\s*$/m).map((p) => p.trim()).filter(Boolean).map((text) => ({ section, text }));
  return [...split(forord, 'forord'), ...split(tekst, 'tekst')];
}

export function checkPage(text) {
  const errors = [];
  const body = text.split('\n').filter((l) => !l.startsWith('###')).join('\n');
  const len = body.replace(/\s+/g, ' ').trim().length;
  if (len < MIN_CHARS) errors.push(`for kort (${len} tegn, min ${MIN_CHARS})`);
  if (len > MAX_CHARS) errors.push(`for lang (${len} tegn, max ${MAX_CHARS})`);
  const count = new Map(SET.map((w) => [w.word, 0]));
  const bad = [];
  const atMax = [];
  for (const t of tokens(text)) {
    const n = [...t].length;
    const base = formToBase.get(t.toLowerCase());
    if (base) count.set(base, count.get(base) + 1);
    else if (n > MAX_OTHER) bad.push(t);
    else if (n === MAX_OTHER) atMax.push(t);
  }
  if (bad.length) errors.push(`for lange ord (over ${MAX_OTHER} bogstaver – skal omskrives): ${[...new Set(bad)].join(', ')}`);
  if (atMax.length > MAX_AT_MAX) errors.push(`for mange ord med ${MAX_OTHER} bogstaver (${atMax.length}, max ${MAX_AT_MAX}): ${atMax.join(', ')}`);
  for (const [w, n] of count) {
    if (n === 0) errors.push(`mangler »${w}«`);
    if (n > 1) errors.push(`»${w}« står ${n} gange`);
  }
  return { len, errors };
}

function main() {
  const args = process.argv.slice(2);
  const files = args.length ? args : fs.readdirSync(path.join(ROOT, 'content')).filter((f) => f.endsWith('.txt')).map((f) => path.join('content', f));
  let total = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.resolve(ROOT, f), 'utf8');
    const pages = parsePages(src);
    let fileErr = 0;
    pages.forEach((p, i) => {
      const { len, errors } = checkPage(p.text);
      if (errors.length) {
        fileErr += errors.length;
        console.log(`${f} side ${i + 1} (${p.section}, ${len} tegn):\n  - ${errors.join('\n  - ')}`);
      }
    });
    console.log(`${fileErr ? 'FEJL' : 'OK  '} ${f}: ${pages.length} sider${fileErr ? `, ${fileErr} fejl` : ''}`);
    total += fileErr;
  }
  if (total) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
