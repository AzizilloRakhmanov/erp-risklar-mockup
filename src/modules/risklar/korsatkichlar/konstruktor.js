/*
 * Ko'rsatkich konstruktori — foydalanuvchi yaratadigan ko'rsatkichlar.
 *
 * Tizimdagi 20 ta ko'rsatkich kodda yozilgan (o'z generatori va formulasi
 * bor). Foydalanuvchi esa DEKLARATIV shakl (spek) to'ldiradi: yo'nalish,
 * kesim, ikki maydon (A, B), formula va chegaralar. Bu fayl spekni
 * dvigatel tushunadigan oddiy ko'rsatkich ta'rifiga aylantiradi —
 * keyin u hisobot, panel, matritsa va sozlamalarda tizimdagilar bilan
 * bir xil ishlaydi.
 *
 * Spek shakli:
 *   { id, guruh, raqam, nom, tavsif, kesim,
 *     a: { nom, tur }, b: { nom, tur }, formula, natijaNom, ayirmaNom,
 *     jamlash, yonalish, standart: { chegara, orta, yuqori },
 *     yaratilgan, yangilangan }
 *
 * Demo ma'lumot: mockupda manba tizim yo'q, shuning uchun qiymat
 * chegaralar atrofida generatsiya qilinadi — taxminan har uchinchi
 * tashkilot riskka tushadi.
 */
import { oraliq } from '../../../lib/rng.js';
import { son } from '../../../lib/format.js';
import { KONTRAGENTLAR, RESURSLAR } from '../../../reference/kataloglar.js';
import { chegaraTekshir } from '../hisob.js';
import { hisobKesimi, litsevoyKesimi, kontragentKesimi, mahsulotKesimi, vazn } from './kesim.js';
import { GURUHLAR, TIZIM_KORSATKICHLAR } from './tizim.js';

export const KESIMLAR = [
  { id: 'hisob', nom: 'Ҳисоб рақами', izoh: 'Ғазначилик ҳисоб рақамлари — молия, кадрлар, режа', bolalar: hisobKesimi, ustunlar: [] },
  {
    id: 'litsevoy',
    nom: 'Лицевой ҳисоб',
    izoh: 'Таъминотчидаги шахсий ҳисоб — коммунал ресурслар',
    bolalar: litsevoyKesimi,
    ustunlar: [{ kalit: 'resursNom', nom: 'Ресурс тури', tur: 'matn' }],
    filtrlar: [{ kalit: 'resurs', nom: 'Ресурс тури', variantlar: RESURSLAR.map((r) => ({ id: r.id, nom: r.nom })) }]
  },
  {
    id: 'kontragent',
    nom: 'Контрагент',
    izoh: 'Етказиб берувчилар — харид ва шартномалар',
    bolalar: kontragentKesimi(KONTRAGENTLAR, 2, 4),
    ustunlar: [{ kalit: 'inn', nom: 'ИНН', tur: 'kod' }]
  },
  {
    id: 'mahsulot',
    nom: 'productCode',
    izoh: 'Харид қилинган маҳсулотлар',
    bolalar: mahsulotKesimi(2, 4),
    ustunlar: [{ kalit: 'mahsulot', nom: 'Маҳсулот номи', tur: 'matn' }]
  }
];

export const MAYDON_TURLARI = [
  { id: 'summa', nom: 'Сумма' },
  { id: 'son', nom: 'Сон' },
  { id: 'kun', nom: 'Кун' }
];

const ulush = (a, b) => (b ? (a / b) * 100 : null);

/*
 * `teskari(t, b)` — generator uchun: maqsad natija t bo'lishi uchun A qancha.
 * `ayirma` — qo'shimcha «oraliq» ustun (masalan, Режа − Касса).
 */
export const FORMULALAR = [
  {
    id: 'ulush',
    nom: 'Улуш',
    ifoda: 'A / B × 100',
    misol: 'Касса / Режа — бажарилиш фоизи',
    foiz: true,
    b: true,
    hisob: (a, b) => ulush(a, b),
    ayirma: (a, b) => b - a,
    ayirmaIfoda: 'B − A',
    teskari: (t, b) => (b * t) / 100
  },
  {
    id: 'qoldiq',
    nom: 'Қолдиқ улуши',
    ifoda: '(B − A) / B × 100',
    misol: '(Режа − Касса) / Режа — ўзлаштирилмаган фоиз',
    foiz: true,
    b: true,
    hisob: (a, b) => ulush(b - a, b),
    ayirma: (a, b) => b - a,
    ayirmaIfoda: 'B − A',
    teskari: (t, b) => b * (1 - Math.min(100, t) / 100)
  },
  {
    id: 'osish',
    nom: 'Ўзгариш',
    ifoda: '(A − B) / B × 100',
    misol: '(Жорий − Аввалги) / Аввалги — ўсиш фоизи',
    foiz: true,
    b: true,
    hisob: (a, b) => ulush(a - b, b),
    ayirma: (a, b) => a - b,
    ayirmaIfoda: 'A − B',
    teskari: (t, b) => b * (1 + t / 100)
  },
  {
    id: 'ayirma',
    nom: 'Айирма',
    ifoda: 'A − B',
    misol: 'Амалдаги − Шартнома муддати — кечикиш',
    foiz: false,
    b: true,
    hisob: (a, b) => a - b,
    teskari: (t, b) => b + t
  },
  {
    id: 'qiymat',
    nom: 'Қиймат',
    ifoda: 'A',
    misol: 'Шартномалар сони, ҳарид сони',
    foiz: false,
    b: false,
    hisob: (a) => a,
    teskari: (t) => t
  }
];

export const formulaTop = (id) => FORMULALAR.find((f) => f.id === id) ?? FORMULALAR[0];
export const kesimTop = (id) => KESIMLAR.find((k) => k.id === id) ?? KESIMLAR[0];

/** Natija ustunining turi: foizli formulada — foiz, aks holda A maydoni turi */
export const natijaTuri = (spek) => (formulaTop(spek.formula).foiz ? 'foiz' : spek.a.tur);

export function yangiSpek(guruh = GURUHLAR[0].id) {
  return {
    id: '',
    guruh,
    raqam: 0,
    nom: '',
    tavsif: '',
    kesim: 'hisob',
    a: { nom: '', tur: 'summa' },
    b: { nom: '', tur: 'summa' },
    formula: 'qoldiq',
    natijaNom: '',
    ayirmaNom: '',
    jamlash: 'sum',
    yonalish: 'yuqori',
    standart: { chegara: 80, orta: 85, yuqori: 90 }
  };
}

/** `{chegara}`, `{orta}`, `{yuqori}` o'rniga sozlamadagi qiymat qo'yiladi */
function tavsifQur(spek, s, tur) {
  const f = (v) => son(v, Number.isInteger(v) ? 0 : 1) + (tur === 'foiz' ? '%' : tur === 'kun' ? ' кун' : '');
  if (spek.tavsif.trim()) {
    return spek.tavsif.replace(/\{(chegara|orta|yuqori)\}/g, (_, k) => f(s[k]));
  }
  return `${spek.natijaNom || 'Натижа'} ${f(s.chegara)} ва ундан ${spek.yonalish === 'past' ? 'паст' : 'юқори'} бўлса — риск.`;
}

/**
 * Generator uchun maqsad oralig'i. Risk tomoni: chegaradan «yuqori»
 * darajadan biroz o'tguncha; norma tomoni undan 1.2 baravar uzun —
 * kesimlarning taxminan 45% i riskka tushadi. Qiymat oraliq bilan emas,
 * har biri alohida kesiladi (`chekla`): masalan, kechikishda manfiy
 * qiymatlar 0 ga aylanadi va «kechikmagan» shartnomalar tabiiy chiqadi.
 */
function maqsadOraligi(spek) {
  const { chegara, yuqori } = spek.standart;
  const past = spek.yonalish === 'past';
  const f = formulaTop(spek.formula);
  const oraliqUz = Math.abs(yuqori - chegara);
  const dum = oraliqUz * 0.4 || Math.abs(chegara) * 0.1 || 1;
  const risk = oraliqUz + dum;
  let lo = past ? yuqori - dum : chegara - risk * 1.2;
  let hi = past ? chegara + risk * 1.2 : yuqori + dum;
  /* Bajarilish foizi 105% dan oshib ketmasin */
  if (f.id === 'ulush' && past) hi = Math.min(hi, Math.max(105, chegara * 1.1));

  const chekla = (v) => {
    if (f.id === 'qoldiq') return Math.min(100, Math.max(0, v));
    if ((f.foiz && f.id !== 'osish') || (!f.foiz && spek.a.tur !== 'summa')) return Math.max(0, v);
    return v;
  };
  return { lo, hi, past, chekla };
}

function bazaQiymat(r, tur, ctx) {
  const v = vazn(ctx);
  if (tur === 'summa') return Math.round((oraliq(r, 2e8, 4e9) * ctx.org.hajm * v) / 1000) * 1000;
  if (tur === 'kun') return Math.round(oraliq(r, 5, 45));
  return Math.max(5, Math.round(oraliq(r, 20, 200) * ctx.org.hajm * v));
}

/** Spek → dvigatel ko'rsatkichi */
export function spekdanKorsatkich(spek) {
  const g = GURUHLAR.find((x) => x.id === spek.guruh) ?? GURUHLAR[0];
  const f = formulaTop(spek.formula);
  const kesim = kesimTop(spek.kesim);
  const tur = natijaTuri(spek);
  const { lo, hi, past, chekla } = maqsadOraligi(spek);
  const yaxlit = (v, t) => (t === 'summa' ? Math.round(v / 1000) * 1000 : Math.round(v));

  const ustunlar = [
    ...kesim.ustunlar,
    { kalit: 'a', nom: spek.a.nom, tur: spek.a.tur },
    ...(f.b ? [{ kalit: 'b', nom: spek.b.nom, tur: spek.b.tur }] : []),
    ...(f.ayirma && spek.ayirmaNom.trim() ? [{ kalit: 'ayirma', nom: spek.ayirmaNom, tur: spek.a.tur }] : []),
    {
      kalit: 'natija',
      nom: spek.natijaNom,
      tur,
      ishora: f.id === 'osish',
      /* Foizsiz natijada tashkilot sarti — yig'indi yoki eng yomon kesim */
      jami: !f.foiz && spek.jamlash === 'max' ? (spek.yonalish === 'past' ? 'min' : 'max') : undefined
    }
  ];

  return {
    id: spek.id,
    nom: spek.nom,
    tavsif: (s) => tavsifQur(spek, s, tur),
    kesimNomi: kesim.nom,
    bolalar: kesim.bolalar,
    filtrlar: kesim.filtrlar,
    asosiy: 'natija',
    yonalish: spek.yonalish,
    standart: { ...spek.standart },
    parametrlar: [],
    ustunlar,
    yarat: (r, x, ctx) => {
      const t = chekla(past ? hi - x * (hi - lo) : lo + x * (hi - lo));
      if (!f.b) return { a: yaxlit(t, spek.a.tur) };
      const b = bazaQiymat(r, spek.b.tur, ctx);
      return { b, a: Math.max(0, yaxlit(f.teskari(t, b), spek.a.tur)) };
    },
    hosila: (q) => ({
      natija: f.hisob(q.a, q.b),
      ...(f.ayirma ? { ayirma: f.ayirma(q.a, q.b) } : {})
    }),
    /* Meta: reyestr va konstruktor uchun */
    guruh: g.id,
    guruhNom: g.nom,
    kod: `${g.qisqa}${spek.raqam}`,
    raqam: spek.raqam,
    manba: 'foydalanuvchi',
    versiya: spek.yangilangan ?? '',
    formulaMatn: `${f.ifoda} · A — ${spek.a.nom}${f.b ? `, B — ${spek.b.nom}` : ''}`,
    spek
  };
}

/** Tizim + foydalanuvchi ko'rsatkichlari, yo'nalishlar tartibida */
export function royxatQur(spekler) {
  const maxsus = spekler.map(spekdanKorsatkich);
  return GURUHLAR.flatMap((g) => [
    ...TIZIM_KORSATKICHLAR.filter((k) => k.guruh === g.id),
    ...maxsus.filter((k) => k.guruh === g.id).sort((a, b) => a.raqam - b.raqam)
  ]);
}

/** Yo'nalishdagi keyingi bo'sh raqam (М4, Х11, …) */
export function keyingiRaqam(guruh, spekler) {
  const tizim = TIZIM_KORSATKICHLAR.filter((k) => k.guruh === guruh).length;
  const band = spekler.filter((s) => s.guruh === guruh).map((s) => s.raqam);
  return Math.max(tizim, ...band, 0) + 1;
}

/** Spek to'g'riligi: { maydon: xabar } */
export function spekTekshir(spek, royxat) {
  const x = {};
  const f = formulaTop(spek.formula);
  const nom = spek.nom.trim().toLowerCase();
  if (!nom) x.nom = 'Номини киритинг';
  else if (royxat.some((k) => k.id !== spek.id && k.nom.trim().toLowerCase() === nom)) x.nom = 'Бундай номли кўрсаткич бор';
  if (!spek.a.nom.trim()) x.a = 'A майдони номини киритинг';
  if (f.b && !spek.b.nom.trim()) x.b = 'B майдони номини киритинг';
  if (!spek.natijaNom.trim()) x.natijaNom = 'Натижа устуни номини киритинг';
  const ch = chegaraTekshir(spek.yonalish, spek.standart);
  for (const [k, v] of Object.entries(ch)) x[`standart.${k}`] = v;
  return x;
}
