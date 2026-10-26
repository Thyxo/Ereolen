// Forside, Søg, Læs/lyt, Min side (Lån m.m.), Mere og bogsiden.
import { coverSVG } from './covers.js';
import { esc, icon, logo, shortDate, numDate, longDate, daysLeft } from './ui.js';
import { getState, bookState, percent, setSort, resetAll, markOpened } from './state.js';
import { bindPeek, bindKickerToggle, onLongPress } from './secret.js';

let BOOKS = [];
export function initViews(books) {
  BOOKS = books;
}

// Fiktivt lånerkort (ikke et rigtigt nummer)
const CARD = '240581';
const HISTORY_COUNT = 23;

const TABS = [
  { path: '/', label: 'Forside', icon: icon.home, on: icon.homeFill },
  { path: '/soeg', label: 'Søg', icon: icon.search, on: icon.search },
  { path: '/laes-lyt', label: 'Læs/lyt', icon: icon.play, on: icon.playFill },
  { path: '/min-side', label: 'Min side', icon: icon.user, on: icon.userFill },
  { path: '/mere', label: 'Mere', icon: icon.menu, on: icon.menu },
];

function tabbar(active) {
  const kick = getState().kicker;
  return `
    <nav class="tabbar">
      ${TABS.map((t) => `
        <a href="${t.path}" data-link class="tab ${t.path === active ? 'on' : ''}">
          <span class="tab-icon">${t.path === active ? t.on : t.icon}${t.path === '/min-side' ? `<i class="tab-dot ${kick ? 'show' : ''}"></i>` : ''}</span>
          <span class="tab-label">${t.label}</span>
        </a>`).join('')}
    </nav>`;
}

// Rød header. Forsiden har stort logo, de andre sider en titel.
function header({ title, back, big } = {}) {
  if (big) {
    return `
      <header class="hdr hdr-big">
        <div class="brand" id="brand">${logo()}<span class="hdr-sub">Bibliotekernes ebøger og lydbøger</span><span class="peek-slot" id="peekSlot"></span></div>
      </header>`;
  }
  return `
    <header class="hdr hdr-small">
      ${back ? `<a class="hdr-back" href="${back}" data-link data-back aria-label="Tilbage">${icon.back}</a>` : '<span></span>'}
      <div class="brand" id="brand"><h1 class="hdr-title">${esc(title)}</h1><span class="peek-slot" id="peekSlot"></span></div>
      <span></span>
    </header>`;
}

function page(active, head, inner, cls = '') {
  return `<div class="shell ${cls}">${head}<main class="content">${inner}</main>${tabbar(active)}</div>`;
}

// Skjulte gestus på headeren: dobbelttryk = peek, langt tryk = kicker til/fra
function bindHeader(app) {
  const brand = app.querySelector('#brand');
  if (!brand) return;
  bindPeek(brand, app.querySelector('#peekSlot'));
  bindKickerToggle(brand, (on) => app.querySelector('.tab-dot')?.classList.toggle('show', on));
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
      ${s.bookmarks.length ? `<span class="bm-flag" aria-label="Bogmærke">${icon.bookmarkFill}</span>` : ''}
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
        <select id="sortSel">
          <option value="title" ${st.sort === 'title' ? 'selected' : ''}>Titel (A–Å)</option>
          <option value="due" ${st.sort === 'due' ? 'selected' : ''}>Udløbsdato</option>
          <option value="recent" ${st.sort === 'recent' ? 'selected' : ''}>Senest læst</option>
        </select>
      </label>
    </div>`;
}

function bindSort(app, rerender) {
  app.querySelector('#sortSel')?.addEventListener('change', (e) => {
    setSort(e.target.value);
    rerender();
  });
}

// ---------- Forside ----------
export function renderHome(app) {
  const featured = BOOKS.find((b) => b.id === 'snedronningen');
  const rowA = ['fyrtojet', 'nattergalen', 'tommelise', 'snedronningen', 'grantraeet', 'klods-hans', 'ole-lukoje', 'prinsessen-paa-aerten'];
  const rowB = ['elverhoj', 'rejsekammeraten', 'dyndkongens-datter', 'anne-lisbeth', 'ib-og-lille-christine', 'hyrdinden-og-skorstensfejeren', 'bedstemoder', 'vanddraaben', 'lille-claus-og-store-claus'];
  const byId = (id) => BOOKS.find((b) => b.id === id);
  const carousel = (ids) => `<div class="carousel">${ids.map(byId).filter(Boolean).map((b) => `
      <a class="c-item" href="/bog/${b.id}" data-link>
        <div class="cover">${coverSVG(b)}</div>
        <span class="c-format">${icon.ebook}</span>
      </a>`).join('')}</div>`;
  const collage = ['snedronningen', 'nattergalen', 'fyrtojet', 'tommelise', 'grantraeet', 'ole-lukoje'].map(byId);

  app.innerHTML = page('/', header({ big: true }), `
    <a class="theme-banner" href="/laes-lyt" data-link>
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
      <div class="block-head"><h2>Klassikere for hele familien</h2><a href="/laes-lyt" data-link class="all">Alle ${icon.chevron}</a></div>
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
      <div class="block-head"><h2>Blå titler – lån uden kvote</h2><a href="/laes-lyt" data-link class="all">Alle ${icon.chevron}</a></div>
      ${carousel(rowB)}
    </section>`, 'home');
  bindHeader(app);
}

// ---------- Søg ----------
export function renderSearch(app) {
  app.innerHTML = page('/soeg', header({ title: 'Søg' }), `
    <label class="search-field">${icon.search}<input id="q" type="search" placeholder="Søg på titel, forfatter, emne…" autocomplete="off"></label>
    <div class="chips"><button>Eventyr</button><button>H.C. Andersen</button><button>Klassikere</button><button>Lydbøger</button><button>Krimi</button><button>Børnebøger</button></div>
    <ul class="loans" id="results"></ul>`);
  bindHeader(app);
  const q = app.querySelector('#q');
  const res = app.querySelector('#results');
  const run = () => {
    const v = q.value.trim().toLowerCase();
    res.innerHTML = v ? BOOKS.filter((b) => (b.title + ' ' + b.author + ' eventyr klassikere børnebøger').toLowerCase().includes(v)).map((b) => loanItem(b)).join('')
      || `<li class="empty small"><p>Ingen resultater for »${esc(q.value)}«</p></li>` : '';
  };
  q.addEventListener('input', run);
  app.querySelectorAll('.chips button').forEach((b) => b.addEventListener('click', () => { q.value = b.textContent; run(); }));
}

// ---------- Læs/lyt ----------
export function renderReadListen(app, tab = 'ebog') {
  const st = getState();
  const body = tab === 'ebog'
    ? `${sortBar(BOOKS.length, 'e-bøger')}<ul class="loans">${sorted(st.sort).map((b) => loanItem(b, { showRead: true })).join('')}</ul>`
    : `<div class="empty">${icon.headphones}<h3>Ingen lydbøger</h3><p>Lydbøger, du låner, kan du lytte til her.</p></div>`;
  app.innerHTML = page('/laes-lyt', header({ title: 'Læs/lyt' }), `
    <div class="seg" role="tablist">
      <button data-tab="ebog" class="${tab === 'ebog' ? 'on' : ''}">E-bøger <span class="count">${BOOKS.length}</span></button>
      <button data-tab="lyd" class="${tab === 'lyd' ? 'on' : ''}">Lydbøger <span class="count">0</span></button>
    </div>
    ${body}`);
  bindHeader(app);
  app.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => renderReadListen(app, b.dataset.tab)));
  bindSort(app, () => renderReadListen(app, 'ebog'));
}

// ---------- Min side ----------
export function renderMyPage(app) {
  const rows = [
    ['/min-side/laan', icon.calendar, 'Lån', BOOKS.length],
    ['/min-side/reserveringer', icon.reserve, 'Reserveringer', 0],
    ['/min-side/huskeliste', icon.heart, 'Huskeliste', 0],
    ['/min-side/historik', icon.history, 'Lånehistorik', HISTORY_COUNT],
  ];
  app.innerHTML = `
  <div class="shell mypage">
    <header class="hdr hdr-profile">
      <div class="brand" id="brand">
        <button class="card-no">${CARD}<span class="dots">●●●●</span>${icon.chevronDown}</button>
        <span class="lib" id="peekSlot">København</span>
      </div>
      <button class="settings" id="settingsBtn">${icon.gear}<span>Indstillinger</span></button>
    </header>
    <main class="content flush">
      <ul class="mp-list">${rows.map(([href, ic, label, n]) => `
        <li><a href="${href}" data-link>${ic}<span>${label}</span><b>${n}</b></a></li>`).join('')}
      </ul>
    </main>
    ${tabbar('/min-side')}
  </div>`;
  // Peek her erstatter »København« et øjeblik
  const brand = app.querySelector('#brand');
  const slot = app.querySelector('#peekSlot');
  bindPeek(brand, slot);
  bindKickerToggle(brand, (on) => app.querySelector('.tab-dot')?.classList.toggle('show', on));
  // Skjult: hold 3 sek. på »Indstillinger« = nulstil alt
  const gear = app.querySelector('#settingsBtn');
  onLongPress(gear, 3000, () => {
    resetAll();
    gear.classList.add('flash');
    setTimeout(() => renderMyPage(app), 400);
  });
}

export function renderLoans(app) {
  const st = getState();
  app.innerHTML = page('/min-side', header({ title: 'Lån', back: '/min-side' }), `
    <div class="quota card">
      <div class="quota-row"><span>E-bøger lånt denne måned</span><strong>0 af 5</strong></div>
      <div class="quota-bar"><span style="width:0%"></span></div>
      <p class="quota-note"><span class="blue-dot"></span>Blå titler tæller ikke med i din kvote.</p>
    </div>
    ${sortBar(BOOKS.length, 'lån')}
    <ul class="loans">${sorted(st.sort).map((b) => loanItem(b)).join('')}</ul>`);
  bindHeader(app);
  bindSort(app, () => renderLoans(app));
}

export function renderSimpleList(app, kind) {
  const conf = {
    reserveringer: ['Reserveringer', icon.reserve, 'Du har ingen reserveringer', 'Når du reserverer en titel, der er udlånt, kan du følge den her.'],
    huskeliste: ['Huskeliste', icon.heart, 'Din huskeliste er tom', 'Tryk på hjertet ved en titel for at gemme den til senere.'],
    historik: ['Lånehistorik', icon.history, '', ''],
  }[kind];
  let inner;
  if (kind === 'historik') {
    const old = ['fyrtojet', 'klods-hans', 'hyrdinden-og-skorstensfejeren', 'prinsessen-paa-aerten']
      .map((id) => BOOKS.find((b) => b.id === id)).filter(Boolean);
    inner = `<p class="fine">Viser de seneste ${HISTORY_COUNT} lån.</p><ul class="loans">${old.map((b) => `
      <li><a class="loan" href="/bog/${b.id}" data-link><div class="cover">${coverSVG(b)}</div>
      <div class="meta"><h3>${esc(b.title)}</h3><p class="author">${esc(b.author)}</p>
      <div class="type">${icon.ebook}<span>E-bog</span></div><p class="due">Lånt ${numDate(bookState(b.id).loanedAt)}</p></div></a></li>`).join('')}</ul>`;
  } else {
    inner = `<div class="empty">${conf[1]}<h3>${conf[2]}</h3><p>${conf[3]}</p></div>`;
  }
  app.innerHTML = page('/min-side', header({ title: conf[0], back: '/min-side' }), inner);
  bindHeader(app);
}

// ---------- Mere ----------
export function renderMore(app) {
  const rows = [
    [icon.info, 'Om eReolen'],
    [icon.help, 'Hjælp og vejledning'],
    [icon.mail, 'Kontakt biblioteket'],
    [icon.bell, 'Notifikationer'],
    [icon.lock, 'Privatlivspolitik'],
    [icon.access, 'Tilgængelighedserklæring'],
    [icon.logout, 'Log ud'],
  ];
  app.innerHTML = page('/mere', header({ title: 'Mere' }), `
    <ul class="mp-list plain">${rows.map(([i, t]) => `<li><button>${i}<span>${t}</span>${icon.chevron}</button></li>`).join('')}</ul>
    <p class="fine center">eReolen · version 4.12.1</p>`);
  bindHeader(app);
}

// ---------- Bogside ----------
export function renderBook(app, book) {
  markOpened(book.id);
  const s = bookState(book.id);
  const pct = percent(book, s.page);
  const left = daysLeft(s.dueAt);
  const firstForord = book.pages[0].blocks.find((b) => b.p)?.p || '';
  const readLabel = !s.started ? 'Læs' : pct >= 100 ? 'Læs igen' : 'Fortsæt læsning';
  const readHref = pct >= 100 ? `/bog/${book.id}/laes?side=1` : `/bog/${book.id}/laes`;
  app.innerHTML = `
  <div class="shell sub">
    <header class="hdr hdr-small">
      <a class="hdr-back" href="/laes-lyt" data-link data-back aria-label="Tilbage">${icon.back}</a>
      <div class="brand" id="brand"><h1 class="hdr-title">E-bog</h1><span class="peek-slot" id="peekSlot"></span></div>
      <button class="hdr-back" aria-label="Del">${icon.share}</button>
    </header>
    <main class="content book-page">
      <div class="book-hero">
        <div class="cover big">${coverSVG(book)}</div>
        <h1>${esc(book.title)}</h1>
        <p class="author">${esc(book.author)}</p>
        <div class="type center">${icon.ebook}<span>E-bog</span><span class="blue-badge">Blå titel</span></div>
      </div>
      <a class="btn primary" href="${readHref}" data-link>${readLabel}</a>
      ${s.started && pct < 100 ? `<div class="read-progress"><div class="bar"><span style="width:${pct}%"></span></div><span>Side ${s.page + 1} af ${book.pages.length} · ${pct} %</span></div>` : ''}
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
          <div><dt>Sider</dt><dd>${book.pages.length}</dd></div>
          <div><dt>Sprog</dt><dd>Dansk</dd></div>
          <div><dt>Format</dt><dd>E-bog (EPUB)</dd></div>
          <div><dt>Forlag</dt><dd>Danske Klassikere</dd></div>
          <div><dt>Målgruppe</dt><dd>Børn og voksne</dd></div>
        </dl>
      </section>
      <p class="fine">Blå titler kan lånes uden at tælle med i din månedlige kvote. Lånet afleveres automatisk, når lånetiden udløber.</p>
    </main>
  </div>`;
  bindHeader(app);
}
