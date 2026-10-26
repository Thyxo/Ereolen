// Små hjælpere og ikoner.
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

export function shortDate(ts) {
  const d = new Date(ts);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

export function numDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function longDate(ts) {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()].replace('.', '')} ${d.getFullYear()}`;
}

export function daysLeft(ts) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((ts - now.getTime()) / 86400000);
}

// Ikoner klippet ud af skærmbilleder af den rigtige app (icons/ui). Farven
// styres med currentColor via CSS-mask.
const m = (name, cls = '') => `<i class="ico ico-${name} ${cls}" style="--m:url(/icons/ui/${name}.png)" aria-hidden="true"></i>`;

const svg = (p, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;

export const icon = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: m('tab-search'),
  home: m('tab-home'),
  homeFill: m('tab-home-on'),
  play: m('tab-play'),
  playFill: m('tab-play'),
  user: m('tab-user'),
  userFill: m('tab-user-on'),
  menu: m('tab-menu'),
  more: svg('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  bookmarkFill: svg('<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  aa: `<span class="aa-icon" aria-hidden="true"><small>A</small>A</span>`,
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>'),
  // e-bogs-ikonet, som eReolen viser under forsiderne
  ebook: m('ebook'),
  headphones: m('headphones'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  chevron: m('chevron-right'),
  chevronDown: m('chevron-down'),
  heart: m('mp-heart'),
  calendar: m('mp-loans'),
  reserve: m('mp-reserve'),
  history: m('mp-history'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  check: svg('<path d="M5 12l5 5L20 7"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  gear: m('gear'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17v.5"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  access: svg('<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5l-3 6M12 14.5l3 6"/>'),
  logout: svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
};

// Logo klippet ud af den rigtige app (hvid maske på rød baggrund).
export function logo() {
  return `<i class="ico logo-img" style="--m:url(/icons/ui/logo.png)" role="img" aria-label="eReolen"></i>`;
}

export function logoSub() {
  return `<i class="ico logo-sub" style="--m:url(/icons/ui/logo-sub.png)" role="img" aria-label="Bibliotekernes ebøger og lydbøger"></i>`;
}
