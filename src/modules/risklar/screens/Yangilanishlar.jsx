/*
 * Ma'lumotlar yangilanishi.
 *
 * Manba tizim ma'lumotni har kuni yuboradi, har bir yangilanishdan keyin
 * ko'rsatkichlar kesim darajasida qayta baholanadi. Texnik tomoni (RabbitMQ
 * navbati) interfeysda ko'rsatilmaydi — mockup mijozga ko'rsatiladi.
 *
 * Mockupda bitta yangilanish = bitta oylik davr. Navbatdagi davr «tayyor»
 * turadi va «Маълумотларни янгилаш» tugmasi bilan qabul qilinadi.
 * Boshlang'ich holatga qaytarish tugmasi faqat `#/yangilanishlar?demo=1`
 * havolasida chiqadi (taqdimotchi uchun).
 */
import { useState } from 'react';
import { mdiRestart, mdiDatabaseSyncOutline, mdiCheckCircleOutline, mdiOpenInNew, mdiCalendarCheckOutline, mdiUpdate } from '@mdi/js';
import { Card, Kpi, Button, Toggle, Select, NumInput, Icon, Pill } from '@ds';
import { son } from '../../../lib/format.js';
import { ot } from '../../../shell/marshrut.js';
import { DAVRLAR } from '../../../reference/davrlar.js';
import { DARAJALAR } from '../hisob.js';
import { useHujjatlar } from '../hujjat/holat.jsx';
import { USTUVORLIKLAR, vaqtMatn, STANDART_SOZLAMA } from '../hujjat/model.js';
import s from '../hujjat/hujjat.module.css';
import e from './ekran.module.css';

const davrNom = (id) => DAVRLAR.find((d) => d.id === id)?.nom ?? id;

export default function Yangilanishlar({ params }) {
  const { holat, navbatdagi, navbatniOqi, qaytaBoshlash, sozlamaOzgartir } = useHujjatlar();
  const [natija, setNatija] = useState(null);
  const tarix = [...holat.yuklashlar].reverse();
  const oxirgi = holat.yuklashlar.at(-1);
  const sz = holat.sozlama;

  const jami = holat.yuklashlar.reduce(
    (a, y) => ({ yangi: a.yangi + y.yangi, yopildi: a.yopildi + y.yopildi, xabarlar: a.xabarlar + y.xabarlar }),
    { yangi: 0, yopildi: 0, xabarlar: 0 }
  );

  return (
    <div className={e.sahifa}>
      <header className={e.sarlavhaBlok}>
        <div className={e.sarlavhaMatn}>
          <div className={e.crumb}>Риск ҳужжатлари</div>
          <h1 className={e.h1}>Маълумотлар янгиланиши</h1>
          <p className={e.tavsif}>
            Маълумотлар манба тизимлардан ҳар куни автоматик янгиланади. Ҳар бир янгиланишдан кейин барча фаол
            кўрсаткичлар қайта баҳоланади: чегарадан ошганлар учун риск яратилади, нормага қайтганлари автоматик
            ёпилади, игнордаги кесимлар ўтказиб юборилади.
          </p>
        </div>
        {params.demo === '1' && (
          <div className={e.sarlavhaAmal}>
            <Button
              ikon={mdiRestart}
              onClick={() => {
                if (window.confirm('Барча рисклар, амаллар ва янгиланишлар бошланғич ҳолатга қайтарилади.')) {
                  qaytaBoshlash();
                  setNatija(null);
                }
              }}
            >
              Бошланғич ҳолатга қайтариш
            </Button>
          </div>
        )}
      </header>

      <div className={s.oqimTarmoq}>
        <Card title="Интеграция ҳолати">
          <dl className={s.ulanish}>
            <dt>Ҳолат</dt>
            <dd>
              <Pill ohang="ok" ikon={mdiCheckCircleOutline}>
                Фаол
              </Pill>
            </dd>
            <dt>Даврийлик</dt>
            <dd>Ҳар куни</dd>
            <dt>Охирги янгиланиш</dt>
            <dd>{vaqtMatn(oxirgi?.sana)}</dd>
            <dt>Охирги маълумот даври</dt>
            <dd>{davrNom(oxirgi?.davrId)}</dd>
          </dl>
        </Card>

        <Card title="Янги маълумот" sub={navbatdagi ? 'Қабул қилишга тайёр' : 'Барча маълумотлар янгиланган'}>
          {navbatdagi ? (
            <div className={s.paket}>
              <Icon path={mdiCalendarCheckOutline} size={28} />
              <div>
                <b>{navbatdagi.nom} маълумоти</b>
                <div className={s.kichik}>Манба тизимдан келди, ҳали қабул қилинмаган</div>
              </div>
              <Button tur="asosiy" ikon={mdiDatabaseSyncOutline} onClick={() => setNatija(navbatniOqi())}>
                Маълумотларни янгилаш
              </Button>
            </div>
          ) : (
            <div className={s.xira}>Охирги маълумот даври: {davrNom(oxirgi?.davrId)}. Кейинги янгиланиш автоматик бўлади.</div>
          )}
          {natija && <Natija y={holat.yuklashlar.find((x) => x.id === natija)} />}
        </Card>

        <Card title="Автоматлаштириш қоидалари" sub="Кейинги янгиланишдан қўлланади">
          <div className={s.qoidalar}>
            <div className={s.qoida}>
              <span>Риск автоматик яратилсин</span>
              <Toggle id="o-yarat" on={sz.avtoYaratish} onChange={(v) => sozlamaOzgartir({ avtoYaratish: v })} />
            </div>
            <div className={s.qoida}>
              <span>Нормага қайтганда автоматик ёпилсин</span>
              <Toggle id="o-yop" on={sz.avtoYopish} onChange={(v) => sozlamaOzgartir({ avtoYopish: v })} />
            </div>
            <div className={s.qoida}>
              <span>Минимал даража</span>
              <Select
                id="o-min"
                value={sz.minDaraja}
                onChange={(v) => sozlamaOzgartir({ minDaraja: v })}
                options={DARAJALAR.filter((d) => d.id !== 'norma')
                  .reverse()
                  .map((d) => ({ id: d.id, nom: `${d.nom} ва ундан юқори` }))}
              />
            </div>
            <div className={s.qoidaSarlavha}>Бартараф этиш муддати (устуворлик бўйича)</div>
            {USTUVORLIKLAR.map((u) => (
              <div key={u.id} className={s.qoida}>
                <span>{u.nom}</span>
                <NumInput
                  id={`o-m-${u.id}`}
                  value={sz.muddat[u.id]}
                  birlik="кун"
                  kenglik={120}
                  onChange={(v) => Number.isFinite(v) && v > 0 && sozlamaOzgartir({ muddat: { ...sz.muddat, [u.id]: Math.round(v) } })}
                />
              </div>
            ))}
            {JSON.stringify(sz) !== JSON.stringify(STANDART_SOZLAMA) && (
              <Button kichik tur="shaffof" onClick={() => sozlamaOzgartir(structuredClone(STANDART_SOZLAMA))}>
                Стандартга қайтариш
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className={e.kpiQator}>
        <Kpi label="Янгиланишлар" ikon={mdiUpdate} value={son(holat.yuklashlar.length)} sub={`${davrNom(holat.yuklashlar[0]?.davrId)} дан бери`} />
        <Kpi label="Текширилган кесимлар" ikon={mdiDatabaseSyncOutline} value={son(jami.xabarlar)} sub="барча янгиланишлар бўйича" />
        <Kpi label="Автоматик яратилган" value={son(jami.yangi)} sub="риск" urgu="orta" />
        <Kpi label="Автоматик ёпилган" value={son(jami.yopildi)} sub="кўрсаткич нормага қайтди" urgu="norma" />
      </div>

      <Card pad={false} title="Янгиланишлар тарихи" sub="Қаторни босинг — шу янгиланишда аниқланган рисклар">
        <div className={s.jadvalWrap}>
          <table className={s.jadval}>
            <thead>
              <tr>
                <th>Сана</th>
                <th>Маълумот даври</th>
                <th className={s.ong}>Текширилди</th>
                <th className={s.ong}>Янги риск</th>
                <th className={s.ong}>Қиймати янгиланди</th>
                <th className={s.ong}>Автоматик ёпилди</th>
                <th className={s.ong}>Игнор сабабли ўтказилди</th>
              </tr>
            </thead>
            <tbody>
              {tarix.map((y) => (
                <tr key={y.id} className={s.qator} onClick={() => ot(`#/hujjatlar?tab=avto&yuklash=${y.id}`)}>
                  <td>{vaqtMatn(y.sana)}</td>
                  <td>{davrNom(y.davrId)}</td>
                  <td className={`${s.ong} ${s.mono}`}>{son(y.xabarlar)}</td>
                  <td className={`${s.ong} ${s.mono}`}>{son(y.yangi)}</td>
                  <td className={`${s.ong} ${s.mono}`}>{son(y.yangilandi)}</td>
                  <td className={`${s.ong} ${s.mono}`}>{son(y.yopildi)}</td>
                  <td className={`${s.ong} ${s.mono}`}>{son(y.ignor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Natija({ y }) {
  if (!y) return null;
  return (
    <div className={s.paketNatija}>
      <b>{davrNom(y.davrId)} маълумоти қабул қилинди</b>
      <span>
        {son(y.xabarlar)} та кесим текширилди: <b>{son(y.yangi)}</b> та янги риск аниқланди, <b>{son(y.yopildi)}</b> таси
        автоматик ёпилди, {son(y.yangilandi)} та очиқ рискнинг қиймати янгиланди, {son(y.ignor)} таси игнор сабабли ўтказиб
        юборилди.
      </span>
      <Button kichik ikon={mdiOpenInNew} onClick={() => ot(`#/hujjatlar?tab=avto&yuklash=${y.id}`)}>
        Янги рискларни кўриш
      </Button>
    </div>
  );
}
