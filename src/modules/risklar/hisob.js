/*
 * Hisob dvigateli — ko'rsatkich ta'rifi + davr + sozlama → 2 darajali daraxt.
 *
 *   1-daraja: tashkilot (INN). Qiymatlari bolalardan YIG'ILADI: xom summalar
 *             qo'shiladi va foizlar yig'indidan qayta hisoblanadi (o'rtacha
 *             foiz emas). `jami` berilgan ustun bundan mustasno.
 *   2-daraja: ko'rsatkich kesimi (hisob raqami, ЛС, shartnoma, …).
 *
 * Prototipdan farqi: chegaradan past qatorlar TASHLAB YUBORILMAYDI —
 * ular «Норма» darajasini oladi va filtr bilan yashirilishi mumkin.
 *
 * Xom ma'lumot (generator natijasi) sozlamaga bog'liq emas, shuning uchun
 * (ko'rsatkich, davr) bo'yicha keshlanadi; sozlama o'zgarsa faqat `hosila`
 * va daraja qayta hisoblanadi.
 */
import { rng, qisqich } from '../../lib/rng.js';
import { TASHKILOTLAR } from '../../reference/tashkilotlar.js';
import { DAVRLAR } from '../../reference/davrlar.js';

export const DARAJALAR = [
  { id: 'yuqori', nom: 'Юқори', vazn: 3 },
  { id: 'orta', nom: 'Ўрта', vazn: 2 },
  { id: 'past', nom: 'Паст', vazn: 1 },
  { id: 'norma', nom: 'Норма', vazn: 0 }
];
export const darajaNom = (id) => DARAJALAR.find((d) => d.id === id)?.nom ?? '—';
export const darajaVazn = (id) => DARAJALAR.find((d) => d.id === id)?.vazn ?? -1;

/**
 * Qiymat → daraja. Chegara qiymatning o'zi ham kiradi (≥ yoki ≤).
 * 'yuqori' yo'nalishda: chegara ≤ orta ≤ yuqori; 'past' da teskari.
 */
export function daraja(v, s, yonalish) {
  if (v == null || Number.isNaN(v)) return null;
  if (yonalish === 'past') {
    if (v <= s.yuqori) return 'yuqori';
    if (v <= s.orta) return 'orta';
    if (v <= s.chegara) return 'past';
    return 'norma';
  }
  if (v >= s.yuqori) return 'yuqori';
  if (v >= s.orta) return 'orta';
  if (v >= s.chegara) return 'past';
  return 'norma';
}

/** Chegaralar tartibi: { maydon: xabar } — sozlamalar va konstruktor uchun bitta qoida */
export function chegaraTekshir(yonalish, s) {
  const x = {};
  for (const f of ['chegara', 'orta', 'yuqori']) if (!Number.isFinite(s[f])) x[f] = 'Сон киритинг';
  if (Object.keys(x).length) return x;
  if (yonalish === 'past') {
    if (s.orta > s.chegara) x.orta = 'Ўрта даража риск чегарасидан катта бўлмаслиги керак';
    if (s.yuqori > s.orta) x.yuqori = 'Юқори даража ўрта даражадан катта бўлмаслиги керак';
  } else {
    if (s.orta < s.chegara) x.orta = 'Ўрта даража риск чегарасидан кичик бўлмаслиги керак';
    if (s.yuqori < s.orta) x.yuqori = 'Юқори даража ўрта даражадан кичик бўлмаслиги керак';
  }
  return x;
}

/* ---------------------------------------------------------------- xom */

const KESH = new Map();

/** Tashkilotning shu ko'rsatkichdagi xavf moyilligi — davrlar bo'yicha barqaror */
function moyillik(kId, orgId) {
  const r = rng('moyil', kId, orgId);
  return r();
}

function xom(k, davr) {
  /* `versiya` — foydalanuvchi ko'rsatkichi tahrirlansa, eski kesh ishlatilmaydi */
  const kalit = `${k.id}|${k.versiya ?? ''}|${davr.id}`;
  if (KESH.has(kalit)) return KESH.get(kalit);

  const natija = TASHKILOTLAR.map((org) => {
    const m = moyillik(k.id, org.id);
    const faza = rng('faza', k.id, org.id)() * 12;
    const bolalar = k.bolalar(rng('kesim', k.id, org.id), org).map((bola, i) => {
      const rb = rng('bola', k.id, bola.id);
      const bolaMoyil = qisqich(m + (rb() - 0.5) * 0.4);
      const r = rng('qiymat', k.id, bola.id, davr.id);
      /* Oyma-oy tebranish: shovqin + yillik to'lqin — dinamika jonli bo'lsin */
      const x = qisqich(bolaMoyil + (r() - 0.5) * 0.26 + 0.09 * Math.sin(((davr.idx + faza) / 12) * 2 * Math.PI));
      const ctx = { org, bola, davr, i };
      return { bola, baza: { ...bola.maydon, ...k.yarat(r, x, ctx) } };
    });
    return { org, bolalar };
  });

  /* Konstruktor ko'rinishi har bosishda yangi spek beradi — keshlanmaydi */
  if (!k.keshsiz) KESH.set(kalit, natija);
  return natija;
}

/* ------------------------------------------------------------- yig'ish */

const UMUMIY = { sum: (a) => a.reduce((s, v) => s + v, 0), max: (a) => Math.max(...a), min: (a) => Math.min(...a) };

/** Bolalar qatorlaridan ota qator: xom yig'indi → hosila → `jami` ustunlari */
function jamla(k, qlar, p, davr) {
  const baza = {};
  const kalitlar = new Set(qlar.flatMap((q) => Object.keys(q)));
  for (const kl of kalitlar) {
    const vs = qlar.map((q) => q[kl]);
    if (vs.every((v) => typeof v === 'number')) baza[kl] = UMUMIY.sum(vs);
    else if (vs.every((v) => v === vs[0])) baza[kl] = vs[0];
    else baza[kl] = null;
  }
  const q = { ...baza, ...(k.hosila ? k.hosila(baza, p, davr) : {}) };

  for (const u of k.ustunlar) {
    if (u.jami === undefined) continue;
    if (u.jami === 'none') q[u.kalit] = null;
    else if (typeof u.jami === 'function') q[u.kalit] = u.jami(qlar, p, davr);
    else {
      const vs = qlar.map((x) => x[u.kalit]).filter((v) => typeof v === 'number');
      q[u.kalit] = vs.length ? UMUMIY[u.jami](vs) : null;
    }
  }
  return q;
}

/**
 * Asosiy hisob.
 * @param filtr  { [kesimFiltrKaliti]: variantId } — ikkinchi daraja filtri
 * @returns { qatorlar: [{ id, org, q, qiymat, daraja, bolalar, riskli }], jami }
 */
export function hisobla(k, davr, soz, filtr = {}) {
  const p = soz.parametrlar;
  const qiy = (q) => q[k.asosiy];

  const qatorlar = [];
  for (const { org, bolalar } of xom(k, davr)) {
    const mos = bolalar.filter(({ baza }) =>
      (k.filtrlar ?? []).every((f) => !filtr[f.kalit] || baza[f.kalit] === filtr[f.kalit])
    );
    if (!mos.length) continue;

    const bq = mos.map(({ bola, baza }) => {
      const q = { ...baza, ...(k.hosila ? k.hosila(baza, p, davr) : {}) };
      return { id: bola.id, bola, q, qiymat: qiy(q), daraja: daraja(qiy(q), soz, k.yonalish) };
    });
    const q = jamla(
      k,
      bq.map((b) => b.q),
      p,
      davr
    );
    qatorlar.push({
      id: org.id,
      org,
      q,
      qiymat: qiy(q),
      daraja: daraja(qiy(q), soz, k.yonalish),
      bolalar: bq,
      riskli: bq.filter((b) => b.daraja && b.daraja !== 'norma').length
    });
  }

  const jq = qatorlar.length
    ? jamla(
        k,
        qatorlar.map((t) => t.q),
        p,
        davr
      )
    : null;
  return {
    qatorlar,
    jami: jq ? { q: jq, qiymat: qiy(jq), daraja: daraja(qiy(jq), soz, k.yonalish) } : null
  };
}

/** Filtrlangan tashkilotlar uchun «Жами» qatori (sahifa filtri o'zgarganda) */
export function jamiQator(k, qatorlar, soz, davr) {
  if (!qatorlar.length) return null;
  const q = jamla(
    k,
    qatorlar.map((t) => t.q),
    soz.parametrlar,
    davr
  );
  return { q, qiymat: q[k.asosiy], daraja: daraja(q[k.asosiy], soz, k.yonalish) };
}

/** Darajalar bo'yicha sanoq: { yuqori, orta, past, norma } */
export function sanoq(qatorlar) {
  const s = { yuqori: 0, orta: 0, past: 0, norma: 0 };
  for (const t of qatorlar) if (t.daraja) s[t.daraja]++;
  return s;
}

/** Oylik dinamika (o'qilgan davrlar bo'yicha): har oy uchun darajalar sanog'i */
export function dinamika(k, soz, filtr = {}, tanlov = () => true, davrlar = DAVRLAR) {
  return davrlar.map((davr) => ({
    davr,
    ...sanoq(hisobla(k, davr, soz, filtr).qatorlar.filter((t) => tanlov(t.org)))
  }));
}

/** Filtrning standart qiymati (majburiy filtr birinchi variantdan boshlanadi) */
export const standartFiltr = (k) =>
  Object.fromEntries((k.filtrlar ?? []).map((f) => [f.kalit, f.majburiy ? f.variantlar[0].id : '']));
