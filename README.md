# ERP — Risklar (mockup)

Risklarni boshqarish moduli uchun interaktiv mockup. Stack va tuzilma
[mockup-xb-erp-v2](https://github.com/nakhmadaliev-webase/mockup-xb-erp-v2)
bilan bir xil: Vite + React 18, Material Design Icons, dizayn tokenlari.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5190
npm run build
npm run lint
npm run smoke    # barcha ekranlarni SSR bilan chizadi
npm run check    # lint + smoke — ishni shu bilan yakunlang
npm run deploy   # check → build → mock.apptest.uz (MOCKUP_TOKEN kerak)
```

## Deploy

Sayt: **https://risklar-m.apptest.uz** (mock.apptest.uz portali, loyiha
«Azizillo Rakhmanov», mockup nomi `risklar-m`).

```bash
MOCKUP_TOKEN=mpt_... npm run deploy
```

[scripts/deploy.mjs](scripts/deploy.mjs) tekshiruvdan o'tgan build'ni zip
qilib portalning `/api/deploy` iga yuboradi (har safar yangi versiya) va
`running` bo'lguncha kutadi. Token portalning Profil sahifasida yaratiladi
va **repoga yozilmaydi**.

## Tuzilma

| Papka | Vazifasi |
|---|---|
| `src/design-system/` | Tokenlar (`tokens.css`) va umumiy komponentlar (`@ds`) |
| `src/shell/` | Ilova qobig'i: topbar, modullar katalogi (`@shell`) |
| `src/modules/` | Har bir modul o'z papkasida, `registry.js` ga yoziladi |
| `src/reference/` | Ma'lumotnomalar va demo ma'lumot (`@ref`) |
| `src/lib/` | Yordamchi funksiyalar (`@lib`) |
| `src/store/` | Holat (state) qatlami (`@store`) |
| `docs/` | TZ, talablar, dizayn manbalari |
| `scripts/` | Tekshiruv skriptlari |

## Holat

| Modul | Ekran | Izoh |
|---|---|---|
| Risk monitoring (`risklar`) | 1 panel + 20 hisobot + sozlamalar | [README](src/modules/risklar/README.md) |

Manba prototip tahlili: [docs/lovable-prototip-tahlili.md](docs/lovable-prototip-tahlili.md).
