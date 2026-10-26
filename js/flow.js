// Fælles "tekststrøm" for en bog: alle afsnit i rækkefølge med en tegn-position
// (off). Positionen bruges til læsefremskridt og bogmærker, så de passer, uanset
// hvor store bogstaverne er, og hvor mange sider teksten derfor fylder.

function blockLen(b) {
  if (b.p) return b.p.length + 1;
  if (b.h) return b.h.length + 1 + (b.sub ? b.sub.length + 1 : 0);
  return 0;
}

// Startposition for hver af datafilens sider (segmenter)
export function segStarts(book) {
  if (book._segStarts) return book._segStarts;
  let off = 0;
  const arr = [];
  for (const pg of book.pages) {
    arr.push(off);
    for (const b of pg.blocks) off += blockLen(b);
  }
  book._segStarts = arr;
  book._total = off;
  return arr;
}

// Segment, som en position ligger i
export function segAt(book, pos) {
  const s = segStarts(book);
  let lo = 0;
  for (let i = 0; i < s.length; i++) if (s[i] <= pos) lo = i;
  return lo;
}

// Strømmen af blokke. kicker = ekstra afsnit i forordet (eller null).
export function buildFlow(book, kicker) {
  const flow = [];
  let off = 0;
  book.pages.forEach((pg, seg) => {
    let afterHead = false;
    if (seg === 0) {
      flow.push({ t: 'sec', x: 'Forord', seg, off });
      afterHead = true;
    }
    if (seg === book.forordPages) {
      flow.push({ t: 'title', x: book.title, seg, off }, { t: 'by', x: 'af H.C. Andersen', seg, off });
      afterHead = true;
    }
    for (const b of pg.blocks) {
      if (b.h) {
        flow.push({ t: 'h', x: b.h, seg, off });
        off += b.h.length + 1;
        if (b.sub) {
          flow.push({ t: 'sub', x: b.sub, seg, off });
          off += b.sub.length + 1;
        }
        afterHead = true;
      } else if (b.sep) {
        flow.push({ t: 'sep', seg, off });
        afterHead = true;
      } else if (b.cont && flow.length && flow[flow.length - 1].t === 'p') {
        // et langt afsnit, der var delt over to datasider, samles igen
        flow[flow.length - 1].x += ' ' + b.p;
        off += b.p.length + 1;
      } else {
        flow.push({ t: 'p', x: b.p, seg, off, noind: afterHead });
        off += b.p.length + 1;
        afterHead = false;
      }
    }
  });
  if (kicker) {
    const first = flow.findIndex((b) => b.t === 'p' && b.seg === 0);
    if (first >= 0) {
      const next = flow[first + 1];
      flow.splice(first + 1, 0, { t: 'p', x: kicker, seg: 0, off: next ? next.off : off, kicker: true });
    }
  }
  return flow;
}

// Position for starten af et stykke {i, from}
export function pieceStart(flow, it) {
  const b = flow[it.i];
  if (b.t !== 'p' || !it.from || b.kicker) return b.off;
  const words = b.w || (b.w = b.x.split(' '));
  return b.off + words.slice(0, it.from).join(' ').length + 1;
}
