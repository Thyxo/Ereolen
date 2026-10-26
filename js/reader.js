// Læseskærmen: swipe for at bladre, skrift/tema, bogmærker, indhold.
import { esc, icon } from './ui.js';
import { getState, bookState, setPage, markOpened, toggleBookmark, updateSettings, percent } from './state.js';
import { glossaryFor, glossaryTitle, kickerParagraph, bindPeek } from './secret.js';

const FONTS = [
  { id: 'serif', label: 'Georgia' },
  { id: 'palatino', label: 'Palatino' },
  { id: 'sans', label: 'System' },
];
const THEMES = [
  { id: 'light', label: 'Lys' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'dark', label: 'Mørk' },
];
const SIZES = [15, 16, 17, 19, 21, 23, 26];

let cleanup = null;

export function renderReader(app, book, pageSets, startPage, onBack) {
  cleanup?.();
  markOpened(book.id);
  const n = book.pages.length;
  let cur = Math.max(0, Math.min(n - 1, startPage ?? bookState(book.id).page));
  setPage(book.id, cur);

  const st = getState().settings;
  app.innerHTML = `
  <div class="reader theme-${st.theme} font-${st.font}" style="--fs:${st.fontSize}px">
    <header class="r-top">
      <button class="icon-btn" data-act="back" aria-label="Luk bog">${icon.back}</button>
      <div class="r-title">${esc(book.title)}</div>
      <button class="icon-btn" data-act="toc" aria-label="Indhold">${icon.list}</button>
      <button class="icon-btn" data-act="aa" aria-label="Skrift og visning">${icon.aa}</button>
      <button class="icon-btn" data-act="bm" aria-label="Bogmærke"></button>
    </header>
    <div class="pager">
      <div class="track"><section class="pg"></section><section class="pg"></section><section class="pg"></section></div>
    </div>
    <footer class="r-bottom">
      <div class="r-progress"><span></span></div>
      <div class="r-foot"><span class="r-pageno" id="pageNo"></span><span class="r-pct"></span></div>
    </footer>
    <div class="sheet" hidden><div class="sheet-backdrop"></div><div class="sheet-panel"></div></div>
  </div>`;

  const root = app.querySelector('.reader');
  const pager = root.querySelector('.pager');
  const track = root.querySelector('.track');
  const panels = [...track.children];
  const bmBtn = root.querySelector('[data-act="bm"]');
  const sheet = root.querySelector('.sheet');
  const sheetPanel = root.querySelector('.sheet-panel');
  document.body.classList.add('reading');
  setThemeColor(st.theme);

  // ---------- sider ----------
  function blocksHTML(i) {
    const pg = book.pages[i];
    let blocks = pg.blocks;
    if (i === 0) {
      const k = kickerParagraph(book);
      if (k) blocks = [blocks[0], { p: k }, ...blocks.slice(1)];
    }
    let afterHead = i === book.forordPages;
    let out = '';
    if (i === 0) out += `<h1 class="sec-title">Forord</h1>`;
    if (i === book.forordPages) out += `<h1 class="book-title">${esc(book.title)}</h1><p class="book-by">af H.C. Andersen</p>`;
    for (const b of blocks) {
      if (b.h) {
        out += `<h2 class="chap">${esc(b.h)}</h2>${b.sub ? `<p class="chap-sub">${esc(b.sub)}</p>` : ''}`;
        afterHead = true;
      } else if (b.sep) {
        out += `<p class="sep">*&nbsp;&nbsp;&nbsp;*&nbsp;&nbsp;&nbsp;*</p>`;
        afterHead = true;
      } else {
        out += `<p class="${b.cont || afterHead ? 'noind' : ''}">${esc(b.p)}</p>`;
        afterHead = false;
      }
    }
    return out;
  }

  function glossaryHTML(i) {
    const items = glossaryFor(pageSets, book.id, i);
    return `
      <aside class="gloss">
        <h4>${esc(glossaryTitle())}</h4>
        <dl>${items.map((w) => `<div><dt>${esc(w.word)}</dt><dd>${esc(w.explanation)}</dd></div>`).join('')}</dl>
      </aside>`;
  }

  function pageHTML(i) {
    if (i < 0 || i >= n) return '';
    const pg = book.pages[i];
    const marked = bookState(book.id).bookmarks.includes(i);
    return `
      <div class="pg-scroll">
        <div class="pg-inner">
          <div class="pg-run"><span>${pg.section === 'forord' ? 'Forord' : esc(book.title)}</span><span>${i + 1}</span></div>
          ${blocksHTML(i)}
          ${glossaryHTML(i)}
        </div>
      </div>
      <span class="ribbon ${marked ? 'show' : ''}"></span>`;
  }

  function render() {
    panels[0].innerHTML = pageHTML(cur - 1);
    panels[1].innerHTML = pageHTML(cur);
    panels[2].innerHTML = pageHTML(cur + 1);
    panels.forEach((p) => { const s = p.querySelector('.pg-scroll'); if (s) s.scrollTop = 0; });
    track.style.transition = 'none';
    track.style.transform = 'translateX(-33.3333%)';
    const pct = percent(book, cur);
    root.querySelector('#pageNo').textContent = `Side ${cur + 1} af ${n}`;
    root.querySelector('.r-pct').textContent = `${pct} % læst`;
    root.querySelector('.r-progress span').style.width = `${Math.max(pct, 1)}%`;
    const marked = bookState(book.id).bookmarks.includes(cur);
    bmBtn.innerHTML = marked ? icon.bookmarkFill : icon.bookmark;
    bmBtn.classList.toggle('on', marked);
    setPage(book.id, cur);
    history.replaceState(history.state, '', `/bog/${book.id}/laes?side=${cur + 1}`);
  }

  function go(delta) {
    const next = cur + delta;
    if (next < 0 || next >= n) {
      bounce(delta);
      return;
    }
    track.style.transition = 'transform .28s cubic-bezier(.2,.7,.2,1)';
    track.style.transform = `translateX(${delta > 0 ? '-66.6667%' : '0%'})`;
    const done = () => {
      track.removeEventListener('transitionend', done);
      clearTimeout(t);
      cur = next;
      render();
    };
    const t = setTimeout(done, 350);
    track.addEventListener('transitionend', done);
  }

  function jump(i) {
    cur = Math.max(0, Math.min(n - 1, i));
    render();
  }

  function bounce(delta) {
    track.style.transition = 'transform .18s ease';
    track.style.transform = `translateX(calc(-33.3333% + ${delta > 0 ? -24 : 24}px))`;
    setTimeout(() => {
      track.style.transform = 'translateX(-33.3333%)';
    }, 180);
  }

  // ---------- swipe og tryk ----------
  let sx = 0, sy = 0, dx = 0, axis = null, active = false, t0 = 0;
  pager.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true;
    sx = e.clientX;
    sy = e.clientY;
    dx = 0;
    axis = null;
    t0 = e.timeStamp;
  });
  pager.addEventListener('pointermove', (e) => {
    if (!active) return;
    const mx = e.clientX - sx;
    const my = e.clientY - sy;
    if (!axis && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (axis === 'x') {
        try { pager.setPointerCapture(e.pointerId); } catch { /* ok */ }
        track.style.transition = 'none';
      }
    }
    if (axis === 'x') {
      dx = mx;
      if ((cur === 0 && dx > 0) || (cur === n - 1 && dx < 0)) dx *= 0.3;
      track.style.transform = `translateX(calc(-33.3333% + ${dx}px))`;
    }
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    if (axis === 'x') {
      const w = pager.clientWidth;
      const fast = Math.abs(dx) > 30 && e.timeStamp - t0 < 260;
      if ((Math.abs(dx) > w * 0.2 || fast) && !(cur === 0 && dx > 0) && !(cur === n - 1 && dx < 0)) {
        go(dx < 0 ? 1 : -1);
      } else {
        track.style.transition = 'transform .2s ease';
        track.style.transform = 'translateX(-33.3333%)';
      }
    } else if (!axis && e.type === 'pointerup') {
      const x = (e.clientX - pager.getBoundingClientRect().left) / pager.clientWidth;
      if (x < 0.22) go(-1);
      else if (x > 0.78) go(1);
      else root.classList.toggle('immersive');
    }
    axis = null;
  };
  pager.addEventListener('pointerup', end);
  pager.addEventListener('pointercancel', (e) => {
    if (axis === 'x') {
      track.style.transition = 'transform .2s ease';
      track.style.transform = 'translateX(-33.3333%)';
    }
    active = false;
    axis = null;
  });

  const onKey = (e) => {
    if (!sheet.hidden) {
      if (e.key === 'Escape') closeSheet();
      return;
    }
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', onKey);

  // ---------- knapper ----------
  root.querySelector('[data-act="back"]').addEventListener('click', () => onBack());
  bmBtn.addEventListener('click', () => {
    toggleBookmark(book.id, cur);
    render();
  });
  root.querySelector('[data-act="aa"]').addEventListener('click', openAa);
  root.querySelector('[data-act="toc"]').addEventListener('click', openToc);
  sheet.querySelector('.sheet-backdrop').addEventListener('click', closeSheet);

  // Skjult: dobbelttryk på sidetallet viser ordet
  bindPeek(root.querySelector('#pageNo'));

  function openSheet(html) {
    sheetPanel.innerHTML = `<div class="sheet-grab"></div>${html}`;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('open'));
  }
  function closeSheet() {
    sheet.classList.remove('open');
    setTimeout(() => { sheet.hidden = true; }, 220);
  }

  function applySettings() {
    const s = getState().settings;
    root.className = `reader theme-${s.theme} font-${s.font}${root.classList.contains('immersive') ? ' immersive' : ''}`;
    root.style.setProperty('--fs', `${s.fontSize}px`);
    setThemeColor(s.theme);
  }

  function openAa() {
    const s = getState().settings;
    const idx = SIZES.indexOf(s.fontSize) === -1 ? 3 : SIZES.indexOf(s.fontSize);
    openSheet(`
      <h3>Visning</h3>
      <div class="aa-size">
        <button data-fs="-1" aria-label="Mindre skrift"><small>A</small></button>
        <div class="aa-steps">${SIZES.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
        <button data-fs="1" aria-label="Større skrift">A</button>
      </div>
      <div class="aa-label">Skrifttype</div>
      <div class="aa-fonts">${FONTS.map((f) => `<button data-font="${f.id}" class="font-${f.id} ${s.font === f.id ? 'on' : ''}">${f.label}</button>`).join('')}</div>
      <div class="aa-label">Tema</div>
      <div class="aa-themes">${THEMES.map((t) => `<button data-theme="${t.id}" class="th-${t.id} ${s.theme === t.id ? 'on' : ''}"><span>Aa</span>${t.label}</button>`).join('')}</div>
    `);
    sheetPanel.querySelectorAll('[data-fs]').forEach((b) => b.addEventListener('click', () => {
      const i = Math.max(0, Math.min(SIZES.length - 1, idx + Number(b.dataset.fs)));
      updateSettings({ fontSize: SIZES[i] });
      applySettings();
      openAa();
    }));
    sheetPanel.querySelectorAll('[data-font]').forEach((b) => b.addEventListener('click', () => {
      updateSettings({ font: b.dataset.font });
      applySettings();
      openAa();
    }));
    sheetPanel.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
      updateSettings({ theme: b.dataset.theme });
      applySettings();
      openAa();
    }));
  }

  function openToc() {
    const chapters = [{ label: 'Forord', page: 0 }, { label: book.title, page: book.forordPages }];
    book.pages.forEach((pg, i) => pg.blocks.forEach((b) => { if (b.h) chapters.push({ label: b.h, page: i, sub: true }); }));
    const marks = bookState(book.id).bookmarks;
    const snippet = (i) => {
      const p = book.pages[i].blocks.find((b) => b.p)?.p || '';
      return esc(p.slice(0, 70)) + (p.length > 70 ? '…' : '');
    };
    openSheet(`
      <h3>Indhold</h3>
      <ul class="toc">${chapters.map((c) => `<li><button data-page="${c.page}" class="${c.sub ? 'sub' : ''} ${cur >= c.page ? 'past' : ''}"><span>${esc(c.label)}</span><span class="pn">${c.page + 1}</span></button></li>`).join('')}</ul>
      <h3>Bogmærker</h3>
      ${marks.length ? `<ul class="toc marks">${marks.map((m) => `<li><button data-page="${m}">${icon.bookmarkFill}<span><b>Side ${m + 1}</b><small>${snippet(m)}</small></span></button></li>`).join('')}</ul>`
        : `<p class="toc-empty">Tryk på ${icon.bookmark} for at sætte et bogmærke.</p>`}
    `);
    sheetPanel.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => {
      jump(Number(b.dataset.page));
      closeSheet();
    }));
  }

  render();

  cleanup = () => {
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('reading');
    setThemeColor('app');
    cleanup = null;
  };
  return cleanup;
}

export function closeReader() {
  cleanup?.();
}

function setThemeColor(theme) {
  const c = { light: '#ffffff', sepia: '#f5ecd9', dark: '#141414', app: '#a60033' }[theme] || '#a60033';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
}
