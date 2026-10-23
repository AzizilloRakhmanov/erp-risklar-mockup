/*
 * Ikki darajali jadval: Tashkilot (INN) → kesim (hisob raqami, ЛС, …).
 *
 * Tashkilot sartidagi qiymat bolalardan yig'ilgan (dvigatel bajaradi).
 * Har bir sonli ustun va daraja bo'yicha saralanadi — saralash ikkala
 * darajaga ham qo'llanadi (bolalar o'z ota qatori ichida saralanadi).
 */
import { Fragment, useEffect, useRef } from 'react';
import { mdiChevronRight, mdiArrowUp, mdiArrowDown, mdiSwapVertical } from '@mdi/js';
import { Icon } from '@ds';
import { qiymatMatn, SONLI } from '../../../lib/format.js';
import { darajaVazn } from '../hisob.js';
import { DarajaBelgi } from './Daraja.jsx';
import s from './local.module.css';

const NOM = '__nom';
const DARAJA = '__daraja';

/** Saralash kaliti bo'yicha qiymat (ikkala daraja uchun) */
function olish(x, kalit, ota) {
  if (kalit === NOM) return ota ? x.org.nom : x.bola.nom;
  if (kalit === DARAJA) return darajaVazn(x.daraja);
  return x.q[kalit];
}

function solishtir(a, b, kalit, yon, ota) {
  const va = olish(a, kalit, ota);
  const vb = olish(b, kalit, ota);
  /* Bo'sh qiymat har doim pastda */
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  const r = typeof va === 'string' ? va.localeCompare(vb, 'uz') : va - vb;
  return yon === 'asc' ? r : -r;
}

export function saralash(qatorlar, { kalit, yon }) {
  return [...qatorlar]
    .sort((a, b) => solishtir(a, b, kalit, yon, true))
    .map((t) => ({ ...t, bolalar: [...t.bolalar].sort((a, b) => solishtir(a, b, kalit, yon, false)) }));
}

function SarTh({ kalit, saralov, onSarala, children, sonli, asosiy, className }) {
  const faol = saralov.kalit === kalit;
  const ikon = faol ? (saralov.yon === 'asc' ? mdiArrowUp : mdiArrowDown) : mdiSwapVertical;
  return (
    <th
      className={`${sonli ? s.ong : ''} ${asosiy ? s.asosiyTh : ''} ${className ?? ''}`}
      aria-sort={faol ? (saralov.yon === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={`${s.sarTugma} ${faol ? s.sarFaol : ''}`}
        onClick={() =>
          onSarala({ kalit, yon: faol ? (saralov.yon === 'asc' ? 'desc' : 'asc') : sonli ? 'desc' : 'asc' })
        }
      >
        <span>{children}</span>
        <Icon path={ikon} size={13} />
      </button>
    </th>
  );
}

function Katak({ u, q, asosiy }) {
  const v = q[u.kalit];
  if (SONLI.has(u.tur)) {
    return (
      <td className={`${s.ong} ${s.mono} ${asosiy ? s.asosiyTd : ''}`}>{qiymatMatn(v, u.tur, { ishora: u.ishora })}</td>
    );
  }
  if (v == null || v === '') return <td className={s.xira}>—</td>;
  return <td className={u.tur === 'kod' ? s.mono : s.matnTd}>{v}</td>;
}

export default function DaraxtJadval({ k, qatorlar, jami, saralov, onSarala, ochiq, onOchiq, tanlangan, belgila, riskKatak }) {
  const qatorRef = useRef({});

  useEffect(() => {
    if (tanlangan) qatorRef.current[tanlangan]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [tanlangan]);

  const ustunSoni = k.ustunlar.length + (riskKatak ? 3 : 2);

  return (
    <div className={s.jadvalWrap}>
      <table className={s.jadval}>
        <thead>
          <tr>
            <SarTh kalit={NOM} saralov={saralov} onSarala={onSarala} className={s.birinchiTh}>
              Ташкилот / {k.kesimNomi}
            </SarTh>
            {k.ustunlar.map((u) => (
              <SarTh
                key={u.kalit}
                kalit={u.kalit}
                saralov={saralov}
                onSarala={onSarala}
                sonli={SONLI.has(u.tur)}
                asosiy={u.kalit === k.asosiy}
              >
                {u.nom}
              </SarTh>
            ))}
            <SarTh kalit={DARAJA} saralov={saralov} onSarala={onSarala} sonli>
              Даража
            </SarTh>
            {riskKatak && <th className={s.riskTh}>Риск</th>}
          </tr>
        </thead>
        <tbody>
          {qatorlar.length === 0 && (
            <tr>
              <td colSpan={ustunSoni} className={s.jadvalBosh}>
                Танланган филтрлар бўйича ташкилот топилмади
              </td>
            </tr>
          )}
          {qatorlar.map((t) => {
            const och = ochiq.has(t.id);
            return (
              <Fragment key={t.id}>
                <tr
                  ref={(el) => (qatorRef.current[t.id] = el)}
                  className={`${s.otaQator} ${tanlangan === t.id ? s.tanlanganQator : ''}`}
                  data-d={t.daraja}
                >
                  <td className={s.birinchi}>
                    <button
                      type="button"
                      className={s.ochTugma}
                      onClick={() => onOchiq(t.id)}
                      aria-expanded={och}
                      aria-label={`${t.org.nom} — ${och ? 'ёпиш' : 'очиш'}`}
                    >
                      <Icon path={mdiChevronRight} size={18} style={{ transform: och ? 'rotate(90deg)' : undefined }} />
                    </button>
                    <div className={s.nomBlok}>
                      <div className={s.orgNom}>{t.org.nom}</div>
                      <div className={s.orgMeta}>
                        <span className={s.mono}>ИНН {t.org.inn}</span>
                        <span>{t.org.viloyat}</span>
                        <span>
                          {t.bolalar.length} та {k.kesimNomi.toLowerCase()}
                          {t.riskli > 0 && <b className={s.riskliSon}> · {t.riskli} таси рискда</b>}
                        </span>
                      </div>
                    </div>
                  </td>
                  {k.ustunlar.map((u) => (
                    <Katak key={u.kalit} u={u} q={t.q} asosiy={u.kalit === k.asosiy} />
                  ))}
                  <td className={s.ong}>
                    <DarajaBelgi daraja={t.daraja} />
                  </td>
                  {riskKatak && <td className={s.riskTd}>{riskKatak(t, null)}</td>}
                </tr>
                {och &&
                  t.bolalar.map((b) => (
                    <tr key={b.id} className={`${s.bolaQator} ${belgila?.(b) ? s.belgilangan : ''}`}>
                      <td className={s.birinchi}>
                        <div className={s.bolaNom}>
                          <span className={s.mono}>{b.bola.nom}</span>
                          {b.bola.izoh && <span className={s.bolaIzoh}>{b.bola.izoh}</span>}
                        </div>
                      </td>
                      {k.ustunlar.map((u) => (
                        <Katak key={u.kalit} u={u} q={b.q} asosiy={u.kalit === k.asosiy} />
                      ))}
                      <td className={s.ong}>
                        <DarajaBelgi daraja={b.daraja} kichik />
                      </td>
                      {riskKatak && <td className={s.riskTd}>{riskKatak(t, b)}</td>}
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
        {jami && qatorlar.length > 0 && (
          <tfoot>
            <tr>
              <td className={s.birinchi}>
                <div className={s.nomBlok}>
                  <div className={s.orgNom}>Жами</div>
                  <div className={s.orgMeta}>{qatorlar.length} та ташкилот бўйича</div>
                </div>
              </td>
              {k.ustunlar.map((u) => (
                <Katak key={u.kalit} u={u} q={jami.q} asosiy={u.kalit === k.asosiy} />
              ))}
              <td className={s.ong}>
                <DarajaBelgi daraja={jami.daraja} kichik />
              </td>
              {riskKatak && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export const SARALASH_NOM = NOM;
