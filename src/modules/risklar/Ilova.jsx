/*
 * Modulning qobiqqa ulanadigan ikki qismi:
 *   Ekran — marshrut bo'yicha sahifa
 *   Menyu — yon panel: panel, 4 yo'nalish × ko'rsatkichlar, risk hujjatlari,
 *           reyestr, sozlamalar
 */
import {
  mdiViewDashboardOutline,
  mdiTuneVariant,
  mdiChevronDown,
  mdiFormatListBulleted,
  mdiPlus,
  mdiFileDocumentAlertOutline,
  mdiDatabaseSyncOutline
} from '@mdi/js';
import { useState } from 'react';
import { Icon } from '@ds';
import { GURUHLAR } from './korsatkichlar/index.js';
import { useRisklar } from './holat.jsx';
import { useBarchaNatija, riskliSoni } from './local/natijalar.js';
import Panel from './screens/Panel.jsx';
import RiskSahifa from './screens/RiskSahifa.jsx';
import Sozlamalar from './screens/Sozlamalar.jsx';
import Reestr from './screens/Reestr.jsx';
import KorsatkichForma from './screens/KorsatkichForma.jsx';
import Hujjatlar from './screens/Hujjatlar.jsx';
import HujjatKorish from './screens/HujjatKorish.jsx';
import Yangilanishlar from './screens/Yangilanishlar.jsx';
import { useHujjatlar } from './hujjat/holat.jsx';
import { OCHIQ, muddatHolati } from './hujjat/model.js';
import s from './ilova.module.css';

export { RisklarHolati } from './holat.jsx';
export { HujjatHolati } from './hujjat/holat.jsx';

export function Ekran({ yol }) {
  const { korsatkichlar } = useRisklar();
  const [bolim, ikkinchi, id] = yol.qismlar;
  if (bolim === 'risklar') {
    const k = korsatkichlar.find((x) => x.id === id);
    /* `versiya` kalitda: tahrirlangan ko'rsatkich sahifasi yangi tuzilma bilan qayta quriladi */
    if (k) return <RiskSahifa key={`${k.id}|${k.versiya ?? ''}|${yol.params.org ?? ''}`} k={k} params={yol.params} />;
  }
  if (bolim === 'korsatkichlar') {
    if (ikkinchi === 'yangi') return <KorsatkichForma params={yol.params} />;
    if (ikkinchi) return <KorsatkichForma id={ikkinchi} params={yol.params} />;
    return <Reestr />;
  }
  if (bolim === 'hujjatlar') {
    if (ikkinchi) return <HujjatKorish key={ikkinchi} id={ikkinchi} />;
    /* Parametrlar (?tab=&yuklash=) o'zgarsa ro'yxat yangidan ochiladi */
    return <Hujjatlar key={JSON.stringify(yol.params)} params={yol.params} />;
  }
  if (bolim === 'yangilanishlar') return <Yangilanishlar params={yol.params} />;
  if (bolim === 'sozlamalar') return <Sozlamalar id={ikkinchi} />;
  return <Panel />;
}

export function Menyu({ yol }) {
  const barcha = useBarchaNatija();
  const { holat, navbatdagi } = useHujjatlar();
  const [bolim, , joriyId] = yol.qismlar;
  const ochiq = holat.risklar.filter((r) => OCHIQ.has(r.status));
  const otgan = ochiq.filter((r) => muddatHolati(r) === 'otgan').length;
  const [yopiq, setYopiq] = useState(() => new Set());

  const almashtir = (g) =>
    setYopiq((e) => {
      const y = new Set(e);
      y.has(g) ? y.delete(g) : y.add(g);
      return y;
    });

  return (
    <nav className={s.menyu} aria-label="Асосий меню">
      <a href="#/" className={`${s.band} ${!bolim ? s.bandFaol : ''}`}>
        <Icon path={mdiViewDashboardOutline} size={18} />
        <span>Бошқарув панели</span>
      </a>

      <div className={s.bolimNom}>Рисклар</div>
      {GURUHLAR.map((g) => {
        const ochiq = !yopiq.has(g.id);
        const ichida = barcha.filter((x) => x.k.guruh === g.id);
        return (
          <div key={g.id} className={s.guruh}>
            <button type="button" className={s.guruhBosh} onClick={() => almashtir(g.id)} aria-expanded={ochiq}>
              <Icon path={g.ikon} size={17} />
              <span className={s.guruhNom}>{g.nom}</span>
              <span className={s.guruhSon}>{ichida.length}</span>
              <Icon path={mdiChevronDown} size={16} style={{ transform: ochiq ? undefined : 'rotate(-90deg)' }} />
            </button>
            {ochiq &&
              ichida.map(({ k, soz, natija }) => {
                const n = riskliSoni(natija);
                const faol = bolim === 'risklar' && joriyId === k.id;
                return (
                  <a
                    key={k.id}
                    href={`#/risklar/${k.guruh}/${k.id}`}
                    className={`${s.kBand} ${faol ? s.bandFaol : ''} ${soz.faol ? '' : s.ochiq}`}
                    title={k.nom}
                    aria-current={faol ? 'page' : undefined}
                  >
                    <span className={s.kod}>{k.kod}</span>
                    <span className={s.kNom}>{k.nom}</span>
                    {soz.faol && n > 0 && (
                      <span className={s.nishon} aria-label={`${n} та ташкилот рискда`}>
                        {n}
                      </span>
                    )}
                  </a>
                );
              })}
          </div>
        );
      })}

      <div className={s.bolimNom}>Риск ҳужжатлари</div>
      <a href="#/hujjatlar" className={`${s.band} ${bolim === 'hujjatlar' ? s.bandFaol : ''}`}>
        <Icon path={mdiFileDocumentAlertOutline} size={18} />
        <span className={s.kNom}>Рисклар рўйхати</span>
        <span className={s.nishonXira} title="Очиқ рисклар">
          {ochiq.length}
        </span>
        {otgan > 0 && (
          <span className={s.nishon} title="Муддати ўтган">
            {otgan}
          </span>
        )}
      </a>
      <a href="#/yangilanishlar" className={`${s.band} ${bolim === 'yangilanishlar' ? s.bandFaol : ''}`}>
        <Icon path={mdiDatabaseSyncOutline} size={18} />
        <span className={s.kNom}>Маълумотлар янгиланиши</span>
        {navbatdagi && (
          <span className={s.nishonInfo} title="Янги маълумот тайёр">
            1
          </span>
        )}
      </a>

      <div className={s.bolimNom}>Бошқарув</div>
      <a href="#/korsatkichlar" className={`${s.band} ${bolim === 'korsatkichlar' && !yol.qismlar[1] ? s.bandFaol : ''}`}>
        <Icon path={mdiFormatListBulleted} size={18} />
        <span>Кўрсаткичлар реестри</span>
      </a>
      <a href="#/korsatkichlar/yangi" className={`${s.band} ${bolim === 'korsatkichlar' && yol.qismlar[1] ? s.bandFaol : ''}`}>
        <Icon path={mdiPlus} size={18} />
        <span>Янги кўрсаткич</span>
      </a>
      <a href="#/sozlamalar" className={`${s.band} ${bolim === 'sozlamalar' ? s.bandFaol : ''}`}>
        <Icon path={mdiTuneVariant} size={18} />
        <span>Чегаралар созламаси</span>
      </a>
    </nav>
  );
}
