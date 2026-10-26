// Performerens skjulte funktioner (mode 1: egen telefon).
//  - Dobbelttryk på den røde header, kortnummeret eller sidetallet i læseren:
//    viser i 1,2 sek. det ord, der har samme forbogstav som den senest åbnede bog.
//  - Langt tryk på den røde header: slår forord-kickeren til/fra (prik på "Min side").
//  - Langt tryk (3 sek.) på "Indstillinger" på Min side: nulstiller alt.
import { getState, toggleKicker } from './state.js';

let words = null;
let books = [];

export function initSecret(w, b) {
  words = w;
  books = b;
}

export function ownSet() {
  return words.sets[words.ownModeSet];
}

export function wordForLetter(letter) {
  return ownSet().words.find((w) => w.initial === letter) || null;
}

export function peekWord() {
  const id = getState().lastOpenedId;
  const book = books.find((b) => b.id === id);
  if (!book) return '–';
  const w = wordForLetter(book.letter);
  return w ? w.word : '–';
}

// Ekstra afsnit i forordet, når kickeren er slået til.
export function kickerParagraph(book) {
  if (!getState().kicker) return null;
  const w = wordForLetter(book.letter);
  if (!w) return null;
  return `I denne udgave er der ét ord, vi håber, du vil tænke på, mens du læser: »${w.word.toLowerCase()}«.`;
}

// ---------- gestus ----------
export function onDoubleTap(el, fn) {
  let last = 0;
  el.addEventListener('pointerup', (e) => {
    const now = e.timeStamp;
    if (now - last < 350) {
      last = 0;
      fn(e);
    } else {
      last = now;
    }
  });
  el.addEventListener('dblclick', (e) => e.preventDefault());
}

export function onLongPress(el, ms, fn) {
  let timer = null;
  let sx = 0;
  let sy = 0;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  el.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn(e);
    }, ms);
  });
  el.addEventListener('pointermove', (e) => {
    if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) cancel();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, cancel));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Viser ordet i elementet i et kort øjeblik.
export function bindPeek(el, target = el) {
  onDoubleTap(el, () => {
    if (target.dataset.peeking) return;
    target.dataset.peeking = '1';
    const orig = target.innerHTML;
    target.textContent = peekWord();
    setTimeout(() => {
      target.innerHTML = orig;
      delete target.dataset.peeking;
    }, 1200);
  });
}

export function bindKickerToggle(el, onChange) {
  onLongPress(el, 700, () => {
    const on = toggleKicker();
    onChange?.(on);
  });
}
