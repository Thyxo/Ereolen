// Opstart og navigation, bygget som en app:
//  - fanerne tegnes én gang og holdes i live (ingen genindlæsning ved fanebyt)
//  - undersider glider ind fra højre og ud igen
//  - læseren glider op nedefra
import { initState } from './state.js';
import { initSecret } from './secret.js';
import {
  initViews, renderTabbar, renderBook, renderHome, renderSearch, renderReadListen, renderMyPage, renderLoans,
  renderSimpleList, renderMore, renderList, openedBook,
} from './views.js';
import { openReader, closeReader, readerOpen } from './reader.js';

const app = document.getElementById('app');
app.innerHTML = '<div id="views"></div><div id="stack"></div><nav id="tabbar" class="tabbar"></nav><div id="reader-root"></div>';
const viewsEl = document.getElementById('views');
const stackEl = document.getElementById('stack');
const tabbarEl = document.getElementById('tabbar');
const readerRoot = document.getElementById('reader-root');

let BOOKS = [];
const tabViews = {};       // sti -> element
let activeTab = null;
const stack = [];          // [{ path, el, render }]
let booted = false;

const TAB_RENDER = {
  '/': renderHome,
  '/soeg': renderSearch,
  '/laes-lyt': renderReadListen,
  '/min-side': renderMyPage,
  '/mere': renderMore,
};

async function load(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url);
  return r.json();
}

function parse(path) {
  const p = path.replace(/\/+$/, '') || '/';
  const parts = p.split('/').filter(Boolean);
  if (parts[0] === 'bog' && parts[1] && parts[2] === 'laes') return { reader: parts[1], base: `/bog/${parts[1]}` };
  if (parts[0] === 'laes' && parts[1]) return { redirect: `/bog/${parts[1]}/laes` };
  if (parts[0] === 'bog' && parts[1]) return { push: p, kind: 'book', id: parts[1] };
  if (parts[0] === 'liste' && parts[1]) return { push: p, kind: 'list', slug: parts[1] };
  if (parts[0] === 'min-side' && parts[1]) return { push: p, kind: parts[1], tab: '/min-side' };
  if (TAB_RENDER[p]) return { tab: p };
  return { tab: '/' };
}

// ---------- faner ----------
function showTab(path) {
  if (!tabViews[path]) {
    const el = document.createElement('section');
    el.className = 'view tab-view';
    viewsEl.appendChild(el);
    TAB_RENDER[path](el);
    el._render = () => TAB_RENDER[path](el);
    tabViews[path] = el;
  }
  if (activeTab !== path) {
    Object.entries(tabViews).forEach(([k, el]) => el.classList.toggle('active', k === path));
    tabbarEl.querySelectorAll('.tab').forEach((a) => a.classList.toggle('on', a.dataset.tab === path));
    activeTab = path;
  }
}

// ---------- undersider ----------
function renderPushed(el, info) {
  if (info.kind === 'book') {
    const book = BOOKS.find((b) => b.id === info.id);
    if (!book) return false;
    renderBook(el, book);
  } else if (info.kind === 'list') renderList(el, info.slug);
  else if (info.kind === 'laan') renderLoans(el);
  else if (['reserveringer', 'huskeliste', 'historik'].includes(info.kind)) renderSimpleList(el, info.kind);
  else return false;
  return true;
}

function push(info, animate) {
  const el = document.createElement('section');
  el.className = 'view pushed';
  if (!renderPushed(el, info)) return;
  if (info.kind === 'book') openedBook(BOOKS.find((b) => b.id === info.id));
  el._render = () => renderPushed(el, info);
  stack.push({ path: info.push, el });
  if (animate) el.classList.add('enter');
  stackEl.appendChild(el);
  stack[stack.length - 2]?.el.classList.add('behind');
  if (!stack[stack.length - 2]) viewsEl.classList.add('behind');
  if (animate) {
    el.getBoundingClientRect();
    el.classList.remove('enter');
  }
}

function popTo(index, animate) {
  // fjern alle sider over index (index -1 = tilbage til fanen)
  while (stack.length - 1 > index) {
    const { el } = stack.pop();
    if (animate) {
      el.classList.add('leave');
      setTimeout(() => el.remove(), 340);
    } else el.remove();
  }
  const top = stack[stack.length - 1];
  if (top) top.el.classList.remove('behind');
  else viewsEl.classList.remove('behind');
}

// ---------- routing ----------
function route() {
  const url = new URL(location.href);
  const info = parse(url.pathname);
  const animate = booted;

  if (info.redirect) {
    history.replaceState(history.state, '', info.redirect + url.search);
    return route();
  }

  if (info.reader) {
    const book = BOOKS.find((b) => b.id === info.reader);
    if (!book) return go('/', true);
    // sørg for at bogsiden ligger under læseren
    if (!stack.length || stack[stack.length - 1].path !== info.base) {
      showTab(activeTab || '/');
      if (!stack.some((s) => s.path === info.base)) push(parse(info.base), false);
    }
    if (!readerOpen()) {
      const side = Number(url.searchParams.get('side'));
      openReader(readerRoot, book, side ? side - 1 : null, () => {
        if (history.state?.fromApp) history.back();
        else go(info.base);
      });
    }
    return;
  }

  if (readerOpen()) {
    closeReader();
    refreshAll();
  }

  if (info.push) {
    const tab = info.tab || activeTab || '/';
    if (tab !== activeTab) {
      popTo(-1, false);
      showTab(tab);
    }
    const idx = stack.findIndex((s) => s.path === info.push);
    if (idx >= 0) popTo(idx, animate);
    else push(info, animate);
  } else {
    if (info.tab !== activeTab) {
      popTo(-1, false);
      showTab(info.tab);
    } else {
      popTo(-1, animate);
    }
  }
  booted = true;
}

function go(href, replace = false) {
  if (replace) history.replaceState({ fromApp: true }, '', href);
  else history.pushState({ fromApp: true }, '', href);
  route();
}

// Opdater sider, der viser læsefremskridt (fx efter læsning eller nulstilling)
function refreshAll() {
  ['/', '/laes-lyt'].forEach((k) => tabViews[k]?._render?.());
  stack.forEach((s) => s.el._render?.());
}
window.addEventListener('ereolen:refresh', refreshAll);

document.addEventListener('click', (e) => {
  const tab = e.target.closest('a[data-tab]');
  if (tab) {
    e.preventDefault();
    const path = tab.dataset.tab;
    if (path === activeTab && stack.length) go(path); // tryk på aktiv fane = tilbage til toppen
    else if (path === activeTab) tabViews[path]?.querySelector('.scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    else go(path);
    return;
  }
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  if (a.hasAttribute('data-back')) {
    if (history.state?.fromApp) history.back();
    else {
      const top = stack.length > 1 ? stack[stack.length - 2].path : activeTab || '/';
      go(top, true);
    }
    return;
  }
  go(a.getAttribute('href'));
});
window.addEventListener('popstate', route);

// iOS-hjemmeskærm: CSS-højderne (100%, 100vh, lvh) kan være for lave med
// gennemsigtig statusbar. Brug telefonens målte højde til html, body og appen.
function fitHeight() {
  const h = Math.max(window.innerHeight, document.documentElement.clientHeight);
  document.documentElement.style.setProperty('--app-h', `${h}px`);
}
window.addEventListener('resize', fitHeight);
window.addEventListener('orientationchange', () => setTimeout(fitHeight, 300));
fitHeight();

// Forhindr zoom med to fingre og dobbelttryk (føles som en app)
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

async function boot() {
  try {
    const [booksData, words] = await Promise.all([load('/data/books.json'), load('/data/words.json')]);
    BOOKS = booksData.books;
    initState(BOOKS);
    initSecret(words, BOOKS);
    initViews(BOOKS);
    renderTabbar(tabbarEl);
    // forvarm ikonerne, så de ikke blinker første gang
    ['tab-home', 'tab-home-on', 'tab-search', 'tab-play', 'tab-user', 'tab-user-on', 'tab-menu', 'ebook', 'chevron-right',
      'r-close', 'r-aa', 'r-toc', 'r-bookmark', 'r-bookmark-on', 'mp-loans', 'mp-reserve', 'mp-heart', 'mp-history', 'gear',
      'chevron-down', 'search-white', 'logo', 'logo-sub'].forEach((n) => { new Image().src = `/icons/ui/${n}.png`; });
    route();
  } catch (err) {
    app.innerHTML = `<div class="boot-error"><p>Der opstod en fejl. Tjek din forbindelse og prøv igen.</p><button onclick="location.reload()">Prøv igen</button></div>`;
    console.error(err);
  }
}

// Service worker + automatisk opdatering: når en ny version er hentet,
// genindlæses appen én gang, så rettelser altid kommer frem.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  });
}

boot();
