/*
 * Mavzu (yorug' / qorong'i) — `<html data-theme>` orqali. Tokenlar shu
 * selektor ostida qayta e'lon qilingan, komponentlarda shart yozilmaydi.
 * Tanlov bo'lmasa — tizim sozlamasi.
 */

const KALIT = 'xb-mavzu';

export function mavzuniOqi() {
  if (typeof window === 'undefined') return 'light';
  try {
    const s = window.localStorage.getItem(KALIT);
    if (s === 'light' || s === 'dark') return s;
  } catch {
    /* localStorage yopiq — tizim sozlamasiga tushamiz */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function mavzuniQoll(mavzu) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mavzu);
  try {
    window.localStorage.setItem(KALIT, mavzu);
  } catch {
    /* eslab qolinmasa ham joriy sessiya ishlaydi */
  }
}
