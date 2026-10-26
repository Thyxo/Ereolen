// Siderne. Hver funktion tegner ind i sit eget element (el), som app.js holder
// i live, så fanerne ikke tegnes om, når man skifter mellem dem.
import { coverSVG } from './covers.js';
import { esc, icon, logo, logoSub, numDate, longDate, daysLeft } from './ui.js';
import { getState, bookState, percent, setSort, resetAll, markOpened } from './state.js';
import { bindPeek, bindKickerToggle, onLongPress } from './secret.js';

let BOOKS = [];
export function initViews(books) {
  BOOKS = books;
}

// Fiktivt lånerkort (ikke et rigtigt nummer)
const CARD = '240581';
const HISTORY_COUNT = 23;

export const TABS = [
  { path: '/', label: 'Forside', off: 'tab-home', on: 'tab-home-on' },
  { path: '/soeg', label: 'Søg', off: 'tab-search', on: 'tab-search' },
  { path: '/laes-lyt', label: 'Læs/lyt', off: 'tab-play', on: 'tab-play' },
  { path: '/min-side', label: 'Min side', off: 'tab-user', on: 'tab-user-on' },
  { path: '/mere', label: 'Mere', off: 'tab-menu', on: 'tab-menu' },
];

const mi = (name, cls = '') => `<i class="ico ${cls}" style="--m:url(/icons/ui/${name}.png)" aria-hidden="true"></i>`;

// Fanebjælken tegnes én gang; app.js skifter blot "on"-klassen.
export function renderTabbar(nav) {
  nav.innerHTML = TABS.map((t) => `
    <a href="${t.path}" data-tab="${t.path}" class="tab">
      <span class="tab-icon">${mi(t.off, 'i-off')}${mi(t.on, 'i-on')}${t.path === '/min-side' ? '<i class="tab-dot"></i>' : ''}</span>
      <span class="tab-label">${t.label}</span>
    </a>`).join('');
  updateTabDot();
}

export function updateTabDot() {
  document.querySelector('.tab-dot')?.classList.toggle('show', !!getState().kicker);
}

// Rød header. Forsiden har logo, de andre sider en titel.
function header({ title, back, big } = {}) {
  if (big) {
    return `
      <header class="hdr hdr-big">
        <div class="brand" id="brand">${logo()}${logoSub()}<span class="peek-slot"></span></div>
      </header>`;
  }
  return `
    <header class="hdr hdr-small">
      ${back ? `<a class="hdr-back" href="${back}" data-link data-back aria-label="Tilbage">${icon.back}</a>` : '<span></span>'}
      <div class="brand"><h1 class="hdr-title">${esc(title)}</h1><span class="peek-slot"></span></div>
      <span></span>
    </header>`;
}

function screen(el, head, inner) {
  el.innerHTML = `${head}<div class="scroll">${inner}</div>`;
  bindHeader(el);
}

// Skjulte gestus på headeren: dobbelttryk = peek, langt tryk = kicker til/fra
function bindHeader(el) {
  const brand = el.querySelector('.hdr .brand');
  if (!brand) return;
  bindPeek(brand, brand.querySelector('.peek-slot'));
  bindKickerToggle(brand, updateTabDot);
}

function progressLine(book) {
  const s = bookState(book.id);
  const pct = percent(book, s.page);
  if (!s.started) return `<div class="progress muted">Ikke påbegyndt</div>`;
  if (pct >= 100) return `<div class="progress done">${icon.check}<span>Læst</span></div>`;
  return `<div class="progress"><div class="bar"><span style="width:${pct}%"></span></div><span class="pct">${pct} %</span></div>`;
}

function loanItem(book, { showRead = false } = {}) {
  const s = bookState(book.id);
  const left = daysLeft(s.dueAt);
  return `
  <li>
    <a class="loan" href="/bog/${book.id}" data-link>
      <div class="cover">${coverSVG(book)}</div>
      <div class="meta">
        <h3>${esc(book.title)}</h3>
        <p class="author">${esc(book.author)}</p>
        <div class="type">${icon.ebook}<span>E-bog</span><span class="blue-badge">Blå titel</span></div>
        <p class="due ${left <= 5 ? 'soon' : ''}">Lånt til ${numDate(s.dueAt)}</p>
        ${progressLine(book)}
      </div>
      ${s.bookmarks.length ? `<span class="bm-flag" aria-label="Bogmærke">${mi('r-bookmark-on')}</span>` : ''}
    </a>
    ${showRead ? `<a class="read-btn" href="/bog/${book.id}/laes" data-link>Læs</a>` : ''}
  </li>`;
}

function sorted(sort) {
  const list = BOOKS.slice();
  if (sort === 'due') list.sort((a, b) => bookState(a.id).dueAt - bookState(b.id).dueAt || a.title.localeCompare(b.title, 'da'));
  else if (sort === 'recent') list.sort((a, b) => bookState(b.id).lastOpened - bookState(a.id).lastOpened);
  else list.sort((a, b) => a.title.localeCompare(b.title, 'da'));
  return list;
}

function sortBar(count, label) {
  const st = getState();
  return `
    <div class="list-toolbar">
      <span>${count} ${label}</span>
      <label class="sort">Sortér
        <select class="sortSel">
          <option value="title" ${st.sort === 'title' ? 'selected' : ''}>Titel (A–Å)</option>
          <option value="due" ${st.sort === 'due' ? 'selected' : ''}>Udløbsdato</option>
          <option value="recent" ${st.sort === 'recent' ? 'selected' : ''}>Senest læst</option>
        </select>
      </label>
    </div>`;
}

function bindSort(el, rerender) {
  el.querySelector('.sortSel')?.addEventListener('change', (e) => {
    setSort(e.target.value);
    rerender();
  });
}

const byId = (id) => BOOKS.find((b) => b.id === id);

// ---------- Forside ----------
export function renderHome(el) {
  const featured = byId('snedronningen');
  const rowA = ['fyrtojet', 'nattergalen', 'tommelise', 'snedronningen', 'grantraeet'];
  const rowB = ['klods-hans', 'ole-lukoje', 'prinsessen-paa-aerten', 'lille-claus-og-store-claus', 'snedronningen'];
  const carousel = (ids) => `<div class="carousel">${ids.map(byId).filter(Boolean).map((b) => `
      <a class="c-item" href="/bog/${b.id}" data-link>
        <div class="cover">${coverSVG(b)}</div>
        <span class="c-format">${icon.ebook}</span>
      </a>`).join('')}</div>`;
  const collage = ['snedronningen', 'nattergalen', 'fyrtojet', 'tommelise', 'grantraeet', 'ole-lukoje'].map(byId);

  screen(el, header({ big: true }), `
    <a class="theme-banner" href="/liste/klassikere" data-link>
      <div class="tb-top">
        <svg class="tb-mark" viewBox="0 0 30 30" aria-hidden="true"><rect x="0" y="0" width="10" height="10" fill="#fff" opacity=".85"/><rect x="20" y="0" width="10" height="10" fill="#fff" opacity=".85"/><rect x="10" y="10" width="10" height="10" fill="#fff" opacity=".85"/><rect x="0" y="20" width="10" height="10" fill="#fff" opacity=".85"/></svg>
        <span class="tb-name">EVENTYR<br>FOR ALLE</span>
      </div>
      <div class="tb-img">
        <div class="tb-collage">${collage.map((b) => `<div class="cover">${coverSVG(b)}</div>`).join('')}</div>
        <div class="tb-text"><span>Tema</span><strong>H.C. Andersens eventyr</strong></div>
      </div>
    </a>
    <section class="block">
      <div class="block-head"><h2>Klassikere for hele familien</h2><a href="/liste/klassikere" data-link class="all">Alle ${icon.chevron}</a></div>
      ${carousel(rowA)}
    </section>
    <a class="feature" href="/bog/${featured.id}" data-link>
      <div class="cover">${coverSVG(featured)}</div>
      <div class="feature-text">
        <span>Månedens klassiker</span>
        <strong>${esc(featured.title)}</strong>
        <em>${esc(featured.author)}</em>
      </div>
    </a>
    <section class="block">
      <div class="block-head"><h2>Bøger, du altid kan låne</h2><a href="/liste/altid" data-link class="all">Alle ${icon.chevron}</a></div>
      ${carousel(rowB)}
    </section>`);
}

// ---------- Søg ----------
export const CATEGORIES = [
  { slug: 'efteraaret', title: 'Bøger til efteråret', color: '#86989c', books: ['grantraeet', 'ole-lukoje', 'nattergalen', 'tommelise'] },
  { slug: 'altid', title: 'Bøger, du altid kan låne', color: '#2d3d4b', books: ['fyrtojet', 'snedronningen', 'klods-hans', 'tommelise'] },
  { slug: 'lydboeger', title: 'Lydbøger', color: '#d76a60', books: ['nattergalen', 'grantraeet', 'ole-lukoje', 'fyrtojet'] },
  { slug: 'podcasts', title: 'Podcasts', color: '#000000', books: ['snedronningen', 'nattergalen', 'klods-hans', 'fyrtojet'] },
  { slug: 'lette', title: 'Lette bøger til voksne', color: '#434e59', books: ['prinsessen-paa-aerten', 'klods-hans', 'ole-lukoje', 'tommelise'] },
  { slug: 'krimi', title: 'Krimi og spænding', color: '#7d726f', books: ['lille-claus-og-store-claus', 'fyrtojet', 'snedronningen', 'nattergalen'] },
  { slug: 'boern', title: 'Børn', color: '#1b222f', books: ['tommelise', 'prinsessen-paa-aerten', 'ole-lukoje', 'snedronningen'] },
  { slug: 'engelsk', title: 'Bøger på engelsk', color: '#86989c', books: ['grantraeet', 'nattergalen', 'klods-hans', 'lille-claus-og-store-claus'] },
  { slug: 'sprog', title: 'Bøger på andre sprog', color: '#2d3d4b', books: ['ole-lukoje', 'snedronningen', 'tommelise', 'fyrtojet'] },
];

export function renderSearch(el) {
  el.innerHTML = `
    <header class="hdr hdr-search">
      <form class="sbar" autocomplete="off">
        <input type="search" placeholder="Hvad søger du?" enterkeyhint="search" aria-label="Søg">
        <button class="sbtn" type="submit" aria-label="Søg">${mi('search-white')}</button>
      </form>
    </header>
    <div class="scroll">
      <ul class="cats">${CATEGORIES.map((c) => `
        <li><a href="/liste/${c.slug}" data-link class="cat" style="--c:${c.color}">
          <div class="cat-art">${c.books.map(byId).filter(Boolean).map((b) => `<div class="cover">${coverSVG(b)}</div>`).join('')}</div>
          <span class="cat-title">${esc(c.title)}</span>
          <svg class="cat-chev" viewBox="0 0 12 22" aria-hidden="true"><path d="M1.5 1.5L10.5 11l-9 9.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a></li>`).join('')}
      </ul>
      <ul class="loans results" hidden></ul>
    </div>`;
  const form = el.querySelector('.sbar');
  const q = form.querySelector('input');
  const cats = el.querySelector('.cats');
  const res = el.querySelector('.results');
  const run = () => {
    const v = q.value.trim().toLowerCase();
    cats.hidden = !!v;
    res.hidden = !v;
    if (!v) return;
    const hits = BOOKS.filter((b) => (b.title + ' ' + b.author + ' eventyr klassikere børn').toLowerCase().includes(v));
    res.innerHTML = hits.map((b) => loanItem(b)).join('') || `<li class="empty small"><p>Ingen resultater for »${esc(q.value)}«</p></li>`;
  };
  q.addEventListener('input', run);
  form.addEventListener('submit', (e) => { e.preventDefault(); q.blur(); run(); });
}

// Liste (kategori eller »Alle«)
export function renderList(el, slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const title = cat ? cat.title : slug === 'klassikere' ? 'Klassikere for hele familien' : 'Bøger, du altid kan låne';
  const offline = ['lydboeger', 'podcasts', 'engelsk', 'sprog'].includes(slug);
  const inner = offline
    ? `<div class="empty">${icon.info}<h3>Indholdet kunne ikke hentes</h3><p>Tjek din internetforbindelse, og prøv igen.</p></div>`
    : `<ul class="loans">${sorted('title').map((b) => loanItem(b)).join('')}</ul>`;
  screen(el, header({ title, back: '/soeg' }), inner);
}

// ---------- Læs/lyt ----------
export function renderReadListen(el, tab = 'ebog') {
  const st = getState();
  const body = tab === 'ebog'
    ? `${sortBar(BOOKS.length, 'e-bøger')}<ul class="loans">${sorted(st.sort).map((b) => loanItem(b, { showRead: true })).join('')}</ul>`
    : `<div class="empty">${icon.headphones}<h3>Ingen lydbøger</h3><p>Lydbøger, du låner, kan du lytte til her.</p></div>`;
  screen(el, header({ title: 'Læs/lyt' }), `
    <div class="seg" role="tablist">
      <button data-tab="ebog" class="${tab === 'ebog' ? 'on' : ''}">E-bøger <span class="count">${BOOKS.length}</span></button>
      <button data-tab="lyd" class="${tab === 'lyd' ? 'on' : ''}">Lydbøger <span class="count">0</span></button>
    </div>
    ${body}`);
  el.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => renderReadListen(el, b.dataset.tab)));
  bindSort(el, () => renderReadListen(el, 'ebog'));
}

// ---------- Min side ----------
export function renderMyPage(el) {
  const rows = [
    ['/min-side/laan', 'mp-loans', 'Lån', BOOKS.length],
    ['/min-side/reserveringer', 'mp-reserve', 'Reserveringer', 0],
    ['/min-side/huskeliste', 'mp-heart', 'Huskeliste', 0],
    ['/min-side/historik', 'mp-history', 'Lånehistorik', HISTORY_COUNT],
  ];
  el.innerHTML = `
    <header class="hdr hdr-profile">
      <div class="brand">
        <button class="card-no">${CARD}<span class="dots">●●●●</span>${icon.chevronDown}</button>
        <span class="lib peek-slot">København</span>
      </div>
      <button class="settings">${icon.gear}<span>Indstillinger</span></button>
    </header>
    <div class="scroll">
      <ul class="mp-list">${rows.map(([href, ic, label, n]) => `
        <li><a href="${href}" data-link>${mi(ic)}<span>${label}</span><b>${n}</b></a></li>`).join('')}
      </ul>
    </div>`;
  // Peek her erstatter »København« et øjeblik
  const brand = el.querySelector('.brand');
  bindPeek(brand, brand.querySelector('.peek-slot'));
  bindKickerToggle(brand, updateTabDot);
  // Skjult: hold 3 sek. på »Indstillinger« = nulstil alt
  const gear = el.querySelector('.settings');
  onLongPress(gear, 3000, () => {
    resetAll();
    updateTabDot();
    gear.classList.add('flash');
    setTimeout(() => {
      gear.classList.remove('flash');
      window.dispatchEvent(new Event('ereolen:refresh'));
    }, 400);
  });
}

export function renderLoans(el) {
  const st = getState();
  screen(el, header({ title: 'Lån', back: '/min-side' }), `
    <div class="pad">
      <div class="quota card">
        <div class="quota-row"><span>E-bøger lånt denne måned</span><strong>0 af 5</strong></div>
        <div class="quota-bar"><span style="width:0%"></span></div>
        <p class="quota-note"><span class="blue-dot"></span>Blå titler tæller ikke med i din kvote.</p>
      </div>
    </div>
    ${sortBar(BOOKS.length, 'lån')}
    <ul class="loans">${sorted(st.sort).map((b) => loanItem(b)).join('')}</ul>`);
  bindSort(el, () => renderLoans(el));
}

export function renderSimpleList(el, kind) {
  const conf = {
    reserveringer: ['Reserveringer', 'mp-reserve', 'Du har ingen reserveringer', 'Når du reserverer en titel, der er udlånt, kan du følge den her.'],
    huskeliste: ['Huskeliste', 'mp-heart', 'Din huskeliste er tom', 'Tryk på hjertet ved en titel for at gemme den til senere.'],
    historik: ['Lånehistorik', 'mp-history', '', ''],
  }[kind];
  let inner;
  if (kind === 'historik') {
    const old = ['fyrtojet', 'klods-hans', 'prinsessen-paa-aerten'].map(byId).filter(Boolean);
    inner = `<ul class="loans">${old.map((b) => `
      <li><a class="loan" href="/bog/${b.id}" data-link><div class="cover">${coverSVG(b)}</div>
      <div class="meta"><h3>${esc(b.title)}</h3><p class="author">${esc(b.author)}</p>
      <div class="type">${icon.ebook}<span>E-bog</span></div><p class="due">Lånt ${numDate(bookState(b.id).loanedAt)}</p></div></a></li>`).join('')}</ul>`;
  } else {
    inner = `<div class="empty">${mi(conf[1])}<h3>${conf[2]}</h3><p>${conf[3]}</p></div>`;
  }
  screen(el, header({ title: conf[0], back: '/min-side' }), inner);
}

// ---------- Mere ----------
export function renderMore(el) {
  const rows = [
    [icon.info, 'Om eReolen'],
    [icon.help, 'Hjælp og vejledning'],
    [icon.mail, 'Kontakt biblioteket'],
    [icon.bell, 'Notifikationer'],
    [icon.lock, 'Privatlivspolitik'],
    [icon.access, 'Tilgængelighedserklæring'],
    [icon.logout, 'Log ud'],
  ];
  screen(el, header({ title: 'Mere' }), `
    <ul class="mp-list plain">${rows.map(([i, t]) => `<li><button>${i}<span>${t}</span>${icon.chevron}</button></li>`).join('')}</ul>
    <p class="fine center">eReolen · version 4.12.1</p>`);
}

// ---------- Bogside ----------
export function renderBook(el, book) {
  const s = bookState(book.id);
  const pct = percent(book, s.page);
  const left = daysLeft(s.dueAt);
  const firstForord = book.pages[0].blocks.find((b) => b.p)?.p || '';
  const readLabel = !s.started ? 'Læs' : pct >= 100 ? 'Læs igen' : 'Fortsæt læsning';
  const readHref = pct >= 100 ? `/bog/${book.id}/laes?side=1` : `/bog/${book.id}/laes`;
  screen(el, header({ title: 'E-bog', back: '/' }), `
    <div class="book-page">
      <div class="book-hero">
        <div class="cover big">${coverSVG(book)}</div>
        <h1>${esc(book.title)}</h1>
        <p class="author">${esc(book.author)}</p>
        <div class="type center">${icon.ebook}<span>E-bog</span><span class="blue-badge">Blå titel</span></div>
      </div>
      <a class="btn primary" href="${readHref}" data-link>${readLabel}</a>
      ${s.started && pct < 100 ? `<div class="read-progress"><div class="bar"><span style="width:${pct}%"></span></div><span>${pct} % læst</span></div>` : ''}
      <div class="loan-box card">
        <div><span class="label">Lånt til</span><strong>${longDate(s.dueAt)}</strong></div>
        <span class="days ${left <= 5 ? 'soon' : ''}">${left} ${left === 1 ? 'dag' : 'dage'} tilbage</span>
      </div>
      <section class="card forord-card">
        <h2>Forord</h2>
        <p>${esc(firstForord)}</p>
        <a href="/bog/${book.id}/laes?side=1" data-link class="link">Læs hele forordet ${icon.chevron}</a>
      </section>
      <section class="card">
        <h2>Detaljer</h2>
        <dl class="facts">
          <div><dt>Forfatter</dt><dd>${esc(book.author)}</dd></div>
          <div><dt>Første udgave</dt><dd>${book.year}</dd></div>
          <div><dt>Sprog</dt><dd>Dansk</dd></div>
          <div><dt>Format</dt><dd>E-bog (EPUB)</dd></div>
          <div><dt>Forlag</dt><dd>Danske Klassikere</dd></div>
          <div><dt>Målgruppe</dt><dd>Børn og voksne</dd></div>
        </dl>
      </section>
      <p class="fine">Blå titler kan lånes uden at tælle med i din månedlige kvote. Lånet afleveres automatisk, når lånetiden udløber.</p>
    </div>`);
}

export function openedBook(book) {
  markOpened(book.id);
}
