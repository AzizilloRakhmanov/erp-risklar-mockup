/*
 * Risk hujjati belgilari va kichik qismlar: status, ustuvorlik, muddat,
 * manba belgilari; fayl tanlash; fayllar ro'yxati.
 */
import { useRef } from 'react';
import {
  mdiRobotOutline,
  mdiAccountEditOutline,
  mdiPaperclip,
  mdiFileDocumentOutline,
  mdiDownload,
  mdiClockAlertOutline,
  mdiClockCheckOutline,
  mdiClockOutline,
  mdiTimerSandComplete
} from '@mdi/js';
import { Pill, Icon, Button } from '@ds';
import { son } from '../../../lib/format.js';
import { foydalanuvchiTop } from '../../../reference/foydalanuvchilar.js';
import { statusNom, ustuvorlikNom, muddatHolati, MUDDAT_HOLATI, vaqtMatn } from './model.js';
import s from './hujjat.module.css';

const STATUS_OHANG = { yangi: 'info', ijroda: 'warn', tekshiruvda: 'accent', yopilgan: 'ok', bekor: 'mut' };
const USTUVOR_OHANG = { yuqori: 'err', orta: 'warn', past: 'mut' };
const MUDDAT_OHANG = { otgan: 'err', yaqin: 'warn', bor: 'mut', muddatida: 'ok', kechikib: 'err' };
const MUDDAT_IKON = {
  otgan: mdiClockAlertOutline,
  yaqin: mdiTimerSandComplete,
  bor: mdiClockOutline,
  muddatida: mdiClockCheckOutline,
  kechikib: mdiClockAlertOutline
};

export const StatusBelgi = ({ status }) => <Pill ohang={STATUS_OHANG[status]}>{statusNom(status)}</Pill>;

export const UstuvorlikBelgi = ({ u }) => <Pill ohang={USTUVOR_OHANG[u]}>{ustuvorlikNom(u)}</Pill>;

export function MuddatBelgi({ r }) {
  const h = muddatHolati(r);
  if (!h) return <span className={s.xira}>—</span>;
  return (
    <Pill ohang={MUDDAT_OHANG[h]} ikon={MUDDAT_IKON[h]}>
      {MUDDAT_HOLATI[h]}
    </Pill>
  );
}

export function ManbaBelgi({ r, toliq }) {
  if (r.manba === 'avto') {
    return (
      <span className={s.manba}>
        <Icon path={mdiRobotOutline} size={14} />
        {toliq ? 'Автоматик (маълумотлар янгиланиши)' : 'Автоматик'}
      </span>
    );
  }
  return (
    <span className={s.manba}>
      <Icon path={mdiAccountEditOutline} size={14} />
      {toliq ? `Мануал · ${foydalanuvchiTop(r.muallif)?.nom ?? r.muallif}` : 'Мануал'}
    </span>
  );
}

export const kimNom = (id) => foydalanuvchiTop(id)?.nom ?? id ?? '—';

const hajmMatn = (b) => (b >= 1048576 ? `${son(b / 1048576, 1)} МБ` : `${son(Math.max(1, b / 1024))} КБ`);

/* Fayl mazmuni IndexedDB ga data-URL sifatida yoziladi. Juda kattasi
   (> 5 МБ) faqat metama'lumot bilan saqlanadi */
const MAX_MAZMUN = 5 * 1048576;

function oqi(fayl) {
  return new Promise((ok) => {
    const meta = { id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, nom: fayl.name, tur: fayl.type, hajm: fayl.size };
    if (fayl.size > MAX_MAZMUN) return ok({ ...meta, mazmun: null });
    const o = new FileReader();
    o.onload = () => ok({ ...meta, mazmun: o.result });
    o.onerror = () => ok({ ...meta, mazmun: null });
    o.readAsDataURL(fayl);
  });
}

/** Fayl tanlash: tanlanganlar ro'yxati bilan, o'chirib yuborish mumkin */
export function FaylTanlash({ fayllar, onChange }) {
  const ref = useRef(null);
  return (
    <div className={s.faylTanlash}>
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        onChange={async (e) => {
          const yangi = await Promise.all([...e.target.files].map(oqi));
          onChange([...fayllar, ...yangi]);
          e.target.value = '';
        }}
      />
      <Button kichik ikon={mdiPaperclip} onClick={() => ref.current?.click()}>
        Файл бириктириш
      </Button>
      {fayllar.map((f) => (
        <div key={f.id} className={s.fayl}>
          <Icon path={mdiFileDocumentOutline} size={16} />
          <span className={s.faylNom}>{f.nom}</span>
          <span className={s.xira}>{hajmMatn(f.hajm)}</span>
          <button type="button" className={s.faylX} onClick={() => onChange(fayllar.filter((x) => x.id !== f.id))} aria-label={`${f.nom} — олиб ташлаш`}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function FayllarRoyxati({ fayllar }) {
  if (!fayllar.length) return <div className={s.xira}>Файл бириктирилмаган</div>;
  return (
    <div className={s.fayllar}>
      {fayllar.map((f) => (
        <div key={f.id} className={s.fayl}>
          <Icon path={mdiFileDocumentOutline} size={18} />
          <div className={s.faylMatn}>
            <span className={s.faylNom}>{f.nom}</span>
            <span className={s.xira}>
              {hajmMatn(f.hajm)} · {kimNom(f.kim)} · {vaqtMatn(f.sana)}
            </span>
          </div>
          {f.mazmun && (
            <a href={f.mazmun} download={f.nom} className={s.yukla} aria-label={`${f.nom} — юклаб олиш`}>
              <Icon path={mdiDownload} size={16} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
