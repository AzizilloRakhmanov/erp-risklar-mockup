/*
 * Risk hujjati — model (sof funksiyalar, React'siz).
 *
 * Hayot sikli:
 *   RabbitMQ paketi → `yuklashniQayta` → har bir faol ko'rsatkichning har bir
 *   kesimi tekshiriladi:
 *     - ochiq risk bor   → qiymat tarixiga yoziladi; normaga qaytgan bo'lsa
 *                          avtomatik yopiladi (asos: «avto»)
 *     - ochiq risk yo'q  → riskli bo'lsa yangi risk (manba: «avto»),
 *                          kalit ignor muddatida bo'lsa — yaratilmaydi
 *   Foydalanuvchi: manual risk yaratadi, statusni o'zgartiradi, fayl bilan
 *   yopadi, ignor muddati belgilaydi. Har bir amal `tarix` ga yoziladi.
 *
 * Kalit (dublikat va ignor uchun): `${kId}|${kesimId}`; kesimsiz manual
 * risk uchun `${kId}|org:${orgId}`.
 */
import { rng, butun, tanla } from '../../../lib/rng.js';
import { qiymatMatn } from '../../../lib/format.js';
import { DAVRLAR } from '../../../reference/davrlar.js';
import { FOYDALANUVCHILAR, TIZIM } from '../../../reference/foydalanuvchilar.js';
import { asosiyUstun } from '../korsatkichlar/index.js';
import { hisobla, darajaVazn } from '../hisob.js';

/* ------------------------------------------------------------ ma'lumotnoma */

export const STATUSLAR = [
  { id: 'yangi', nom: 'Янги' },
  { id: 'ijroda', nom: 'Ижрода' },
  { id: 'tekshiruvda', nom: 'Текширувда' },
  { id: 'yopilgan', nom: 'Бартараф этилди' },
  { id: 'bekor', nom: 'Бекор қилинди' }
];
export const statusNom = (id) => STATUSLAR.find((s) => s.id === id)?.nom ?? id;
export const OCHIQ = new Set(['yangi', 'ijroda', 'tekshiruvda']);

/** Statusdan statusga o'tishlar. `yopish` — izoh majburiy, fayl va ignor ixtiyoriy */
export const OTISHLAR = {
  yangi: [
    { ga: 'ijroda', nom: 'Ишга олиш' },
    { ga: 'bekor', nom: 'Бекор қилиш', izohShart: true, xavf: true }
  ],
  ijroda: [
    { ga: 'tekshiruvda', nom: 'Текширувга юбориш' },
    { ga: 'yopilgan', nom: 'Бартараф этилди', yopish: true, asosiy: true },
    { ga: 'bekor', nom: 'Бекор қилиш', izohShart: true, xavf: true }
  ],
  tekshiruvda: [
    { ga: 'yopilgan', nom: 'Тасдиқлаш ва ёпиш', yopish: true, asosiy: true },
    { ga: 'ijroda', nom: 'Қайта ишлашга қайтариш', izohShart: true }
  ],
  yopilgan: [{ ga: 'ijroda', nom: 'Қайта очиш', izohShart: true }],
  bekor: [{ ga: 'ijroda', nom: 'Қайта очиш', izohShart: true }]
};

export const USTUVORLIKLAR = [
  { id: 'yuqori', nom: 'Юқори' },
  { id: 'orta', nom: 'Ўрта' },
  { id: 'past', nom: 'Паст' }
];
export const ustuvorlikNom = (id) => USTUVORLIKLAR.find((u) => u.id === id)?.nom ?? id;

export const STANDART_SOZLAMA = {
  avtoYaratish: true,
  avtoYopish: true,
  minDaraja: 'past',
  /* Ma'lumot oyiga bir marta keladi — avto yopilish eng erta keyingi paketda */
  muddat: { yuqori: 30, orta: 45, past: 60 }
};

/*
 * Holat sxemasi versiyasi. Interfeys matni o'zgarsa (masalan, tarixdagi
 * avtomatik izohlar) oshiriladi — eski saqlangan holat qayta quriladi.
 * Mijozga ko'rsatiladigan matnda integratsiya atamalari (navbat, paket, …)
 * ishlatilmaydi.
 */
export const VERSIYA = 2;

/* ------------------------------------------------------------------ sana */

const ikki = (n) => String(n).padStart(2, '0');
const isoDan = (d) =>
  `${d.getUTCFullYear()}-${ikki(d.getUTCMonth() + 1)}-${ikki(d.getUTCDate())}T${ikki(d.getUTCHours())}:${ikki(d.getUTCMinutes())}`;
const isodanDate = (iso) => new Date(`${iso.length === 10 ? iso + 'T00:00' : iso}:00Z`);

/** Mahalliy «hozir» (vaqt mintaqasini UTC sifatida saqlaymiz — mockup uchun yetarli) */
export function hozir() {
  const d = new Date();
  return `${d.getFullYear()}-${ikki(d.getMonth() + 1)}-${ikki(d.getDate())}T${ikki(d.getHours())}:${ikki(d.getMinutes())}`;
}
export const bugun = () => hozir().slice(0, 10);

export function kunQosh(iso, n, soat = 0) {
  const d = isodanDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(d.getUTCHours() + soat);
  return isoDan(d);
}
export const kunFarqi = (a, b) => Math.round((isodanDate(b.slice(0, 10)) - isodanDate(a.slice(0, 10))) / 864e5);

export const sanaMatn = (iso) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '—');
export const vaqtMatn = (iso) => (iso ? `${sanaMatn(iso)} ${iso.slice(11, 16)}` : '—');

/** Davr paketi RabbitMQ ga keyingi oyning 5-sanasida, 06:00 da tushadi */
export function paketSanasi(davr) {
  const d = new Date(Date.UTC(davr.yil, davr.oy, 5, 6, 0));
  return isoDan(d);
}

/* ------------------------------------------------------------- yordamchi */

export const riskKaliti = (kId, kesimId, orgId) => `${kId}|${kesimId ?? `org:${orgId}`}`;

/* Qiymat tarixi ixcham saqlanadi: [davrId, qiymat, daraja] — 1000+ risk localStorage ga sig'sin */
const yaxlitla = (v) => (v == null ? null : Math.round(v * 100) / 100);
export const qiymatYozuvi = ([davrId, qiymat, daraja]) => ({ davrId, qiymat, daraja });

export function muddatHisobla(sana, ustuvorlik, sozlama) {
  return kunQosh(sana, sozlama.muddat[ustuvorlik] ?? 20).slice(0, 10);
}

/**
 * Muddat holati:
 *   ochiq  — 'otgan' (o'tib ketgan) | 'yaqin' (≤ 3 kun) | 'bor'
 *   yopiq  — 'muddatida' | 'kechikib'
 */
export function muddatHolati(r, bugunSana = bugun()) {
  if (r.status === 'bekor') return null;
  if (r.status === 'yopilgan') return r.yopilgan.slice(0, 10) <= r.muddat ? 'muddatida' : 'kechikib';
  if (bugunSana > r.muddat) return 'otgan';
  return kunFarqi(bugunSana, r.muddat) <= 3 ? 'yaqin' : 'bor';
}
export const MUDDAT_HOLATI = {
  otgan: 'Муддати ўтган',
  yaqin: 'Муддати яқин',
  bor: 'Муддат бор',
  muddatida: 'Муддатида',
  kechikib: 'Кечикиб'
};

export function chegaraMatni(r) {
  return `${r.yonalish === 'past' ? '≤' : '≥'} ${qiymatMatn(r.chegaralar.chegara, r.tur)}`;
}

/** Risk qiymati va sababi: «Бўш, % = 34,9% (риск чегараси ≥ 10,0%)» */
export const sababMatni = (r, qiymat = r.qiymat) =>
  `${r.asosiyNom} = ${qiymatMatn(qiymat, r.tur)} (риск чегараси ${chegaraMatni(r)})`;

/** Faol ignor: kalit → { gacha, riskId } */
export function ignorlar(risklar, bugunSana = bugun()) {
  const m = new Map();
  for (const r of risklar) {
    if (!r.ignorGacha || r.ignorGacha < bugunSana) continue;
    const eski = m.get(r.kalit);
    if (!eski || eski.gacha < r.ignorGacha) m.set(r.kalit, { gacha: r.ignorGacha, riskId: r.id, r });
  }
  return m;
}

const tarixYoz = (r, vaqt, kim, tur, qolgan = {}) => {
  r.tarix.push({ vaqt, kim: kim.id, tur, ...qolgan });
};

function raqamBer(h, sana) {
  h.seq += 1;
  return `Р-${sana.slice(0, 10).replace(/-/g, '')}-${String(h.seq).padStart(4, '0')}`;
}

/* --------------------------------------------------------------- yaratish */

/**
 * Yangi risk (draft holatga yoziladi).
 * `m`: { k, soz, org, bola?, qiymat, daraja, davr, manba, yuklashId?, ustuvorlik?, muddat?, masul?, izoh? }
 */
function _yarat(h, m, kim, sana) {
  const u = asosiyUstun(m.k);
  const ustuvorlik = m.ustuvorlik ?? (m.daraja && m.daraja !== 'norma' ? m.daraja : 'orta');
  const r = {
    id: `r${h.seq + 1}`,
    raqam: raqamBer(h, sana),
    kalit: riskKaliti(m.k.id, m.bola?.id, m.org.id),
    manba: m.manba,
    yuklashId: m.yuklashId ?? null,
    muallif: kim.id,
    yaratilgan: sana,
    guruh: m.k.guruh,
    kId: m.k.id,
    kKod: m.k.kod,
    kNom: m.k.nom,
    orgId: m.org.id,
    orgNom: m.org.nom,
    inn: m.org.inn,
    kesimTuri: m.bola ? m.k.kesimNomi : null,
    kesimId: m.bola?.id ?? null,
    kesimNom: m.bola?.nom ?? null,
    kesimIzoh: m.bola?.izoh ?? null,
    davrId: m.davr.id,
    asosiyNom: u.nom,
    tur: u.tur,
    yonalish: m.k.yonalish,
    chegaralar: { chegara: m.soz.chegara, orta: m.soz.orta, yuqori: m.soz.yuqori },
    qiymat: yaxlitla(m.qiymat),
    daraja: m.daraja,
    joriyQiymat: yaxlitla(m.qiymat),
    joriyDaraja: m.daraja,
    ustuvorlik,
    muddat: m.muddat ?? muddatHisobla(sana, ustuvorlik, h.sozlama),
    masul: m.masul ?? null,
    status: 'yangi',
    yopilgan: null,
    yopilishAsosi: null,
    yopilishIzohi: null,
    fayllar: [],
    ignorGacha: null,
    izoh: m.izoh ?? '',
    qiymatlar: [[m.davr.id, yaxlitla(m.qiymat), m.daraja]],
    tarix: []
  };
  tarixYoz(r, sana, kim, 'yaratildi', {
    izoh: m.manba === 'avto' ? `Маълумотлар янгиланишида автоматик аниқланди (${m.davr.nom} маълумоти)` : m.izoh || 'Мануал яратилди'
  });
  h.risklar.push(r);
  return r;
}

/* ----------------------------------------------------- RabbitMQ yuklashi */

/**
 * Bitta paketni qayta ishlash (draft `h` o'zgaradi).
 * Kesim darajasida tekshiriladi — tashkilot sarti emas, chunki risk aniq
 * hisob raqami / mahsulot / ЛС ga biriktiriladi.
 */
function _yuklash(h, { davr, sana, korsatkichlar, sozlamalar }) {
  const boshlandi = typeof performance !== 'undefined' ? performance.now() : 0;
  const yuklashId = `L-${davr.id.replace('-', '')}-${String(h.yuklashlar.length + 1).padStart(3, '0')}`;
  const st = { xabarlar: 0, yangi: 0, yangilandi: 0, yopildi: 0, ignor: 0, korsatkichlar: 0 };
  const sana10 = sana.slice(0, 10);

  const ochiq = new Map();
  for (const r of h.risklar) if (OCHIQ.has(r.status)) ochiq.set(r.kalit, r);
  const ign = ignorlar(h.risklar, sana10);
  const minVazn = darajaVazn(h.sozlama.minDaraja);

  for (const k of korsatkichlar) {
    const soz = sozlamalar[k.id];
    if (!soz?.faol) continue;
    st.korsatkichlar++;
    /* Kesim filtrisiz: majburiy filtr (avans/oylik) faqat tashkilot sartini
       yig'ish uchun kerak, kesim darajasida aralashmaydi */
    const { qatorlar } = hisobla(k, davr, soz, {});
    for (const t of qatorlar) {
      for (const b of t.bolalar) {
        st.xabarlar++;
        const kalit = riskKaliti(k.id, b.id, t.org.id);
        const r = ochiq.get(kalit);
        if (r) {
          r.qiymatlar.push([davr.id, yaxlitla(b.qiymat), b.daraja]);
          const eskiDaraja = r.joriyDaraja;
          r.joriyQiymat = yaxlitla(b.qiymat);
          r.joriyDaraja = b.daraja;
          st.yangilandi++;
          if (b.daraja === 'norma' && h.sozlama.avtoYopish) {
            const izoh = `${davr.nom} маълумотига кўра ${r.asosiyNom} = ${qiymatMatn(b.qiymat, r.tur)} — риск чегарасидан (${chegaraMatni(r)}) чиқди.`;
            tarixYoz(r, sana, TIZIM, 'status', { dan: r.status, ga: 'yopilgan', izoh, yuklashId });
            Object.assign(r, { status: 'yopilgan', yopilgan: sana, yopilishAsosi: 'avto', yopilishIzohi: izoh });
            ochiq.delete(kalit);
            st.yopildi++;
          } else if (eskiDaraja !== b.daraja) {
            tarixYoz(r, sana, TIZIM, 'daraja', { dan: eskiDaraja, ga: b.daraja, yuklashId, izoh: `${qiymatMatn(b.qiymat, r.tur)}` });
          }
          continue;
        }
        if (!h.sozlama.avtoYaratish || !b.daraja || b.daraja === 'norma' || darajaVazn(b.daraja) < minVazn) continue;
        if (ign.has(kalit)) {
          st.ignor++;
          continue;
        }
        const yangi = _yarat(
          h,
          { k, soz, org: t.org, bola: b.bola, qiymat: b.qiymat, daraja: b.daraja, davr, manba: 'avto', yuklashId },
          TIZIM,
          sana
        );
        ochiq.set(kalit, yangi);
        st.yangi++;
      }
    }
  }

  h.yuklashlar.push({
    id: yuklashId,
    sana,
    davrId: davr.id,
    ...st,
    davomiylik: Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : 1) - boshlandi))
  });
  h.yuklangan = davr.idx + 1;
  return yuklashId;
}

/* ----------------------------------------------------------- amallar */

function _status(h, id, ga, { izoh = '', fayllar = [], ignorGacha = null } = {}, kim, sana) {
  const r = h.risklar.find((x) => x.id === id);
  if (!r) return;
  const dan = r.status;
  tarixYoz(r, sana, kim, 'status', { dan, ga, izoh });
  r.status = ga;
  if (ga === 'yopilgan' || ga === 'bekor') {
    Object.assign(r, { yopilgan: sana, yopilishAsosi: 'manual', yopilishIzohi: izoh || null });
  } else if (!OCHIQ.has(dan)) {
    /* Qayta ochish — yopilish ma'lumoti tozalanadi, muddat yangidan */
    Object.assign(r, { yopilgan: null, yopilishAsosi: null, yopilishIzohi: null, muddat: muddatHisobla(sana, r.ustuvorlik, h.sozlama) });
  }
  if (fayllar.length) {
    r.fayllar.push(...fayllar.map((f) => ({ ...f, kim: kim.id, sana })));
    tarixYoz(r, sana, kim, 'fayl', { izoh: fayllar.map((f) => f.nom).join(', ') });
  }
  if (ignorGacha) _ignor(r, ignorGacha, '', kim, sana);
}

function _ignor(r, gacha, izoh, kim, sana) {
  tarixYoz(r, sana, kim, 'ignor', { dan: r.ignorGacha, ga: gacha, izoh });
  r.ignorGacha = gacha;
}

/* Tashqi API: holatni o'zgartirmaydi — yangi obyekt qaytaradi */
const nusxa = (h) => ({ ...h, risklar: h.risklar.map((r) => r), yuklashlar: [...h.yuklashlar] });
const riskNusxa = (h, id) => {
  const i = h.risklar.findIndex((r) => r.id === id);
  if (i >= 0) h.risklar[i] = { ...h.risklar[i], tarix: [...h.risklar[i].tarix], fayllar: [...h.risklar[i].fayllar], qiymatlar: [...h.risklar[i].qiymatlar] };
  return h.risklar[i];
};

export function yuklashniQayta(holat, ctx) {
  const h = nusxa(holat);
  /* Ochiq risklar qiymat tarixi o'zgaradi — ularni nusxalaymiz */
  h.risklar = h.risklar.map((r) => (OCHIQ.has(r.status) ? { ...r, tarix: [...r.tarix], qiymatlar: [...r.qiymatlar] } : r));
  const id = _yuklash(h, ctx);
  return { holat: h, yuklashId: id };
}

export function riskYarat(holat, m, kim, sana = hozir()) {
  const h = nusxa(holat);
  const r = _yarat(h, { ...m, manba: 'manual' }, kim, sana);
  return { holat: h, risk: r };
}

export function statusOzgartir(holat, id, ga, qolgan, kim, sana = hozir()) {
  const h = nusxa(holat);
  riskNusxa(h, id);
  _status(h, id, ga, qolgan, kim, sana);
  return h;
}

export function ignorBelgila(holat, id, gacha, izoh, kim, sana = hozir()) {
  const h = nusxa(holat);
  const r = riskNusxa(h, id);
  _ignor(r, gacha, izoh, kim, sana);
  return h;
}

export function izohQosh(holat, id, matn, fayllar, kim, sana = hozir()) {
  const h = nusxa(holat);
  const r = riskNusxa(h, id);
  if (matn) tarixYoz(r, sana, kim, 'izoh', { izoh: matn });
  if (fayllar?.length) {
    r.fayllar.push(...fayllar.map((f) => ({ ...f, kim: kim.id, sana })));
    tarixYoz(r, sana, kim, 'fayl', { izoh: fayllar.map((f) => f.nom).join(', ') });
  }
  return h;
}

export function maydonOzgartir(holat, id, patch, kim, sana = hozir()) {
  const h = nusxa(holat);
  const r = riskNusxa(h, id);
  for (const [k, v] of Object.entries(patch)) {
    if (r[k] === v) continue;
    tarixYoz(r, sana, kim, k, { dan: r[k], ga: v });
    r[k] = v;
  }
  return h;
}

/* ------------------------------------------------------ demo tarixi */

const FAYL_NAMUNALARI = [
  { nom: 'Тушунтириш хати.pdf', tur: 'application/pdf', hajm: 184320 },
  { nom: 'Тузатилган ҳисобот.xlsx', tur: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', hajm: 52480 },
  { nom: 'Далолатнома.pdf', tur: 'application/pdf', hajm: 241664 },
  { nom: 'Буйруқ нусхаси.jpg', tur: 'image/jpeg', hajm: 398336 }
];
const YOPISH_IZOHLARI = [
  'Ташкилотдан тушунтириш хати олинди, камчилик бартараф этилди.',
  'Касса ижроси тикланди, тасдиқловчи ҳужжатлар илова қилинди.',
  'Шартнома шартлари қайта кўриб чиқилди, қўшимча келишув имзоланди.',
  'Масъул ходимга интизомий чора кўрилди, тартиб тикланди.'
];

/**
 * Boshlang'ich holat: dastlabki `n` paket qayta o'ynatiladi va paketlar
 * orasida foydalanuvchi amallari (ishga olish, tekshiruv, manual yopish,
 * ignor, manual risk) deterministik tarzda qo'shiladi.
 */
export function boshlangichHolat(korsatkichlar, sozlamalar, n = DAVRLAR.length - 1) {
  const h = { versiya: VERSIYA, seq: 0, yuklangan: 0, yuklashlar: [], risklar: [], sozlama: structuredClone(STANDART_SOZLAMA) };
  const r = rng('hujjat-demo');
  const u = () => tanla(r, FOYDALANUVCHILAR);

  for (let i = 0; i < n; i++) {
    const davr = DAVRLAR[i];
    const sana = paketSanasi(davr);
    const keyingi = i + 1 < DAVRLAR.length ? paketSanasi(DAVRLAR[i + 1]) : kunQosh(sana, 30);
    const chegara = (s) => (s < keyingi ? s : null);
    _yuklash(h, { davr, sana, korsatkichlar, sozlamalar });

    /* Paketlar orasidagi foydalanuvchi amallari */
    for (const x of h.risklar) {
      if (!OCHIQ.has(x.status) || x.yaratilgan > sana) continue;
      const y = r();
      if (x.status === 'yangi' && y < 0.6) {
        const s = chegara(kunQosh(x.yaratilgan, butun(r, 1, 4), butun(r, 2, 8)));
        if (s) {
          _status(h, x.id, 'ijroda', {}, u(), s);
          x.masul = x.masul ?? tanla(r, FOYDALANUVCHILAR).id;
        }
      } else if (x.status === 'ijroda' && y < 0.35) {
        const s = chegara(kunQosh(sana, butun(r, 3, 12), butun(r, 1, 9)));
        if (s) _status(h, x.id, 'tekshiruvda', { izoh: 'Ташкилотдан ҳужжатлар сўралди' }, u(), s);
      } else if (x.status === 'tekshiruvda' && y < 0.45) {
        const s = chegara(kunQosh(sana, butun(r, 6, 20), butun(r, 1, 9)));
        if (s) {
          _status(
            h,
            x.id,
            'yopilgan',
            {
              izoh: tanla(r, YOPISH_IZOHLARI),
              fayllar: [{ id: `f${x.id}`, ...tanla(r, FAYL_NAMUNALARI), mazmun: null }],
              ignorGacha: r() < 0.35 ? kunQosh(s, tanla(r, [30, 60, 90])).slice(0, 10) : null
            },
            tanla(r, FOYDALANUVCHILAR.slice(1)),
            s
          );
        }
      }
    }

    /* Har oy 1–2 ta manual risk (hisobotni ko'rish davomida) */
    for (let j = 0; j < butun(r, 1, 2); j++) {
      const k = tanla(r, korsatkichlar.filter((x) => sozlamalar[x.id]?.faol));
      const t = tanla(r, hisobla(k, davr, sozlamalar[k.id], {}).qatorlar);
      const b = r() < 0.7 ? tanla(r, t.bolalar) : null;
      const s = chegara(kunQosh(sana, butun(r, 2, 20), butun(r, 2, 9)));
      if (!s || h.risklar.some((x) => OCHIQ.has(x.status) && x.kalit === riskKaliti(k.id, b?.id, t.org.id))) continue;
      _yarat(
        h,
        {
          k,
          soz: sozlamalar[k.id],
          org: t.org,
          bola: b?.bola,
          qiymat: b ? b.qiymat : t.qiymat,
          daraja: b ? b.daraja : t.daraja,
          davr,
          manba: 'manual',
          ustuvorlik: tanla(r, ['yuqori', 'orta', 'orta', 'past']),
          masul: tanla(r, FOYDALANUVCHILAR).id,
          izoh: 'Ҳисоботни кўриш давомида аниқланди: кўрсаткич тенденцияси ёмонлашмоқда, ташкилотдан изоҳ сўраш керак.'
        },
        u(),
        s
      );
    }
  }
  return h;
}
