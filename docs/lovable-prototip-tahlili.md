# Lovable prototipi tahlili — Risk monitoring

Manba: https://erp-risklar.lovable.app/ (o'qilgan sana: 2026-10-23)

Ilova nomi: «Риск мониторинг — Ички аудит тизими». UI o'zbek tilida, kirill yozuvida.
Mahsulot nomlari va kodlari qisman rus tilida. Faqat ko'rish uchun: formalar, qidiruv,
sana filtri, eksport va qator amallari yo'q.

## Tuzilma

- `/` — «Рисклар бошқарув панели». Risklar yo'nalishlar bo'yicha guruhlangan kartochkalarda
  (nomi, tavsifi, «N та ёзув»). Grafiklar yo'q.
- `/risklar/<guruh>/<slug>` — har bir risk uchun alohida sahifa. Tarkibi: guruh nomi,
  H1, tavsif, 2 ta kartochka («Жами ёзувлар», «Юқори даража») va jadval.
- Sidebar: «Бошқарув панели» va «Рисклар» bo'limi, ichida 4 ta guruh.
- Daraja («Даража»): Юқори / Ўрта / Паст. Chegaralari sahifada ko'rsatilmagan.
- Raqam formati: minglik ajratuvchi — bo'sh joy, summalarda kasr ajratuvchi — vergul
  (`152 184 550 000,00`), foizlarda — nuqta (`96.4%`).

## Risklar ro'yxati (20 ta)

### 1. Молиялаштириш ва бюджетлаштириш (`moliya`) — 3 ta

| Slug | Nomi | Qoida (tavsifdan) | Ustunlar | Daraja |
|---|---|---|---|---|
| `ozlashtirilmagan-mablaglar` | Ўзлаштирилмаган маблағлар | Reja va kassa farqi > 80% (hisob raqami kesimida) | № · Ташкилот · Ҳисоб рақами · Аниқланган режа · Касса · Ўзлаштирилмаган · Фарқ, % · Даража | bor (Ю4/Ў3/П2) |
| `band-qilinmagan-mablaglar` | Банд қилинмаган маблағлар | Rejaga nisbatan band qilinmagan > 80% | № · Ташкилот · Ҳисоб рақами · Аниқланган режа · Банд қилинган · Банд қилинмаган · Улуши, % · Даража | bor (Ю4/Ў3/П2) |
| `oylik-maoshlar` | Ойлик маошлар тўланганлик ҳолати | 4111100 Асосий иш ҳақи: oylik rejaning 1/12 qismidan oylikda < 50%, avansda < 20% kassa | № · Ташкилот · Ҳисоб рақами · Давр · Ойлик режа (1/12) · Касса · Талаб · Амалда, % · Камомад, % · Даража | bor (hammasi Паст) |

Izoh: `oylik-maoshlar` sahifasida «Давр» = «Аванс (1-15)» | «Ойлик (16-охирги кун)», «Талаб» = 20% | 50%,
Камомад = Талаб − Амалда.

### 2. Харидлар (`xarid`) — 10 ta

| Slug | Nomi | Qoida | Ustunlar | Daraja |
|---|---|---|---|---|
| `narxlar-farqi` | Нархлар ўртасидаги фарқ | Bir xil productCode bo'yicha narx farqi > 20% | № · productCode · Маҳсулот номи · Энг паст нарх · Энг юқори нарх · Паст нарх — ташкилот · Юқори нарх — ташкилот · Фарқ, % · Даража | bor |
| `kechikkan-etkazib-berish` | Товарлар (ишлар, хизматлар)ни ўз вақтида етказиб берилмаслиги | Yetkazish muddati shartnomadan oshgan, kechikish bo'yicha saralangan | № · Ташкилот · Контрагент · Шартнома рақами · Маҳсулот номи · Шартнома муддати (кун) · Амалдаги (кун) · Кечикиш (кун) | yo'q |
| `takroriy-shartnomalar` | Етказиб берувчилар билан такрорий тузилган шартномалар | Bir tashkilot – bir tadbirkor shartnomalari soni, ko'pdan kamga | № · Ташкилот · Контрагент · ИНН · Шартномалар сони · Умумий сумма | yo'q |
| `oylik-xarid-limiti` | Етказиб берувчи билан ойига 4 мартадан ортиқ харид | Bir yetkazib beruvchidan oyiga > 4 marta xarid | № · Ташкилот · Етказиб берувчи · ИНН · Ой · Харидлар сони · Умумий сумма | yo'q |
| `droblenie-xaridlar` | Дробление қилиб харид қилинган харидлар | Bitta xarid bir nechta shartnomaga bo'lingan | № · Ташкилот · Етказиб берувчи · Маҳсулот гуруҳи · Шартномалар сони · Умумий сумма · Давр | yo'q |
| `plan-grafik-integratsiya` | План-график ва план закупокнинг савдо платформалари билан интеграцияси | Plan-grafikdagi xaridlar platformaga chiqarilmagan | № · Ташкилот · Пландаги ҳаридлар · Платформага чиқарилган · Чиқарилмаган · Чиқарилмаган, % · Даража | bor (hammasi Паст) |
| `yillik-reja-bajarilishi` | Йиллик харид режасининг бажарилиши | Yillik reja bajarilishi eng past bo'lganlar yuqorida | № · Ташкилот · Йиллик режа · Бажарилган · Бажарилиш, % · Даража | bor (hammasi Паст) |
| `summa-diapazon-indikator` | Белгиланган диапазондан ошган харид суммалари | Xarid summasi mahsulot diapazonidan oshgan | № · productCode · Маҳсулот номи · Ташкилот · Диапазон чегараси · Харид суммаси · Ошириш · Ошириш, % · Даража | bor (Ю2/П3) |
| `mxik-enkt-gruppalash` | МХИК кодини ЕНКТ кодга нисбатан гуруҳлаш | MXIK guruhlari ENKT kodlariga moslangan, mos kelmaydiganlar soni bo'yicha | № · МХИК гуруҳи · ЕНКТ коди · Позициялар сони · Мос келмайдиганлар | yo'q |
| `tz-standartlash` | Маҳсулот ТЗсини стандартлаштириш | TZ standartlashtirilganlik darajasi, eng pasti yuqorida | № · Маҳсулот гуруҳи · Жами ТЗ · Стандартлашган · Стандартлашмаган · Стандартлаш, % · Даража | bor (hammasi Паст) |

### 3. Кадрларни бошқариш (`kadrlar`) — 6 ta

| Slug | Nomi | Qoida | Ustunlar | Daraja |
|---|---|---|---|---|
| `bosh-ish-orinlari` | Бўш иш ўринлари сони | — | № · Ташкилот · Ҳисоб рақами · Штат бирлиги · Банд · Бўш иш ўринлари | yo'q |
| `bir-shtatdan-kam` | 1 штат бирлигидан кам улушга эга ходимлар улуши | Normadan kam (masalan, < 0.5 stavka) ishlaydiganlar foizi | № · Ташкилот · Ходимлар сони · 1 штатдан кам · Улуши, % · Даража | bor (hammasi Паст) |
| `shtat-bandligi` | Штат бўйича бандлик даражаси | Jami shtatdan vakantlar ayirilgan, eng kam vakant yuqorida | № · Ташкилот · Жами штат · Банд · Вакант · Бандлик, % · Даража | bor (Ў1/П5) |
| `kadrlar-almashinuvi` | Кадрлар алмашинуви коэффициенти | (Qabul + chiqqan) / shtat, eng yuqorisi tepada | № · Ташкилот · Қабул қилинган · Ишдан чиққан · Штат бирлиги · Коэффициент | yo'q |
| `ishdan-ketganlar` | Йил давомида ишдан кетган ходимлар сони | Eng ko'pi yuqorida | № · Ташкилот · Ишдан кетганлар · Штатга нисбатан, % · Даража | bor (hammasi Паст) |
| `ishdan-boshaganlar` | Белгиланган йил ичида ишдан бўшаган ходимлар сони | Eng ko'pi yuqorida | № · Ташкилот · Штат бирлиги · Ишдан бўшаганлар · Улуши, % · Даража | bor (hammasi Паст) |

### 4. Коммунал ресурслардан фойдаланиш (`kommunal`) — 1 ta

| Slug | Nomi | Qoida | Ustunlar | Daraja |
|---|---|---|---|---|
| `limitdan-ortiq-sarf` | Коммунал харажатларни ўзгариши | Joriy oy sarfi (naturada) o'tgan oyga yoki o'tgan yilning shu oyiga nisbatan > 20% o'zgargan | № · Ташкилот · Ҳисоб рақами · Ресурс тури · Жорий ой · Аввалги ой · Аввалги ойга фарқ, % · Ўтган йилнинг шу ойи · Ўтган йил шу ойига фарқ, % | yo'q |

Bu sahifada yagona filtr bor — resurs turi chiplari: Электр энергия 4 · Табиий газ 2 · Совуқ сув 3 ·
Иссиқ сув 3 · Иссиқлик 2 (jami 14). Jadvalda standart holatda faqat tanlangan resurs ko'rinadi.

## Prototipdagi kamchiliklar va nomuvofiqliklar

- «Юқори даража» kartochkasi «Даража» ustuni yo'q sahifalarda ham chiqadi (doim 0).
- 20 ta riskdan 9 tasida «Даража» ustuni yo'q. Bor joylarda ham ko'pincha hamma qiymat «Паст»
  (masalan, 72.7% standartlash ham, 70% reja bajarilishi ham «Паст»). Daraja chegaralari aniqlanmagan.
- `shtat-bandligi` sahifasida daraja «Бандлик, %» ga mos kelmaydi: 85.8% → Ўрта, 81.0% → Паст.
- Kasr ajratuvchi turlicha: `kadrlar-almashinuvi` «0,37», boshqa sahifalarda «13.8%».
- Ma'lumotlardagi xato: «Мебель жиҳозlari» (lotincha «l»), bitta ИНН 14 xonali (qolganlari 9 xonali).
- Kommunal sahifasining slugi (`limitdan-ortiq-sarf`) sarlavhaga («...ўзгариши») mos emas.
- MXIK/ENKT atamalari sahifada izohlanmagan.
- Demo ma'lumot barcha sahifalarda umumiy: bir xil tashkilotlar (Ижтимоий ҳимоя миллий агентлиги,
  Меҳрибонлик уйлари, reabilitatsiya markazlari va h.k.) va shablon hisob raqamlari.
- Sahifalar statik markdown orqali o'qilgan, shu sababli faqat JS bilan chiziladigan
  boshqaruv elementlari (masalan, saralash) bu tahlilga kirmagan bo'lishi mumkin.
