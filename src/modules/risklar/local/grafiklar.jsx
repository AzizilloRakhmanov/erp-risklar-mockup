/*
 * Diagrammalar — kutubxonasiz (HTML + SVG).
 *
 *   TashkilotReyting — tashkilotlar asosiy ko'rsatkich bo'yicha, chegara
 *                      chiziqlari bilan (gorizontal ustunlar)
 *   Dinamika         — 12 oy: riskdagi tashkilotlar soni darajalar bo'yicha
 *                      (yig'ma ustunlar), oyni bosib davr tanlanadi
 *   Matritsa         — tashkilot × ko'rsatkich issiqlik xaritasi (panel)
 *
 * Rang = holat (daraja); har bir belgida izoh (tooltip), qiymat matni esa
 * siyoh tokenida. Jadval ko'rinishi har doim sahifaning o'zida bor.
 */
import { useEffect, useRef, useState } from 'react';
import { useTooltip, Tooltip } from '@ds';
import { qiymatMatn } from '../../../lib/format.js';
import { DARAJALAR, darajaNom } from '../hisob.js';
import { DarajaBelgi } from './Daraja.jsx';
import s from './local.module.css';

export function useKenglik() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ------------------------------------------------- Tashkilot reytingi */

export function TashkilotReyting({ qatorlar, k, soz, tur, onTanla, tanlangan }) {
  const tip = useTooltip();
  /* Eng yomoni tepada */
  const royxat = qatorlar
    .filter((t) => t.qiymat != null)
    .sort((a, b) => (k.yonalish === 'past' ? a.qiymat - b.qiymat : b.qiymat - a.qiymat));

  const eng = Math.max(...royxat.map((t) => t.qiymat), 0);
  const chegaralar = [soz.chegara, soz.orta, soz.yuqori];
  const shkala = Math.max(eng, ...chegaralar) * 1.08 || 1;
  const x = (v) => `${Math.max(0, Math.min(100, (v / shkala) * 100))}%`;
  const belgilar = [
    { v: soz.chegara, d: 'past' },
    { v: soz.orta, d: 'orta' },
    { v: soz.yuqori, d: 'yuqori' }
  ];

  if (!royxat.length) return <div className={s.grafikBosh}>Маълумот йўқ</div>;

  return (
    <div className={s.reyting}>
      <div className={s.reytingBosh}>
        <span />
        <div className={s.reytingIz}>
          {belgilar.map((b) => (
            <span key={b.d} className={s.chegaraYorliq} style={{ left: x(b.v) }}>
              {qiymatMatn(b.v, tur)}
            </span>
          ))}
        </div>
        <span />
      </div>
      {royxat.map((t) => (
        <div key={t.id} className={`${s.reytingQator} ${tanlangan === t.id ? s.reytingTanlangan : ''}`}>
          <span className={s.reytingNom} title={t.org.nom}>
            {t.org.nom}
          </span>
          <button
            type="button"
            className={s.reytingIz}
            onClick={() => onTanla?.(t.id)}
            aria-label={`${t.org.nom}: ${qiymatMatn(t.qiymat, tur)}, ${darajaNom(t.daraja)}`}
            {...tip.ulash(
              <>
                <div className={s.tipSarlavha}>{t.org.nom}</div>
                <div>
                  <b className={s.tipQiymat}>{qiymatMatn(t.qiymat, tur)}</b> · {darajaNom(t.daraja)}
                </div>
                <div className={s.tipIzoh}>
                  {t.bolalar.length} та кесим, {t.riskli} таси рискда · босинг — жадвалда очиш
                </div>
              </>
            )}
          >
            {belgilar.map((b) => (
              <i key={b.d} className={s.chegaraChiziq} style={{ left: x(b.v) }} aria-hidden="true" />
            ))}
            <span className={s.reytingUstun} style={{ width: x(t.qiymat), background: `var(--xb-st-${t.daraja})` }} />
          </button>
          <span className={s.reytingQiymat}>{qiymatMatn(t.qiymat, tur)}</span>
        </div>
      ))}
      <Tooltip {...tip} />
    </div>
  );
}

/* ----------------------------------------------------------- Dinamika */

const QAVATLAR = ['yuqori', 'orta', 'past'];

export function Dinamika({ data, tanlanganId, onTanla, jamiTashkilot }) {
  const [ref, w] = useKenglik();
  const tip = useTooltip();
  const h = 200;
  const pad = { l: 28, r: 8, t: 18, b: 24 };
  const ichW = w - pad.l - pad.r;
  const ichH = h - pad.t - pad.b;
  const eng = Math.max(1, ...data.map((d) => d.yuqori + d.orta + d.past));
  const tepa = Math.max(eng, Math.ceil(eng / 4) * 4);
  const y = (v) => pad.t + ichH - (v / tepa) * ichH;
  const qadam = ichW / data.length;
  const ustunW = Math.min(34, qadam * 0.62);
  const torlar = [0, tepa / 4, tepa / 2, (3 * tepa) / 4, tepa].map((v) => Math.round(v));

  return (
    <div ref={ref} className={s.dinamika}>
      <svg width={w} height={h} role="img" aria-label="12 ойлик динамика: рискдаги ташкилотлар сони">
        {[...new Set(torlar)].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} className={s.tor} />
            <text x={pad.l - 6} y={y(v) + 3} className={s.oqYorliq} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + qadam * i + qadam / 2;
          const tanlangan = d.davr.id === tanlanganId;
          const jami = d.yuqori + d.orta + d.past;
          let ost = 0;
          return (
            <g key={d.davr.id} className={s.dinUstun} onClick={() => onTanla?.(d.davr.id)}>
              {tanlangan && <rect x={cx - qadam / 2 + 2} y={pad.t - 14} width={qadam - 4} height={ichH + 14} rx={6} className={s.dinTanlov} />}
              {QAVATLAR.map((q) => {
                if (!d[q]) return null;
                const y0 = y(ost);
                ost += d[q];
                const y1 = y(ost);
                return (
                  <rect
                    key={q}
                    x={cx - ustunW / 2}
                    y={y1 + 1}
                    width={ustunW}
                    height={Math.max(1, y0 - y1 - 2)}
                    rx={3}
                    fill={`var(--xb-st-${q})`}
                    tabIndex={0}
                    {...tip.ulash(
                      <>
                        <div className={s.tipSarlavha}>{d.davr.nom}</div>
                        {QAVATLAR.map((z) => (
                          <div key={z} className={s.tipQator}>
                            <i style={{ background: `var(--xb-st-${z})` }} />
                            <b className={s.tipQiymat}>{d[z]}</b> {darajaNom(z)}
                          </div>
                        ))}
                        <div className={s.tipIzoh}>
                          Норма: {d.norma} · жами {jamiTashkilot ?? jami + d.norma}
                        </div>
                      </>
                    )}
                  />
                );
              })}
              {(tanlangan || i === data.length - 1) && (
                <text x={cx} y={y(jami) - 5} className={s.ustunYorliq} textAnchor="middle">
                  {jami}
                </text>
              )}
              <text x={cx} y={h - 6} className={`${s.oqYorliq} ${tanlangan ? s.oqTanlangan : ''}`} textAnchor="middle">
                {d.davr.qisqa}
              </text>
              {/* Bosish maydoni ustundan katta */}
              <rect x={cx - qadam / 2} y={pad.t} width={qadam} height={ichH} fill="transparent" />
            </g>
          );
        })}
      </svg>
      <div className={s.afsona}>
        {QAVATLAR.map((q) => (
          <span key={q}>
            <i style={{ background: `var(--xb-st-${q})` }} aria-hidden="true" />
            {darajaNom(q)}
          </span>
        ))}
        <span className={s.afsonaIzoh}>Ойни босинг — давр алмашади</span>
      </div>
      <Tooltip {...tip} />
    </div>
  );
}

/* ----------------------------------------------------------- Matritsa */

/**
 * `ustunlar`: [{ k, guruh }] · `qatorlar`: [{ org, kataklar: { [kId]: { daraja, qiymat, tur } } }]
 */
export function Matritsa({ ustunlar, qatorlar, onTanla }) {
  const tip = useTooltip();
  return (
    <div className={s.matritsaWrap}>
      <table className={s.matritsa}>
        <thead>
          <tr>
            <th className={s.mxNomTh}>Ташкилот</th>
            {ustunlar.map(({ k }) => (
              <th key={k.id} title={k.nom}>
                {k.kod}
              </th>
            ))}
            <th className={s.mxBall}>Рисклар</th>
          </tr>
        </thead>
        <tbody>
          {qatorlar.map((q) => (
            <tr key={q.org.id}>
              <th className={s.mxNom} title={q.org.nom}>
                {q.org.nom}
              </th>
              {ustunlar.map(({ k }) => {
                const c = q.kataklar[k.id];
                return (
                  <td key={k.id}>
                    <button
                      type="button"
                      className={s.katak}
                      data-d={c?.daraja ?? 'yoq'}
                      onClick={() => onTanla?.(k, q.org)}
                      aria-label={`${q.org.nom}, ${k.nom}: ${darajaNom(c?.daraja)}`}
                      {...tip.ulash(
                        <>
                          <div className={s.tipSarlavha}>
                            {k.kod} · {k.nom}
                          </div>
                          <div className={s.tipIzoh}>{q.org.nom}</div>
                          <div className={s.tipQatorKatta}>
                            <b className={s.tipQiymat}>{c ? qiymatMatn(c.qiymat, c.tur) : '—'}</b>
                            <DarajaBelgi daraja={c?.daraja} kichik />
                          </div>
                        </>
                      )}
                    />
                  </td>
                );
              })}
              <td className={s.mxBall}>
                <b>{q.riskli}</b>
                {q.yuqori > 0 && <span className={s.mxYuqori}> · {q.yuqori} юқори</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.afsona}>
        {DARAJALAR.map((d) => (
          <span key={d.id}>
            <i className={s.afsonaKatak} data-d={d.id} aria-hidden="true" />
            {d.nom}
          </span>
        ))}
        <span className={s.afsonaIzoh}>Катакни босинг — кўрсаткич ўша ташкилот билан очилади</span>
      </div>
      <Tooltip {...tip} />
    </div>
  );
}
