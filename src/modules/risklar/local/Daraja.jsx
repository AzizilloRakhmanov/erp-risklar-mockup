/*
 * Risk darajasi belgilari. Rang hech qachon yolg'iz kelmaydi: har bir
 * darajaning o'z ikonasi (signal ustunlari soni) va yorlig'i bor.
 */
import { mdiCheckCircleOutline, mdiSignalCellular1, mdiSignalCellular2, mdiSignalCellular3 } from '@mdi/js';
import { Icon, useTooltip, Tooltip } from '@ds';
import { DARAJALAR, darajaNom } from '../hisob.js';
import s from './local.module.css';

export const DARAJA_IKON = {
  yuqori: mdiSignalCellular3,
  orta: mdiSignalCellular2,
  past: mdiSignalCellular1,
  norma: mdiCheckCircleOutline
};

export function DarajaBelgi({ daraja, kichik }) {
  if (!daraja) return <span className={s.bosh}>—</span>;
  return (
    <span className={`${s.belgi} ${kichik ? s.belgiKichik : ''}`} data-d={daraja}>
      <Icon path={DARAJA_IKON[daraja]} size={kichik ? 12 : 14} />
      {darajaNom(daraja)}
    </span>
  );
}

/**
 * Darajalar ulushi — bitta gorizontal chiziq (yig'ma).
 * `sanoq`: { yuqori, orta, past, norma }. `afsona` — ostida yorliqlar.
 */
export function DarajaChiziq({ sanoq, afsona, balandlik = 8 }) {
  const tip = useTooltip();
  const jami = DARAJALAR.reduce((a, d) => a + (sanoq[d.id] ?? 0), 0);
  return (
    <div>
      <div className={s.chiziq} style={{ height: balandlik }} role="img" aria-label={DARAJALAR.map((d) => `${d.nom}: ${sanoq[d.id] ?? 0}`).join(', ')}>
        {jami === 0 && <span className={s.chiziqBosh} />}
        {DARAJALAR.map((d) =>
          sanoq[d.id] ? (
            <span
              key={d.id}
              className={s.chiziqBolak}
              style={{ flexGrow: sanoq[d.id], background: `var(--xb-st-${d.id})` }}
              {...tip.ulash(
                <>
                  <b className={s.tipQiymat}>{sanoq[d.id]}</b> · {d.nom} ({Math.round((sanoq[d.id] / jami) * 100)}%)
                </>
              )}
            />
          ) : null
        )}
      </div>
      {afsona && <DarajaAfsona sanoq={sanoq} />}
      <Tooltip {...tip} />
    </div>
  );
}

/** Darajalar afsonasi sanoq bilan */
export function DarajaAfsona({ sanoq }) {
  return (
    <div className={s.afsona}>
      {DARAJALAR.map((d) => (
        <span key={d.id}>
          <i style={{ background: `var(--xb-st-${d.id})` }} aria-hidden="true" />
          {d.nom} <b>{sanoq[d.id] ?? 0}</b>
        </span>
      ))}
    </div>
  );
}
