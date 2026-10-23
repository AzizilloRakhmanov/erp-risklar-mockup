/*
 * Moliyalashtirish va byudjetlashtirish — 3 ko'rsatkich.
 * Ikkinchi daraja: g'aznachilik hisob raqami.
 */
import { oraliq } from '../../../lib/rng.js';
import { son } from '../../../lib/format.js';
import { hisobKesimi, vazn } from './kesim.js';

const mlrd = (r, a, b) => Math.round(oraliq(r, a, b) / 1000) * 1000;
const ulush = (a, b) => (b ? (a / b) * 100 : null);

const QISMLAR = [
  { id: 'oylik', nom: 'Ойлик (16 – ой охири)' },
  { id: 'avans', nom: 'Аванс (1 – 15)' }
];

export default [
  {
    id: 'ozlashtirilmagan-mablaglar',
    nom: 'Ўзлаштирилмаган маблағлар',
    tavsif: (s) =>
      `Аниқланган режа ва касса ўртасидаги фарқ. Фарқи ${son(s.chegara)}% ва ундан юқори бўлган ташкилотлар рискли ҳисобланади (ҳисоб рақами кесимида).`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 80, orta: 85, yuqori: 90 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'reja', nom: 'Аниқланган режа', tur: 'summa' },
      { kalit: 'kassa', nom: 'Касса', tur: 'summa' },
      { kalit: 'ozl', nom: 'Ўзлаштирилмаган', tur: 'summa' },
      { kalit: 'foiz', nom: 'Фарқ, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const reja = Math.round(mlrd(r, 3e9, 24e9) * ctx.org.hajm * vazn(ctx));
      const foiz = 35 + x * 65;
      return { reja, kassa: Math.round(reja * (1 - foiz / 100)) };
    },
    hosila: (q) => ({ ozl: q.reja - q.kassa, foiz: ulush(q.reja - q.kassa, q.reja) })
  },

  {
    id: 'band-qilinmagan-mablaglar',
    nom: 'Банд қилинмаган маблағлар',
    tavsif: (s) =>
      `Аниқланган режага нисбатан банд қилинмаган маблағлар улуши. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 80, orta: 85, yuqori: 90 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'reja', nom: 'Аниқланган режа', tur: 'summa' },
      { kalit: 'band', nom: 'Банд қилинган', tur: 'summa' },
      { kalit: 'bandEmas', nom: 'Банд қилинмаган', tur: 'summa' },
      { kalit: 'foiz', nom: 'Улуши, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const reja = Math.round(mlrd(r, 3e9, 24e9) * ctx.org.hajm * vazn(ctx));
      const foiz = 38 + x * 62;
      return { reja, band: Math.round(reja * (1 - foiz / 100)) };
    },
    hosila: (q) => ({ bandEmas: q.reja - q.band, foiz: ulush(q.reja - q.band, q.reja) })
  },

  {
    id: 'oylik-maoshlar',
    nom: 'Ойлик маошлар тўланганлик ҳолати',
    tavsif: (s) =>
      `4111100 — Асосий иш ҳақи. Ойлик режанинг 1/12 қисмидан аванс даврида ${son(s.parametrlar.avansTalab)}%, ойлик даврида ${son(s.parametrlar.oylikTalab)}% касса харажати талаб қилинади. Камомад ${son(s.chegara, 1)} п.п. ва ундан кўп бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: (r, org) =>
      org.hisoblar.flatMap((h) =>
        QISMLAR.map((q) => ({
          id: `${h.id}-${q.id}`,
          nom: h.raqam,
          izoh: `${h.nom} · ${q.nom}`,
          maydon: { qism: q.id, qismNom: q.nom }
        }))
      ),
    /* Avans va oylik bitta jamiga qo'shilmaydi: talab har xil */
    filtrlar: [{ kalit: 'qism', nom: 'Тўлов даври', variantlar: QISMLAR, majburiy: true }],
    asosiy: 'kamomad',
    yonalish: 'yuqori',
    standart: { chegara: 1, orta: 10, yuqori: 20 },
    parametrlar: [
      { kalit: 'avansTalab', nom: 'Аванс даврида талаб', tur: 'foiz', standart: 20, min: 0, max: 100 },
      { kalit: 'oylikTalab', nom: 'Ойлик даврида талаб', tur: 'foiz', standart: 50, min: 0, max: 100 }
    ],
    ustunlar: [
      { kalit: 'qismNom', nom: 'Давр', tur: 'matn' },
      { kalit: 'rejaOy', nom: 'Ойлик режа (1/12)', tur: 'summa' },
      { kalit: 'kassa', nom: 'Касса', tur: 'summa' },
      { kalit: 'talab', nom: 'Талаб, %', tur: 'foiz' },
      { kalit: 'amalda', nom: 'Амалда, %', tur: 'foiz' },
      { kalit: 'kamomad', nom: 'Камомад, п.п.', tur: 'pp' }
    ],
    yarat: (r, x, ctx) => {
      const rejaOy = Math.round(mlrd(r, 0.6e9, 3.8e9) * ctx.org.hajm * vazn(ctx));
      const talab = ctx.bola.maydon.qism === 'avans' ? 20 : 50;
      const amalda = talab * (1.6 - x * 1.0) + oraliq(r, -2, 2);
      return { rejaOy, kassa: Math.round((rejaOy * Math.max(0, amalda)) / 100) };
    },
    hosila: (q, p) => {
      const talab = q.qism === 'avans' ? p.avansTalab : q.qism === 'oylik' ? p.oylikTalab : null;
      const amalda = ulush(q.kassa, q.rejaOy);
      return { talab, amalda, kamomad: talab == null ? null : Math.max(0, talab - amalda) };
    }
  }
];
