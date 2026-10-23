import { useMemo } from 'react';
import { hisobla, standartFiltr } from '../hisob.js';
import { useRisklar } from '../holat.jsx';

/**
 * Barcha ko'rsatkichlarning (tizim + foydalanuvchi) joriy davrdagi natijasi (standart kesim filtri bilan).
 * Panel va sidebar sanog'i shundan oladi.
 */
export function useBarchaNatija() {
  const { korsatkichlar, sozlamalar, davr } = useRisklar();
  return useMemo(
    () =>
      korsatkichlar.map((k) => ({
        k,
        soz: sozlamalar[k.id],
        natija: hisobla(k, davr, sozlamalar[k.id], standartFiltr(k))
      })),
    [korsatkichlar, sozlamalar, davr]
  );
}

/** Riskdagi («Норма» emas) tashkilotlar soni */
export const riskliSoni = (natija) => natija.qatorlar.filter((t) => t.daraja && t.daraja !== 'norma').length;
