// Lokal tilstand: læsefremskridt, lån, bogmærker, indstillinger.
// Alt ligger kun i telefonens localStorage.
import { segStarts } from './flow.js';

const KEY = 'ereolen:v3';
const DAY = 86400000;

// Startværdier, så hylden ser "brugt" ud (andel læst).
const SEED_PROGRESS = {
  // De 8 »ord-bøger« (F G K L N P S T) er enten ulæste eller færdiglæste, så
  // »Læs« / »Læs igen« altid åbner på forordet (kickeren). Ole Lukøje er i gang.
  'fyrtojet': 1,
  'klods-hans': 1,
  'prinsessen-paa-aerten': 1,
  'ole-lukoje': 0.38,
};
const LOAN_DAYS = [26, 4, 13, 27, 9, 18, 22, 5, 29, 13, 10, 18, 26, 23, 14, 29, 9];
const BOOKMARKS = { 'ole-lukoje': [3] };

let state = null;
let books = [];

function today0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fresh() {
  const now = today0();
  const s = {
    seededAt: now,
    settings: { fontSize: 17, font: 'times', theme: 'light' },
    kicker: false,
    lastOpenedId: null,
    sort: 'title',
    books: {},
  };
  books.forEach((b, i) => {
    const p = SEED_PROGRESS[b.id] || 0;
    const starts = segStarts(b);
    const page = Math.round(p * (b.pages.length - 1));
    s.books[b.id] = {
      page,
      pos: starts[page],
      started: p > 0,
      loanedAt: now - (30 - LOAN_DAYS[i % LOAN_DAYS.length]) * DAY,
      dueAt: now + LOAN_DAYS[i % LOAN_DAYS.length] * DAY,
      lastOpened: p > 0 ? now - (i + 1) * 3.7 * 3600000 : 0,
      // bogmærker gemmes som tegn-positioner i bogen
      bookmarks: (BOOKMARKS[b.id] || []).filter((n) => n < b.pages.length).map((n) => starts[n]),
    };
  });
  return s;
}

export function initState(bookList) {
  books = bookList;
  try {
    state = JSON.parse(localStorage.getItem(KEY));
  } catch {
    state = null;
  }
  const valid = state && state.books && books.every((b) => state.books[b.id]);
  // Forny lånene, hvis et lån er udløbet, så datoerne altid ser rigtige ud.
  const expired = valid && Object.values(state.books).some((b) => b.dueAt < today0());
  if (!valid || expired) {
    const keep = valid ? { settings: state.settings } : {};
    state = { ...fresh(), ...keep };
    save();
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* privat tilstand e.l. – appen virker stadig */
  }
}

export function getState() {
  return state;
}

export function bookState(id) {
  return state.books[id];
}

// page = datasegment (bruges til % på listerne), pos = tegn-position
export function setPosition(id, page, pos) {
  const b = state.books[id];
  b.page = page;
  b.pos = pos;
  b.started = true;
  save();
}

export function markOpened(id) {
  state.books[id].lastOpened = Date.now();
  state.lastOpenedId = id;
  save();
}

// Bogmærke for en skærmside [start, end). Fjerner, hvis der allerede er et.
export function toggleBookmark(id, start, end) {
  const b = state.books[id];
  const inside = b.bookmarks.filter((x) => x >= start && x < end);
  if (inside.length) b.bookmarks = b.bookmarks.filter((x) => !(x >= start && x < end));
  else b.bookmarks = [...b.bookmarks, start].sort((x, y) => x - y);
  save();
  return !inside.length;
}

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  save();
}

export function setSort(sort) {
  state.sort = sort;
  save();
}

export function toggleKicker() {
  state.kicker = !state.kicker;
  save();
  return state.kicker;
}

export function resetAll() {
  const settings = state.settings;
  state = fresh();
  state.settings = settings;
  save();
}

export function percent(book, page) {
  const n = book.pages.length;
  if (n <= 1) return 100;
  return Math.round((page / (n - 1)) * 100);
}
