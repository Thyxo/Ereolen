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

const svg = (p, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;

export const icon = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="7"/><path d="M20.5 20.5l-5-5"/>'),
  home: svg('<path d="M4 10.5L12 4l8 6.5V20h-5v-5.5a3 3 0 0 0-6 0V20H4z"/>'),
  homeFill: svg('<path d="M4 10.5L12 4l8 6.5V20h-5v-5.5a3 3 0 0 0-6 0V20H4z" fill="currentColor"/>'),
  play: svg('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>'),
  playFill: svg('<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M10 8.5l5 3.5-5 3.5z" fill="#fff" stroke="#fff"/>'),
  user: svg('<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-2.5A4.5 4.5 0 0 1 9.5 13h5a4.5 4.5 0 0 1 4.5 4.5V20z"/>'),
  userFill: svg('<circle cx="12" cy="7.5" r="3.5" fill="currentColor"/><path d="M5 20v-2.5A4.5 4.5 0 0 1 9.5 13h5a4.5 4.5 0 0 1 4.5 4.5V20z" fill="currentColor"/>'),
  menu: svg('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>'),
  more: svg('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  bookmarkFill: svg('<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  aa: `<span class="aa-icon" aria-hidden="true"><small>A</small>A</span>`,
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>'),
  // e-bogs-ikonet, som eReolen viser under forsiderne
  ebook: `<svg viewBox="0 0 26 22" width="26" height="22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 3.5h7.5c1.6 0 3 .8 3.5 2 .5-1.2 1.9-2 3.5-2H24v15h-7.5c-1.6 0-3 .6-3.5 1.5-.5-.9-1.9-1.5-3.5-1.5H2z"/><text x="13" y="16" text-anchor="middle" font-family="Source Sans 3, Arial, sans-serif" font-size="13" fill="currentColor" stroke="none">e</text></svg>`,
  headphones: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  chevron: svg('<path d="M9 6l6 6-6 6"/>'),
  chevronDown: svg('<path d="M5 9l7 7 7-7"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>'),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2.2 2.2L15.5 12"/>'),
  reserve: svg('<path d="M4 4h11l-2 3.2L15 10.5H4z" transform="translate(0 1)"/><path d="M4 4v16"/><circle cx="16.5" cy="16" r="4.2"/><path d="M14.8 16l1.2 1.2 2.2-2.4"/>'),
  history: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5v3.5h3.5"/><path d="M12 8v4.5l3 2"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  check: svg('<path d="M5 12l5 5L20 7"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.3 2.7-.8.6 2.8 2.7.9-.8 2.7 2 1.9-2 1.9.8 2.7-2.7.9-.6 2.8-2.7-.8L12 21.2l-1.6-2.3-2.7.8-.6-2.8-2.7-.9.8-2.7-2-1.9 2-1.9-.8-2.7 2.7-.9.6-2.8 2.7.8z"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17v.5"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  access: svg('<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5l-3 6M12 14.5l3 6"/>'),
  logout: svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
};

// @Reolen-logoet: et »e« i en åben ring + ordmærke.
export function logo(cls = '') {
  return `<span class="logo ${cls}" aria-label="eReolen"><svg class="logo-at" viewBox="0 0 40 40" aria-hidden="true"><path d="M34.2 29.4A16.5 16.5 0 1 1 36.5 20v2.2a4.2 4.2 0 0 1-8.4 0V20" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/><path d="M28.1 21.4H13.6c.4 4 3.1 6.2 6.6 6.2 2.1 0 3.8-.7 5.1-1.9M13.7 18c.5-3.4 3-5.6 6.2-5.6 3.4 0 5.8 2.3 6.2 5.6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg>Reolen</span>`;
}
