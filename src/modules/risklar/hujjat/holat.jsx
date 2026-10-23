/*
 * Risk hujjatlari holati.
 *
 * Saqlash — IndexedDB: 1000+ risk tarixi bilan ~1,7 MB va biriktirilgan
 * fayllar localStorage (5 MB) ga sig'maydi. IndexedDB yo'q muhitda
 * (SSR smoke testi) holat xotirada quriladi.
 *
 * Birinchi ochilishda demo tarixi quriladi: 11 ta yangilanish (2025-10 …
 * 2026-08) qayta o'ynatiladi; 2026-09 ma'lumoti «tayyor» holatda turadi va
 * «Маълумотлар янгиланиши» sahifasida qabul qilinadi. Hisobotlardagi davr
 * ro'yxati faqat qabul qilingan davrlar bilan cheklanadi.
 *
 * Texnik tomon (RabbitMQ navbati) interfeysda ko'rsatilmaydi — mockup
 * mijozga ko'rsatiladi.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DAVRLAR } from '../../../reference/davrlar.js';
import { FOYDALANUVCHILAR, foydalanuvchiTop } from '../../../reference/foydalanuvchilar.js';
import { useRisklar } from '../holat.jsx';
import * as M from './model.js';

const DB = 'erp-risklar';
const STORE = 'holat';
const KALIT = 'hujjatlar-v1';
const FOYD_KALIT = 'risklar-foydalanuvchi';

function idb(amal, qiymat) {
  return new Promise((ok, rad) => {
    const so = indexedDB.open(DB, 1);
    so.onupgradeneeded = () => so.result.createObjectStore(STORE);
    so.onerror = () => rad(so.error);
    so.onsuccess = () => {
      const tx = so.result.transaction(STORE, amal === 'oqi' ? 'readonly' : 'readwrite');
      const st = tx.objectStore(STORE);
      const q = amal === 'oqi' ? st.get(KALIT) : amal === 'yoz' ? st.put(qiymat, KALIT) : st.delete(KALIT);
      q.onsuccess = () => ok(q.result);
      q.onerror = () => rad(q.error);
    };
  });
}

const brauzer = () => typeof indexedDB !== 'undefined';

const Ctx = createContext(null);

/** `boshHolat` — smoke testi uchun tayyor holat */
export function HujjatHolati({ children, boshHolat }) {
  const { korsatkichlar, sozlamalar, setDavrId } = useRisklar();
  const [holat, setHolat] = useState(() => boshHolat ?? (brauzer() ? null : M.boshlangichHolat(korsatkichlar, sozlamalar)));
  const [foydId, setFoydId] = useState(() => {
    try {
      return (typeof window !== 'undefined' && window.localStorage.getItem(FOYD_KALIT)) || 'u1';
    } catch {
      return 'u1';
    }
  });
  const joriy = useRef(holat);
  joriy.current = holat;
  const korsRef = useRef({ korsatkichlar, sozlamalar });
  korsRef.current = { korsatkichlar, sozlamalar };

  const ornat = useCallback(
    (h) => {
      joriy.current = h;
      setHolat(h);
      setDavrId(DAVRLAR[h.yuklangan - 1].id);
      if (brauzer()) idb('yoz', h).catch(() => {});
    },
    [setDavrId]
  );

  /* Birinchi yuklash: IndexedDB → bo'lmasa demo tarixi */
  useEffect(() => {
    if (joriy.current) {
      setDavrId(DAVRLAR[joriy.current.yuklangan - 1].id);
      return;
    }
    let tirik = true;
    idb('oqi')
      .then((s) => {
        if (!tirik) return;
        if (s?.versiya === M.VERSIYA) {
          joriy.current = s;
          setHolat(s);
          setDavrId(DAVRLAR[s.yuklangan - 1].id);
        } else ornat(M.boshlangichHolat(korsRef.current.korsatkichlar, korsRef.current.sozlamalar));
      })
      .catch(() => tirik && ornat(M.boshlangichHolat(korsRef.current.korsatkichlar, korsRef.current.sozlamalar)));
    return () => {
      tirik = false;
    };
  }, [ornat, setDavrId]);

  /* Holat o'zgarishi: yangi obyekt → saqlash. Har bir amal shu orqali */
  const amal = useCallback(
    (fn) => {
      if (!joriy.current) return;
      const y = fn(joriy.current);
      joriy.current = y;
      setHolat(y);
      if (brauzer()) idb('yoz', y).catch(() => {});
    },
    []
  );

  const foydalanuvchi = foydalanuvchiTop(foydId) ?? FOYDALANUVCHILAR[0];

  const api = useMemo(() => {
    if (!holat) return { holat: null };
    const kim = foydalanuvchi;
    return {
      holat,
      foydalanuvchi,
      setFoydalanuvchi: (id) => {
        setFoydId(id);
        try {
          window.localStorage.setItem(FOYD_KALIT, id);
        } catch {
          /* eslab qolinmasa ham bo'ladi */
        }
      },
      davrlar: DAVRLAR.slice(0, holat.yuklangan),
      navbatdagi: DAVRLAR[holat.yuklangan] ?? null,
      /** Navbatdagi RabbitMQ paketini o'qish */
      navbatniOqi: () => {
        const davr = DAVRLAR[joriy.current.yuklangan];
        if (!davr) return null;
        const { holat: y, yuklashId } = M.yuklashniQayta(joriy.current, {
          davr,
          sana: M.hozir(),
          korsatkichlar: korsRef.current.korsatkichlar,
          sozlamalar: korsRef.current.sozlamalar
        });
        ornat(y);
        return yuklashId;
      },
      qaytaBoshlash: () => ornat(M.boshlangichHolat(korsRef.current.korsatkichlar, korsRef.current.sozlamalar)),
      riskYarat: (m) => {
        let risk = null;
        amal((h) => {
          const n = M.riskYarat(h, m, kim);
          risk = n.risk;
          return n.holat;
        });
        return risk;
      },
      statusOzgartir: (id, ga, qolgan) => amal((h) => M.statusOzgartir(h, id, ga, qolgan, kim)),
      ignorBelgila: (id, gacha, izoh) => amal((h) => M.ignorBelgila(h, id, gacha, izoh, kim)),
      izohQosh: (id, matn, fayllar) => amal((h) => M.izohQosh(h, id, matn, fayllar, kim)),
      maydonOzgartir: (id, patch) => amal((h) => M.maydonOzgartir(h, id, patch, kim)),
      sozlamaOzgartir: (patch) => amal((h) => ({ ...h, sozlama: { ...h.sozlama, ...patch } }))
    };
  }, [holat, foydalanuvchi, amal, ornat]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useHujjatlar = () => useContext(Ctx);

/** Ochiq risklar kalit bo'yicha (hisobot jadvali uchun) */
export function useOchiqRisklar(kId) {
  const { holat } = useHujjatlar();
  return useMemo(() => {
    const m = new Map();
    for (const r of holat?.risklar ?? []) if (r.kId === kId && M.OCHIQ.has(r.status)) m.set(r.kalit, r);
    return m;
  }, [holat, kId]);
}
