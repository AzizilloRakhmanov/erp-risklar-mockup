/*
 * Ikkinchi daraja (kesim) yasovchilari — ko'rsatkich ta'riflari umumiy holatda
 * shulardan foydalanadi, o'ziga xos kesim kerak bo'lsa `bolalar()` ni o'zi yozadi.
 *
 * Bola shakli: { id, nom, izoh, maydon }
 *   nom    — daraxtdagi asosiy yorliq (hisob raqami, ЛС, shartnoma raqami …)
 *   izoh   — uning ostidagi kulrang qator
 *   maydon — jadval ustunlariga tushadigan matnli maydonlar
 */
import { nechta, butun, raqamlar } from '../../../lib/rng.js';
import { MAHSULOTLAR } from '../../../reference/kataloglar.js';

export const hisobKesimi = (_r, org) =>
  org.hisoblar.map((h) => ({ id: h.id, nom: h.raqam, izoh: h.nom, maydon: {} }));

export const litsevoyKesimi = (_r, org) =>
  org.litsevoylar.map((l) => ({
    id: l.id,
    nom: l.raqam,
    izoh: `${l.resursNom} · ${l.nom}`,
    maydon: { resurs: l.resurs, resursNom: l.resursNom, birlik: l.birlik, taminotchi: l.taminotchi }
  }));

/** Hisob raqamining ulushi: asosiy hisob eng katta, qolganlari kichikroq */
export const HISOB_VAZNI = [1, 0.42, 0.18, 0.1];
export const vazn = (ctx) => HISOB_VAZNI[ctx.i] ?? 0.1;

/** Tashkilot bilan ishlagan kontragentlardan bir nechtasi */
export const kontragentKesimi = (royxat, a, b) => (r, org) =>
  nechta(r, royxat, butun(r, a, b)).map((k) => ({
    id: `${org.id}-${k.id}`,
    nom: k.nom,
    izoh: `ИНН ${k.inn}`,
    maydon: { kontragent: k.nom, inn: k.inn }
  }));

export const shartnomaRaqami = (r) => `${butun(r, 1, 9)}${raqamlar(r, 6)}.1.${butun(r, 1, 4)}`;

/** Tashkilot xarid qilgan mahsulotlardan bir nechtasi (productCode kesimi) */
export const mahsulotKesimi = (a, b) => (r, org) =>
  nechta(r, MAHSULOTLAR, butun(r, a, b)).map((m) => ({
    id: `${org.id}-${m.kod}`,
    nom: m.kod,
    izoh: m.nom,
    maydon: { kod: m.kod, mahsulot: m.nom, guruh: m.guruh, narx: m.narx }
  }));
