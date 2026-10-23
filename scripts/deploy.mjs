/*
 * Deploy — mock.apptest.uz portali (static mockup).
 *
 *   MOCKUP_TOKEN=mpt_... npm run deploy
 *
 * Tartib: tekshiruv (lint + smoke) → build → `dist/` zip (ildizda index.html)
 * → `POST /api/deploy`. Mockup bo'lsa — yangi versiya, bo'lmasa — yaratiladi.
 * So'ng holat `running` bo'lguncha kutiladi.
 *
 * Token portalning Profil sahifasida yaratiladi va HECH QACHON repoga
 * yozilmaydi — faqat muhit o'zgaruvchisi orqali beriladi.
 *
 * Manzil: https://risklar-m.apptest.uz
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORTAL = 'https://mock.apptest.uz';
const NOM = 'risklar-m';
const LOYIHA = 'Azizillo Rakhmanov';
const IZOH = "ERP — Risk monitoring: 20 ta ko'rsatkich, konstruktor, risk hujjatlari";

const token = process.env.MOCKUP_TOKEN;
if (!token) {
  console.error('MOCKUP_TOKEN berilmagan: MOCKUP_TOKEN=mpt_... npm run deploy');
  process.exit(1);
}
const sarlavha = { Authorization: `Bearer ${token}` };
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

run('npm run check');
run('npm run build');

const papka = mkdtempSync(join(tmpdir(), 'risklar-deploy-'));
try {
  const zip = join(papka, `${NOM}.zip`);
  /* `zip` utilitasi hamma joyda yo'q — Python zipfile ishlatiladi */
  execSync(
    `python3 -c "import shutil,sys; shutil.make_archive(sys.argv[1][:-4], 'zip', 'dist')" "${zip}"`,
    { stdio: 'inherit' }
  );

  const forma = new FormData();
  forma.set('project', LOYIHA);
  forma.set('name', NOM);
  forma.set('description', IZOH);
  forma.set('file', new Blob([readFileSync(zip)], { type: 'application/zip' }), `${NOM}.zip`);

  const javob = await fetch(`${PORTAL}/api/deploy`, { method: 'POST', headers: sarlavha, body: forma });
  const natija = await javob.json().catch(() => ({}));
  if (!javob.ok) throw new Error(`Portal ${javob.status}: ${JSON.stringify(natija)}`);
  console.log(`→ ${natija.action ?? 'deploy'} · v${natija.version} · ${natija.status}`);

  /* Holat `running` bo'lguncha (ko'pi bilan ~2 daqiqa) */
  for (let i = 0; i < 40; i++) {
    await new Promise((ok) => setTimeout(ok, 3000));
    const h = await (await fetch(`${PORTAL}/api/mockups/${NOM}`, { headers: sarlavha })).json();
    if (h.status === 'running') {
      console.log(`\n✓ ${h.url} — v${h.version}`);
      process.exit(0);
    }
    if (/fail|error/i.test(h.status ?? '')) throw new Error(`Build xatosi: ${h.status} — loglar: ${PORTAL}/api/mockups/${NOM}/logs`);
  }
  throw new Error('Kutish vaqti tugadi — portalda holatni tekshiring');
} finally {
  rmSync(papka, { recursive: true, force: true });
}
