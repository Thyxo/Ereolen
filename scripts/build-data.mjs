// Bygger data/books.json og data/pageSets.json ud fra content/*.txt og data/words.json.
// Kør: node scripts/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, 'content');
const DATA = path.join(ROOT, 'data');
const PAGE_CHARS = 780; // ca. én telefonskærm tekst

// ---------- hjælpere ----------
function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ORD = /^(Første|Anden|Tredje|Fjerde|Femte|Sjette|Syvende) historie[.,]?\s*/;
const DAYS = /^(Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag)$/;

// Afsnit -> blokke: {h: overskrift, sub?}, {sep: true} eller {p: tekst}
function toBlocks(paras) {
  const out = [];
  for (let raw of paras) {
    let p = raw.replace(/­/g, '').replace(/ \* /g, ' ').trim();
    if (!p) continue;
    if (/^[*\-–—\s]+$/.test(p)) { out.push({ sep: true }); continue; }
    if (DAYS.test(p)) { out.push({ h: p }); continue; }
    // Kapiteloverskrifter kan ligge midt i et afsnit, adskilt af linjeskift
    const lines = p.split('\n');
    let buf = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (ORD.test(line) && line.length < 40) {
        if (buf.length) out.push({ p: buf.join(' ') });
        buf = [];
        const sub = lines[i + 1] && lines[i + 1].length < 90 ? lines[++i].trim().replace(/\.$/, '') : undefined;
        out.push({ h: line.replace(/[.,]$/, ''), sub });
      } else if (line) {
        buf.push(line);
      }
    }
    if (buf.length) out.push({ p: buf.join(' ') });
  }
  return out;
}

function splitLong(text) {
  if (text.length <= PAGE_CHARS * 1.25) return [text];
  // del kun efter sætningstegn (evt. efterfulgt af »«) + mellemrum
  const sentences = text.split(/(?<=[.!?][«»]?)\s+(?=[»«A-ZÆØÅa-zæøå–])/);
  const parts = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + s.length > PAGE_CHARS) { parts.push(cur.trim()); cur = ''; }
    cur += (cur ? ' ' : '') + s;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function paginate(blocks, section) {
  const pages = [];
  let cur = [];
  let len = 0;
  const flush = () => { if (cur.length) pages.push({ section, blocks: cur }); cur = []; len = 0; };
  for (const b of blocks) {
    if (b.h) { if (len > 200) flush(); cur.push(b); len += 60; continue; }
    if (b.sep) { cur.push(b); len += 40; continue; }
    const parts = splitLong(b.p);
    parts.forEach((part, i) => {
      if (len > 0 && len + part.length > PAGE_CHARS * 1.15) flush();
      cur.push(i > 0 ? { p: part, cont: true } : { p: part });
      len += part.length;
    });
  }
  flush();
  // undgå en sidste side med næsten ingenting
  const last = pages[pages.length - 1];
  const lastLen = last ? last.blocks.reduce((n, b) => n + (b.p ? b.p.length : 40), 0) : 0;
  if (pages.length > 1 && lastLen < 160) {
    pages[pages.length - 2].blocks.push(...last.blocks);
    pages.pop();
  }
  // fjern separatorer i starten/slutningen af en side
  for (const pg of pages) {
    while (pg.blocks[0]?.sep) pg.blocks.shift();
    while (pg.blocks[pg.blocks.length - 1]?.sep) pg.blocks.pop();
  }
  return pages;
}

function parseContent(file) {
  const src = fs.readFileSync(file, 'utf8');
  const [headPart, rest] = src.split('## Forord');
  const [forordPart, tekstPart = ''] = rest.split('## Tekst');
  const meta = {};
  for (const line of headPart.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  const paras = (s) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  return { meta, forord: paras(forordPart), tekst: paras(tekstPart) };
}

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
  if (set.words.length !== 8) throw new Error(`Sæt ${set.id} har ikke 8 ord`);
}
fs.writeFileSync(path.join(DATA, 'words.json'), JSON.stringify(words, null, 2) + '\n');

// ---------- bøger ----------
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.txt'));
const books = files.map((f) => {
  const { meta, forord, tekst } = parseContent(path.join(CONTENT, f));
  if (!tekst.length) throw new Error(`${f}: mangler tekst`);
  const forordPages = paginate(forord.map((p) => ({ p })), 'forord');
  const tekstPages = paginate(toBlocks(tekst), 'tekst');
  return {
    id: meta.id,
    title: meta.title,
    letter: meta.title[0].toUpperCase(),
    year: Number(meta.year),
    author: 'H.C. Andersen',
    forordPages: forordPages.length,
    pages: [...forordPages, ...tekstPages],
  };
}).sort((a, b) => a.title.localeCompare(b.title, 'da'));

const letters = new Set();
for (const b of books) {
  if (letters.has(b.letter)) throw new Error(`To titler starter med ${b.letter}`);
  letters.add(b.letter);
}
for (const set of words.sets) {
  for (const w of set.words) {
    if (!letters.has(w.initial)) throw new Error(`Ingen titel starter med ${w.initial} (${w.word})`);
  }
}

// ---------- sidernes ordsæt ----------
// Hver side får et sæt (til tilskuer-mode) og en rækkefølge af de 8 ord.
// Ingen to sider i samme bog har samme rækkefølge, og intet ord står samme
// sted som på siden før.
const pageSets = { ownModeSet: words.ownModeSet, books: {} };
for (const b of books) {
  const rand = rng(hash(b.id));
  const seen = new Set();
  let prevSet = -1;
  let prevOrder = null;
  pageSets.books[b.id] = b.pages.map(() => {
    let set;
    do { set = Math.floor(rand() * words.sets.length); } while (set === prevSet);
    let order;
    for (;;) {
      order = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rand);
      const key = order.join('');
      const clash = prevOrder && order.some((v, i) => v === prevOrder[i]);
      if (!seen.has(key) && !clash) { seen.add(key); break; }
    }
    prevSet = set;
    prevOrder = order;
    return { set, order };
  });
}

fs.writeFileSync(path.join(DATA, 'books.json'), JSON.stringify({ books }) + '\n');
fs.writeFileSync(path.join(DATA, 'pageSets.json'), JSON.stringify(pageSets) + '\n');

const total = books.reduce((n, b) => n + b.pages.length, 0);
for (const b of books) console.log(`${b.letter}  ${b.title.padEnd(32)} ${String(b.pages.length).padStart(3)} sider`);
console.log(`I alt ${books.length} bøger, ${total} sider.`);
