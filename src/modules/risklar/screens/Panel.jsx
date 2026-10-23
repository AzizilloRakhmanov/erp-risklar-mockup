/*
 * Boshqaruv paneli — barcha faol ko'rsatkichlar bitta joyda.
 *
 * Risk matritsasi (tashkilot × ko'rsatkich) asosiy diagramma: qaysi
 * tashkilot qaysi yo'nalishda muammoli ekani bir qarashda ko'rinadi.
 */
import { useMemo, useState } from 'react';
import {
  mdiCalendarMonthOutline,
  mdiMapMarkerOutline,
  mdiChartBar,
  mdiDomain,
  mdiAlertOutline,
  mdiSignalCellular3,
  mdiChevronRight,
  mdiPlus
} from '@mdi/js';
import { Card, Kpi, Select, Icon } from '@ds';
import { son, qiymatMatn } from '../../../lib/format.js';
import { TASHKILOTLAR, VILOYATLAR } from '../../../reference/tashkilotlar.js';
import { ot } from '../../../shell/marshrut.js';
import { GURUHLAR, asosiyUstun } from '../korsatkichlar/index.js';
import { sanoq, dinamika, standartFiltr } from '../hisob.js';
import { useRisklar } from '../holat.jsx';
import { useBarchaNatija } from '../local/natijalar.js';
import { useHujjatlar } from '../hujjat/holat.jsx';
import { DarajaChiziq, DarajaAfsona } from '../local/Daraja.jsx';
import { Matritsa, Dinamika } from '../local/grafiklar.jsx';
import s from './ekran.module.css';

const riskUrl = (k, org) => `#/risklar/${k.guruh}/${k.id}${org ? `?org=${org.id}` : ''}`;

export default function Panel() {
  const { davr, setDavrId, sozlamalar } = useRisklar();
  const { davrlar } = useHujjatlar();
  const [viloyat, setViloyat] = useState('');
  const barcha = useBarchaNatija();

  const mos = (org) => !viloyat || org.viloyat === viloyat;
  const faollar = barcha
    .filter((x) => x.soz.faol)
    .map((x) => ({ ...x, qatorlar: x.natija.qatorlar.filter((t) => mos(t.org)) }));

  const tashkilotlar = TASHKILOTLAR.filter(mos);
  const matritsa = tashkilotlar
    .map((org) => {
      const kataklar = {};
      let riskli = 0;
      let yuqori = 0;
      let ball = 0;
      for (const { k, qatorlar } of faollar) {
        const t = qatorlar.find((x) => x.org.id === org.id);
        if (!t) continue;
        kataklar[k.id] = { daraja: t.daraja, qiymat: t.qiymat, tur: asosiyUstun(k).tur };
        if (t.daraja !== 'norma') riskli++;
        if (t.daraja === 'yuqori') yuqori++;
        ball += { yuqori: 3, orta: 2, past: 1 }[t.daraja] ?? 0;
      }
      return { org, kataklar, riskli, yuqori, ball };
    })
    .sort((a, b) => b.ball - a.ball);

  const holatlar = sanoq(faollar.flatMap((x) => x.qatorlar));
  const riskliOrg = matritsa.filter((m) => m.riskli > 0).length;

  /* 12 oylik umumiy dinamika: barcha faol ko'rsatkichlardagi holatlar yig'indisi */
  const umumiyDin = useMemo(() => {
    const qatlam = barcha
      .filter((x) => x.soz.faol)
      .map((x) => dinamika(x.k, x.soz, standartFiltr(x.k), (org) => !viloyat || org.viloyat === viloyat, davrlar));
    return davrlar.map((d, i) => ({
      davr: d,
      yuqori: qatlam.reduce((a, q) => a + q[i].yuqori, 0),
      orta: qatlam.reduce((a, q) => a + q[i].orta, 0),
      past: qatlam.reduce((a, q) => a + q[i].past, 0),
      norma: qatlam.reduce((a, q) => a + q[i].norma, 0)
    }));
  }, [barcha, viloyat, davrlar]);

  const faolSoni = Object.values(sozlamalar).filter((x) => x.faol).length;

  return (
    <div className={s.sahifa}>
      <header className={s.sarlavhaBlok}>
        <div className={s.sarlavhaMatn}>
          <div className={s.crumb}>Ички аудит тизими</div>
          <h1 className={s.h1}>Рисклар бошқарув панели</h1>
          <p className={s.tavsif}>
            {faolSoni} та фаол кўрсаткич бўйича {davr.nom.toLowerCase()} ҳолати. Кўрсаткичлар чегараларини «Созламалар» бўлимида
            ўзгартириш мумкин — барча ҳисоблар дарҳол янгиланади.
          </p>
        </div>
      </header>

      <div className={s.filtrQator}>
        <Select id="p-davr" ikon={mdiCalendarMonthOutline} value={davr.id} onChange={setDavrId} options={[...davrlar].reverse()} />
        <Select
          id="p-viloyat"
          ikon={mdiMapMarkerOutline}
          value={viloyat}
          onChange={setViloyat}
          options={[{ id: '', nom: 'Барча ҳудудлар' }, ...VILOYATLAR.map((v) => ({ id: v, nom: v }))]}
        />
      </div>

      <div className={s.kpiQator}>
        <Kpi label="Фаол кўрсаткичлар" ikon={mdiChartBar} value={`${faolSoni} / ${barcha.length}`} sub="4 йўналиш бўйича" />
        <Kpi label="Мониторингдаги ташкилотлар" ikon={mdiDomain} value={son(tashkilotlar.length)} sub={viloyat || 'барча ҳудудлар'} />
        <Kpi
          label="Рискли ташкилотлар"
          ikon={mdiAlertOutline}
          value={son(riskliOrg)}
          sub="камида битта кўрсаткичда"
          urgu="orta"
        />
        <Kpi
          label="Рискли ҳолатлар"
          ikon={mdiAlertOutline}
          value={son(holatlar.yuqori + holatlar.orta + holatlar.past)}
          sub={`${son(holatlar.yuqori + holatlar.orta + holatlar.past + holatlar.norma)} та текширувдан`}
          urgu="past"
        />
        <Kpi label="Юқори даражали" ikon={mdiSignalCellular3} value={son(holatlar.yuqori)} sub="ташкилот × кўрсаткич" urgu="yuqori" />
      </div>

      <div className={s.grafikQator}>
        <Card title="Риск матрицаси" sub="Ташкилот × кўрсаткич · энг рискли ташкилотлар тепада" className={s.grafikKatta}>
          <Matritsa
            ustunlar={faollar.map((x) => ({ k: x.k }))}
            qatorlar={matritsa}
            onTanla={(k, org) => ot(riskUrl(k, org))}
          />
        </Card>
        <div className={s.ustunBlok}>
          <Card title="Йўналишлар бўйича" sub="Ташкилот × кўрсаткич ҳолатлари">
            <div className={s.yonalishlar}>
              {GURUHLAR.map((g) => {
                const ichida = faollar.filter((x) => x.k.guruh === g.id);
                return (
                  <div key={g.id} className={s.yonalish}>
                    <div className={s.yonalishBosh}>
                      <Icon path={g.ikon} size={16} />
                      <span>{g.nom}</span>
                      <span className={s.xira}>{ichida.length} та</span>
                    </div>
                    <DarajaChiziq sanoq={sanoq(ichida.flatMap((x) => x.qatorlar))} balandlik={10} />
                  </div>
                );
              })}
              <DarajaAfsona sanoq={holatlar} />
            </div>
          </Card>
          <Card title="Умумий динамика" sub={`Рискли ҳолатлар сони, ${davrlar.length} ой`}>
            <Dinamika data={umumiyDin} tanlanganId={davr.id} onTanla={setDavrId} />
          </Card>
        </div>
      </div>

      {GURUHLAR.map((g) => {
        const ichida = barcha.filter((x) => x.k.guruh === g.id);
        return (
          <section key={g.id} className={s.guruhBolim}>
            <h2 className={s.h2}>
              <Icon path={g.ikon} size={18} />
              {g.nom}
              <span className={s.xira}>{ichida.length} та кўрсаткич</span>
            </h2>
            <div className={s.kartalar}>
              {ichida.map(({ k, soz }) => {
                const qatorlar = faollar.find((x) => x.k.id === k.id)?.qatorlar ?? barcha.find((x) => x.k.id === k.id).natija.qatorlar.filter((t) => mos(t.org));
                const sq = sanoq(qatorlar);
                const asosiy = asosiyUstun(k);
                return (
                  <button
                    key={k.id}
                    type="button"
                    className={`${s.kKarta} ${soz.faol ? '' : s.kKartaOchiq}`}
                    onClick={() => ot(riskUrl(k))}
                  >
                    <div className={s.kKartaBosh}>
                      <span className={s.kodBelgi}>{k.kod}</span>
                      {k.manba === 'foydalanuvchi' && <span className={s.yangiBelgi}>фойдаланувчи</span>}
                      {!soz.faol && <span className={s.ochirilgan}>ўчирилган</span>}
                      <Icon path={mdiChevronRight} size={16} />
                    </div>
                    <div className={s.kNom}>{k.nom}</div>
                    <div className={s.kChegara}>
                      {asosiy.nom}: риск {k.yonalish === 'past' ? '≤' : '≥'} {qiymatMatn(soz.chegara, asosiy.tur)}
                    </div>
                    <div className={s.kRaqam}>
                      <b>{sq.yuqori + sq.orta + sq.past}</b>
                      <span>/ {qatorlar.length} рискда</span>
                    </div>
                    <DarajaChiziq sanoq={sq} />
                  </button>
                );
              })}
              <button type="button" className={s.qoshKarta} onClick={() => ot(`#/korsatkichlar/yangi?guruh=${g.id}`)}>
                <Icon path={mdiPlus} size={20} />
                Кўрсаткич қўшиш
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
