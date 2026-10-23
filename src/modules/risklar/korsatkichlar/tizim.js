/*
 * Tizim ko'rsatkichlari — kodda yozilgan 20 ta hisobot.
 * Foydalanuvchi yaratadiganlari — `konstruktor.js` (deklarativ spek).
 *
 * Har bir ko'rsatkich BIR XIL tuzilmada ta'riflanadi; o'ziga xosligi faqat
 * maydonlar qiymatida. Dvigatel (`../hisob.js`), jadval, diagramma va
 * sozlamalar sahifasi shu tuzilmani o'qiydi — yangi ko'rsatkich qo'shish
 * uchun ekran kodi tegilmaydi.
 *
 *   id          barqaror kalit (marshrut va sozlama kaliti)
 *   nom         sarlavha
 *   tavsif(s)   tavsif matni — joriy sozlama raqamlari bilan
 *   kesimNomi   ikkinchi daraja nomi (Ҳисоб рақами, Лицевой ҳисоб, …)
 *   bolalar(r, org)        → [{ id, nom, izoh, maydon }] — ikkinchi daraja
 *   filtrlar?   ikkinchi daraja maydoni bo'yicha sahifa filtri
 *               [{ kalit, nom, variantlar: [{id, nom}], majburiy? }]
 *   asosiy      daraja shu ustun qiymatidan aniqlanadi
 *   yonalish    'yuqori' — qiymat oshsa xavf ortadi, 'past' — kamaysa
 *   standart    { chegara, orta, yuqori } — daraja chegaralari (asosiy birligida)
 *   parametrlar maxsus sozlamalar: [{ kalit, nom, tur, standart, variantlar?, min?, max?, izoh? }]
 *               tur: 'foiz' | 'son' | 'summa' | 'tanlov' | 'mantiq'
 *   ustunlar    [{ kalit, nom, tur, jami?, ishora? }]
 *               tur: 'summa' | 'son' | 'foiz' | 'pp' | 'kun' | 'koef' | 'matn' | 'kod'
 *               jami (tashkilot sarti): yo'q — xom maydonlar yig'iladi va
 *               `hosila` qayta hisoblanadi; 'sum' | 'max' | 'min' | 'none' |
 *               (bolalar, p, davr) => qiymat
 *   yarat(r, x, ctx)       → xom maydonlar (demo generator; x ∈ [0,1] — xavf moyilligi)
 *   hosila?(q, p, davr)    → hisoblanadigan maydonlar (ikkala darajada ishlaydi)
 */
import { mdiCashMultiple, mdiCartOutline, mdiAccountGroupOutline, mdiLightningBoltOutline } from '@mdi/js';
import moliya from './moliya.js';
import xarid from './xarid.js';
import kadrlar from './kadrlar.js';
import kommunal from './kommunal.js';

export const GURUHLAR = [
  { id: 'moliya', nom: 'Молиялаштириш ва бюджетлаштириш', qisqa: 'М', ikon: mdiCashMultiple, royxat: moliya },
  { id: 'xarid', nom: 'Харидлар', qisqa: 'Х', ikon: mdiCartOutline, royxat: xarid },
  { id: 'kadrlar', nom: 'Кадрларни бошқариш', qisqa: 'К', ikon: mdiAccountGroupOutline, royxat: kadrlar },
  { id: 'kommunal', nom: 'Коммунал ресурслардан фойдаланиш', qisqa: 'КР', ikon: mdiLightningBoltOutline, royxat: kommunal }
];

/** Tekis ro'yxat: guruh va qisqa kod (М1, Х4, …) qo'shilgan */
export const TIZIM_KORSATKICHLAR = GURUHLAR.flatMap((g) =>
  g.royxat.map((k, i) => ({ ...k, guruh: g.id, guruhNom: g.nom, kod: `${g.qisqa}${i + 1}`, raqam: i + 1, manba: 'tizim' }))
);

/** Asosiy ustun ta'rifi (birlik va nom uchun) */
export const asosiyUstun = (k) => k.ustunlar.find((u) => u.kalit === k.asosiy);
