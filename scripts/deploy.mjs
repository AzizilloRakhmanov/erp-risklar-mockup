/*
 * Deploy — GitHub Pages (`gh-pages` branch).
 *
 *   npm run deploy
 *
 * Tartib: tekshiruv (lint + smoke) → build → `dist/` vaqtinchalik git
 * reposiga ko'chiriladi va `mockup` remote'ining `gh-pages` branch'iga
 * yuboriladi (har safar bitta commit, tarix saqlanmaydi — bu faqat tayyor
 * fayllar). Manzil: https://azizillorakhmanov.github.io/erp-risklar-mockup/
 *
 * Remote nomini `DEPLOY_REMOTE` bilan almashtirish mumkin.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const remote = process.env.DEPLOY_REMOTE ?? 'mockup';
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const ol = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const url = ol(`git remote get-url ${remote}`);
const commit = ol('git rev-parse --short HEAD');
const ifloslik = ol('git status --porcelain');
if (ifloslik) console.warn('⚠ Ishchi papkada commit qilinmagan o\'zgarishlar bor — ular ham deploy bo\'ladi.');

run('npm run check');
run('npm run build');

const papka = mkdtempSync(join(tmpdir(), 'erp-risklar-deploy-'));
try {
  cpSync('dist', papka, { recursive: true });
  /* Jekyll `_` bilan boshlanadigan fayllarni tashlab yubormasin */
  writeFileSync(join(papka, '.nojekyll'), '');
  run('git init -q -b gh-pages', papka);
  run(`git -c user.name="${ol('git config user.name')}" -c user.email="${ol('git config user.email')}" add -A`, papka);
  run(
    `git -c user.name="${ol('git config user.name')}" -c user.email="${ol('git config user.email')}" commit -q -m "Deploy: ${commit}"`,
    papka
  );
  run(`git push -f ${url} gh-pages`, papka);
  console.log(`\n✓ ${commit} → ${remote}/gh-pages`);
} finally {
  rmSync(papka, { recursive: true, force: true });
}
