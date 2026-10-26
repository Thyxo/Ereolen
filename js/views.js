// Hylde, bogside, forside, søg og profil.
import { coverSVG } from './covers.js';
import { esc, icon, logo, shortDate, longDate, daysLeft } from './ui.js';
import { getState, bookState, percent, setSort, resetAll, markOpened } from './state.js';
import { bindPeek, bindKickerToggle, onLongPress } from './secret.js';

let BOOKS = [];
export function initViews(books) {
  BOOKS = books;
}

const TABS = [
  { path: '/forside', label: 'Forside', icon: icon.home },
  { path: '/soeg', label: 'Søg', icon: icon.search },
  { path: '/', label: 'Min hylde', icon: icon.shelf },
  { path: '/profil', label: 'Profil', icon: icon.user },
];

function shell(active, inner) {
  const kick = getState().kicker;
  return `
  <div class="shell">
    <header class="topbar">
      <div class="brand" id="brand">${logo()}<span class="peek-slot" id="peekSlot"></span></div>
      <div class="top-actions">
        <a class="icon-btn" href="/soeg" data-link aria-label="Søg">${icon.search}</a>
      </div>
    </header>
    <main class="content">${inner}</main>
    <nav class="tabbar">
      ${TABS.map((t) => `
        <a href="${t.path}" data-link class="tab ${t.path === active ? 'on' : ''}">
          <span class="tab-icon">${t.icon}${t.path === '/profil' ? `<i class="tab-dot ${kick ? 'show' : ''}"></i>` : ''}</span>
          <span class="tab-label">${t.label}</span>
        </a>`).join('')}
    </nav>
  </div>`;
}

function bindShell(app) {
  const brand = app.querySelector('#brand');
  bindPeek(brand, app.querySelector('#peekSlot'));
  bindKickerToggle(brand, (on) => {
    app.querySelector('.tab-dot')?.classList.toggle('show', on);
  });
}

function progressLine(book) {
  const s = bookState(book.id);
  const pct = percent(book, s.page);
  if (!s.started) return `<div class="progress muted">Ikke påbegyndt</div>`;
  if (pct >= 100) return `<div class="progress done">${icon.check}<span>Læst</span></div>`;
  return `<div class="progress"><div class="bar"><span style="width:${pct}%"></span></div><span class="pct">${pct} %</span></div>`;
}

function loanItem(book) {
  const s = bookState(book.id);
  const left = daysLeft(s.dueAt);
  return `
  <li>
    <a class="loan" href="/bog/${book.id}" data-link>
      <div class="cover">${coverSVG(book)}</div>
      <div class="meta">
        <div class="type">${icon.book}<span>E-bog</span><span class="blue-badge">Blå titel</span></div>
        <h3>${esc(book.title)}</h3>
        <p class="author">${esc(book.author)}</p>
        <p class="due ${left <= 5 ? 'soon' : ''}">Lånt til ${shortDate(s.dueAt)}</p>
        ${progressLine(book)}
      </div>
      ${s.bookmarks.length ? `<span class="bm-flag" aria-label="Bogmærke">${icon.bookmarkFill}</span>` : ''}
    </a>
  </li>`;
}

function sorted(sort) {
  const list = BOOKS.slice();
  if (sort === 'due') list.sort((a, b) => bookState(a.id).dueAt - bookState(b.id).dueAt || a.title.localeCompare(b.title, 'da'));
  else if (sort === 'recent') list.sort((a, b) => bookState(b.id).lastOpened - bookState(a.id).lastOpened);
  else list.sort((a, b) => a.title.localeCompare(b.title, 'da'));
  return list;
}

// ---------- Min hylde ----------
export function renderShelf(app, tab = 'laan') {
  const st = getState();
  let body = '';
  if (tab === 'laan') {
    body = `
      <div class="quota card">
        <div class="quota-row"><span>E-bøger lånt denne måned</span><strong>0 af 5</strong></div>
        <div class="quota-bar"><span style="width:0%"></span></div>
        <p class="quota-note"><span class="blue-dot"></span>Blå titler tæller ikke med i din kvote.</p>
      </div>
      <div class="list-toolbar">
        <span>${BOOKS.length} e-bøger</span>
        <label class="sort">Sortér
          <select id="sortSel">
            <option value="title" ${st.sort === 'title' ? 'selected' : ''}>Titel (A–Å)</option>
            <option value="due" ${st.sort === 'due' ? 'selected' : ''}>Udløbsdato</option>
            <option value="recent" ${st.sort === 'recent' ? 'selected' : ''}>Senest læst</option>
          </select>
        </label>
      </div>
      <ul class="loans">${sorted(st.sort).map(loanItem).join('')}</ul>`;
  } else {
    const txt = tab === 'res'
      ? ['Du har ingen reserveringer', 'Når du reserverer en titel, der er udlånt, kan du følge den her.']
      : ['Din huskeliste er tom', 'Tryk på hjertet ved en titel for at gemme den til senere.'];
    body = `<div class="empty">${tab === 'res' ? icon.bell : icon.heart}<h3>${txt[0]}</h3><p>${txt[1]}</p></div>`;
  }
  app.innerHTML = shell('/', `
    <h1 class="page-title" id="shelfTitle">Min hylde</h1>
    <div class="seg" role="tablist">
      <button data-tab="laan" class="${tab === 'laan' ? 'on' : ''}">Lån <span class="count">${BOOKS.length}</span></button>
      <button data-tab="res" class="${tab === 'res' ? 'on' : ''}">Reserveringer</button>
      <button data-tab="husk" class="${tab === 'husk' ? 'on' : ''}">Huskeliste</button>
    </div>
    ${body}`);
  bindShell(app);
  app.querySelectorAll('.seg button').forEach((b) =>
    b.addEventListener('click', () => renderShelf(app, b.dataset.tab)));
  app.querySelector('#sortSel')?.addEventListener('change', (e) => {
    setSort(e.target.value);
    renderShelf(app, 'laan');
  });
  // Skjult: hold 3 sek. på "Min hylde" = nulstil alt
  const title = app.querySelector('#shelfTitle');
  onLongPress(title, 3000, () => {
    resetAll();
    title.classList.add('flash');
    setTimeout(() => renderShelf(app, 'laan'), 350);
  });
}

// ---------- Bogside ----------
export function renderBook(app, book) {
  markOpened(book.id);
  const s = bookState(book.id);
  const pct = percent(book, s.page);
  const left = daysLeft(s.dueAt);
  const firstForord = book.pages[0].blocks.find((b) => b.p)?.p || '';
  const readLabel = !s.started ? 'Læs' : pct >= 100 ? 'Læs igen' : 'Fortsæt læsning';
  const readHref = pct >= 100 ? `/laes/${book.id}?side=1` : `/laes/${book.id}`;
  app.innerHTML = `
  <div class="shell sub">
    <header class="subbar">
      <a class="icon-btn" href="/" data-link data-back aria-label="Tilbage">${icon.back}</a>
      <span class="subbar-title" id="subTitle">Min hylde</span>
      <button class="icon-btn" aria-label="Del">${icon.share}</button>
    </header>
    <main class="content book-page">
      <div class="book-hero">
        <div class="cover big">${coverSVG(book)}</div>
        <div class="type center">${icon.book}<span>E-bog</span><span class="blue-badge">Blå titel</span></div>
        <h1>${esc(book.title)}</h1>
        <p class="author">${esc(book.author)}</p>
        <p class="facts-line">${book.year} · Dansk · ${book.pages.length} sider</p>
      </div>
      <a class="btn primary" href="${readHref}" data-link>${icon.book}<span>${readLabel}</span></a>
      ${s.started && pct < 100 ? `<div class="read-progress"><div class="bar"><span style="width:${pct}%"></span></div><span>Side ${s.page + 1} af ${book.pages.length} · ${pct} %</span></div>` : ''}
      <div class="loan-box card">
        <div><span class="label">Lånt til</span><strong>${longDate(s.dueAt)}</strong></div>
        <span class="days ${left <= 5 ? 'soon' : ''}">${left} ${left === 1 ? 'dag' : 'dage'} tilbage</span>
      </div>
      <section class="card forord-card">
        <h2>Forord</h2>
        <p>${esc(firstForord)}</p>
        <a href="/laes/${book.id}?side=1" data-link class="link">Læs hele forordet ${icon.chevron}</a>
      </section>
      <section class="card">
        <h2>Om e-bogen</h2>
        <dl class="facts">
          <div><dt>Forfatter</dt><dd>${esc(book.author)}</dd></div>
          <div><dt>Første udgave</dt><dd>${book.year}</dd></div>
          <div><dt>Sider</dt><dd>${book.pages.length}</dd></div>
          <div><dt>Sprog</dt><dd>Dansk</dd></div>
          <div><dt>Format</dt><dd>EPUB</dd></div>
          <div><dt>Forlag</dt><dd>Danske Klassikere</dd></div>
          <div><dt>Målgruppe</dt><dd>Børn og voksne</dd></div>
        </dl>
      </section>
      <p class="fine">Blå titler kan lånes uden at tælle med i din månedlige kvote. Lånet afleveres automatisk, når lånetiden udløber.</p>
    </main>
  </div>`;
  bindPeek(app.querySelector('#subTitle'));
}

// ---------- Forside ----------
export function renderHome(app) {
  const h = new Date().getHours();
  const greet = h < 10 ? 'Godmorgen' : h < 18 ? 'God eftermiddag' : 'Godaften';
  const recent = BOOKS.filter((b) => bookState(b.id).started && percent(b, bookState(b.id).page) < 100)
    .sort((a, b) => bookState(b.id).lastOpened - bookState(a.id).lastOpened);
  const carousel = (list) => `<div class="carousel">${list.map((b) => `
      <a class="c-item" href="/bog/${b.id}" data-link>
        <div class="cover">${coverSVG(b)}</div>
        <span class="c-title">${esc(b.title)}</span>
      </a>`).join('')}</div>`;
  app.innerHTML = shell('/forside', `
    <h1 class="page-title">${greet}</h1>
    <section class="block">
      <div class="block-head"><h2>Fortsæt hvor du slap</h2></div>
      ${carousel(recent)}
    </section>
    <section class="promo card">
      <span class="promo-kicker">Tema</span>
      <h2>Eventyr til hele familien</h2>
      <p>H.C. Andersens eventyr som blå titler – lån så mange, du vil.</p>
      <a href="/" data-link class="link">Se dine lån ${icon.chevron}</a>
    </section>
    <section class="block">
      <div class="block-head"><h2>Klassikere</h2><a href="/" data-link class="link small">Se alle</a></div>
      ${carousel(BOOKS.slice().reverse())}
    </section>`);
  bindShell(app);
}

// ---------- Søg ----------
export function renderSearch(app) {
  app.innerHTML = shell('/soeg', `
    <h1 class="page-title">Søg</h1>
    <label class="search-field">${icon.search}<input id="q" type="search" placeholder="Søg efter titel, forfatter eller emne" autocomplete="off"></label>
    <div class="chips"><button>Eventyr</button><button>H.C. Andersen</button><button>Klassikere</button><button>Lydbøger</button><button>Krimi</button></div>
    <ul class="loans" id="results"></ul>`);
  bindShell(app);
  const q = app.querySelector('#q');
  const res = app.querySelector('#results');
  const run = () => {
    const v = q.value.trim().toLowerCase();
    res.innerHTML = v ? BOOKS.filter((b) => (b.title + ' ' + b.author + ' eventyr').toLowerCase().includes(v)).map(loanItem).join('')
      || `<li class="empty small"><p>Ingen resultater for »${esc(q.value)}«</p></li>` : '';
  };
  q.addEventListener('input', run);
  app.querySelectorAll('.chips button').forEach((b) => b.addEventListener('click', () => { q.value = b.textContent; run(); }));
}

// ---------- Profil ----------
export function renderProfile(app) {
  const rows = [
    [icon.bell, 'Notifikationer'],
    [icon.gear, 'Indstillinger'],
    [icon.globe, 'Skift bibliotek'],
    [icon.help, 'Hjælp og vejledning'],
    [icon.info, 'Om eReolen'],
    [icon.logout, 'Log ud'],
  ];
  app.innerHTML = shell('/profil', `
    <h1 class="page-title">Profil</h1>
    <div class="card profile-card">
      <div class="avatar-big">${icon.user}</div>
      <div><strong>Låner</strong><p>Københavns Biblioteker</p></div>
    </div>
    <div class="card stats">
      <div><strong>${BOOKS.length}</strong><span>Lån</span></div>
      <div><strong>0</strong><span>Reserveringer</span></div>
      <div><strong>0 af 5</strong><span>Kvote</span></div>
    </div>
    <ul class="menu card">${rows.map(([i, t]) => `<li><button>${i}<span>${t}</span>${icon.chevron}</button></li>`).join('')}</ul>
    <p class="fine center">eReolen · version 4.12.1</p>`);
  bindShell(app);
}
