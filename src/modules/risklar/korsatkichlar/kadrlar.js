/*
 * Kadrlarni boshqarish — 6 ko'rsatkich.
 * Ikkinchi daraja: hisob raqami (shtat jadvali hisob raqami bo'yicha
 * tasdiqlanadi). Prototipda foizi yo'q edi — hammasiga ulush qo'shildi.
 */
import { oraliq } from '../../../lib/rng.js';
import { son } from '../../../lib/format.js';
import { hisobKesimi, vazn } from './kesim.js';

const ulush = (a, b) => (b ? (a / b) * 100 : null);
const shtat = (r, ctx, a = 60, b = 180) => Math.max(6, Math.round(ctx.org.hajm * vazn(ctx) * oraliq(r, a, b)));
const ortiq = (x, dan) => Math.max(0, x - dan);

const STAVKALAR = [
  { id: '0.5', nom: '0,5 ставкадан кам' },
  { id: '0.75', nom: '0,75 ставкадан кам' },
  { id: '1', nom: '1 ставкадан кам' }
];

export default [
  {
    id: 'bosh-ish-orinlari',
    nom: 'Бўш иш ўринлари сони',
    tavsif: (s) =>
      `Штат бирлигига нисбатан бўш иш ўринлари улуши. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 10, orta: 20, yuqori: 30 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'shtat', nom: 'Штат бирлиги', tur: 'son' },
      { kalit: 'band', nom: 'Банд', tur: 'son' },
      { kalit: 'bosh', nom: 'Бўш иш ўринлари', tur: 'son' },
      { kalit: 'foiz', nom: 'Бўш, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const sh = shtat(r, ctx);
      return { shtat: sh, band: sh - Math.round(sh * ortiq(x, 0.3) * 0.5) };
    },
    hosila: (q) => ({ bosh: q.shtat - q.band, foiz: ulush(q.shtat - q.band, q.shtat) })
  },

  {
    id: 'bir-shtatdan-kam',
    nom: '1 штат бирлигидан кам улушга эга ходимлар улуши',
    tavsif: (s) => {
      const st = STAVKALAR.find((v) => v.id === s.parametrlar.stavka);
      return `Нормадан кам (${st?.nom ?? '—'}) ишлайдиган ходимлар улуши. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`;
    },
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'ulush',
    yonalish: 'yuqori',
    standart: { chegara: 10, orta: 18, yuqori: 25 },
    parametrlar: [
      { kalit: 'stavka', nom: 'Норма чегараси', tur: 'tanlov', standart: '1', variantlar: STAVKALAR }
    ],
    ustunlar: [
      { kalit: 'xodimlar', nom: 'Ходимлар сони', tur: 'son' },
      { kalit: 's025', nom: '0,25 ставка', tur: 'son' },
      { kalit: 's05', nom: '0,5 ставка', tur: 'son' },
      { kalit: 's075', nom: '0,75 ставка', tur: 'son' },
      { kalit: 'kam', nom: 'Нормадан кам', tur: 'son' },
      { kalit: 'ulush', nom: 'Улуши, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const xodimlar = shtat(r, ctx, 50, 160);
      const f = ortiq(x, 0.25);
      return {
        xodimlar,
        s025: Math.round(xodimlar * f * 0.1),
        s05: Math.round(xodimlar * f * 0.15),
        s075: Math.round(xodimlar * f * 0.13)
      };
    },
    hosila: (q, p) => {
      const kam = p.stavka === '0.5' ? q.s025 : p.stavka === '0.75' ? q.s025 + q.s05 : q.s025 + q.s05 + q.s075;
      return { kam, ulush: ulush(kam, q.xodimlar) };
    }
  },

  {
    id: 'shtat-bandligi',
    nom: 'Штат бўйича бандлик даражаси',
    tavsif: (s) => `Жами штат бирликларига нисбатан банд ўринлар улуши. ${son(s.chegara)}% ва ундан паст бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'past',
    standart: { chegara: 90, orta: 80, yuqori: 70 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'shtat', nom: 'Жами штат', tur: 'son' },
      { kalit: 'band', nom: 'Банд', tur: 'son' },
      { kalit: 'vakant', nom: 'Вакант', tur: 'son' },
      { kalit: 'foiz', nom: 'Бандлик, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const sh = shtat(r, ctx);
      return { shtat: sh, band: sh - Math.round(sh * ortiq(x, 0.25) * 0.5) };
    },
    hosila: (q) => ({ vakant: q.shtat - q.band, foiz: ulush(q.band, q.shtat) })
  },

  {
    id: 'kadrlar-almashinuvi',
    nom: 'Кадрлар алмашинуви коэффициенти',
    tavsif: (s) =>
      `${s.parametrlar.formula === 'chiqish' ? 'Ишдан чиққанлар' : 'Қабул қилинган ва ишдан чиққанлар йиғиндиси'}нинг ўртача ходимлар сонига нисбати. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'koef',
    yonalish: 'yuqori',
    standart: { chegara: 25, orta: 40, yuqori: 55 },
    parametrlar: [
      {
        kalit: 'formula',
        nom: 'Ҳисоблаш формуласи',
        tur: 'tanlov',
        standart: 'umumiy',
        variantlar: [
          { id: 'umumiy', nom: '(Қабул + Чиқиш) / Ўртача сон' },
          { id: 'chiqish', nom: 'Чиқиш / Ўртача сон' }
        ]
      }
    ],
    ustunlar: [
      { kalit: 'ortacha', nom: 'Ўртача ходимлар', tur: 'son' },
      { kalit: 'qabul', nom: 'Қабул қилинган', tur: 'son' },
      { kalit: 'chiqqan', nom: 'Ишдан чиққан', tur: 'son' },
      { kalit: 'koef', nom: 'Коэффициент, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const ortacha = shtat(r, ctx);
      const f = ortiq(x, 0.3);
      return {
        ortacha,
        chiqqan: Math.round(ortacha * (0.02 + f * 0.45)),
        qabul: Math.round(ortacha * (0.02 + f * 0.4 + oraliq(r, 0, 0.03)))
      };
    },
    hosila: (q, p) => ({
      koef: ulush(p.formula === 'chiqish' ? q.chiqqan : q.qabul + q.chiqqan, q.ortacha)
    })
  },

  {
    id: 'ishdan-ketganlar',
    nom: 'Йил давомида ишдан кетган ходимлар сони',
    tavsif: (s) =>
      `Йил бошидан ишдан кетган (барча асослар бўйича) ходимларнинг ўртача ходимлар сонига нисбати. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'ulush',
    yonalish: 'yuqori',
    standart: { chegara: 10, orta: 18, yuqori: 25 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'xodimlar', nom: 'Ўртача ходимлар', tur: 'son' },
      { kalit: 'ketgan', nom: 'Ишдан кетганлар', tur: 'son' },
      { kalit: 'ulush', nom: 'Улуши, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const xodimlar = shtat(r, ctx);
      return { xodimlar, ketgan: Math.round(xodimlar * (0.02 + ortiq(x, 0.3) * 0.3)) };
    },
    hosila: (q) => ({ ulush: ulush(q.ketgan, q.xodimlar) })
  },

  {
    id: 'ishdan-boshaganlar',
    nom: 'Белгиланган йил ичида ишдан бўшаган ходимлар сони',
    tavsif: (s) =>
      `Иш берувчи ташаббуси билан ишдан бўшатилган ходимларнинг ўртача ходимлар сонига нисбати. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'ulush',
    yonalish: 'yuqori',
    standart: { chegara: 4, orta: 7, yuqori: 10 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'xodimlar', nom: 'Ўртача ходимлар', tur: 'son' },
      { kalit: 'boshatilgan', nom: 'Ишдан бўшатилганлар', tur: 'son' },
      { kalit: 'ulush', nom: 'Улуши, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const xodimlar = shtat(r, ctx);
      return { xodimlar, boshatilgan: Math.round(xodimlar * (0.005 + ortiq(x, 0.3) * 0.12)) };
    },
    hosila: (q) => ({ ulush: ulush(q.boshatilgan, q.xodimlar) })
  }
];
