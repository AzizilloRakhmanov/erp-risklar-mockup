/*
 * Kommunal resurslardan foydalanish — 1 ko'rsatkich.
 *
 * Ikkinchi daraja — hisob raqami EMAS, ta'minotchidagi shaxsiy hisob (ЛС).
 * Natural birliklar har xil (кВт·соат, м³, Гкал), shuning uchun tashkilot
 * sartida hajmlar faqat bitta birlik bo'lganda qo'shiladi; aralash bo'lsa —
 * eng katta o'zgarish ko'rsatiladi.
 */
import { oraliq } from '../../../lib/rng.js';
import { son } from '../../../lib/format.js';
import { RESURSLAR } from '../../../reference/kataloglar.js';
import { litsevoyKesimi } from './kesim.js';

const ozg = (a, b) => (b ? ((a - b) / b) * 100 : null);
const jamla = (qlar, k) => qlar.reduce((s, q) => s + (q[k] ?? 0), 0);
const birXil = (qlar) => qlar.length > 0 && qlar[0].birlik != null && qlar.every((q) => q.birlik === qlar[0].birlik);

/** Taqqoslash bazasiga ko'ra asosiy ko'rsatkich */
function tanlangan(oyFarq, yilFarq, p) {
  const v =
    p.taqqoslash === 'oy'
      ? oyFarq
      : p.taqqoslash === 'yil'
        ? yilFarq
        : Math.abs(oyFarq ?? 0) >= Math.abs(yilFarq ?? 0)
          ? oyFarq
          : yilFarq;
  if (v == null) return null;
  return p.faqatOsish ? Math.max(0, v) : Math.abs(v);
}

const TAQQOSLASH = [
  { id: 'ikkala', nom: 'Иккаласидан каттаси' },
  { id: 'oy', nom: 'Аввалги ойга нисбатан' },
  { id: 'yil', nom: 'Ўтган йилнинг шу ойига нисбатан' }
];

const TAQQOSLASH_MATN = {
  ikkala: 'аввалги ойга ёки ўтган йилнинг шу ойига нисбатан',
  oy: 'аввалги ойга нисбатан',
  yil: 'ўтган йилнинг шу ойига нисбатан'
};

/** Bir xil birlikda — yig'indidan qayta hisob, aralashda — bolalarning eng kattasi */
const hajmJami = (k) => (qlar) => (birXil(qlar) ? jamla(qlar, k) : null);
const farqJami = (k) => (qlar, p) => {
  if (birXil(qlar)) {
    const oy = ozg(jamla(qlar, 'joriy'), jamla(qlar, 'avvalgi'));
    const yil = ozg(jamla(qlar, 'joriy'), jamla(qlar, 'otganYil'));
    return k === 'ozgarish' ? tanlangan(oy, yil, p) : k === 'oyFarq' ? oy : yil;
  }
  const qiymatlar = qlar.map((q) => q[k]).filter((v) => v != null);
  if (!qiymatlar.length) return null;
  return qiymatlar.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m));
};

export default [
  {
    id: 'kommunal-ozgarish',
    nom: 'Коммунал харажатларни ўзгариши',
    tavsif: (s) => {
      const t = TAQQOSLASH_MATN[s.parametrlar.taqqoslash] ?? '';
      return `Жорий ойда сарфланган коммунал ресурс (натурада) ${t} ${son(s.chegara)}% ва ундан кўп ${s.parametrlar.faqatOsish ? 'ошган' : 'ўзгарган'} ташкилотлар. Иккинчи даража — таъминотчидаги лицевой ҳисоб.`;
    },
    kesimNomi: 'Лицевой ҳисоб',
    bolalar: litsevoyKesimi,
    filtrlar: [{ kalit: 'resurs', nom: 'Ресурс тури', variantlar: RESURSLAR.map((r) => ({ id: r.id, nom: r.nom })) }],
    asosiy: 'ozgarish',
    yonalish: 'yuqori',
    standart: { chegara: 20, orta: 35, yuqori: 50 },
    parametrlar: [
      { kalit: 'taqqoslash', nom: 'Солиштириш базаси', tur: 'tanlov', standart: 'ikkala', variantlar: TAQQOSLASH },
      {
        kalit: 'faqatOsish',
        nom: 'Фақат ўсишни ҳисобга олиш',
        tur: 'mantiq',
        standart: false,
        izoh: 'Ўчирилган бўлса, кескин камайиш ҳам риск ҳисобланади (ҳисоблагич носозлиги ёки ҳисобга олинмаган истеъмол).'
      }
    ],
    ustunlar: [
      { kalit: 'resursNom', nom: 'Ресурс тури', tur: 'matn' },
      { kalit: 'taminotchi', nom: 'Таъминотчи', tur: 'matn' },
      { kalit: 'birlik', nom: 'Бирлик', tur: 'matn' },
      { kalit: 'joriy', nom: 'Жорий ой', tur: 'son', jami: hajmJami('joriy') },
      { kalit: 'avvalgi', nom: 'Аввалги ой', tur: 'son', jami: hajmJami('avvalgi') },
      { kalit: 'oyFarq', nom: 'Аввалги ойга фарқ', tur: 'foiz', ishora: true, jami: farqJami('oyFarq') },
      { kalit: 'otganYil', nom: 'Ўтган йил шу ойи', tur: 'son', jami: hajmJami('otganYil') },
      { kalit: 'yilFarq', nom: 'Ўтган йилга фарқ', tur: 'foiz', ishora: true, jami: farqJami('yilFarq') },
      { kalit: 'ozgarish', nom: 'Ўзгариш, %', tur: 'foiz', jami: farqJami('ozgarish') }
    ],
    yarat: (r, x, ctx) => {
      const res = RESURSLAR.find((v) => v.id === ctx.bola.maydon.resurs);
      /* Isitish mavsumi: gaz va issiqlik qishda ko'payadi */
      const qish = [11, 12, 1, 2, 3].includes(ctx.davr.oy) && (res.id === 'gaz' || res.id === 'issiqlik') ? 1.8 : 1;
      const avvalgi = Math.round(res.hajm * ctx.org.hajm * qish * oraliq(r, 0.75, 1.25));
      const yon = r() < 0.75 ? 1 : -1;
      const sakrash = Math.max(0, x - 0.3) * 0.75;
      const joriy = Math.round(avvalgi * (1 + yon * sakrash + oraliq(r, -0.04, 0.04)));
      const otganYil = Math.round(joriy / (1 + yon * Math.max(0, x - 0.35) * 0.6 + oraliq(r, -0.05, 0.05)));
      return { avvalgi, joriy, otganYil };
    },
    hosila: (q, p) => {
      const oyFarq = ozg(q.joriy, q.avvalgi);
      const yilFarq = ozg(q.joriy, q.otganYil);
      return { oyFarq, yilFarq, ozgarish: tanlangan(oyFarq, yilFarq, p) };
    }
  }
];
