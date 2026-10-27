// Forsider: rigtige omslag (icons/covers/<id>.jpg) – tegnet SVG som reserve.
const PHOTO = new Set(['fyrtojet', 'grantraeet', 'klods-hans', 'lille-claus-og-store-claus', 'nattergalen', 'ole-lukoje', 'prinsessen-paa-aerten', 'snedronningen', 'tommelise']);
const C = {
  'anne-lisbeth': { bg: '#1f3b4d', fg: '#efe4cc', ac: '#86b0c0', style: 'band', motif: 'waves' },
  'bedstemoder': { bg: '#efe6da', fg: '#5a2a2a', ac: '#b5485d', style: 'frame', motif: 'rose' },
  'dyndkongens-datter': { bg: '#2e3b2a', fg: '#ece4c6', ac: '#c9a54a', style: 'full', motif: 'lily' },
  'elverhoj': { bg: '#22223b', fg: '#f2e9e4', ac: '#b8a9c9', style: 'full', motif: 'hill' },
  'fyrtojet': { bg: '#b23a1e', fg: '#fff4e0', ac: '#ffd28a', style: 'band', motif: 'eyes' },
  'grantraeet': { bg: '#0f4c3a', fg: '#f4efe1', ac: '#e0b84f', style: 'full', motif: 'tree' },
  'hyrdinden-og-skorstensfejeren': { bg: '#f3efe7', fg: '#26364a', ac: '#5b7db1', style: 'frame', motif: 'roof' },
  'ib-og-lille-christine': { bg: '#c9b37e', fg: '#2b2416', ac: '#6b4f2a', style: 'band', motif: 'nuts' },
  'klods-hans': { bg: '#e9a23b', fg: '#2a1a0a', ac: '#7a4e16', style: 'full', motif: 'crown' },
  'lille-claus-og-store-claus': { bg: '#4a5d23', fg: '#f5f0dc', ac: '#d9c27a', style: 'band', motif: 'horses' },
  'nattergalen': { bg: '#0d1b2a', fg: '#f1e3c6', ac: '#d4a373', style: 'full', motif: 'bird' },
  'ole-lukoje': { bg: '#3c2a5d', fg: '#f6edff', ac: '#f2c14e', style: 'full', motif: 'umbrella' },
  'prinsessen-paa-aerten': { bg: '#f6d9d6', fg: '#5b1f3a', ac: '#6fa354', style: 'frame', motif: 'pea' },
  'rejsekammeraten': { bg: '#d9cbb0', fg: '#2f2a24', ac: '#8c5e3c', style: 'band', motif: 'road' },
  'snedronningen': { bg: '#dcecf6', fg: '#183a5a', ac: '#4f95c8', style: 'full', motif: 'flake' },
  'tommelise': { bg: '#fbe3c8', fg: '#6b2737', ac: '#e0607e', style: 'frame', motif: 'tulip' },
  'vanddraaben': { bg: '#e3f1ed', fg: '#14453d', ac: '#3aa18e', style: 'band', motif: 'drop' },
};

// Motiver, centreret omkring (100, cy)
const M = {
  waves: (c, y) => [0, 1, 2, 3].map((i) =>
    `<path d="M30 ${y - 20 + i * 14} q17.5 -10 35 0 t35 0 t35 0 t35 0" fill="none" stroke="${i === 1 ? c.fg : c.ac}" stroke-width="3" stroke-linecap="round" opacity="${1 - i * 0.18}"/>`).join('') +
    `<circle cx="140" cy="${y - 48}" r="12" fill="${c.fg}" opacity=".9"/>`,
  rose: (c, y) => `<path d="M100 ${y + 50} C 98 ${y + 20} 102 ${y + 10} 100 ${y - 5}" stroke="#5d7a4a" stroke-width="3" fill="none"/>
    <path d="M100 ${y + 22} q-22 -4 -26 -18 q18 0 26 14z" fill="#6f8f57"/>
    <circle cx="100" cy="${y - 22}" r="22" fill="${c.ac}"/>
    <path d="M100 ${y - 22} m-12 0 a12 12 0 1 1 12 12 a7 7 0 1 1 -7 -7" fill="none" stroke="${c.fg}" stroke-width="2.5" opacity=".7"/>`,
  lily: (c, y) => `<ellipse cx="100" cy="${y + 22}" rx="58" ry="10" fill="${c.ac}" opacity=".35"/>
    <path d="M100 ${y + 18} l-26 -30 l18 6 l8 -26 l8 26 l18 -6z" fill="${c.fg}"/>
    <path d="M100 ${y + 18} l-40 -12 l20 -4 M100 ${y + 18} l40 -12 l-20 -4" stroke="${c.ac}" stroke-width="3" fill="none"/>
    <circle cx="100" cy="${y - 2}" r="5" fill="${c.ac}"/>`,
  hill: (c, y) => `<circle cx="132" cy="${y - 40}" r="16" fill="${c.fg}"/><circle cx="138" cy="${y - 44}" r="14" fill="${c.bg}"/>
    <path d="M20 ${y + 40} Q100 ${y - 40} 180 ${y + 40}z" fill="${c.ac}" opacity=".85"/>
    ${[70, 88, 106, 124].map((x, i) => `<circle cx="${x}" cy="${y + 4 - (i % 2) * 8}" r="3" fill="${c.fg}"/>`).join('')}`,
  eyes: (c, y) => [[-52, 9], [0, 15], [55, 24]].map(([dx, r]) =>
    `<g transform="translate(${100 + dx} ${y})"><circle cx="${-r * 0.9}" r="${r * 0.62}" fill="${c.fg}"/><circle cx="${r * 0.9}" r="${r * 0.62}" fill="${c.fg}"/><circle cx="${-r * 0.9}" r="${r * 0.28}" fill="${c.bg}"/><circle cx="${r * 0.9}" r="${r * 0.28}" fill="${c.bg}"/></g>`).join(''),
  tree: (c, y) => `<path d="M100 ${y - 58} l-24 34 h12 l-22 30 h14 l-24 32 h88 l-24 -32 h14 l-22 -30 h12z" fill="${c.fg}" opacity=".95"/>
    <rect x="94" y="${y + 38}" width="12" height="14" fill="${c.ac}"/>
    <path d="M100 ${y - 72} l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1z" fill="${c.ac}"/>`,
  roof: (c, y) => `<path d="M30 ${y + 40} L100 ${y - 20} L170 ${y + 40}" fill="none" stroke="${c.fg}" stroke-width="3"/>
    <rect x="124" y="${y - 30}" width="16" height="34" fill="${c.ac}"/>
    <circle cx="70" cy="${y - 40}" r="2" fill="${c.fg}"/><circle cx="160" cy="${y - 52}" r="2" fill="${c.fg}"/><circle cx="42" cy="${y - 20}" r="1.6" fill="${c.fg}"/>
    <path d="M132 ${y - 36} q-6 -14 4 -24 q10 -10 2 -24" fill="none" stroke="${c.fg}" stroke-width="2" opacity=".45"/>`,
  nuts: (c, y) => [[-34, 0], [0, -14], [34, 0]].map(([dx, dy]) =>
    `<g transform="translate(${100 + dx} ${y + dy})"><ellipse rx="15" ry="18" fill="${c.ac}"/><path d="M-15 -4 q15 -14 30 0" fill="${c.fg}"/></g>`).join(''),
  crown: (c, y) => `<path d="M60 ${y + 24} l-6 -46 l24 22 l22 -34 l22 34 l24 -22 l-6 46z" fill="${c.fg}"/>
    <rect x="60" y="${y + 24}" width="80" height="10" fill="${c.ac}"/>
    <circle cx="100" cy="${y + 4}" r="5" fill="${c.bg}"/>`,
  horses: (c, y) => [0, 1, 2, 3, 4].map((i) =>
    `<rect x="${42 + i * 24}" y="${y - (i === 2 ? 30 : 18)}" width="${i === 2 ? 14 : 10}" height="${i === 2 ? 56 : 40}" rx="5" fill="${i === 2 ? c.ac : c.fg}" opacity="${i === 2 ? 1 : 0.85}"/>`).join(''),
  bird: (c, y) => `<circle cx="100" cy="${y - 4}" r="44" fill="${c.ac}" opacity=".18"/>
    <path d="M70 ${y + 8} q20 -30 52 -18 l14 -6 l-6 12 q-2 26 -34 26 q-14 0 -26 -14z" fill="${c.fg}"/>
    <path d="M86 ${y + 2} q14 -18 30 -4" fill="none" stroke="${c.bg}" stroke-width="3"/>
    <circle cx="124" cy="${y - 13}" r="2.4" fill="${c.bg}"/>
    <path d="M60 ${y + 34} h80" stroke="${c.ac}" stroke-width="3" stroke-linecap="round"/>`,
  umbrella: (c, y) => `<path d="M48 ${y} A52 52 0 0 1 152 ${y} q-13 -10 -26 0 q-13 -10 -26 0 q-13 -10 -26 0 q-13 -10 -26 0z" fill="${c.ac}"/>
    <path d="M100 ${y} v40 q0 10 -10 10 q-8 0 -8 -8" fill="none" stroke="${c.fg}" stroke-width="3" stroke-linecap="round"/>
    ${[[40, -50], [160, -40], [60, -70], [140, -72]].map(([x, dy]) => `<circle cx="${x}" cy="${y + dy}" r="2" fill="${c.fg}"/>`).join('')}`,
  pea: (c, y) => [0, 1, 2, 3, 4, 5].map((i) =>
    `<rect x="${52 + (i % 2) * 3}" y="${y - 40 + i * 11}" width="94" height="9" rx="4" fill="${['#e6b3b8', '#c9d7ee', '#f1dca7', '#d6c1e6', '#bfe0cf', '#f0c3a8'][i]}"/>`).join('') +
    `<circle cx="100" cy="${y + 34}" r="8" fill="${c.ac}"/>`,
  road: (c, y) => `<path d="M100 ${y - 40} L60 ${y + 46} H140z" fill="${c.ac}" opacity=".55"/>
    <path d="M100 ${y - 34} v14 M100 ${y - 10} v16 M100 ${y + 16} v20" stroke="${c.fg}" stroke-width="3"/>
    <path d="M100 ${y - 66} l5 11 l12 1 l-9 8 l3 12 l-11 -7 l-11 7 l3 -12 l-9 -8 l12 -1z" fill="${c.fg}"/>`,
  flake: (c, y) => {
    let s = '';
    for (let i = 0; i < 6; i++) {
      s += `<g transform="rotate(${i * 60} 100 ${y})"><path d="M100 ${y} v-48 M100 ${y - 30} l-11 -11 M100 ${y - 30} l11 -11 M100 ${y - 16} l-8 -8 M100 ${y - 16} l8 -8" stroke="${c.ac}" stroke-width="3.2" stroke-linecap="round" fill="none"/></g>`;
    }
    return s + `<circle cx="100" cy="${y}" r="5" fill="${c.fg}"/>`;
  },
  tulip: (c, y) => `<path d="M100 ${y + 50} v-40" stroke="#5f8a4f" stroke-width="3"/>
    <path d="M100 ${y + 30} q-24 -6 -26 -24 q20 2 26 20z" fill="#6f9a5c"/>
    <path d="M76 ${y - 30} q0 34 24 38 q24 -4 24 -38 l-12 12 l-12 -18 l-12 18z" fill="${c.ac}"/>
    <circle cx="100" cy="${y - 10}" r="3" fill="${c.fg}"/>`,
  drop: (c, y) => `<path d="M100 ${y - 50} C 80 ${y - 20} 70 ${y} 70 ${y + 14} a30 30 0 0 0 60 0 C 130 ${y} 120 ${y - 20} 100 ${y - 50}z" fill="${c.ac}"/>
    <circle cx="92" cy="${y + 10}" r="18" fill="none" stroke="${c.fg}" stroke-width="3"/>
    <path d="M105 ${y + 23} l16 16" stroke="${c.fg}" stroke-width="5" stroke-linecap="round"/>
    ${[[86, 6], [96, 14], [90, 16]].map(([x, dy]) => `<circle cx="${x}" cy="${y + dy}" r="2" fill="${c.fg}"/>`).join('')}`,
};

function lines(title, max) {
  const words = title.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function titleText(title, y, color, size, anchor = 'middle', x = 100) {
  const ls = lines(title, size > 22 ? 11 : 14);
  const fs = ls.length > 2 ? size * 0.78 : size;
  return ls.map((l, i) =>
    `<text x="${x}" y="${y + i * fs * 1.12}" fill="${color}" font-family="Georgia, 'Times New Roman', serif" font-size="${fs}" font-weight="700" text-anchor="${anchor}">${esc(l)}</text>`).join('');
}

const author = (y, color, x = 100, anchor = 'middle') =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="Helvetica, Arial, sans-serif" font-size="9.5" letter-spacing="2.4" text-anchor="${anchor}">H.C. ANDERSEN</text>`;

export function coverSVG(book) {
  if (PHOTO.has(book.id)) return `<img src="/icons/covers/${book.id}.jpg" alt="" decoding="async" draggable="false">`;
  const c = C[book.id] || { bg: '#444', fg: '#fff', ac: '#aaa', style: 'full', motif: 'flake' };
  const motif = M[c.motif];
  let body = '';
  if (c.style === 'full') {
    body = `<rect width="200" height="300" fill="${c.bg}"/>${author(34, c.fg)}
      <line x1="80" y1="44" x2="120" y2="44" stroke="${c.ac}" stroke-width="1.5"/>
      ${motif(c, 140)}${titleText(book.title, 232, c.fg, 24)}`;
  } else if (c.style === 'band') {
    body = `<rect width="200" height="300" fill="${c.bg}"/>${motif(c, 104)}
      <rect y="186" width="200" height="114" fill="${c.fg}"/>
      ${titleText(book.title, 222, c.bg, 22)}${author(282, c.bg)}`;
  } else {
    body = `<rect width="200" height="300" fill="${c.bg}"/>
      <rect x="10" y="10" width="180" height="280" fill="none" stroke="${c.fg}" stroke-width="1.5"/>
      <rect x="15" y="15" width="170" height="270" fill="none" stroke="${c.fg}" stroke-width=".6"/>
      ${author(44, c.fg)}${titleText(book.title, 80, c.fg, 22)}${motif(c, 200)}`;
  }
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(book.title)}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}
