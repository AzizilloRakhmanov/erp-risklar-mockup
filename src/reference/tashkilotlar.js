/*
 * Tashkilotlar ma'lumotnomasi — har bir hisobotning birinchi darajasi.
 *
 * Ikkinchi daraja hisobot turiga bog'liq:
 *   - moliya, kadrlar, ba'zi xaridlar → `hisoblar` (g'aznachilik hisob raqami);
 *   - kommunal → `litsevoylar` (ta'minotchidagi shaxsiy hisob raqami).
 * Prototipda kommunal ham hisob raqami bilan chiqqan edi — bu xato tuzatildi.
 *
 * Nomlar prototipdagi demo ma'lumotdan, INN va raqamlar sintetik.
 */
import { rng, butun, raqamlar, nechta } from '../lib/rng.js';
import { RESURSLAR } from './kataloglar.js';

const ASOS = [
  ['t01', 'Ижтимоий ҳимоя миллий агентлигини сақлаш ва марказлашган харажатлар', 'Тошкент ш.', 3.0],
  ['t02', 'Ижтимоий ҳимоя миллий агентлигининг ҳудудий бошқармалари', 'Тошкент ш.', 2.6],
  ['t03', 'Ижтимоий инспекция ҳамда унинг бошқармалари', 'Тошкент ш.', 1.4],
  ['t04', 'Ижтимоий ходимлар', 'Тошкент ш.', 1.8],
  ['t05', 'Тиббий-ижтимоий экспертиза комиссиялари', 'Тошкент вилояти', 1.1],
  ['t06', 'Меҳрибонлик уйлари', 'Самарқанд вилояти', 0.9],
  ['t07', 'Фарғона «Мурувват» болалар интернат уйи', 'Фарғона вилояти', 0.6],
  ['t08', 'Қашқадарё вилояти Ногиронлиги бўлган шахсларни реабилитация маркази', 'Қашқадарё вилояти', 0.7],
  ['t09', 'Андижон вилояти ижтимоий қўллаб-қувватлаш маркази', 'Андижон вилояти', 0.8],
  ['t10', 'Боғдод 88-сонли ихтисослаштирилган мактаб', 'Фарғона вилояти', 0.4],
  ['t11', 'Наманган «Саховат» қариялар уйи', 'Наманган вилояти', 0.5],
  ['t12', 'Бухоро вилояти протез-ортопедия маркази', 'Бухоро вилояти', 0.6],
  ['t13', 'Хоразм вилояти ижтимоий хизматлар маркази', 'Хоразм вилояти', 0.7],
  ['t14', 'Сурхондарё «Мурувват» интернат уйи', 'Сурхондарё вилояти', 0.5],
  ['t15', 'Нукус ижтимоий реабилитация маркази', 'Қорақалпоғистон Р.', 0.6]
];

const HISOB_TURLARI = [
  'Асосий бюджет ҳисоби',
  'Бюджетдан ташқари жамғарма',
  'Ҳомийлик маблағлари',
  'Махсус ҳисоб'
];

export const TASHKILOTLAR = ASOS.map(([id, nom, viloyat, hajm]) => {
  const r = rng('tashkilot', id);
  const inn = '2' + raqamlar(r, 8);
  const nHisob = hajm >= 2 ? 4 : hajm >= 1 ? 3 : butun(r, 1, 2);
  const hisoblar = HISOB_TURLARI.slice(0, nHisob).map((tur, i) => ({
    id: `${id}-h${i + 1}`,
    raqam: '20208000' + raqamlar(r, 9) + String(i + 1).padStart(3, '0'),
    nom: tur
  }));

  /* Har bir tashkilotda elektr, gaz va sovuq suv bor; issiq suv va
     issiqlik — faqat bir qismida. Kattalarida bir nechta bino (2 ta ЛС). */
  const resurslar = RESURSLAR.filter((x) => x.majburiy || r() < 0.6);
  const litsevoylar = resurslar.flatMap((res) =>
    Array.from({ length: hajm >= 2 && r() < 0.6 ? 2 : 1 }, (_, i) => ({
      id: `${id}-${res.id}-${i + 1}`,
      raqam: res.prefiks + raqamlar(r, 10),
      nom: i === 0 ? 'Асосий бино' : 'Филиал биноси',
      resurs: res.id,
      resursNom: res.nom,
      birlik: res.birlik,
      taminotchi: res.taminotchi
    }))
  );

  return { id, nom, viloyat, hajm, inn, hisoblar, litsevoylar };
});

export const VILOYATLAR = [...new Set(TASHKILOTLAR.map((t) => t.viloyat))];

/** Tashkilot kesimidagi tasodifiy tanlov — ikkinchi daraja ro'yxati uchun */
export const tashkilotdanNechta = (r, royxat, a, b) => nechta(r, royxat, butun(r, a, b));
