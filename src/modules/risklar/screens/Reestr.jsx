/*
 * Ko'rsatkichlar reyestri — CRUD ning «R» va «D» qismi.
 *
 * Tizim ko'rsatkichlari (20 ta) kodda yozilgan: ularni o'chirib yoki
 * tuzilmasini o'zgartirib bo'lmaydi — faqat yoqish/o'chirish va chegaralarni
 * sozlash. Foydalanuvchi ko'rsatkichlari to'liq tahrirlanadi va o'chiriladi.
 */
import { useState } from 'react';
import {
  mdiPlus,
  mdiPencilOutline,
  mdiDeleteOutline,
  mdiContentCopy,
  mdiOpenInNew,
  mdiTuneVariant,
  mdiLockOutline,
  mdiFormatListBulleted,
  mdiAccountOutline,
  mdiCheckCircleOutline
} from '@mdi/js';
import { Card, Kpi, Button, Select, Search, Segment, Toggle, Icon } from '@ds';
import { qiymatMatn, son } from '../../../lib/format.js';
import { ot } from '../../../shell/marshrut.js';
import { GURUHLAR, asosiyUstun } from '../korsatkichlar/index.js';
import { useRisklar } from '../holat.jsx';
import s from './reestr.module.css';
import e from './ekran.module.css';

const MANBALAR = [
  { id: '', nom: 'Барчаси' },
  { id: 'tizim', nom: 'Тизим' },
  { id: 'foydalanuvchi', nom: 'Фойдаланувчи' }
];

const yoz = (m) => (m ?? '').toString().toLowerCase();

export default function Reestr() {
  const { korsatkichlar, sozlamalar, saqla, spekOchir } = useRisklar();
  const [qidiruv, setQidiruv] = useState('');
  const [guruh, setGuruh] = useState('');
  const [manba, setManba] = useState('');

  const q = yoz(qidiruv).trim();
  const royxat = korsatkichlar.filter(
    (k) =>
      (!guruh || k.guruh === guruh) &&
      (!manba || k.manba === manba) &&
      (!q || yoz(k.nom).includes(q) || yoz(k.kod).includes(q) || yoz(k.kesimNomi).includes(q))
  );

  const maxsusSoni = korsatkichlar.filter((k) => k.manba === 'foydalanuvchi').length;
  const faolSoni = korsatkichlar.filter((k) => sozlamalar[k.id].faol).length;

  const ochir = (k) => {
    if (window.confirm(`«${k.nom}» (${k.kod}) кўрсаткичи ва унинг созламаси ўчирилади. Бу амални қайтариб бўлмайди.`)) {
      spekOchir(k.id);
    }
  };

  return (
    <div className={e.sahifa}>
      <header className={e.sarlavhaBlok}>
        <div className={e.sarlavhaMatn}>
          <div className={e.crumb}>Бошқарув</div>
          <h1 className={e.h1}>Кўрсаткичлар реестри</h1>
          <p className={e.tavsif}>
            Тизимдаги ва фойдаланувчи яратган барча кўрсаткичлар. Янги кўрсаткич конструктор орқали яратилади ва
            дарҳол бошқарув панели, риск матрицаси ва созламаларда пайдо бўлади.
          </p>
        </div>
        <div className={e.sarlavhaAmal}>
          <Button tur="asosiy" ikon={mdiPlus} onClick={() => ot('#/korsatkichlar/yangi')}>
            Янги кўрсаткич
          </Button>
        </div>
      </header>

      <div className={e.kpiQator}>
        <Kpi label="Жами кўрсаткичлар" ikon={mdiFormatListBulleted} value={son(korsatkichlar.length)} sub={`${GURUHLAR.length} йўналиш`} />
        <Kpi label="Тизим" ikon={mdiLockOutline} value={son(korsatkichlar.length - maxsusSoni)} sub="стандарт кўрсаткичлар" />
        <Kpi label="Фойдаланувчи яратган" ikon={mdiAccountOutline} value={son(maxsusSoni)} sub="конструктор орқали" urgu="norma" />
        <Kpi label="Фаол" ikon={mdiCheckCircleOutline} value={`${faolSoni} / ${korsatkichlar.length}`} sub="ҳисобларда иштирок этади" />
      </div>

      <div className={e.filtrQator}>
        <Select
          id="r-guruh"
          value={guruh}
          onChange={setGuruh}
          options={[{ id: '', nom: 'Барча йўналишлар' }, ...GURUHLAR.map((g) => ({ id: g.id, nom: g.nom }))]}
        />
        <Segment value={manba} onChange={setManba} options={MANBALAR} />
        <Search value={qidiruv} onChange={setQidiruv} placeholder="Код, ном ёки кесим" />
      </div>

      <Card pad={false} title={`${son(royxat.length)} та кўрсаткич`}>
        <div className={s.wrap}>
          <table className={s.jadval}>
            <thead>
              <tr>
                <th>Код</th>
                <th>Кўрсаткич</th>
                <th>Кесим</th>
                <th>Асосий кўрсаткич</th>
                <th className={s.ong}>Риск чегараси</th>
                <th>Манба</th>
                <th>Ҳолат</th>
                <th className={s.ong}>Амаллар</th>
              </tr>
            </thead>
            <tbody>
              {royxat.length === 0 && (
                <tr>
                  <td colSpan={8} className={s.bosh}>
                    Кўрсаткич топилмади
                  </td>
                </tr>
              )}
              {royxat.map((k) => {
                const soz = sozlamalar[k.id];
                const u = asosiyUstun(k);
                const maxsus = k.manba === 'foydalanuvchi';
                return (
                  <tr key={k.id} className={soz.faol ? undefined : s.ochiq}>
                    <td>
                      <span className={e.kodBelgi}>{k.kod}</span>
                    </td>
                    <td className={s.nomTd}>
                      <a href={`#/risklar/${k.guruh}/${k.id}`} className={s.nom}>
                        {k.nom}
                      </a>
                      <div className={s.izoh}>{k.guruhNom}</div>
                    </td>
                    <td>{k.kesimNomi}</td>
                    <td className={s.formulaTd}>
                      <div>{u.nom}</div>
                      {k.formulaMatn && <div className={s.izoh}>{k.formulaMatn}</div>}
                    </td>
                    <td className={`${s.ong} ${s.mono}`}>
                      {k.yonalish === 'past' ? '≤' : '≥'} {qiymatMatn(soz.chegara, u.tur)}
                    </td>
                    <td>
                      <span className={maxsus ? s.manbaMaxsus : s.manbaTizim}>
                        <Icon path={maxsus ? mdiAccountOutline : mdiLockOutline} size={12} />
                        {maxsus ? 'Фойдаланувчи' : 'Тизим'}
                      </span>
                    </td>
                    <td>
                      <Toggle
                        id={`faol-${k.id}`}
                        on={soz.faol}
                        onChange={(v) => saqla(k.id, { ...soz, faol: v })}
                        label={soz.faol ? 'Фаол' : 'Ўчиқ'}
                      />
                    </td>
                    <td className={s.ong}>
                      <div className={s.amallar}>
                        <Button kichik tur="shaffof" ikon={mdiOpenInNew} title="Ҳисоботни очиш" aria-label="Ҳисоботни очиш" onClick={() => ot(`#/risklar/${k.guruh}/${k.id}`)} />
                        <Button kichik tur="shaffof" ikon={mdiTuneVariant} title="Чегараларни созлаш" aria-label="Чегараларни созлаш" onClick={() => ot(`#/sozlamalar/${k.id}`)} />
                        {maxsus ? (
                          <>
                            <Button kichik tur="shaffof" ikon={mdiPencilOutline} title="Таҳрирлаш" aria-label="Таҳрирлаш" onClick={() => ot(`#/korsatkichlar/${k.id}`)} />
                            <Button kichik tur="shaffof" ikon={mdiContentCopy} title="Нусха олиш" aria-label="Нусха олиш" onClick={() => ot(`#/korsatkichlar/yangi?nusxa=${k.id}`)} />
                            <Button kichik tur="xavf" ikon={mdiDeleteOutline} title="Ўчириш" aria-label="Ўчириш" onClick={() => ochir(k)} />
                          </>
                        ) : (
                          <span className={s.qulf} title="Тизим кўрсаткичи — тузилмаси ўзгармайди, фақат чегаралари созланади">
                            <Icon path={mdiLockOutline} size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
