import { useEffect, useState } from 'react';

/*
 * Hash-marshrutlash — mockup statik hostingda ham server sozlamasisiz ishlaydi.
 *
 *   #/                               boshqaruv paneli
 *   #/risklar/<guruh>/<id>?org=t01   ko'rsatkich hisoboti (tashkilot ochilgan)
 *   #/sozlamalar/<id>                ko'rsatkich sozlamasi
 */

export function yolniOqi() {
  if (typeof window === 'undefined') return { qismlar: [], params: {} };
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const [yol, sorov = ''] = h.split('?');
  return {
    qismlar: yol.split('/').filter(Boolean).map(decodeURIComponent),
    params: Object.fromEntries(new URLSearchParams(sorov))
  };
}

/** Boshqa sahifaga o'tish — `hashchange` hodisasi chiqadi */
export function ot(yol) {
  if (typeof window !== 'undefined') window.location.hash = yol;
}

export function useMarshrut() {
  const [yol, setYol] = useState(yolniOqi);
  useEffect(() => {
    const yangila = () => {
      setYol(yolniOqi());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', yangila);
    return () => window.removeEventListener('hashchange', yangila);
  }, []);
  return yol;
}
