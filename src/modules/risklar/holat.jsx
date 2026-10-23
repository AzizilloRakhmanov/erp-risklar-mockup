/*
 * Modul holati: ko'rsatkichlar ro'yxati, ularning sozlamasi va tanlangan davr.
 *
 * Ro'yxat = tizimdagi 20 ta + foydalanuvchi yaratgan ko'rsatkichlar (spek,
 * `korsatkichlar/konstruktor.js`). Spek o'zgarsa ro'yxat qayta quriladi va
 * butun ilova (menyu, panel, hisobotlar, sozlamalar) yangisini ko'radi.
 *
 * Sozlama BARCHA ko'rsatkich uchun bir xil tuzilmada:
 *   { faol, chegara, orta, yuqori, parametrlar: { [kalit]: qiymat } }
 * Saqlanadi faqat foydalanuvchi o'zgartirgani; qolgani ta'rifdagi standart.
 *
 * Mockupda server yo'q: hammasi brauzerning localStorage'ida.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { royxatQur, keyingiRaqam } from './korsatkichlar/index.js';
import { chegaraTekshir } from './hisob.js';
import { JORIY_DAVR, davrTop } from '../../reference/davrlar.js';

const KALIT = 'risklar-sozlama-v1';
const SPEK_KALIT = 'risklar-korsatkichlar-v1';

export const standartSozlama = (k) => ({
  faol: true,
  ...k.standart,
  parametrlar: Object.fromEntries(k.parametrlar.map((p) => [p.kalit, p.standart]))
});

function oqi(kalit, bosh) {
  try {
    /* SSR smoke testida `window` yo'q */
    if (typeof window !== 'undefined') return JSON.parse(window.localStorage.getItem(kalit) ?? 'null') ?? bosh;
  } catch {
    /* yopiq yoki buzilgan — standartdan boshlaymiz */
  }
  return bosh;
}

function yoz(kalit, qiymat) {
  try {
    window.localStorage.setItem(kalit, JSON.stringify(qiymat));
  } catch {
    /* saqlanmasa ham joriy sessiyada ishlaydi */
  }
}

/** Saqlangan sozlama + ta'rif standarti (noma'lum yoki buzilgan maydon tashlanadi) */
function birlashtir(k, s = {}) {
  const st = standartSozlama(k);
  return {
    faol: typeof s.faol === 'boolean' ? s.faol : st.faol,
    chegara: Number.isFinite(s.chegara) ? s.chegara : st.chegara,
    orta: Number.isFinite(s.orta) ? s.orta : st.orta,
    yuqori: Number.isFinite(s.yuqori) ? s.yuqori : st.yuqori,
    parametrlar: Object.fromEntries(k.parametrlar.map((p) => [p.kalit, s.parametrlar?.[p.kalit] ?? st.parametrlar[p.kalit]]))
  };
}

/** Sozlama to'g'riligi: { maydon: xabar } — bo'sh obyekt = xato yo'q */
export function tekshir(k, s) {
  const x = chegaraTekshir(k.yonalish, s);
  for (const p of k.parametrlar) {
    if (!['foiz', 'son', 'summa'].includes(p.tur)) continue;
    const v = s.parametrlar[p.kalit];
    if (!Number.isFinite(v)) x[`p.${p.kalit}`] = 'Сон киритинг';
    else if (p.min != null && v < p.min) x[`p.${p.kalit}`] = `Камида ${p.min}`;
    else if (p.max != null && v > p.max) x[`p.${p.kalit}`] = `Кўпи билан ${p.max}`;
  }
  return x;
}

/** Sozlama standartdan farq qiladimi */
export const ozgarganmi = (k, s) => JSON.stringify(s) !== JSON.stringify(standartSozlama(k));

const Ctx = createContext(null);

/** `boshSpekler` — faqat smoke testi uchun (SSR da localStorage yo'q) */
export function RisklarHolati({ children, boshSpekler }) {
  const [xomSozlama, setXomSozlama] = useState(() => oqi(KALIT, {}));
  const [spekler, setSpekler] = useState(() => boshSpekler ?? oqi(SPEK_KALIT, []));
  const [davrId, setDavrId] = useState(JORIY_DAVR);

  const korsatkichlar = useMemo(() => royxatQur(spekler), [spekler]);
  const sozlamalar = useMemo(
    () => Object.fromEntries(korsatkichlar.map((k) => [k.id, birlashtir(k, xomSozlama[k.id])])),
    [korsatkichlar, xomSozlama]
  );

  const saqla = useCallback((id, s) => {
    setXomSozlama((eski) => {
      const yangi = { ...eski, [id]: s };
      yoz(KALIT, yangi);
      return yangi;
    });
  }, []);

  const hammasiniTikla = useCallback(() => {
    yoz(KALIT, {});
    setXomSozlama({});
  }, []);

  /* Sozlama ham tozalanadi: spek o'zgarsa uning chegaralari yangi standart bo'ladi */
  const sozlamaniOchir = useCallback((id) => {
    setXomSozlama((eski) => {
      if (!(id in eski)) return eski;
      const { [id]: _, ...qolgan } = eski;
      yoz(KALIT, qolgan);
      return qolgan;
    });
  }, []);

  /** Yaratish va tahrirlash. Qaytaradi: saqlangan spek (id va kod bilan) */
  const spekSaqla = useCallback(
    (spek) => {
      const vaqt = new Date().toISOString();
      const eski = spekler.find((s) => s.id === spek.id);
      const yangi = {
        ...spek,
        id: spek.id || `m-${Date.now().toString(36)}`,
        raqam:
          eski && eski.guruh === spek.guruh
            ? eski.raqam
            : keyingiRaqam(
                spek.guruh,
                spekler.filter((s) => s.id !== spek.id)
              ),
        yaratilgan: eski?.yaratilgan ?? vaqt,
        yangilangan: vaqt
      };
      const royxat = eski ? spekler.map((s) => (s.id === yangi.id ? yangi : s)) : [...spekler, yangi];
      yoz(SPEK_KALIT, royxat);
      setSpekler(royxat);
      sozlamaniOchir(yangi.id);
      return yangi;
    },
    [spekler, sozlamaniOchir]
  );

  const spekOchir = useCallback(
    (id) => {
      const royxat = spekler.filter((s) => s.id !== id);
      yoz(SPEK_KALIT, royxat);
      setSpekler(royxat);
      sozlamaniOchir(id);
    },
    [spekler, sozlamaniOchir]
  );

  const qiymat = useMemo(
    () => ({
      korsatkichlar,
      spekler,
      spekSaqla,
      spekOchir,
      sozlamalar,
      saqla,
      hammasiniTikla,
      davr: davrTop(davrId),
      setDavrId
    }),
    [korsatkichlar, spekler, spekSaqla, spekOchir, sozlamalar, saqla, hammasiniTikla, davrId]
  );
  return <Ctx.Provider value={qiymat}>{children}</Ctx.Provider>;
}

export const useRisklar = () => useContext(Ctx);
