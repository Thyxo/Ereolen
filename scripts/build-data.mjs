// Bygger data/books.json og data/pageSets.json ud fra content/*.txt.
// Siderne er skrevet på forhånd (adskilt af en linje med ---), så hver side
// indeholder præcis de 8 lange ord. Bygget stopper, hvis en side bryder reglen.
// Kør: node scripts/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePages, checkPage } from './check-pages.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, 'content');
const DATA = path.join(ROOT, 'data');

// ---------- ord ----------
const words = JSON.parse(fs.readFileSync(path.join(DATA, 'words.json'), 'utf8'));
for (const set of words.sets) {
  const initials = new Set();
  for (const w of set.words) {
    w.letters = [...w.word].length;
    w.initial = w.word[0].toUpperCase();
    if (initials.has(w.initial)) throw new Error(`Sæt ${set.id}: to ord starter med ${w.initial}`);
    initials.add(w.initial);
  }
}
fs.writeFileSync(path.join(DATA, 'words.json'), JSON.stringify(words, null, 2) + '\n');

// ---------- bøger ----------
function meta(src) {
  const m = {};
  for (const line of src.split('## Forord')[0].split('\n')) {
    const r = line.match(/^(\w+):\s*(.+)$/);
    if (r) m[r[1]] = r[2].trim();
  }
  return m;
}

function blocks(text) {
  const out = [];
  for (const para of text.split(/\n\s*\n/)) {
    for (const line of para.split('\n').filter((l) => l.startsWith('### '))) out.push({ h: line.slice(4).trim() });
    const body = para.split('\n').filter((l) => !l.startsWith('### ')).join(' ').replace(/\s+/g, ' ').trim();
    if (body) out.push({ p: body });
  }
  return out;
}

let errors = 0;
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.txt'));
const books = files.map((f) => {
  const src = fs.readFileSync(path.join(CONTENT, f), 'utf8');
  const m = meta(src);
  const pages = parsePages(src);
  pages.forEach((pg, i) => {
    const { errors: e } = checkPage(pg.text);
    if (e.length) {
      errors += e.length;
      console.error(`${f} side ${i + 1}: ${e.join('; ')}`);
    }
  });
  return {
    id: m.id,
    title: m.title,
    letter: m.title[0].toUpperCase(),
    year: Number(m.year),
    author: 'H.C. Andersen',
    forordPages: pages.filter((p) => p.section === 'forord').length,
    pages: pages.map((p) => ({ section: p.section, blocks: blocks(p.text) })),
  };
}).sort((a, b) => a.title.localeCompare(b.title, 'da'));

if (errors && !process.argv.includes('--force')) {
  console.error(`\n${errors} fejl – ret teksterne (eller kør med --force).`);
  process.exit(1);
}

const letters = new Set();
for (const b of books) {
  if (letters.has(b.letter)) throw new Error(`To titler starter med ${b.letter}`);
  letters.add(b.letter);
}
for (const w of words.sets[words.ownModeSet].words) {
  if (!letters.has(w.initial)) throw new Error(`Ingen titel starter med ${w.initial} (${w.word})`);
}

// Hvilket ordsæt hører hver side til (mode 1: altid sæt 0)
const pageSets = { ownModeSet: words.ownModeSet, books: {} };
for (const b of books) pageSets.books[b.id] = b.pages.map(() => ({ set: words.ownModeSet }));

fs.writeFileSync(path.join(DATA, 'books.json'), JSON.stringify({ books }) + '\n');
fs.writeFileSync(path.join(DATA, 'pageSets.json'), JSON.stringify(pageSets) + '\n');
for (const b of books) console.log(`${b.letter}  ${b.title.padEnd(30)} ${String(b.pages.length).padStart(3)} sider`);
console.log(`I alt ${books.length} bøger, ${books.reduce((n, b) => n + b.pages.length, 0)} sider.`);
