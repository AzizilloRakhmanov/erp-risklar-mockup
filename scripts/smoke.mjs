/*
 * Ekran render tekshiruvi (SSR): panel, har bir hisobot va sozlama sahifasi,
 * reyestr va konstruktor xatosiz chizilishi kerak. Har bir formula × kesim
 * uchun bittadan foydalanuvchi ko'rsatkichi yaratilib, u ham tekshiriladi.
 * Build ushlamaydigan ish vaqti xatolari (`undefined.map()`, noto'g'ri hook)
 * shu yerda chiqadi.
 *
 * Mockup mijozga ko'rsatiladi: chizilgan matnda texnik/integratsiya atamalari
 * (RabbitMQ, navbat, paket, demo, mockup, JSON, …) bo'lsa ham xato.
 *
 *   npm run smoke
 */
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

let xatolar = 0;

/* Interfeys matnida bo'lmasligi kerak bo'lgan so'zlar */
const TAQIQ = /rabbit|пакет|навбат|демо|мокап|mockup|json|vhost|consumer|localstorage|indexeddb|кодда ёзилган/i;
const matn = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
try {
  const { createElement: h } = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { RisklarHolati, HujjatHolati, Ekran } = await vite.ssrLoadModule('/src/modules/risklar/Ilova.jsx');
  const H = await vite.ssrLoadModule('/src/modules/risklar/hujjat/model.js');
  const K = await vite.ssrLoadModule('/src/modules/risklar/korsatkichlar/index.js');

  /* Har bir formula × kesim — bittadan sinov speki */
  const spekler = K.FORMULALAR.flatMap((f, i) =>
    K.KESIMLAR.map((kesim, j) => ({
      ...K.yangiSpek(K.GURUHLAR[(i + j) % K.GURUHLAR.length].id),
      id: `sinov-${f.id}-${kesim.id}`,
      raqam: 100 + i * 10 + j,
      nom: `Синов ${f.id} ${kesim.id}`,
      kesim: kesim.id,
      formula: f.id,
      a: { nom: 'A майдон', tur: f.foiz ? 'summa' : 'son' },
      b: { nom: 'B майдон', tur: f.foiz ? 'summa' : 'son' },
      natijaNom: 'Натижа',
      ayirmaNom: 'Оралиқ',
      jamlash: j % 2 ? 'max' : 'sum',
      yonalish: j % 2 ? 'past' : 'yuqori',
      standart: j % 2 ? { chegara: 50, orta: 30, yuqori: 10 } : { chegara: 20, orta: 40, yuqori: 60 },
      yangilangan: 'sinov'
    }))
  );
  const barcha = K.royxatQur(spekler);

  /* Risk hujjatlari: demo tarixi (11 paket) + navbatdagi paket o'qiladi */
  const sozlamalar = Object.fromEntries(barcha.map((k) => [k.id, { faol: true, ...k.standart, parametrlar: Object.fromEntries(k.parametrlar.map((p) => [p.kalit, p.standart])) }]));
  const DAVRLAR = (await vite.ssrLoadModule('/src/reference/davrlar.js')).DAVRLAR;
  const bosh = H.boshlangichHolat(barcha, sozlamalar);
  const { holat } = H.yuklashniQayta(bosh, { davr: DAVRLAR[bosh.yuklangan], sana: H.hozir(), korsatkichlar: barcha, sozlamalar });
  const namunalar = [
    holat.risklar.find((r) => r.yopilishAsosi === 'avto'),
    holat.risklar.find((r) => r.yopilishAsosi === 'manual' && r.fayllar.length),
    holat.risklar.find((r) => r.manba === 'manual'),
    holat.risklar.find((r) => r.status === 'tekshiruvda'),
    holat.risklar.find((r) => r.ignorGacha)
  ].filter(Boolean);

  const yollar = [
    { nom: 'panel', qismlar: [], params: {} },
    { nom: 'reyestr', qismlar: ['korsatkichlar'], params: {} },
    { nom: 'yangi', qismlar: ['korsatkichlar', 'yangi'], params: { guruh: 'xarid' } },
    { nom: 'nusxa', qismlar: ['korsatkichlar', 'yangi'], params: { nusxa: spekler[0].id } },
    { nom: 'tahrir', qismlar: ['korsatkichlar', spekler[3].id], params: {} },
    { nom: 'tizim tahrir', qismlar: ['korsatkichlar', K.TIZIM_KORSATKICHLAR[0].id], params: {} },
    { nom: 'hujjatlar', qismlar: ['hujjatlar'], params: {} },
    { nom: 'hujjatlar avto', qismlar: ['hujjatlar'], params: { tab: 'avto', yuklash: holat.yuklashlar.at(-1).id } },
    { nom: 'hujjatlar ignor', qismlar: ['hujjatlar'], params: { tab: 'ignor' } },
    { nom: 'yangilanishlar', qismlar: ['yangilanishlar'], params: {} },
    { nom: 'yangilanishlar demo', qismlar: ['yangilanishlar'], params: { demo: '1' } },
    ...namunalar.map((r) => ({ nom: `hujjat ${r.raqam}`, qismlar: ['hujjatlar', r.id], params: {} })),
    ...barcha.map((k) => ({ nom: k.kod, qismlar: ['risklar', k.guruh, k.id], params: { org: 't01' } })),
    ...barcha.map((k) => ({ nom: `soz ${k.kod}`, qismlar: ['sozlamalar', k.id], params: {} }))
  ];

  for (const yol of yollar) {
    try {
      const html = renderToString(h(RisklarHolati, { boshSpekler: spekler }, h(HujjatHolati, { boshHolat: holat }, h(Ekran, { yol }))));
      if (html.length < 500) throw new Error(`juda qisqa HTML (${html.length})`);
      const topildi = matn(html).match(TAQIQ);
      if (topildi) throw new Error(`interfeysda texnik atama: «${topildi[0]}»`);
    } catch (e) {
      xatolar++;
      console.error(`✗ ${yol.nom}: ${e.message}`);
    }
  }
  console.log(`${yollar.length - xatolar}/${yollar.length} ekran chizildi`);
} finally {
  await vite.close();
}
process.exit(xatolar ? 1 : 0);
