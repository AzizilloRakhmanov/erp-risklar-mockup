/*
 * Deterministik tasodifiy sonlar — demo ma'lumot har safar bir xil chiqadi.
 *
 * `Math.random()` ishlatilmaydi. Har bir oqim o'z kalitidan (masalan
 * `rng('ozlashtirilmagan', 't01', 'h2', 7)`) urug' oladi, shuning uchun bitta
 * ko'rsatkich qo'shilsa yoki o'chirilsa, boshqalarining raqamlari siljimaydi.
 */

/** FNV-1a — satrdan 32 bitli urug' */
function xesh(satr) {
  let h = 2166136261;
  for (let i = 0; i < satr.length; i++) {
    h ^= satr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 oqimi: () => [0, 1) */
export function rng(...kalitlar) {
  let a = xesh(kalitlar.join('|'));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const oraliq = (r, a, b) => a + r() * (b - a);
export const butun = (r, a, b) => Math.floor(oraliq(r, a, b + 1));
export const tanla = (r, royxat) => royxat[Math.floor(r() * royxat.length)];
export const qisqich = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Ro'yxatdan n ta takrorlanmas element (tartib aralashadi) */
export function nechta(r, royxat, n) {
  const nusxa = [...royxat];
  for (let i = nusxa.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [nusxa[i], nusxa[j]] = [nusxa[j], nusxa[i]];
  }
  return nusxa.slice(0, n);
}

/** n xonali raqamlar satri */
export const raqamlar = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');
