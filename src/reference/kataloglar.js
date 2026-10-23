/*
 * Xarid va kommunal hisobotlari uchun kataloglar: kontragentlar, mahsulotlar,
 * MXIK guruhlari, TZ guruhlari, kommunal resurslar.
 * Mahsulot nomlari prototipdagidek rus tilida (MXIK katalogida shunday).
 */

export const KONTRAGENTLAR = [
  { id: 'k01', nom: '«Sanoat Servis» МЧЖ', inn: '301122334' },
  { id: 'k02', nom: '«Texno Import» МЧЖ', inn: '305566778' },
  { id: 'k03', nom: 'MEXR VODIYSI', inn: '309758964' },
  { id: 'k04', nom: 'ASIA PHARM LYUKS', inn: '306214587' },
  { id: 'k05', nom: '«Dori-Darmon Trade» МЧЖ', inn: '302874411' },
  { id: 'k06', nom: 'ЯТТ Пирматов Сарвар', inn: '32406894320078' },
  { id: 'k07', nom: '«Mebel Lux Group» МЧЖ', inn: '307745120' },
  { id: 'k08', nom: '«Qurilish Materiallari» АЖ', inn: '303398562' },
  { id: 'k09', nom: '«Ofis Plus» МЧЖ', inn: '308812047' },
  { id: 'k10', nom: '«Tibbiyot Texnika» МЧЖ', inn: '304450913' }
];

export const MAHSULOTLAR = [
  { kod: '20.30.12.130-00002', nom: 'Эмульсия акриловая', guruh: 'Қурилиш материаллари', mxik: 'm20', narx: 6000 },
  { kod: '28.13.14.110-00031', nom: 'Насос центробежный', guruh: 'Машина ва жиҳозлар', mxik: 'm28', narx: 4200000 },
  { kod: '14.12.30.120-00107', nom: 'Брюки мужские классические', guruh: 'Кийим-кечак', mxik: 'm14', narx: 185000 },
  { kod: '27.51.24.110-00009', nom: 'Утюги электрические бытовые', guruh: 'Маиший техника', mxik: 'm27', narx: 320000 },
  { kod: '58.29.50.000-00014', nom: 'Лицензия на программный продукт', guruh: 'Дастурий таъминот', mxik: 'm58', narx: 2400000 },
  { kod: '21.20.23.110-00422', nom: 'Dextrose 5% 500 мл', guruh: 'Дори воситалари', mxik: 'm21', narx: 9800 },
  { kod: '21.20.10.190-00871', nom: 'Лекарственные препараты (антибиотики)', guruh: 'Дори воситалари', mxik: 'm21', narx: 46000 },
  { kod: '26.20.11.110-00041', nom: 'Ноутбук 15,6"', guruh: 'Компьютер техникаси', mxik: 'm26', narx: 8900000 },
  { kod: '26.20.17.110-00012', nom: 'Монитор 24"', guruh: 'Компьютер техникаси', mxik: 'm26', narx: 2100000 },
  { kod: '31.01.11.150-00012', nom: 'Стол офисный', guruh: 'Мебель жиҳозлари', mxik: 'm31', narx: 1450000 },
  { kod: '31.01.12.160-00033', nom: 'Кресло офисное', guruh: 'Мебель жиҳозлари', mxik: 'm31', narx: 980000 },
  { kod: '32.50.13.190-00205', nom: 'Шприц одноразовый 5 мл', guruh: 'Тиббий сарфлов материаллари', mxik: 'm32', narx: 900 },
  { kod: '17.12.14.129-00006', nom: 'Бумага офисная А4', guruh: 'Канцелярия', mxik: 'm17', narx: 52000 },
  { kod: '10.61.31.000-00018', nom: 'Мука пшеничная высший сорт', guruh: 'Озиқ-овқат', mxik: 'm10', narx: 7400 }
];

export const MAHSULOT_GURUHLARI = [...new Set(MAHSULOTLAR.map((m) => m.guruh))];

export const MXIK_GURUHLAR = [
  { id: 'm10', nom: '10 — Озиқ-овқат маҳсулотлари', enkt: '10.61 — Ун ва ёрма' },
  { id: 'm14', nom: '14 — Кийим-кечак', enkt: '14.12 — Иш кийимлари' },
  { id: 'm17', nom: '17 — Қоғоз маҳсулотлари', enkt: '17.12 — Қоғоз ва картон' },
  { id: 'm20', nom: '20 — Кимё маҳсулотлари', enkt: '20.30 — Бўёқ ва лаклар' },
  { id: 'm21', nom: '21 — Фармацевтика', enkt: '21.20 — Дори препаратлари' },
  { id: 'm26', nom: '26 — Компьютер ва электроника', enkt: '26.20 — Ҳисоблаш машиналари' },
  { id: 'm27', nom: '27 — Электр жиҳозлари', enkt: '27.51 — Маиший электр асбоблар' },
  { id: 'm28', nom: '28 — Машина ва жиҳозлар', enkt: '28.13 — Насослар' },
  { id: 'm31', nom: '31 — Мебель', enkt: '31.01 — Офис мебели' },
  { id: 'm32', nom: '32 — Тиббий буюмлар', enkt: '32.50 — Тиббий асбоблар' }
];

/* `majburiy` — har bir tashkilotda bor resurs */
export const RESURSLAR = [
  { id: 'elektr', nom: 'Электр энергия', birlik: 'кВт·соат', prefiks: 'ЭЛ-', taminotchi: '«Ҳудудий электр тармоқлари» АЖ', hajm: 42000, majburiy: true },
  { id: 'gaz', nom: 'Табиий газ', birlik: 'м³', prefiks: 'ГЗ-', taminotchi: '«Ҳудудгазтаъминот» АЖ', hajm: 18000, majburiy: true },
  { id: 'suv', nom: 'Совуқ сув', birlik: 'м³', prefiks: 'СВ-', taminotchi: '«Сувсоз» АЖ', hajm: 2600, majburiy: true },
  { id: 'issiqSuv', nom: 'Иссиқ сув', birlik: 'м³', prefiks: 'ИС-', taminotchi: '«Иссиқлик манбаи» ДУК', hajm: 900 },
  { id: 'issiqlik', nom: 'Иссиқлик', birlik: 'Гкал', prefiks: 'ИК-', taminotchi: '«Иссиқлик манбаи» ДУК', hajm: 260 }
];
