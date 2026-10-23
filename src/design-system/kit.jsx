/*
 * Umumiy komponentlar: karta, KPI, tugma, chip, kalit (switch), tanlov,
 * qidiruv, raqam maydoni, segment va diagramma uchun suzuvchi izoh (tooltip).
 *
 * Rang faqat tokenlardan. Holat ma'nosi rang bilan yolg'iz berilmaydi —
 * matn yoki ikona yonida keladi.
 */
import { useCallback, useEffect, useState } from 'react';
import { mdiMagnify, mdiClose } from '@mdi/js';
import Icon from './Icon.jsx';
import s from './kit.module.css';

const cx = (...v) => v.filter(Boolean).join(' ');

export function Card({ title, sub, extra, pad = true, className, children }) {
  return (
    <section className={cx(s.card, className)}>
      {(title || extra) && (
        <header className={s.cardHead}>
          <div>
            {title && <h3 className={s.cardTitle}>{title}</h3>}
            {sub && <div className={s.cardSub}>{sub}</div>}
          </div>
          {extra && <div className={s.cardExtra}>{extra}</div>}
        </header>
      )}
      <div className={pad ? s.cardBody : undefined}>{children}</div>
    </section>
  );
}

/** KPI kartochkasi. `urgu` — chap chetdagi rangli chiziq (status tokeni nomi) */
export function Kpi({ label, value, sub, ikon, urgu, onClick, faol }) {
  const Teg = onClick ? 'button' : 'div';
  return (
    <Teg
      type={onClick ? 'button' : undefined}
      className={cx(s.kpi, onClick && s.kpiBos, faol && s.kpiFaol)}
      style={urgu ? { '--urgu': `var(--xb-st-${urgu})` } : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!faol : undefined}
    >
      <div className={s.kpiTop}>
        <span className={s.kpiLabel}>{label}</span>
        {ikon && <Icon path={ikon} size={16} />}
      </div>
      <div className={s.kpiValue}>{value}</div>
      {sub && <div className={s.kpiSub}>{sub}</div>}
    </Teg>
  );
}

export function Button({ ikon, children, tur = 'oddiy', kichik, className, ...rest }) {
  return (
    <button type="button" className={cx(s.btn, s[`btn_${tur}`], kichik && s.btnKichik, className)} {...rest}>
      {ikon && <Icon path={ikon} size={kichik ? 14 : 16} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Chip({ on, onClick, children, rang, son }) {
  return (
    <button
      type="button"
      className={cx(s.chip, on && s.chipOn)}
      onClick={onClick}
      aria-pressed={!!on}
      style={rang ? { '--nuqta': `var(--xb-st-${rang})` } : undefined}
    >
      {rang && <span className={s.chipNuqta} aria-hidden="true" />}
      <span>{children}</span>
      {son != null && <span className={s.chipSon}>{son}</span>}
    </button>
  );
}

export function Toggle({ on, onChange, label, id }) {
  return (
    <label className={s.toggle} htmlFor={id}>
      <input id={id} type="checkbox" checked={!!on} onChange={(e) => onChange(e.target.checked)} />
      <span className={s.toggleIz} aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, label, ikon, id }) {
  return (
    <label className={s.field} htmlFor={id}>
      {label && <span className={s.fieldLabel}>{label}</span>}
      <span className={s.selectWrap}>
        {ikon && <Icon path={ikon} size={15} />}
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

export function Search({ value, onChange, placeholder }) {
  return (
    <div className={s.search}>
      <Icon path={mdiMagnify} size={16} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button type="button" className={s.searchX} onClick={() => onChange('')} aria-label="Тозалаш">
          <Icon path={mdiClose} size={14} />
        </button>
      )}
    </div>
  );
}

/** Raqam maydoni birlik qo'shimchasi bilan. Bo'sh qoldirilsa NaN qaytadi */
export function NumInput({ value, onChange, birlik, xato, id, qadam = 'any', kenglik }) {
  return (
    <span className={cx(s.num, xato && s.numXato)} style={kenglik ? { width: kenglik } : undefined}>
      <input
        id={id}
        type="number"
        step={qadam}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        aria-invalid={!!xato}
      />
      {birlik && <span className={s.numBirlik}>{birlik}</span>}
    </span>
  );
}

/** `type="date"` bilan sana maydoni ham shu */
export function TextInput({ value, onChange, xato, id, placeholder, maxLength = 160, type = 'text', min, max }) {
  return (
    <input
      id={id}
      type={type}
      min={min}
      max={max}
      className={cx(s.matn, xato && s.numXato)}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!xato}
    />
  );
}

export function TextArea({ value, onChange, id, placeholder, qator = 3 }) {
  return (
    <textarea
      id={id}
      className={cx(s.matn, s.matnKop)}
      rows={qator}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Segment({ value, onChange, options }) {
  return (
    <div className={s.segment} role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={cx(s.segItem, value === o.id && s.segOn)}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
        >
          {o.nom}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tooltip */

/**
 * Diagramma izohi. Ishlatish:
 *   const tip = useTooltip();
 *   <rect {...tip.ulash(<>...</>)} />   ·   <Tooltip {...tip} />
 * Kontent React tugunlari sifatida chiziladi — HTML qatori qo'shilmaydi.
 */
export function useTooltip() {
  const [holat, setHolat] = useState(null);
  const ulash = useCallback(
    (kontent) => ({
      onPointerMove: (e) => setHolat({ x: e.clientX, y: e.clientY, kontent }),
      onPointerLeave: () => setHolat(null),
      onFocus: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setHolat({ x: r.left + r.width / 2, y: r.top, kontent });
      },
      onBlur: () => setHolat(null)
    }),
    []
  );
  return { holat, ulash };
}

export function Tooltip({ holat }) {
  if (!holat) return null;
  const chapga = typeof window !== 'undefined' && holat.x > window.innerWidth - 260;
  return (
    <div
      className={s.tip}
      style={{ left: holat.x + (chapga ? -14 : 14), top: holat.y + 14, transform: chapga ? 'translateX(-100%)' : undefined }}
      role="tooltip"
    >
      {holat.kontent}
    </div>
  );
}

/* ------------------------------------------------------------- modal */

/** Modal oyna: Escape va parda bosilsa yopiladi */
export function Modal({ ochiq, onYop, sarlavha, sub, children, amallar, kenglik = 560 }) {
  useEffect(() => {
    if (!ochiq) return;
    const tugma = (e) => e.key === 'Escape' && onYop();
    window.addEventListener('keydown', tugma);
    return () => window.removeEventListener('keydown', tugma);
  }, [ochiq, onYop]);
  if (!ochiq) return null;
  return (
    <div className={s.parda} onMouseDown={(e) => e.target === e.currentTarget && onYop()}>
      <div className={s.modal} style={{ maxWidth: kenglik }} role="dialog" aria-modal="true" aria-label={typeof sarlavha === 'string' ? sarlavha : undefined}>
        <header className={s.modalBosh}>
          <div>
            <h2 className={s.modalSarlavha}>{sarlavha}</h2>
            {sub && <div className={s.cardSub}>{sub}</div>}
          </div>
          <button type="button" className={s.searchX} onClick={onYop} aria-label="Ёпиш">
            <Icon path={mdiClose} size={18} />
          </button>
        </header>
        <div className={s.modalTana}>{children}</div>
        {amallar && <footer className={s.modalOyoq}>{amallar}</footer>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- tablar */

export function Tabs({ value, onChange, options }) {
  return (
    <div className={s.tablar} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={cx(s.tab, value === o.id && s.tabOn)}
          onClick={() => onChange(o.id)}
        >
          {o.ikon && <Icon path={o.ikon} size={16} />}
          {o.nom}
          {o.son != null && <span className={s.tabSon}>{o.son}</span>}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- pill */

/** Holat belgisi. `ohang`: ok | warn | err | info | accent | primary | mut */
export function Pill({ ohang = 'mut', ikon, children, title }) {
  return (
    <span className={cx(s.pill, s[`pill_${ohang}`])} title={title}>
      {ikon && <Icon path={ikon} size={12} />}
      {children}
    </span>
  );
}

export function Field({ label, htmlFor, xato, izoh, children, keng }) {
  return (
    <div className={cx(s.fieldBlok, keng && s.fieldKeng)}>
      {label && (
        <label className={s.fieldLabel} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {izoh && <span className={s.fieldIzoh}>{izoh}</span>}
      {xato && <span className={s.fieldXato}>{xato}</span>}
    </div>
  );
}
