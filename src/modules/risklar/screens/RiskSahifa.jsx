/*
 * Ko'rsatkich hisoboti — 20 ta hisobotning har biri shu bitta ekranda chiziladi.
 *
 * Tepada: filtrlar (bitta qator) → KPI kartochkalari → ikki diagramma
 * (tashkilotlar reytingi va 12 oylik dinamika) → ikki darajali jadval.
 * Filtrlar pastdagi hamma narsaga ta'sir qiladi, raqamlar bir-biriga mos.
 */
import { useMemo, useState } from 'react';
import {
  mdiCalendarMonthOutline,
  mdiMapMarkerOutline,
  mdiTuneVariant,
  mdiDownload,
  mdiUnfoldMoreHorizontal,
  mdiUnfoldLessHorizontal,
  mdiDomain,
  mdiAlertOutline,
  mdiEyeOffOutline,
  mdiPlus
} from '@mdi/js';
import { Card, Kpi, Button, Chip, Toggle, Select, Search, Icon } from '@ds';
import { qiymatMatn, son } from '../../../lib/format.js';
import { VILOYATLAR } from '../../../reference/tashkilotlar.js';
import { ot } from '../../../shell/marshrut.js';
import { asosiyUstun } from '../korsatkichlar/index.js';
import { hisobla, sanoq, dinamika, jamiQator, standartFiltr, DARAJALAR, darajaNom } from '../hisob.js';
import { useRisklar } from '../holat.jsx';
import { DARAJA_IKON } from '../local/Daraja.jsx';
import { TashkilotReyting, Dinamika } from '../local/grafiklar.jsx';
import DaraxtJadval, { saralash } from '../local/DaraxtJadval.jsx';
import { csvYukla } from '../local/eksport.js';
import { useHujjatlar, useOchiqRisklar } from '../hujjat/holat.jsx';
import { RiskYaratOyna } from '../hujjat/oynalar.jsx';
import { riskKaliti, statusNom } from '../hujjat/model.js';
import l from '../local/local.module.css';
import s from './ekran.module.css';

const yoz = (matn) => (matn ?? '').toString().toLowerCase();

export default function RiskSahifa({ k, params }) {
  const { sozlamalar, davr, setDavrId } = useRisklar();
  const { davrlar } = useHujjatlar();
  const ochiqRisklar = useOchiqRisklar(k.id);
  const [yaratish, setYaratish] = useState(null);
  const soz = sozlamalar[k.id];
  const asosiy = asosiyUstun(k);

  const [filtr, setFiltr] = useState(() => standartFiltr(k));
  const [viloyat, setViloyat] = useState('');
  const [qidiruv, setQidiruv] = useState('');
  const [darajalar, setDarajalar] = useState(() => new Set());
  const [faqatRisk, setFaqatRisk] = useState(false);
  const [saralov, setSaralov] = useState({ kalit: k.asosiy, yon: k.yonalish === 'past' ? 'asc' : 'desc' });
  const [ochiq, setOchiq] = useState(() => new Set(params.org ? [params.org] : []));
  const [tanlangan, setTanlangan] = useState(params.org ?? null);

  const natija = useMemo(() => hisobla(k, davr, soz, filtr), [k, davr, soz, filtr]);

  /* 1-bosqich: viloyat va qidiruv. KPI va daraja chiplari shu to'plamni sanaydi */
  const q = yoz(qidiruv).trim();
  const bolaMos = (b) => q && (yoz(b.bola.nom).includes(q) || yoz(b.bola.izoh).includes(q));
  const asos = natija.qatorlar.filter(
    (t) =>
      (!viloyat || t.org.viloyat === viloyat) &&
      (!q || yoz(t.org.nom).includes(q) || t.org.inn.includes(q) || t.bolalar.some(bolaMos))
  );
  const sn = sanoq(asos);
  const riskda = asos.length - sn.norma;

  /* 2-bosqich: daraja filtri */
  const korinadi = asos.filter(
    (t) => (!darajalar.size || darajalar.has(t.daraja)) && (!faqatRisk || t.daraja !== 'norma')
  );
  const qatorlar = saralash(korinadi, saralov);
  const jami = jamiQator(k, korinadi, soz, davr);

  const dinData = useMemo(
    () => dinamika(k, soz, filtr, (org) => !viloyat || org.viloyat === viloyat, davrlar),
    [k, soz, filtr, viloyat, davrlar]
  );

  /* Qidiruv bola qatoriga mos kelsa — ota qator avtomatik ochiladi */
  const ochiqlar = q ? new Set([...ochiq, ...qatorlar.filter((t) => t.bolalar.some(bolaMos)).map((t) => t.id)]) : ochiq;

  const darajaAlmashtir = (id) =>
    setDarajalar((eski) => {
      const y = new Set(eski);
      y.has(id) ? y.delete(id) : y.add(id);
      return y;
    });
  const ochAlmashtir = (id) =>
    setOchiq((eski) => {
      const y = new Set(eski);
      y.has(id) ? y.delete(id) : y.add(id);
      return y;
    });
  const hammasiOchiq = qatorlar.length > 0 && qatorlar.every((t) => ochiqlar.has(t.id));
  const tashkilotniTanla = (id) => {
    setTanlangan(id);
    setOchiq((eski) => new Set([...eski, id]));
  };

  const chegaraMatn = `${k.yonalish === 'past' ? '≤' : '≥'} ${qiymatMatn(soz.chegara, asosiy.tur)}`;
  const bolalarSoni = asos.reduce((a, t) => a + t.bolalar.length, 0);

  return (
    <div className={s.sahifa}>
      <header className={s.sarlavhaBlok}>
        <div className={s.sarlavhaMatn}>
          <div className={s.crumb}>
            <span className={s.kodBelgi}>{k.kod}</span>
            {k.guruhNom}
          </div>
          <h1 className={s.h1}>{k.nom}</h1>
          <p className={s.tavsif}>{k.tavsif(soz)}</p>
        </div>
        <div className={s.sarlavhaAmal}>
          <Button ikon={mdiTuneVariant} onClick={() => ot(`#/sozlamalar/${k.id}`)}>
            Созлаш
          </Button>
          <Button ikon={mdiDownload} onClick={() => csvYukla(k, qatorlar, jami, davr)}>
            CSV
          </Button>
        </div>
      </header>

      {!soz.faol && (
        <div className={s.ogohlantirish}>
          <Icon path={mdiEyeOffOutline} size={18} />
          Бу кўрсаткич созламаларда ўчирилган — бошқарув панели ва йиғма ҳисобларда иштирок этмайди.
          <button type="button" onClick={() => ot(`#/sozlamalar/${k.id}`)}>
            Ёқиш
          </button>
        </div>
      )}

      {/* ---------- Filtrlar: bitta qator, hammasi pastga ta'sir qiladi ---------- */}
      <div className={s.filtrQator}>
        <Select
          id="davr"
          ikon={mdiCalendarMonthOutline}
          value={davr.id}
          onChange={setDavrId}
          options={[...davrlar].reverse()}
        />
        <Select
          id="viloyat"
          ikon={mdiMapMarkerOutline}
          value={viloyat}
          onChange={setViloyat}
          options={[{ id: '', nom: 'Барча ҳудудлар' }, ...VILOYATLAR.map((v) => ({ id: v, nom: v }))]}
        />
        {(k.filtrlar ?? []).map((f) => (
          <Select
            key={f.kalit}
            id={`f-${f.kalit}`}
            value={filtr[f.kalit]}
            onChange={(v) => setFiltr((e) => ({ ...e, [f.kalit]: v }))}
            options={[...(f.majburiy ? [] : [{ id: '', nom: `${f.nom}: барчаси` }]), ...f.variantlar]}
          />
        ))}
        <Search value={qidiruv} onChange={setQidiruv} placeholder={`Ташкилот, ИНН ёки ${k.kesimNomi.toLowerCase()}`} />
      </div>

      {/* ---------- KPI ---------- */}
      <div className={s.kpiQator}>
        <Kpi
          label="Ташкилотлар"
          ikon={mdiDomain}
          value={son(asos.length)}
          sub={`${son(bolalarSoni)} та ${k.kesimNomi.toLowerCase()}`}
        />
        <Kpi
          label="Рискдаги ташкилотлар"
          ikon={mdiAlertOutline}
          value={son(riskda)}
          sub={asos.length ? `${son((riskda / asos.length) * 100, 1)}% · чегара ${chegaraMatn}` : '—'}
          urgu="yuqori"
          onClick={() => setFaqatRisk((v) => !v)}
          faol={faqatRisk}
        />
        {DARAJALAR.map((d) => (
          <Kpi
            key={d.id}
            label={d.id === 'norma' ? 'Норма (риск йўқ)' : `${d.nom} даража`}
            ikon={DARAJA_IKON[d.id]}
            value={son(sn[d.id])}
            sub={chegaraIzoh(d.id, soz, k, asosiy.tur)}
            urgu={d.id}
            onClick={() => darajaAlmashtir(d.id)}
            faol={darajalar.has(d.id)}
          />
        ))}
      </div>

      {/* ---------- Diagrammalar ---------- */}
      <div className={s.grafikQator}>
        <Card
          title={`Ташкилотлар: ${asosiy.nom}`}
          sub={`${davr.nom} · чизиқлар — даража чегаралари`}
          className={s.grafikKatta}
        >
          <TashkilotReyting
            qatorlar={korinadi}
            k={k}
            soz={soz}
            tur={asosiy.tur}
            tanlangan={tanlangan}
            onTanla={tashkilotniTanla}
          />
        </Card>
        <Card title="Динамика" sub={`Рискдаги ташкилотлар сони, охирги ${davrlar.length} ой`}>
          <Dinamika data={dinData} tanlanganId={davr.id} onTanla={setDavrId} />
          <div className={s.dinXulosa}>
            <DinXulosa data={dinData} davr={davr} />
          </div>
        </Card>
      </div>

      {/* ---------- Jadval ---------- */}
      <Card
        pad={false}
        title={`${son(qatorlar.length)} та ташкилот`}
        sub={`Тартиб: ${saralovNomi(k, saralov)} · ташкилот қаторини босинг — ${k.kesimNomi.toLowerCase()} кесими очилади`}
        extra={
          <>
            <div className={s.chiplar}>
              {DARAJALAR.map((d) => (
                <Chip key={d.id} rang={d.id} on={darajalar.has(d.id)} son={sn[d.id]} onClick={() => darajaAlmashtir(d.id)}>
                  {d.nom}
                </Chip>
              ))}
            </div>
            <Toggle id="faqatRisk" on={faqatRisk} onChange={setFaqatRisk} label="Фақат рискдагилар" />
            <Button
              kichik
              ikon={hammasiOchiq ? mdiUnfoldLessHorizontal : mdiUnfoldMoreHorizontal}
              onClick={() => setOchiq(hammasiOchiq ? new Set() : new Set(qatorlar.map((t) => t.id)))}
            >
              {hammasiOchiq ? 'Барчасини ёпиш' : 'Барчасини очиш'}
            </Button>
          </>
        }
      >
        <div className={s.jadvalOrasi} />
        <DaraxtJadval
          k={k}
          qatorlar={qatorlar}
          jami={jami}
          saralov={saralov}
          onSarala={setSaralov}
          ochiq={ochiqlar}
          onOchiq={ochAlmashtir}
          tanlangan={tanlangan}
          belgila={q ? bolaMos : undefined}
          riskKatak={(t, b) => {
            const r = ochiqRisklar.get(riskKaliti(k.id, b?.id, t.org.id));
            if (r) {
              return (
                <a href={`#/hujjatlar/${r.id}`} className={l.riskHavola} title={`Очиқ риск · ${statusNom(r.status)}`}>
                  {r.raqam.slice(-9)}
                </a>
              );
            }
            /* Ташкилот қаторида — кесимлардаги очиқ рисклар сони */
            const ichida = !b && t.bolalar.filter((x) => ochiqRisklar.has(riskKaliti(k.id, x.id, t.org.id))).length;
            return (
              <>
                {ichida > 0 && <span className={l.riskHavola}>{ichida} та</span>}{' '}
                <button
                  type="button"
                  className={l.riskQosh}
                  title="Мануал риск яратиш"
                  aria-label="Мануал риск яратиш"
                  onClick={() => setYaratish({ kId: k.id, orgId: t.org.id, kesimId: b?.id ?? '' })}
                >
                  <Icon path={mdiPlus} size={14} />
                </button>
              </>
            );
          }}
        />
      </Card>

      {yaratish && (
        <RiskYaratOyna ochiq bosh={yaratish} onYop={() => setYaratish(null)} onYaratildi={(r) => ot(`#/hujjatlar/${r.id}`)} />
      )}
    </div>
  );
}

/** KPI ostidagi izoh: daraja oralig'i */
function chegaraIzoh(d, soz, k, tur) {
  const f = (v) => qiymatMatn(v, tur);
  const past = k.yonalish === 'past';
  if (d === 'yuqori') return `${past ? '≤' : '≥'} ${f(soz.yuqori)}`;
  if (d === 'orta') return `${f(soz.orta)} – ${f(soz.yuqori)}`;
  if (d === 'past') return `${f(soz.chegara)} – ${f(soz.orta)}`;
  return `${past ? '>' : '<'} ${f(soz.chegara)}`;
}

function saralovNomi(k, { kalit, yon }) {
  const u = k.ustunlar.find((x) => x.kalit === kalit);
  const nom = u?.nom ?? (kalit === '__daraja' ? 'Даража' : 'Номи');
  return `${nom} ${yon === 'asc' ? '↑' : '↓'}`;
}

function DinXulosa({ data, davr }) {
  const joriy = data.find((d) => d.davr.id === davr.id);
  const oldingi = data[data.indexOf(joriy) - 1];
  if (!joriy) return null;
  const r = (d) => d.yuqori + d.orta + d.past;
  if (!oldingi) return <span>{davr.nom}: {r(joriy)} та ташкилот рискда</span>;
  const farq = r(joriy) - r(oldingi);
  return (
    <span>
      {davr.nom}: <b>{r(joriy)}</b> та ташкилот рискда ·{' '}
      {farq === 0 ? 'ўтган ойдагидек' : `ўтган ойга нисбатан ${farq > 0 ? '+' : '−'}${Math.abs(farq)}`}
      {joriy.yuqori > 0 && ` · ${joriy.yuqori} таси ${darajaNom('yuqori').toLowerCase()} даражада`}
    </span>
  );
}

