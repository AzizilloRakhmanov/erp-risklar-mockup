/*
 * Hisobot davrlari — oxirgi 12 ta yopilgan oy (2025-10 … 2026-09).
 * Dinamika diagrammasi shu 12 oyni chizadi.
 */

const OYLAR = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const QISQA = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

export const DAVRLAR = Array.from({ length: 12 }, (_, idx) => {
  const sana = new Date(2025, 9 + idx, 1);
  const yil = sana.getFullYear();
  const oy = sana.getMonth() + 1;
  return {
    id: `${yil}-${String(oy).padStart(2, '0')}`,
    idx,
    yil,
    oy,
    nom: `${OYLAR[oy - 1]} ${yil}`,
    qisqa: QISQA[oy - 1]
  };
});

export const JORIY_DAVR = DAVRLAR[DAVRLAR.length - 1].id;

export const davrTop = (id) => DAVRLAR.find((d) => d.id === id) ?? DAVRLAR[DAVRLAR.length - 1];

/** Oldingi oy (dinamika va «аввалги ой» taqqoslashi uchun) */
export const oldingiDavr = (d) => DAVRLAR[d.idx - 1] ?? null;
