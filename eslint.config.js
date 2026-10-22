import js from '@eslint/js';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/*
 * Maqsad — build ushlay olmaydigan xatolarni ushlash.
 *
 * Sabab: 2026-08-19 da `mdiPlus` import qilinmay qolgan edi. Build muvaffaqiyatli
 * o'tdi, chunki bu erkin o'zgaruvchi — xato faqat ekran ochilganda chiqdi.
 * `no-undef` aynan shuni ushlaydi.
 *
 * Uslub qoidalari yo'q: mockup loyihasida ular faqat shovqin.
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'docs/**'] },

  js.configs.recommended,

  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { react, 'react-hooks': hooks },
    settings: { react: { version: '18.3' } },
    rules: {
      /* Asosiy maqsad */
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',

      /* Hook qoidalari — noto'g'ri ishlatilsa ekran jimgina buziladi */
      'react-hooks/rules-of-hooks': 'error',

      /* Ishlatilmagan import — ko'chirishda tez-tez qoladi */
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      /* JSX da ishlatilgan komponent «ishlatilmagan» deb belgilanmasin */
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off'
    }
  }
];
