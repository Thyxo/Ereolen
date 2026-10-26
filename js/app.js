// Opstart og routing.
import { initState } from './state.js';
import { initSecret } from './secret.js';
import {
  initViews, renderBook, renderHome, renderSearch, renderReadListen, renderMyPage, renderLoans, renderSimpleList, renderMore,
} from './views.js';
import { renderReader, closeReader } from './reader.js';

const app = document.getElementById('app');
let BOOKS = [];
let PAGESETS = null;
const scrollMemory = {};
let currentPath = null;

async function load(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url);
  return r.json();
}

function navigate(href, replace = false) {
  scrollMemory[location.pathname] = window.scrollY;
  if (replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  route();
}

function route() {
  const url = new URL(location.href);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const reading = parts[0] === 'bog' && parts[2] === 'laes';
  if (!reading) closeReader();

  // gamle adresser
  if (parts[0] === 'laes' && parts[1]) return navigate(`/bog/${parts[1]}/laes${url.search}`, true);

  if (parts[0] === 'bog' && parts[1]) {
    const book = BOOKS.find((b) => b.id === parts[1]);
    if (!book) return navigate('/', true);
    if (reading) {
      const side = Number(url.searchParams.get('side'));
      renderReader(app, book, PAGESETS, side ? side - 1 : undefined, () => {
        // Tilbage til bogsiden (eller dertil, hvis man kom direkte)
        if (history.state?.fromApp) history.back();
        else navigate(`/bog/${book.id}`);
      });
    } else {
      renderBook(app, book);
    }
  } else if (parts[0] === 'soeg') renderSearch(app);
  else if (parts[0] === 'laes-lyt') renderReadListen(app);
  else if (parts[0] === 'min-side' && parts[1] === 'laan') renderLoans(app);
  else if (parts[0] === 'min-side' && ['reserveringer', 'huskeliste', 'historik'].includes(parts[1])) renderSimpleList(app, parts[1]);
  else if (parts[0] === 'min-side') renderMyPage(app);
  else if (parts[0] === 'mere') renderMore(app);
  else renderHome(app);

  const same = currentPath === path;
  currentPath = path;
  if (!same) window.scrollTo(0, scrollMemory[path] || 0);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  if (a.hasAttribute('data-back') && history.length > 1 && history.state?.fromApp) {
    history.back();
    return;
  }
  scrollMemory[location.pathname] = window.scrollY;
  history.pushState({ fromApp: true }, '', a.getAttribute('href'));
  route();
});
window.addEventListener('popstate', route);

async function boot() {
  try {
    const [booksData, words, pageSets] = await Promise.all([
      load('/data/books.json'),
      load('/data/words.json'),
      load('/data/pageSets.json'),
    ]);
    BOOKS = booksData.books;
    PAGESETS = pageSets;
    initState(BOOKS);
    initSecret(words, BOOKS);
    initViews(BOOKS);
    route();
  } catch (err) {
    app.innerHTML = `<div class="boot-error"><p>Der opstod en fejl. Tjek din forbindelse og prøv igen.</p><button onclick="location.reload()">Prøv igen</button></div>`;
    console.error(err);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

boot();
