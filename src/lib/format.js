/*
 * Raqam formatlari. Butun sahifada bitta uslub: minglik ajratgich — bo'sh joy,
 * kasr ajratgich — vergul (prototipda «0,37» va «13.8%» aralash edi).
 */

const nf = (d) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });
const NF = [nf(0), nf(1), nf(2)];

/** 1 240 · 152 184 550 000 — nbsp oddiy bo'sh joyga almashtiriladi */
export const son = (n, d = 0) => (n == null || Number.isNaN(n) ? '—' : NF[d].format(n).replace(/\s/g, ' '));

export const summa = (n) => son(n, 0);

/** 152,2 млрд — KPI kartochkalari uchun */
export function qisqaSumma(n) {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return `${son(n / 1e12, 1)} трлн`;
  if (a >= 1e9) return `${son(n / 1e9, 1)} млрд`;
  if (a >= 1e6) return `${son(n / 1e6, 1)} млн`;
  return son(n);
}

/** Ustun turi bo'yicha qiymatni matnga aylantiradi */
export function qiymatMatn(v, tur, { ishora = false } = {}) {
  if (v == null || (typeof v === 'number' && Number.isNaN(v))) return '—';
  const plus = ishora && v > 0 ? '+' : '';
  switch (tur) {
    case 'summa':
      return summa(v);
    case 'son':
      return son(v);
    case 'foiz':
      return `${plus}${son(v, 1)}%`;
    case 'pp':
      return `${plus}${son(v, 1)} п.п.`;
    case 'kun':
      return `${son(v)} кун`;
    case 'koef':
      return son(v, 2);
    default:
      return String(v);
  }
}

/** Sozlama maydonining birlik yorlig'i */
export const BIRLIK = { foiz: '%', pp: 'п.п.', kun: 'кун', son: 'та', summa: 'сўм', koef: '' };

export const SONLI = new Set(['summa', 'son', 'foiz', 'pp', 'kun', 'koef']);
