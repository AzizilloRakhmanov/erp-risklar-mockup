import { useEffect, useState } from 'react';
import { mdiShieldAlertOutline, mdiWeatherNight, mdiWhiteBalanceSunny, mdiMenu, mdiCalendarMonthOutline, mdiAccountCircleOutline } from '@mdi/js';
import { Icon } from '@ds';
import { MODULLAR } from '../modules/registry.js';
import { RisklarHolati, HujjatHolati, Ekran, Menyu } from '../modules/risklar/Ilova.jsx';
import { useHujjatlar } from '../modules/risklar/hujjat/holat.jsx';
import { FOYDALANUVCHILAR } from '../reference/foydalanuvchilar.js';
import { useRisklar } from '../modules/risklar/holat.jsx';
import { useMarshrut } from './marshrut.js';
import { mavzuniOqi, mavzuniQoll } from './mavzu.js';
import s from './shell.module.css';

export default function Shell() {
  return (
    <RisklarHolati>
      <HujjatHolati>
        <Yuklanish />
      </HujjatHolati>
    </RisklarHolati>
  );
}

/** Risk hujjatlari IndexedDB dan o'qilguncha (yoki demo tarixi qurilguncha) */
function Yuklanish() {
  const { holat } = useHujjatlar();
  if (!holat) {
    return (
      <div className={s.yuklanish}>
        <span className={s.belgi}>
          <Icon path={mdiShieldAlertOutline} size={18} />
        </span>
        Риск ҳужжатлари юкланмоқда…
      </div>
    );
  }
  return <Qobiq />;
}

function Qobiq() {
  const yol = useMarshrut();
  const { davr } = useRisklar();
  const { foydalanuvchi, setFoydalanuvchi } = useHujjatlar();
  const [mavzu, setMavzu] = useState(mavzuniOqi);
  const [menyuOchiq, setMenyuOchiq] = useState(false);
  const modul = MODULLAR[0];

  useEffect(() => mavzuniQoll(mavzu), [mavzu]);
  /* Kichik ekranda sahifa almashsa menyu yopiladi */
  useEffect(() => setMenyuOchiq(false), [yol]);

  return (
    <div className={s.ilova}>
      <aside className={`${s.yon} ${menyuOchiq ? s.yonOchiq : ''}`}>
        <div className={s.brend}>
          <span className={s.belgi}>
            <Icon path={mdiShieldAlertOutline} size={18} />
          </span>
          <div>
            <div className={s.nom}>{modul.nom}</div>
            <div className={s.izoh}>Ички аудит тизими</div>
          </div>
        </div>
        <Menyu yol={yol} />
      </aside>
      {menyuOchiq && <div className={s.parda} onClick={() => setMenyuOchiq(false)} aria-hidden="true" />}

      <div className={s.ong}>
        <header className={s.topbar}>
          <button type="button" className={s.menyuTugma} onClick={() => setMenyuOchiq(true)} aria-label="Менюни очиш">
            <Icon path={mdiMenu} size={20} />
          </button>
          <span className={s.topNom}>Рисклар мониторинги тизими</span>
          <span className={s.davr}>
            <Icon path={mdiCalendarMonthOutline} size={15} />
            {davr.nom}
          </span>
          <label className={s.foydalanuvchi} title="Жорий фойдаланувчи">
            <Icon path={mdiAccountCircleOutline} size={18} />
            <select value={foydalanuvchi.id} onChange={(e) => setFoydalanuvchi(e.target.value)} aria-label="Фойдаланувчи">
              {FOYDALANUVCHILAR.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom} · {u.lavozim}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={s.mavzuTugma}
            onClick={() => setMavzu(mavzu === 'dark' ? 'light' : 'dark')}
            aria-label={mavzu === 'dark' ? 'Ёруғ мавзу' : 'Қоронғи мавзу'}
            title={mavzu === 'dark' ? 'Ёруғ мавзу' : 'Қоронғи мавзу'}
          >
            <Icon path={mavzu === 'dark' ? mdiWhiteBalanceSunny : mdiWeatherNight} size={18} />
          </button>
        </header>
        <main className={s.asosiy}>
          <Ekran yol={yol} />
        </main>
      </div>
    </div>
  );
}
