import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  /* Nisbiy yo'llar: sayt GitHub Pages da `/erp-risklar-mockup/` ostida ochiladi.
     Marshrut hash orqali, shuning uchun server sozlamasi kerak emas. */
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@ds': r('./src/design-system'),
      '@ref': r('./src/reference'),
      '@lib': r('./src/lib'),
      '@store': r('./src/store'),
      '@shell': r('./src/shell')
    }
  },
  /* 5180-5182 serverdagi boshqa loyihalarda band — 5190 dan boshlaymiz */
  server: { port: 5190, host: true, open: false }
});
