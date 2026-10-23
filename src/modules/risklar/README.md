# Risklar moduli — Risk monitoring

Manba: [Lovable prototipi](https://erp-risklar.lovable.app/), tahlili:
[docs/lovable-prototip-tahlili.md](../../../docs/lovable-prototip-tahlili.md).

## Ekranlar

| Marshrut | Ekran | Mazmuni |
|---|---|---|
| `#/` | [Panel.jsx](screens/Panel.jsx) | KPI, risk matritsasi (tashkilot × ko'rsatkich), yo'nalishlar, 12 oylik umumiy dinamika, ko'rsatkich kartochkalari |
| `#/risklar/<guruh>/<id>?org=` | [RiskSahifa.jsx](screens/RiskSahifa.jsx) | 20 ta hisobotning har biri: filtrlar → KPI → reyting + dinamika → 2 darajali jadval |
| `#/sozlamalar/<id>` | [Sozlamalar.jsx](screens/Sozlamalar.jsx) | Ko'rsatkich sozlamasi: chegaralar, maxsus parametrlar, jonli ta'sir |
| `#/korsatkichlar` | [Reestr.jsx](screens/Reestr.jsx) | Ko'rsatkichlar reyestri: ro'yxat, yoqish/o'chirish, nusxa, o'chirish |
| `#/korsatkichlar/yangi[?guruh=&nusxa=]` · `#/korsatkichlar/<id>` | [KorsatkichForma.jsx](screens/KorsatkichForma.jsx) | Konstruktor: yaratish va tahrirlash, jonli ko'rinish bilan |
| `#/hujjatlar[?tab=&yuklash=&status=&k=&muddat=&q=]` | [Hujjatlar.jsx](screens/Hujjatlar.jsx) | Risklar ro'yxati: barchasi / avtomatik / manual / ignor tablari |
| `#/hujjatlar/<id>` | [HujjatKorish.jsx](screens/HujjatKorish.jsx) | Risk hujjati: 15 maydon, flow, qiymat dinamikasi, tarix, amallar |
| `#/yangilanishlar[?demo=1]` | [Yangilanishlar.jsx](screens/Yangilanishlar.jsx) | Ma'lumotlar yangilanishi: holat, yangi davrni qabul qilish, tarix, avtomatlashtirish qoidalari. `?demo=1` — boshlang'ich holatga qaytarish tugmasi |

## Tuzilma

- [korsatkichlar/](korsatkichlar/) — 20 ta tizim ko'rsatkichi. Ta'rif shakli
  [tizim.js](korsatkichlar/tizim.js) ning bosh izohida. Yangi tizim
  ko'rsatkichi = guruh fayliga bitta obyekt; ekranlar tegilmaydi.
- [konstruktor.js](korsatkichlar/konstruktor.js) — foydalanuvchi ko'rsatkichi:
  deklarativ spek (yo'nalish, kesim, A/B maydonlar, formula, chegaralar) →
  oddiy ta'rif. Shundan keyin u tizimdagilar bilan bir xil ishlaydi.
- [hisob.js](hisob.js) — dvigatel: xom ma'lumot → hosila → daraja → tashkilot
  bo'yicha yig'ish → «Жами».
- [holat.jsx](holat.jsx) — sozlama (localStorage) va tanlangan davr.

## Muhim

- **Barcha holatlar ko'rinadi.** Prototip faqat chegaradan oshganlarni
  ko'rsatar edi. Endi chegaradan pastdagilar «Норма» darajasini oladi;
  yashirish uchun «Фақат рискдагилар» kalitini yoki daraja chiplarini bosing.
- **Ikki daraja: Tashkilot (INN) → kesim.** Tashkilot sartidagi qiymat
  bolalardan *yig'iladi*: summalar qo'shiladi va foiz yig'indidan qayta
  hisoblanadi (o'rtacha foiz olinmaydi). Kesim hisobotga qarab:

  | Kesim | Hisobotlar |
  |---|---|
  | Ҳисоб рақами | М1–М3, Х6, Х7, К1–К6 |
  | Лицевой ҳисоб | КР1 (prototipda hisob raqami deb xato ko'rsatilgan edi) |
  | Контрагент | Х3, Х4, Х5 |
  | Шартнома | Х2 |
  | productCode | Х1, Х8 |
  | МХИК / маҳсулот гуруҳи | Х9, Х10 |

  Sanoq va kechikish turidagi ko'rsatkichlarda (Х2–Х5) tashkilot sarti
  eng yomon bola qiymatini oladi (`jami: 'max'`). Bir necha shartnomaning
  kechikishini qo'shish ma'nosiz.
- **Foiz qo'shildi**: bo'sh ish o'rinlari, shtat bandligi, ishdan
  ketganlar va bo'shatilganlar, kechikish (muddatga nisbatan), MXIK mos
  kelmasligi. Har bir sonli ustun bosilganda saralanadi (ikkala darajada).
- **Sozlama shakli bir xil**: `{ faol, chegara, orta, yuqori, parametrlar }`.
  Maxsus parametrlar: М3 — avans va oylik talabi; Х5 — tanlov chegarasi
  summasi; Х7 — davrga mutanosib hisob; К2 — stavka normasi; К4 — formula;
  КР1 — solishtirish bazasi va «faqat o'sish».
- Daraja chegarasining o'zi ham darajaga kiradi (`≥`, «past» yo'nalishda `≤`).
- Demo ma'lumot deterministik ([lib/rng.js](../../lib/rng.js)): har bir
  (ko'rsatkich, tashkilot, kesim, oy) o'z urug'ida. 12 oy (2025-10 … 2026-09).

## Ko'rsatkichlar CRUD

| Amal | Tizim (20 ta) | Foydalanuvchi |
|---|---|---|
| Yaratish | — (kodda) | Konstruktor: 5 formula × 4 kesim |
| Ko'rish | Reyestr, hisobot | Reyestr, hisobot |
| Tahrirlash | Faqat chegara va parametrlar (sozlamalar) | To'liq: nom, yo'nalish, kesim, maydonlar, formula, chegaralar |
| O'chirish | Faqat «o'chiq» qilish | Butunlay (sozlamasi bilan) |

Formulalar: `A / B × 100`, `(B − A) / B × 100`, `(A − B) / B × 100`, `A − B`, `A`.
Kesimlar: hisob raqami, лицевой ҳисоб, kontragent, productCode. Kod yo'nalishda
keyingi bo'sh raqamni oladi (М4, Х11 …). Spek tahrirlansa uning sozlamasi
yangi standartga qaytadi. Saqlash — localStorage (`risklar-korsatkichlar-v1`).

Demo ma'lumot: manba tizim yo'q, shuning uchun foydalanuvchi ko'rsatkichining
qiymatlari standart chegaralar atrofida generatsiya qilinadi.

## Risk hujjatlari

Model — [hujjat/model.js](hujjat/model.js) (sof funksiyalar), holat —
[hujjat/holat.jsx](hujjat/holat.jsx) (IndexedDB `erp-risklar`).

**Avtomatik oqim.** Ma'lumot yangilanganda (texnik tomoni — RabbitMQ paketi) har bir faol ko'rsatkichning
har bir *kesimi* tekshiriladi:

| Holat | Natija |
|---|---|
| Ochiq risk bor, qiymat hali riskli | Qiymat tarixiga yoziladi; daraja o'zgarsa — tarixga |
| Ochiq risk bor, qiymat normaga qaytdi | Avtomatik yopiladi (asos «avto», izohda yangi qiymat) |
| Ochiq risk yo'q, qiymat riskli | Yangi risk (manba «avto», paket ID bilan) |
| Kalit ignor muddatida | Yaratilmaydi, jurnalda «игнор» sanog'i |

Kalit = ko'rsatkich + kesim (hisob raqami / productCode / ЛС / kontragent).
Bitta kalit bo'yicha bir vaqtda faqat bitta ochiq risk.

**Statuslar:** Янги → Ижрода → Текширувда → Бартараф этилди; istalgan
ochiqdan «Бекор қилинди»; yopilgan va bekor qilingan qayta ochiladi.
Manual yopishda izoh majburiy, fayl va ignor muddati ixtiyoriy.

**Muddat** ustuvorlikdan: Юқори 30 / Ўрта 45 / Паст 60 kun («Маълумотлар янгиланиши»
sahifasida sozlanadi). Ma'lumot oyiga bir marta kelgani uchun 10–20 kunlik muddat
avtomatik yopilishni doim «кечикиб» qilib qo'yardi.

**Demo.** Birinchi ochilishda 11 paket (2025-10 … 2026-08) qayta o'ynatiladi,
paketlar orasiga foydalanuvchi amallari (ishga olish, tekshiruv, fayl bilan
yopish, ignor, manual risk) deterministik qo'shiladi. 2026-09 paketi
navbatda — «Маълумот оқими» sahifasida o'qiladi. Hisobotlardagi davr
ro'yxati faqat o'qilgan paketlar bilan cheklangan.

## Interfeys matni

Mockup **mijozga ko'rsatiladi**: UI da texnik va integratsiya atamalari
bo'lmaydi — RabbitMQ, navbat, paket, host, ms, JSON, «demo», «mockup»,
«kodda yozilgan». O'rniga biznes tili: «маълумотлар янгиланиши»,
«маълумот даври», «Тизим (автоматик)». Texnik tafsilot faqat kod izohlari
va shu README da. Saqlangan holat sxemasi `VERSIYA` bilan belgilanadi —
avtomatik izoh matni o'zgarsa oshiriladi va holat qayta quriladi.

## Ochiq savollar

1. **Daraja chegaralari** (orta/yuqori) TZ da yo'q — standart qiymatlar
   taxminiy. Analitik tasdiqlashi kerak.
2. **К1 va К3** (bo'sh o'rinlar va bandlik) bir-birini to'ldiradi: 10% bo'sh
   = 90% band. Ikkalasi ham kerakmi?
3. **К5 va К6** farqi taxmin qilindi: К5 — barcha asoslar bo'yicha ketganlar,
   К6 — ish beruvchi tashabbusi bilan bo'shatilganlar.
4. **Х1** tashkilot sartida ortiqcha to'lovning jami xaridga nisbati
   (vaznli) olindi. Eng yomon mahsulot (max) kerakmi?
5. **КР1**: turli birlikdagi resurslar (кВт·соат, м³, Гкал) qo'shilmaydi —
   «Барчаси» tanlansa tashkilot sartida hajm «—», o'zgarish esa eng kattasi.
   Resurs bo'yicha alohida hisobot kerakmi?
6. Kadrlar hisob raqami kesimida berildi (shtat jadvali hisob raqami
   bo'yicha) — bo'linma/lavozim kesimi kerak bo'lishi mumkin.
7. Konstruktorda ma'lumot manbai yo'q: haqiqiy tizimda A va B maydonlari
   qaysi jadval/maydonga bog'lanadi (g'aznachilik, HR, xarid platformasi)?
   Formula 2 maydondan oshsa (masalan, A / (B + C)) — kengaytirish kerakmi?
8. Tizim ko'rsatkichlarini ham konstruktorga o'tkazish (to'liq tahrir) kerakmi?
   Hozir ulardagi maxsus mantiq (avans/oylik, drobleniye, kommunal birliklar)
   oddiy formulaga sig'maydi.
9. RabbitMQ paketining formati: kunlik paket butun davr kesimini olib keladimi
   yoki faqat o'zgarganlarini (delta)? Delta bo'lsa, kelmagan kesim uchun
   ochiq risk qanday baholanadi?
10. Avto yopilgan risk keyingi paketda yana riskli bo'lsa — yangi risk (hozir)
    yoki eskisini qayta ochish kerakmi?
11. Manual yaratilgan risk ham avtomatik yopiladimi? Hozir — ha (kalit bir xil).
12. Ignor kim tomonidan belgilanishi mumkin (rol cheklovi) va tasdiq kerakmi?
13. Muddati o'tgan risk uchun eskalatsiya (xabarnoma, rahbarga) kerakmi?

## Qaror tarixi

- 2026-10-23 — Prototip (20 sahifa) qayta qurildi: barcha holatlar, 2 darajali
  daraxt, foizlar va saralash, KPI + diagrammalar + filtrlar, sozlamalar
  sahifasi. КР1 sluga `limitdan-ortiq-sarf` → `kommunal-ozgarish` (sarlavhaga mos).
- 2026-10-23 — Ko'rsatkichlar CRUD: reyestr va konstruktor. Tizim ko'rsatkichlari
  kodda qoldi (faqat sozlanadi), foydalanuvchiniki — deklarativ spek.
- 2026-10-23 — Risk hujjatlari: RabbitMQ simulyatsiyasi, avto yaratish/yopish,
  manual risk, statuslar, fayl, ignor, tarix. Saqlash IndexedDB da — demo
  tarixi ~1,7 MB, localStorage ga sig'maydi.
