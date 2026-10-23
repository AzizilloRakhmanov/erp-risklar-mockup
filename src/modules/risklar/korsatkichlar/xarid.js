/*
 * Xaridlar — 10 ko'rsatkich.
 *
 * Ikkinchi daraja hisobotga qarab: hisob raqami (reja va plan-grafik),
 * kontragent, shartnoma, mahsulot yoki mahsulot guruhi. Xarid xavfi odatda
 * hisob raqamida emas, aynan shu obyektda ko'rinadi.
 */
import { oraliq, butun, nechta, tanla } from '../../../lib/rng.js';
import { son, summa as summaMatn } from '../../../lib/format.js';
import { KONTRAGENTLAR, MAHSULOTLAR, MAHSULOT_GURUHLARI, MXIK_GURUHLAR } from '../../../reference/kataloglar.js';
import { hisobKesimi, kontragentKesimi, mahsulotKesimi, shartnomaRaqami, vazn } from './kesim.js';

const ulush = (a, b) => (b ? (a / b) * 100 : null);
const yaxlit = (v, q = 1000) => Math.round(v / q) * q;
const jamla = (qlar, k) => qlar.reduce((s, q) => s + (q[k] ?? 0), 0);

export default [
  {
    id: 'narxlar-farqi',
    nom: 'Нархлар ўртасидаги фарқ',
    tavsif: (s) =>
      `Бир хил productCode бўйича ташкилот нархи бозордаги энг паст нархдан ${son(s.chegara)}% ва ундан кўп юқори бўлган харидлар. Ташкилот сатрида — ортиқча тўловнинг жами харидга нисбати.`,
    kesimNomi: 'productCode',
    bolalar: mahsulotKesimi(2, 5),
    asosiy: 'farq',
    yonalish: 'yuqori',
    standart: { chegara: 20, orta: 50, yuqori: 100 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'mahsulot', nom: 'Маҳсулот номи', tur: 'matn' },
      { kalit: 'miqdor', nom: 'Миқдор', tur: 'son', jami: 'none' },
      { kalit: 'bozorMin', nom: 'Энг паст нарх', tur: 'summa', jami: 'none' },
      { kalit: 'orgNarx', nom: 'Ташкилот нархи', tur: 'summa', jami: 'none' },
      { kalit: 'summa', nom: 'Харид суммаси', tur: 'summa' },
      { kalit: 'ortiqcha', nom: 'Ортиқча тўлов', tur: 'summa' },
      { kalit: 'farq', nom: 'Фарқ, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const narx = ctx.bola.maydon.narx;
      const bozorMin = yaxlit(narx * oraliq(r, 0.85, 1), narx > 1e5 ? 1000 : 10);
      const orgNarx = yaxlit(bozorMin * (1 + Math.max(0, x - 0.35) * 2.2), narx > 1e5 ? 1000 : 10);
      const miqdor = Math.max(1, Math.round((ctx.org.hajm * oraliq(r, 2e7, 1.6e8)) / narx));
      return { miqdor, bozorMin, orgNarx, summa: orgNarx * miqdor, ortiqcha: (orgNarx - bozorMin) * miqdor };
    },
    hosila: (q) => ({ farq: ulush(q.ortiqcha, q.summa - q.ortiqcha) })
  },

  {
    id: 'kechikkan-etkazib-berish',
    nom: 'Товарлар (ишлар, хизматлар)ни ўз вақтида етказиб берилмаслиги',
    tavsif: (s) =>
      `Етказиб бериш шартномада белгиланган муддатдан ${son(s.chegara)} кун ва ундан кўпга кечиккан шартномалар. Кечикиш шартнома муддатига нисбатан фоизда ҳам кўрсатилади.`,
    kesimNomi: 'Шартнома рақами',
    bolalar: (r, org) =>
      Array.from({ length: butun(r, 2, 4) }, (_, i) => {
        const k = tanla(r, KONTRAGENTLAR);
        const m = tanla(r, MAHSULOTLAR);
        return {
          id: `${org.id}-sh${i + 1}`,
          nom: shartnomaRaqami(r),
          izoh: k.nom,
          maydon: { kontragent: k.nom, mahsulot: m.nom }
        };
      }),
    asosiy: 'kechikish',
    yonalish: 'yuqori',
    standart: { chegara: 1, orta: 15, yuqori: 30 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'kontragent', nom: 'Контрагент', tur: 'matn' },
      { kalit: 'mahsulot', nom: 'Маҳсулот номи', tur: 'matn' },
      { kalit: 'summa', nom: 'Шартнома суммаси', tur: 'summa' },
      { kalit: 'muddat', nom: 'Шартнома муддати', tur: 'kun', jami: 'none' },
      { kalit: 'amalda', nom: 'Амалда', tur: 'kun', jami: 'none' },
      { kalit: 'kechikish', nom: 'Кечикиш', tur: 'kun', jami: 'max' },
      { kalit: 'foiz', nom: 'Кечикиш, %', tur: 'foiz', jami: 'max' }
    ],
    yarat: (r, x, ctx) => {
      const muddat = tanla(r, [5, 10, 15, 20, 30]);
      const kechikish = Math.max(0, Math.round((x - 0.5) * 90));
      return { summa: yaxlit(oraliq(r, 2e7, 4e8) * Math.sqrt(ctx.org.hajm)), muddat, amalda: muddat + kechikish, kechikish };
    },
    hosila: (q) => ({ foiz: ulush(q.kechikish, q.muddat) })
  },

  {
    id: 'takroriy-shartnomalar',
    nom: 'Етказиб берувчилар билан такрорий тузилган шартномалар',
    tavsif: (s) =>
      `Бир ташкилот бир тадбиркор билан ${son(s.chegara)} та ва ундан кўп шартнома тузган ҳолатлар. Ташкилот сатрида — энг кўп шартнома тузилган контрагент.`,
    kesimNomi: 'Контрагент',
    bolalar: kontragentKesimi(KONTRAGENTLAR, 2, 4),
    asosiy: 'soni',
    yonalish: 'yuqori',
    standart: { chegara: 8, orta: 14, yuqori: 20 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'inn', nom: 'ИНН', tur: 'kod' },
      { kalit: 'soni', nom: 'Шартномалар сони', tur: 'son', jami: 'max' },
      { kalit: 'summa', nom: 'Умумий сумма', tur: 'summa' },
      { kalit: 'ortacha', nom: 'Ўртача шартнома', tur: 'summa' }
    ],
    yarat: (r, x, ctx) => {
      const soni = Math.max(1, Math.round(2 + Math.max(0, x - 0.45) * 32 + oraliq(r, -1, 1)));
      return { soni, summa: yaxlit(soni * oraliq(r, 1.5e7, 9e7) * Math.sqrt(ctx.org.hajm)) };
    },
    hosila: (q) => ({ ortacha: q.soni ? q.summa / q.soni : null })
  },

  {
    id: 'oylik-xarid-limiti',
    nom: 'Етказиб берувчи билан ойига 4 мартадан ортиқ харид',
    tavsif: (s) => `Бир етказиб берувчидан бир ойда ${son(s.chegara)} марта ва ундан кўп харид қилинган ҳолатлар.`,
    kesimNomi: 'Етказиб берувчи',
    bolalar: kontragentKesimi(KONTRAGENTLAR, 2, 4),
    asosiy: 'soni',
    yonalish: 'yuqori',
    standart: { chegara: 5, orta: 8, yuqori: 11 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'inn', nom: 'ИНН', tur: 'kod' },
      { kalit: 'soni', nom: 'Ойдаги харидлар', tur: 'son', jami: 'max' },
      { kalit: 'summa', nom: 'Умумий сумма', tur: 'summa' }
    ],
    yarat: (r, x, ctx) => {
      const soni = Math.max(1, Math.round(1 + Math.max(0, x - 0.45) * 19 + oraliq(r, -1, 1)));
      return { soni, summa: yaxlit(soni * oraliq(r, 4e6, 4e7) * Math.sqrt(ctx.org.hajm)) };
    }
  },

  {
    id: 'droblenie-xaridlar',
    nom: 'Дробление қилиб харид қилинган харидлар',
    tavsif: (s) =>
      `Бир контрагентдан бир маҳсулот гуруҳи бўйича ҳар бири ${summaMatn(s.parametrlar.limit)} сўмдан кичик, лекин жами шу чегарадан ошадиган ${son(s.chegara)} ва ундан кўп шартномалар — танловдан қочиш белгиси.`,
    kesimNomi: 'Контрагент / гуруҳ',
    bolalar: (r, org) =>
      Array.from({ length: butun(r, 1, 3) }, (_, i) => {
        const k = tanla(r, KONTRAGENTLAR);
        const g = tanla(r, MAHSULOT_GURUHLARI);
        return { id: `${org.id}-d${i + 1}`, nom: k.nom, izoh: g, maydon: { kontragent: k.nom, guruh: g } };
      }),
    asosiy: 'bolingan',
    yonalish: 'yuqori',
    standart: { chegara: 3, orta: 5, yuqori: 7 },
    parametrlar: [
      {
        kalit: 'limit',
        nom: 'Танлов мажбурий бўлган сумма',
        tur: 'summa',
        standart: 100_000_000,
        min: 1_000_000,
        izoh: 'Жами сумма шундан ошса, лекин ҳар бир шартнома кичик бўлса — бўлиб харид қилинган деб ҳисобланади.'
      }
    ],
    ustunlar: [
      { kalit: 'guruh', nom: 'Маҳсулот гуруҳи', tur: 'matn' },
      { kalit: 'soni', nom: 'Шартномалар сони', tur: 'son' },
      { kalit: 'engKatta', nom: 'Энг катта шартнома', tur: 'summa', jami: 'max' },
      { kalit: 'summa', nom: 'Умумий сумма', tur: 'summa' },
      { kalit: 'davrKun', nom: 'Давр', tur: 'kun', jami: 'max' },
      { kalit: 'limitdan', nom: 'Чегарадан ошади', tur: 'matn', jami: (qlar) => (qlar.some((q) => q.limitdan === 'Ҳа') ? 'Ҳа' : 'Йўқ') },
      { kalit: 'bolingan', nom: 'Бўлинган шартномалар', tur: 'son', jami: 'max' }
    ],
    yarat: (r, x) => {
      const soni = Math.max(1, Math.round(1 + Math.max(0, x - 0.4) * 11 + oraliq(r, -0.6, 0.6)));
      const bitta = oraliq(r, 0.35, 0.92) * 1e8;
      return { soni, engKatta: yaxlit(bitta * 1.06), summa: yaxlit(bitta * soni), davrKun: butun(r, 4, 30) };
    },
    hosila: (q, p) => {
      const ha = q.summa >= p.limit && q.engKatta < p.limit;
      return { limitdan: ha ? 'Ҳа' : 'Йўқ', bolingan: ha ? q.soni : 0 };
    }
  },

  {
    id: 'plan-grafik-integratsiya',
    nom: 'План-график ва план закупокнинг савдо платформалари билан интеграцияси',
    tavsif: (s) =>
      `План-графикдаги харидларнинг савдо платформаларига чиқарилмаган улуши. ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 25, orta: 40, yuqori: 60 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'pland', nom: 'Пландаги харидлар', tur: 'son' },
      { kalit: 'chiqarilgan', nom: 'Платформага чиқарилган', tur: 'son' },
      { kalit: 'chiqarilmagan', nom: 'Чиқарилмаган', tur: 'son' },
      { kalit: 'foiz', nom: 'Чиқарилмаган, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const pland = Math.max(3, Math.round(ctx.org.hajm * vazn(ctx) * oraliq(r, 10, 34)));
      const chiq = Math.round(pland * Math.max(0, x - 0.25));
      return { pland, chiqarilgan: pland - chiq };
    },
    hosila: (q) => ({ chiqarilmagan: q.pland - q.chiqarilgan, foiz: ulush(q.pland - q.chiqarilgan, q.pland) })
  },

  {
    id: 'yillik-reja-bajarilishi',
    nom: 'Йиллик харид режасининг бажарилиши',
    tavsif: (s) =>
      `Йиллик тасдиқланган харид режасининг бажарилиши${s.parametrlar.mutanosib ? ' (ҳисобот даврига мутаносиб қисмига нисбатан)' : ''}. ${son(s.chegara)}% ва ундан паст бўлса — риск.`,
    kesimNomi: 'Ҳисоб рақами',
    bolalar: hisobKesimi,
    asosiy: 'foiz',
    yonalish: 'past',
    standart: { chegara: 80, orta: 60, yuqori: 40 },
    parametrlar: [
      {
        kalit: 'mutanosib',
        nom: 'Даврга мутаносиб ҳисоблаш',
        tur: 'mantiq',
        standart: true,
        izoh: 'Ёқилган бўлса, бажарилиш йиллик режанинг ўтган ойларга тўғри келадиган қисмига солиштирилади (масалан, сентябрда — 9/12).'
      }
    ],
    ustunlar: [
      { kalit: 'reja', nom: 'Йиллик режа', tur: 'summa' },
      { kalit: 'kutilgan', nom: 'Даврга режа', tur: 'summa' },
      { kalit: 'bajarilgan', nom: 'Бажарилган', tur: 'summa' },
      { kalit: 'foiz', nom: 'Бажарилиш, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const reja = yaxlit(oraliq(r, 3e8, 3e9) * ctx.org.hajm * vazn(ctx), 1e5);
      return { reja, bajarilgan: yaxlit(reja * (ctx.davr.oy / 12) * Math.min(1.04, Math.max(0.05, 1.3 - x * 0.95))) };
    },
    hosila: (q, p, davr) => {
      const kutilgan = p.mutanosib ? (q.reja * davr.oy) / 12 : q.reja;
      return { kutilgan, foiz: ulush(q.bajarilgan, kutilgan) };
    }
  },

  {
    id: 'summa-diapazon-indikator',
    nom: 'Белгиланган диапазондан ошган харид суммалари',
    tavsif: (s) =>
      `Харид суммаси маҳсулот бўйича белгиланган диапазон юқори чегарасидан ${son(s.chegara)}% ва ундан кўп ошган ҳолатлар.`,
    kesimNomi: 'productCode',
    bolalar: mahsulotKesimi(2, 4),
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 10, orta: 30, yuqori: 60 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'mahsulot', nom: 'Маҳсулот номи', tur: 'matn' },
      { kalit: 'diapazon', nom: 'Диапазон чегараси', tur: 'summa' },
      { kalit: 'summa', nom: 'Харид суммаси', tur: 'summa' },
      { kalit: 'oshish', nom: 'Ошириш', tur: 'summa', jami: 'sum' },
      {
        kalit: 'foiz',
        nom: 'Ошириш, %',
        tur: 'foiz',
        jami: (qlar) => ulush(jamla(qlar, 'oshish'), jamla(qlar, 'diapazon'))
      }
    ],
    yarat: (r, x, ctx) => {
      const diapazon = yaxlit(ctx.bola.maydon.narx * oraliq(r, 12, 40), 1e5);
      return { diapazon, summa: yaxlit(diapazon * (0.6 + x * 1.15)) };
    },
    hosila: (q) => {
      const oshish = Math.max(0, q.summa - q.diapazon);
      return { oshish, foiz: ulush(oshish, q.diapazon) };
    }
  },

  {
    id: 'mxik-enkt-gruppalash',
    nom: 'МХИК кодини ЕНКТ кодга нисбатан гуруҳлаш',
    tavsif: (s) =>
      `МХИК гуруҳлари ЕНКТ кодларига мослаштирилган. ЕНКТ кодига мос келмайдиган позициялар улуши ${son(s.chegara)}% ва ундан юқори бўлса — риск.`,
    kesimNomi: 'МХИК гуруҳи',
    bolalar: (r, org) =>
      nechta(r, MXIK_GURUHLAR, butun(r, 2, 4)).map((g) => ({
        id: `${org.id}-${g.id}`,
        nom: g.nom,
        izoh: `ЕНКТ ${g.enkt}`,
        maydon: { enkt: g.enkt }
      })),
    asosiy: 'foiz',
    yonalish: 'yuqori',
    standart: { chegara: 10, orta: 20, yuqori: 30 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'enkt', nom: 'ЕНКТ коди', tur: 'matn' },
      { kalit: 'pozitsiya', nom: 'Позициялар сони', tur: 'son' },
      { kalit: 'mosEmas', nom: 'Мос келмайдиганлар', tur: 'son' },
      { kalit: 'foiz', nom: 'Мос келмайдиган, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const pozitsiya = Math.max(4, Math.round(ctx.org.hajm * oraliq(r, 10, 60)));
      return { pozitsiya, mosEmas: Math.round(pozitsiya * Math.max(0, x - 0.35) * 0.5) };
    },
    hosila: (q) => ({ foiz: ulush(q.mosEmas, q.pozitsiya) })
  },

  {
    id: 'tz-standartlash',
    nom: 'Маҳсулот ТЗсини стандартлаштириш',
    tavsif: (s) =>
      `Маҳсулотнинг ўзи эмас, унинг техник топшириғи (ТЗ) стандартлаштирилганлик даражаси. ${son(s.chegara)}% ва ундан паст бўлса — риск.`,
    kesimNomi: 'Маҳсулот гуруҳи',
    bolalar: (r, org) =>
      nechta(r, MAHSULOT_GURUHLARI, butun(r, 2, 4)).map((g, i) => ({
        id: `${org.id}-tz${i + 1}`,
        nom: g,
        izoh: '',
        maydon: {}
      })),
    asosiy: 'foiz',
    yonalish: 'past',
    standart: { chegara: 70, orta: 50, yuqori: 30 },
    parametrlar: [],
    ustunlar: [
      { kalit: 'jamiTz', nom: 'Жами ТЗ', tur: 'son' },
      { kalit: 'standart', nom: 'Стандартлашган', tur: 'son' },
      { kalit: 'nostandart', nom: 'Стандартлашмаган', tur: 'son' },
      { kalit: 'foiz', nom: 'Стандартлаш, %', tur: 'foiz' }
    ],
    yarat: (r, x, ctx) => {
      const jamiTz = Math.max(4, Math.round(oraliq(r, 6, 30) * Math.sqrt(ctx.org.hajm)));
      return { jamiTz, standart: Math.min(jamiTz, Math.round(jamiTz * Math.max(0.05, 1.15 - x * 0.85))) };
    },
    hosila: (q) => ({ nostandart: q.jamiTz - q.standart, foiz: ulush(q.standart, q.jamiTz) })
  }
];
