// Lokal tilstand: læsefremskridt, lån, bogmærker, indstillinger.
// Alt ligger kun i telefonens localStorage.
const KEY = 'ereolen:v1';
const DAY = 86400000;

// Startværdier, så hylden ser "brugt" ud (andel læst).
const SEED_PROGRESS = {
  // Bøgerne til ordsættets bogstaver (B D F K L N R T) er enten ulæste eller
  // færdiglæste, så »Læs« altid åbner på forordet (kickeren).
  'fyrtojet': 1,
  'klods-hans': 1,
  'snedronningen': 0.42,
  'elverhoj': 0.71,
  'grantraeet': 0.27,
  'ole-lukoje': 0.08,
  'ib-og-lille-christine': 0.33,
  'hyrdinden-og-skorstensfejeren': 1,
  'prinsessen-paa-aerten': 1,
  'anne-lisbeth': 0.15,
};
const LOAN_DAYS = [26, 4, 13, 27, 9, 18, 22, 5, 29, 13, 10, 18, 26, 23, 14, 29, 9];
const BOOKMARKS = { 'snedronningen': [12], 'elverhoj': [5], 'grantraeet': [3] };

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
    settings: { fontSize: 19, font: 'serif', theme: 'light' },
    kicker: false,
    lastOpenedId: null,
    sort: 'title',
    books: {},
  };
  books.forEach((b, i) => {
    const p = SEED_PROGRESS[b.id] || 0;
    s.books[b.id] = {
      page: Math.round(p * (b.pages.length - 1)),
      started: p > 0,
      loanedAt: now - (30 - LOAN_DAYS[i % LOAN_DAYS.length]) * DAY,
      dueAt: now + LOAN_DAYS[i % LOAN_DAYS.length] * DAY,
      lastOpened: p > 0 ? now - (i + 1) * 3.7 * 3600000 : 0,
      bookmarks: (BOOKMARKS[b.id] || []).filter((n) => n < b.pages.length),
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

export function setPage(id, page) {
  const b = state.books[id];
  b.page = page;
  b.started = true;
  save();
}

export function markOpened(id) {
  state.books[id].lastOpened = Date.now();
  state.lastOpenedId = id;
  save();
}

export function toggleBookmark(id, page) {
  const list = state.books[id].bookmarks;
  const i = list.indexOf(page);
  if (i >= 0) list.splice(i, 1);
  else list.push(page);
  list.sort((a, b) => a - b);
  save();
  return i < 0;
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
