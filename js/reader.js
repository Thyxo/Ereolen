// Læseren: teksten deles op, så hver side fylder præcis én skærm (som i en
// rigtig e-bogslæser). Swipe eller tryk i siderne for at bladre.
import { esc } from './ui.js';
import { getState, bookState, setPosition, markOpened, toggleBookmark, updateSettings } from './state.js';
import { kickerParagraph, bindPeek } from './secret.js';
import { buildFlow, pieceStart, segStarts } from './flow.js';

const FONTS = [
  { id: 'times', label: 'Times' },
  { id: 'georgia', label: 'Georgia' },
  { id: 'palatino', label: 'Palatino' },
  { id: 'sans', label: 'System' },
];
const THEMES = [
  { id: 'light', label: 'Lys' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'dark', label: 'Mørk' },
];
const SIZES = [14, 15, 16, 17, 18, 20, 22, 24];
const HEADS = new Set(['sec', 'title', 'by', 'h', 'sub']);

const mi = (name, cls = '') => `<i class="ico ${cls}" style="--m:url(/icons/ui/${name}.png)" aria-hidden="true"></i>`;

let active = null; // { el, cleanup }

function pieceHTML(flow, it) {
  const b = flow[it.i];
  switch (b.t) {
    case 'sec': return `<h1 class="sec-title">${esc(b.x)}</h1>`;
    case 'title': return `<h1 class="book-title">${esc(b.x)}</h1>`;
    case 'by': return `<p class="book-by">${esc(b.x)}</p>`;
    case 'h': return `<h2 class="chap">${esc(b.x)}</h2>`;
    case 'sub': return `<p class="chap-sub">${esc(b.x)}</p>`;
    case 'sep': return `<p class="sep">*&nbsp;&nbsp;&nbsp;*&nbsp;&nbsp;&nbsp;*</p>`;
    default: {
      const words = b.w || (b.w = b.x.split(' '));
      const text = words.slice(it.from, it.to).join(' ');
      return `<p class="${it.from > 0 || b.noind ? 'noind' : ''}">${esc(text)}</p>`;
    }
  }
}

// Deler strømmen op i skærmsider ved at måle i et skjult element.
function paginate(flow, m, H) {
  const pages = [];
  let cur = [];
  m.innerHTML = '';
  const fits = () => m.offsetHeight <= H;
  const add = (it) => {
    m.insertAdjacentHTML('beforeend', pieceHTML(flow, it));
    return m.lastElementChild;
  };
  const flush = () => {
    // en overskrift må ikke stå alene nederst på en side
    const carry = [];
    while (cur.length > 1 && HEADS.has(flow[cur[cur.length - 1].i].t)) carry.unshift(cur.pop());
    if (cur.length) pages.push(cur);
    cur = [];
    m.innerHTML = '';
    for (const it of carry) {
      add(it);
      cur.push(it);
    }
  };

  let seg = flow[0]?.seg;
  for (let i = 0; i < flow.length; i++) {
    const b = flow[i];
    // hver skrevet side begynder på en ny skærm
    if (b.seg !== seg) {
      if (cur.length) flush();
      seg = b.seg;
    }
    if (b.t !== 'p') {
      if (b.t === 'sep' && !cur.length) continue;
      const el = add({ i });
      if (!fits()) {
        el.remove();
        flush();
        if (b.t === 'sep') continue;
        add({ i });
      }
      cur.push({ i });
      continue;
    }
    const words = b.w || (b.w = b.x.split(' '));
    let from = 0;
    while (from < words.length) {
      const it = { i, from, to: words.length };
      const el = add(it);
      if (fits()) {
        cur.push(it);
        break;
      }
      let lo = 0;
      let hi = words.length - from;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        el.textContent = words.slice(from, from + mid).join(' ');
        if (fits()) lo = mid;
        else hi = mid;
      }
      // Under en linje plads tilbage: start afsnittet på næste side
      if ((lo < 7 && from === 0 && cur.length) || lo === 0) {
        el.remove();
        if (!cur.length) lo = 1;
        else {
          flush();
          continue;
        }
      }
      el.textContent = words.slice(from, from + lo).join(' ');
      cur.push({ i, from, to: from + lo });
      from += lo;
      flush();
    }
  }
  if (cur.length) pages.push(cur);
  return pages.map((items) => ({ items, start: pieceStart(flow, items[0]), seg: flow[items[0].i].seg }));
}

// ---------- åbn / luk ----------
export function openReader(root, book, startIndex, onClose) {
  closeReaderNow();
  markOpened(book.id);
  const st = getState().settings;
  const el = document.createElement('div');
  el.className = `reader theme-${st.theme} font-${st.font}`;
  el.style.setProperty('--fs', `${st.fontSize}px`);
  el.innerHTML = `
    <header class="r-top">
      <button class="r-btn" data-act="close" aria-label="Luk">${mi('r-close', 'r-close')}</button>
      <span></span>
      <button class="r-btn" data-act="aa" aria-label="Skrift og visning">${mi('r-aa', 'r-aa')}</button>
    </header>
    <div class="pager">
      <div class="track"><section class="pg"></section><section class="pg"></section><section class="pg"></section></div>
    </div>
    <footer class="r-bottom">
      <button class="r-btn" data-act="toc" aria-label="Indhold">${mi('r-toc', 'r-toc')}</button>
      <div class="r-slider">
        <span class="r-label" id="pageNo"></span>
        <div class="r-hit"><div class="r-track"><span class="r-fill"></span><span class="r-knob"></span></div></div>
      </div>
      <button class="r-btn" data-act="bm" aria-label="Bogmærke">${mi('r-bookmark', 'r-bm-off')}${mi('r-bookmark-on', 'r-bm-on')}</button>
    </footer>
    <div class="pg-measure" aria-hidden="true"><div class="pg-text"></div></div>
    <div class="sheet" hidden><div class="sheet-backdrop"></div><div class="sheet-panel"></div></div>`;
  root.appendChild(el);
  document.body.classList.add('reading');
  setThemeColor(st.theme);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));

  const pager = el.querySelector('.pager');
  const track = el.querySelector('.track');
  const panels = [...track.children];
  const measure = el.querySelector('.pg-measure');
  const mText = measure.querySelector('.pg-text');
  const bmBtn = el.querySelector('[data-act="bm"]');
  const label = el.querySelector('#pageNo');
  const rTrack = el.querySelector('.r-track');
  const rHit = el.querySelector('.r-hit');
  const sheet = el.querySelector('.sheet');
  const sheetPanel = el.querySelector('.sheet-panel');

  let flow = [];
  let pages = [];
  let cur = 0;
  let pos = null; // tegn-position, der skal bevares ved ny opdeling

  if (startIndex == null) {
    const s = bookState(book.id);
    pos = s.pos ?? segStarts(book)[s.page] ?? 0;
  }

  function layout() {
    flow = buildFlow(book, kickerParagraph(book));
    // den plads, teksten har på én skærm
    measure.style.width = `${pager.clientWidth}px`;
    mText.innerHTML = '';
    const H = Math.max(120, Math.floor(pager.clientHeight - 8 - 10));
    el.style.setProperty('--th', `${H}px`);
    pages = paginate(flow, mText, H);
    if (pos != null) {
      cur = 0;
      for (let k = 0; k < pages.length; k++) if (pages[k].start <= pos) cur = k;
    } else {
      cur = Math.max(0, Math.min(pages.length - 1, startIndex));
    }
    render();
  }

  function pageHTML(k) {
    if (k < 0 || k >= pages.length) return '';
    const p = pages[k];
    const end = pages[k + 1] ? pages[k + 1].start : Infinity;
    const marked = bookState(book.id).bookmarks.some((x) => x >= p.start && x < end);
    return `<div class="pg-text">${p.items.map((it) => pieceHTML(flow, it)).join('')}</div>
      <span class="ribbon ${marked ? 'show' : ''}"></span>`;
  }

  function isMarked(k) {
    const p = pages[k];
    const end = pages[k + 1] ? pages[k + 1].start : Infinity;
    return bookState(book.id).bookmarks.some((x) => x >= p.start && x < end);
  }

  function setSlider(k) {
    const n = pages.length;
    const f = n > 1 ? k / (n - 1) : 1;
    rTrack.style.setProperty('--f', f);
    label.textContent = `${k + 1} af ${n}`;
  }

  function render() {
    panels[0].innerHTML = pageHTML(cur - 1);
    panels[1].innerHTML = pageHTML(cur);
    panels[2].innerHTML = pageHTML(cur + 1);
    track.style.transition = 'none';
    track.style.transform = 'translateX(-33.3333%)';
    setSlider(cur);
    bmBtn.classList.toggle('on', isMarked(cur));
    const p = pages[cur];
    pos = p.start;
    const seg = cur === pages.length - 1 ? book.pages.length - 1 : p.seg;
    setPosition(book.id, seg, p.start);
    history.replaceState(history.state, '', `/bog/${book.id}/laes?side=${cur + 1}`);
  }

  function go(delta) {
    const next = cur + delta;
    if (next < 0 || next >= pages.length) return bounce(delta);
    track.style.transition = 'transform .26s cubic-bezier(.2,.7,.2,1)';
    track.style.transform = `translateX(${delta > 0 ? '-66.6667%' : '0%'})`;
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      cur = next;
      render();
    };
    track.addEventListener('transitionend', fin, { once: true });
    setTimeout(fin, 320);
  }

  function bounce(delta) {
    track.style.transition = 'transform .16s ease';
    track.style.transform = `translateX(calc(-33.3333% + ${delta > 0 ? -22 : 22}px))`;
    setTimeout(() => { track.style.transform = 'translateX(-33.3333%)'; }, 160);
  }

  function jump(k) {
    cur = Math.max(0, Math.min(pages.length - 1, k));
    render();
  }

  // ---------- swipe og tryk ----------
  let sx = 0, sy = 0, dx = 0, axis = null, down = false, t0 = 0;
  pager.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true; sx = e.clientX; sy = e.clientY; dx = 0; axis = null; t0 = e.timeStamp;
  });
  pager.addEventListener('pointermove', (e) => {
    if (!down) return;
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
      if ((cur === 0 && dx > 0) || (cur === pages.length - 1 && dx < 0)) dx *= 0.3;
      track.style.transform = `translateX(calc(-33.3333% + ${dx}px))`;
    }
  });
  pager.addEventListener('pointerup', (e) => {
    if (!down) return;
    down = false;
    if (axis === 'x') {
      const fast = Math.abs(dx) > 30 && e.timeStamp - t0 < 260;
      const edge = (cur === 0 && dx > 0) || (cur === pages.length - 1 && dx < 0);
      if ((Math.abs(dx) > pager.clientWidth * 0.18 || fast) && !edge) go(dx < 0 ? 1 : -1);
      else {
        track.style.transition = 'transform .2s ease';
        track.style.transform = 'translateX(-33.3333%)';
      }
    } else if (!axis) {
      const x = (e.clientX - pager.getBoundingClientRect().left) / pager.clientWidth;
      if (x < 0.3) go(-1);
      else if (x > 0.7) go(1);
    }
    axis = null;
  });
  pager.addEventListener('pointercancel', () => {
    down = false;
    axis = null;
    track.style.transition = 'transform .2s ease';
    track.style.transform = 'translateX(-33.3333%)';
  });

  // slider
  let dragging = false;
  const sliderTo = (e) => {
    const r = rTrack.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    return Math.round(f * (pages.length - 1));
  };
  rHit.addEventListener('pointerdown', (e) => {
    dragging = true;
    try { rHit.setPointerCapture(e.pointerId); } catch { /* ok */ }
    setSlider(sliderTo(e));
  });
  rHit.addEventListener('pointermove', (e) => { if (dragging) setSlider(sliderTo(e)); });
  rHit.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    jump(sliderTo(e));
  });

  const onKey = (e) => {
    if (!sheet.hidden) { if (e.key === 'Escape') closeSheet(); return; }
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', onKey);
  let rt = null;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(layout, 150); };
  window.addEventListener('resize', onResize);

  // knapper
  el.querySelector('[data-act="close"]').addEventListener('click', () => onClose());
  el.querySelector('[data-act="aa"]').addEventListener('click', openAa);
  el.querySelector('[data-act="toc"]').addEventListener('click', openToc);
  bmBtn.addEventListener('click', () => {
    const p = pages[cur];
    const end = pages[cur + 1] ? pages[cur + 1].start : Infinity;
    toggleBookmark(book.id, p.start, end);
    render();
  });
  sheet.querySelector('.sheet-backdrop').addEventListener('click', closeSheet);

  // Skjult: dobbelttryk på »x af y« viser ordet
  bindPeek(label);

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
    el.className = `reader theme-${s.theme} font-${s.font} open`;
    el.style.setProperty('--fs', `${s.fontSize}px`);
    setThemeColor(s.theme);
    layout();
  }

  function openAa() {
    const s = getState().settings;
    const idx = Math.max(0, SIZES.indexOf(s.fontSize));
    openSheet(`
      <div class="aa-size">
        <button data-fs="-1" aria-label="Mindre skrift"><small>A</small></button>
        <div class="aa-steps">${SIZES.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
        <button data-fs="1" aria-label="Større skrift">A</button>
      </div>
      <div class="aa-fonts">${FONTS.map((f) => `<button data-font="${f.id}" class="font-${f.id} ${s.font === f.id ? 'on' : ''}">${f.label}</button>`).join('')}</div>
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

  function pageOf(predicate) {
    for (let k = 0; k < pages.length; k++) if (pages[k].items.some((it) => predicate(flow[it.i]))) return k;
    return 0;
  }

  function openToc() {
    const chapters = [
      { label: 'Forord', page: 0 },
      { label: book.title, page: pageOf((b) => b.t === 'title') },
    ];
    flow.forEach((b) => { if (b.t === 'h') chapters.push({ label: b.x, page: pageOf((x) => x === b), sub: true }); });
    const marks = bookState(book.id).bookmarks.map((x) => {
      let k = 0;
      for (let j = 0; j < pages.length; j++) if (pages[j].start <= x) k = j;
      return k;
    });
    const snippet = (k) => {
      const it = pages[k].items.find((x) => flow[x.i].t === 'p');
      const t = it ? (flow[it.i].w || flow[it.i].x.split(' ')).slice(it.from, it.from + 14).join(' ') : '';
      return esc(t) + '…';
    };
    openSheet(`
      <h3>Indhold</h3>
      <ul class="toc">${chapters.map((c) => `<li><button data-page="${c.page}" class="${c.sub ? 'sub' : ''}"><span>${esc(c.label)}</span><span class="pn">${c.page + 1}</span></button></li>`).join('')}</ul>
      <h3>Bogmærker</h3>
      ${marks.length ? `<ul class="toc marks">${[...new Set(marks)].map((k) => `<li><button data-page="${k}">${mi('r-bookmark-on', 'toc-bm')}<span><b>Side ${k + 1}</b><small>${snippet(k)}</small></span></button></li>`).join('')}</ul>`
        : `<p class="toc-empty">Du har ingen bogmærker i denne bog.</p>`}
    `);
    sheetPanel.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => {
      jump(Number(b.dataset.page));
      closeSheet();
    }));
  }

  // Vent til skrifterne er klar, så målingen passer
  const start = () => requestAnimationFrame(layout);
  if (document.fonts?.ready) document.fonts.ready.then(start);
  else start();

  const cleanup = () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
  active = { el, cleanup };
}

// Luk med animation (glider ned)
export function closeReader() {
  if (!active) return;
  const { el, cleanup } = active;
  active = null;
  cleanup();
  document.body.classList.remove('reading');
  setThemeColor('app');
  el.classList.remove('open');
  setTimeout(() => el.remove(), 320);
}

function closeReaderNow() {
  if (!active) return;
  active.cleanup();
  active.el.remove();
  active = null;
}

export function readerOpen() {
  return !!active;
}

function setThemeColor(theme) {
  const c = { light: '#ffffff', sepia: '#f5ecd9', dark: '#141414', app: '#ac0030' }[theme] || '#ac0030';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
}
