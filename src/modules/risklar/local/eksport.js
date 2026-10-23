/*
 * CSV eksport — joriy ko'rinish (filtr va saralash bilan) ikki darajasi bilan.
 * Ajratgich «;» va BOM: Excel kirill matnni va vergulli kasrni to'g'ri ochadi.
 */
import { qiymatMatn } from '../../../lib/format.js';
import { darajaNom } from '../hisob.js';

const katak = (v) => {
  const m = v == null ? '' : String(v);
  return /[";\n]/.test(m) ? `"${m.replace(/"/g, '""')}"` : m;
};

export function csvYukla(k, qatorlar, jami, davr) {
  const qiy = (q, u) => (q[u.kalit] == null ? '' : qiymatMatn(q[u.kalit], u.tur, { ishora: u.ishora }));
  const satrlar = [
    ['Даража', 'Ташкилот', 'ИНН', k.kesimNomi, 'Изоҳ', ...k.ustunlar.map((u) => u.nom), 'Риск даражаси']
  ];
  for (const t of qatorlar) {
    satrlar.push(['1', t.org.nom, t.org.inn, '', '', ...k.ustunlar.map((u) => qiy(t.q, u)), darajaNom(t.daraja)]);
    for (const b of t.bolalar) {
      satrlar.push(['2', t.org.nom, t.org.inn, b.bola.nom, b.bola.izoh, ...k.ustunlar.map((u) => qiy(b.q, u)), darajaNom(b.daraja)]);
    }
  }
  if (jami) satrlar.push(['', 'Жами', '', '', '', ...k.ustunlar.map((u) => qiy(jami.q, u)), darajaNom(jami.daraja)]);

  const matn = '﻿' + satrlar.map((r) => r.map(katak).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([matn], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${k.kod}-${k.id}-${davr.id}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
