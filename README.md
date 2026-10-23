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
npm run smoke    # 41 ekranni SSR bilan chizadi
npm run check    # lint + smoke — ishni shu bilan yakunlang
npm run deploy   # check → build → GitHub Pages (gh-pages branch)
```

## Deploy

Sayt: **https://azizillorakhmanov.github.io/erp-risklar-mockup/**

`npm run deploy` tekshiruvdan o'tgan build'ni `mockup` remote'ining
`gh-pages` branch'iga yuboradi ([scripts/deploy.mjs](scripts/deploy.mjs)).
GitHub Pages bir-ikki daqiqada yangilanadi. Remote:
`git@github-azizillo.rakhmanov:AzizilloRakhmanov/erp-risklar-mockup.git`.

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
