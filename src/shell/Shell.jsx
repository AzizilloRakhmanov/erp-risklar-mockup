import { mdiShieldAlertOutline, mdiViewGridPlusOutline } from '@mdi/js';
import { Icon } from '@ds';
import { MODULLAR } from '../modules/registry.js';
import s from './shell.module.css';

export default function Shell() {
  return (
    <div className={s.ilova}>
      <header className={s.topbar}>
        <span className={s.belgi}>
          <Icon path={mdiShieldAlertOutline} size={18} />
        </span>
        <span className={s.nom}>ERP — Risklar</span>
        <span className={s.versiya}>mockup v0.1</span>
      </header>

      <main className={s.asosiy}>
        <h1 className={s.sarlavha}>Modullar</h1>
        {MODULLAR.length === 0 ? (
          <div className={s.bosh}>
            <Icon path={mdiViewGridPlusOutline} size={32} />
            <p>Hali modul yo'q. Birinchi modul <code>src/modules/</code> ga qo'shiladi.</p>
          </div>
        ) : (
          <ul className={s.royxat}>
            {MODULLAR.map((m) => (
              <li key={m.id} className={s.karta}>
                <b>{m.nom}</b>
                <span>{m.izoh}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
