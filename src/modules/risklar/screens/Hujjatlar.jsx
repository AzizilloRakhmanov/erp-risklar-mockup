/*
 * Risklar ro'yxati (getList).
 *
 * Tablar: barchasi · avtomatik · manual · ignor ro'yxati. Filtrlar bitta
 * qatorda; KPI kartochkalari filtrlangan to'plamni sanaydi. Ro'yxat katta
 * (1000+), shuning uchun sahifalanadi.
 */
import { useMemo, useState } from 'react';
import {
  mdiPlus,
  mdiFolderOpenOutline,
  mdiClockAlertOutline,
  mdiRobotOutline,
  mdiCheckDecagramOutline,
  mdiAccountEditOutline,
  mdiEyeOffOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiArrowUp,
  mdiArrowDown
} from '@mdi/js';
import { Card, Kpi, Button, Select, Search, Tabs, Chip, TextInput, Icon } from '@ds';
import { son, qiymatMatn } from '../../../lib/format.js';
import { ot } from '../../../shell/marshrut.js';
import { GURUHLAR } from '../korsatkichlar/index.js';
import { useRisklar } from '../holat.jsx';
import { DarajaBelgi } from '../local/Daraja.jsx';
import { useHujjatlar } from '../hujjat/holat.jsx';
import { StatusBelgi, UstuvorlikBelgi, MuddatBelgi, ManbaBelgi, kimNom } from '../hujjat/qismlar.jsx';
import { RiskYaratOyna } from '../hujjat/oynalar.jsx';
import { STATUSLAR, USTUVORLIKLAR, OCHIQ, muddatHolati, ignorlar, sanaMatn, vaqtMatn, MUDDAT_HOLATI, bugun } from '../hujjat/model.js';
import s from '../hujjat/hujjat.module.css';
import e from './ekran.module.css';

const SAHIFA = 50;
const yoz = (m) => (m ?? '').toString().toLowerCase();

const USTUNLAR = [
  { kalit: 'raqam', nom: 'Рақам / сана', ol: (r) => r.yaratilgan },
  { kalit: 'korsatkich', nom: 'Йўналиш / риск тури', ol: (r) => r.kKod },
  { kalit: 'org', nom: 'Ташкилот / кесим', ol: (r) => r.orgNom },
  { kalit: 'qiymat', nom: 'Риск қиймати', ol: (r) => r.qiymat },
  { kalit: 'ustuvorlik', nom: 'Устуворлик', ol: (r) => ({ yuqori: 3, orta: 2, past: 1 })[r.ustuvorlik] },
  { kalit: 'muddat', nom: 'Муддат', ol: (r) => r.muddat },
  { kalit: 'status', nom: 'Статус', ol: (r) => STATUSLAR.findIndex((x) => x.id === r.status) },
  { kalit: 'yopilgan', nom: 'Ёпилган', ol: (r) => r.yopilgan ?? '' },
  { kalit: 'manba', nom: 'Манба', ol: (r) => r.manba }
];

export default function Hujjatlar({ params }) {
  const { korsatkichlar } = useRisklar();
  const { holat } = useHujjatlar();
  const [tab, setTab] = useState(params.tab ?? 'barcha');
  const [statuslar, setStatuslar] = useState(() => new Set(params.status ? params.status.split(',') : []));
  const [ustuvorlik, setUstuvorlik] = useState('');
  const [guruh, setGuruh] = useState('');
  const [kId, setKId] = useState(params.k ?? '');
  const [muddatF, setMuddatF] = useState(params.muddat ?? '');
  const [yuklash, setYuklash] = useState(params.yuklash ?? '');
  const [dan, setDan] = useState('');
  const [gacha, setGacha] = useState('');
  const [qidiruv, setQidiruv] = useState(params.q ?? '');
  const [saralov, setSaralov] = useState({ kalit: 'raqam', yon: 'desc' });
  const [sahifa, setSahifa] = useState(0);
  const [yaratish, setYaratish] = useState(false);

  const bugunSana = bugun();
  const q = yoz(qidiruv).trim();

  /* Tabdan tashqari barcha filtrlar — tab sanoqlari shu to'plamdan */
  const asos = useMemo(
    () =>
      holat.risklar.filter(
        (r) =>
          (!statuslar.size || statuslar.has(r.status)) &&
          (!ustuvorlik || r.ustuvorlik === ustuvorlik) &&
          (!guruh || r.guruh === guruh) &&
          (!kId || r.kId === kId) &&
          (!muddatF || (muddatF === 'ochiq' ? OCHIQ.has(r.status) : muddatHolati(r, bugunSana) === muddatF)) &&
          (!yuklash || r.yuklashId === yuklash) &&
          (!dan || r.yaratilgan.slice(0, 10) >= dan) &&
          (!gacha || r.yaratilgan.slice(0, 10) <= gacha) &&
          (!q ||
            yoz(r.raqam).includes(q) ||
            yoz(r.orgNom).includes(q) ||
            (r.inn ?? '').includes(q) ||
            yoz(r.kesimNom).includes(q) ||
            yoz(r.kNom).includes(q))
      ),
    [holat, statuslar, ustuvorlik, guruh, kId, muddatF, yuklash, dan, gacha, q, bugunSana]
  );

  const avto = asos.filter((r) => r.manba === 'avto');
  const manual = asos.filter((r) => r.manba === 'manual');
  const ign = useMemo(() => [...ignorlar(holat.risklar, bugunSana).values()], [holat, bugunSana]);
  const royxat = tab === 'avto' ? avto : tab === 'manual' ? manual : asos;

  const u = USTUNLAR.find((x) => x.kalit === saralov.kalit);
  const saralangan = [...royxat].sort((a, b) => {
    const va = u.ol(a);
    const vb = u.ol(b);
    const r = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return saralov.yon === 'asc' ? r : -r;
  });
  const sahifalar = Math.max(1, Math.ceil(saralangan.length / SAHIFA));
  const joriySahifa = Math.min(sahifa, sahifalar - 1);
  const korinadi = saralangan.slice(joriySahifa * SAHIFA, (joriySahifa + 1) * SAHIFA);

  const ochiq = royxat.filter((r) => OCHIQ.has(r.status));
  const otgan = ochiq.filter((r) => muddatHolati(r, bugunSana) === 'otgan').length;
  const yopilgan = royxat.filter((r) => r.status === 'yopilgan');
  const muddatida = yopilgan.filter((r) => muddatHolati(r) === 'muddatida').length;
  const avtoYopilgan = yopilgan.filter((r) => r.yopilishAsosi === 'avto').length;

  const statusAlmashtir = (id) => {
    setSahifa(0);
    setStatuslar((x) => {
      const y = new Set(x);
      y.has(id) ? y.delete(id) : y.add(id);
      return y;
    });
  };
  const filtr = (fn) => (v) => {
    setSahifa(0);
    fn(v);
  };
  const tozala = () => {
    setStatuslar(new Set());
    setUstuvorlik('');
    setGuruh('');
    setKId('');
    setMuddatF('');
    setYuklash('');
    setDan('');
    setGacha('');
    setQidiruv('');
    setSahifa(0);
  };
  const filtrBor = statuslar.size || ustuvorlik || guruh || kId || muddatF || yuklash || dan || gacha || qidiruv;

  return (
    <div className={e.sahifa}>
      <header className={e.sarlavhaBlok}>
        <div className={e.sarlavhaMatn}>
          <div className={e.crumb}>Риск ҳужжатлари</div>
          <h1 className={e.h1}>Рисклар рўйхати</h1>
          <p className={e.tavsif}>
            Автоматик рисклар маълумотлар янгиланганда чегарадан ошган кесимлар бўйича яратилади ва кўрсаткич нормага
            қайтса автоматик ёпилади. Мануал рисклар ҳисоботдан ёки шу ердан яратилади.
          </p>
        </div>
        <div className={e.sarlavhaAmal}>
          <Button tur="asosiy" ikon={mdiPlus} onClick={() => setYaratish(true)}>
            Мануал риск
          </Button>
        </div>
      </header>

      <div className={e.kpiQator}>
        <Kpi
          label="Очиқ рисклар"
          ikon={mdiFolderOpenOutline}
          value={son(ochiq.length)}
          sub={`${son(royxat.length)} тадан`}
          urgu="orta"
          onClick={() => filtr(setMuddatF)(muddatF === 'ochiq' ? '' : 'ochiq')}
          faol={muddatF === 'ochiq'}
        />
        <Kpi
          label="Муддати ўтган"
          ikon={mdiClockAlertOutline}
          value={son(otgan)}
          sub={ochiq.length ? `очиқларнинг ${son((otgan / ochiq.length) * 100, 1)}%` : '—'}
          urgu="yuqori"
          onClick={() => filtr(setMuddatF)(muddatF === 'otgan' ? '' : 'otgan')}
          faol={muddatF === 'otgan'}
        />
        <Kpi
          label="Муддатида ёпилган"
          ikon={mdiCheckDecagramOutline}
          value={yopilgan.length ? `${son((muddatida / yopilgan.length) * 100, 1)}%` : '—'}
          sub={`${son(muddatida)} / ${son(yopilgan.length)} ёпилган`}
          urgu="norma"
          onClick={() => filtr(setMuddatF)(muddatF === 'muddatida' ? '' : 'muddatida')}
          faol={muddatF === 'muddatida'}
        />
        <Kpi label="Автоматик ёпилган" ikon={mdiRobotOutline} value={son(avtoYopilgan)} sub="маълумот нормага қайтгани учун" urgu="past" />
        <Kpi label="Игнордаги кесимлар" ikon={mdiEyeOffOutline} value={son(ign.length)} sub="автоматик яратилмайди" onClick={() => setTab('ignor')} faol={tab === 'ignor'} />
      </div>

      <div className={e.filtrQator}>
        <Select
          id="h-g"
          value={guruh}
          onChange={filtr((v) => {
            setGuruh(v);
            setKId('');
          })}
          options={[{ id: '', nom: 'Барча йўналишлар' }, ...GURUHLAR.map((g) => ({ id: g.id, nom: g.nom }))]}
        />
        <Select
          id="h-k"
          value={kId}
          onChange={filtr(setKId)}
          options={[
            { id: '', nom: 'Барча риск турлари' },
            ...korsatkichlar.filter((k) => !guruh || k.guruh === guruh).map((k) => ({ id: k.id, nom: `${k.kod} · ${k.nom}` }))
          ]}
        />
        <Select
          id="h-u"
          value={ustuvorlik}
          onChange={filtr(setUstuvorlik)}
          options={[{ id: '', nom: 'Устуворлик: барчаси' }, ...USTUVORLIKLAR]}
        />
        <Select
          id="h-m"
          value={muddatF}
          onChange={filtr(setMuddatF)}
          options={[
            { id: '', nom: 'Муддат: барчаси' },
            { id: 'ochiq', nom: 'Фақат очиқлар' },
            ...Object.entries(MUDDAT_HOLATI).map(([id, nom]) => ({ id, nom }))
          ]}
        />
        <span className={s.sanaOraliq}>
          <TextInput type="date" value={dan} onChange={filtr(setDan)} id="h-dan" />
          <span className={s.xira}>—</span>
          <TextInput type="date" value={gacha} onChange={filtr(setGacha)} id="h-gacha" />
        </span>
        <Search value={qidiruv} onChange={filtr(setQidiruv)} placeholder="Рақам, ташкилот, ИНН, кесим" />
        {filtrBor ? (
          <Button kichik tur="shaffof" onClick={tozala}>
            Тозалаш
          </Button>
        ) : null}
      </div>
      <div className={s.chiplar}>
        {STATUSLAR.map((x) => (
          <Chip key={x.id} on={statuslar.has(x.id)} onClick={() => statusAlmashtir(x.id)} son={royxat.filter((r) => r.status === x.id).length}>
            {x.nom}
          </Chip>
        ))}
        {yuklash && (
          <Chip on onClick={() => setYuklash('')}>
            Янгиланиш: {vaqtMatn(holat.yuklashlar.find((y) => y.id === yuklash)?.sana)} ×
          </Chip>
        )}
      </div>

      <Card pad={false}>
        <div className={s.tabQator}>
          <Tabs
            value={tab}
            onChange={(v) => {
              setTab(v);
              setSahifa(0);
            }}
            options={[
              { id: 'barcha', nom: 'Барчаси', son: asos.length },
              { id: 'avto', nom: 'Автоматик', ikon: mdiRobotOutline, son: avto.length },
              { id: 'manual', nom: 'Мануал', ikon: mdiAccountEditOutline, son: manual.length },
              { id: 'ignor', nom: 'Игнор рўйхати', ikon: mdiEyeOffOutline, son: ign.length }
            ]}
          />
        </div>

        {tab === 'ignor' ? (
          <IgnorJadval royxat={ign} />
        ) : (
          <>
            <div className={s.jadvalWrap}>
              <table className={s.jadval}>
                <thead>
                  <tr>
                    {USTUNLAR.map((x) => {
                      const faol = saralov.kalit === x.kalit;
                      return (
                        <th key={x.kalit}>
                          <button
                            type="button"
                            className={s.sarTugma}
                            onClick={() => setSaralov({ kalit: x.kalit, yon: faol && saralov.yon === 'desc' ? 'asc' : 'desc' })}
                          >
                            {x.nom}
                            {faol && <Icon path={saralov.yon === 'asc' ? mdiArrowUp : mdiArrowDown} size={13} />}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {korinadi.length === 0 && (
                    <tr>
                      <td colSpan={USTUNLAR.length} className={s.bosh}>
                        Риск топилмади
                      </td>
                    </tr>
                  )}
                  {korinadi.map((r) => (
                    <tr key={r.id} className={s.qator} onClick={() => ot(`#/hujjatlar/${r.id}`)}>
                      <td>
                        <a href={`#/hujjatlar/${r.id}`} className={s.raqam} onClick={(ev) => ev.stopPropagation()}>
                          {r.raqam}
                        </a>
                        <div className={s.kichik}>{vaqtMatn(r.yaratilgan)}</div>
                      </td>
                      <td className={s.kenglik}>
                        <div className={s.kichik}>{GURUHLAR.find((g) => g.id === r.guruh)?.nom}</div>
                        <div>
                          <b className={s.mono}>{r.kKod}</b> {r.kNom}
                        </div>
                      </td>
                      <td className={s.kenglik}>
                        <div>{r.orgNom}</div>
                        <div className={s.kichik}>
                          {r.kesimNom ? (
                            <>
                              {r.kesimTuri}: <span className={s.mono}>{r.kesimNom}</span>
                            </>
                          ) : (
                            'Ташкилот бўйича'
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={s.qiymatKatak}>
                          <span className={s.mono}>{qiymatMatn(r.qiymat, r.tur)}</span>
                          <DarajaBelgi daraja={r.daraja} kichik />
                        </div>
                        {OCHIQ.has(r.status) && r.joriyQiymat !== r.qiymat && (
                          <div className={s.kichik}>ҳозир: {qiymatMatn(r.joriyQiymat, r.tur)}</div>
                        )}
                      </td>
                      <td>
                        <UstuvorlikBelgi u={r.ustuvorlik} />
                      </td>
                      <td>
                        <div className={s.mono}>{sanaMatn(r.muddat)}</div>
                        <MuddatBelgi r={r} />
                      </td>
                      <td>
                        <StatusBelgi status={r.status} />
                      </td>
                      <td>
                        {r.yopilgan ? (
                          <>
                            <div className={s.mono}>{sanaMatn(r.yopilgan)}</div>
                            <div className={s.kichik}>{r.yopilishAsosi === 'avto' ? 'Автоматик' : kimNom(songgiKim(r))}</div>
                          </>
                        ) : (
                          <span className={s.xira}>—</span>
                        )}
                      </td>
                      <td>
                        <ManbaBelgi r={r} />
                        <div className={s.kichik}>{r.manba === 'avto' ? 'Тизим' : kimNom(r.muallif)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={s.sahifalash}>
              <span className={s.xira}>
                {saralangan.length
                  ? `${son(joriySahifa * SAHIFA + 1)}–${son(Math.min(saralangan.length, (joriySahifa + 1) * SAHIFA))} / ${son(saralangan.length)}`
                  : '0'}
              </span>
              <Button kichik ikon={mdiChevronLeft} disabled={joriySahifa === 0} onClick={() => setSahifa(joriySahifa - 1)} aria-label="Олдинги" />
              <span className={s.mono}>
                {joriySahifa + 1} / {sahifalar}
              </span>
              <Button kichik ikon={mdiChevronRight} disabled={joriySahifa >= sahifalar - 1} onClick={() => setSahifa(joriySahifa + 1)} aria-label="Кейинги" />
            </div>
          </>
        )}
      </Card>

      {yaratish && <RiskYaratOyna ochiq onYop={() => setYaratish(false)} onYaratildi={(r) => ot(`#/hujjatlar/${r.id}`)} />}
    </div>
  );
}

/** Kim yopdi: oxirgi status yozuvining muallifi */
const songgiKim = (r) => [...r.tarix].reverse().find((t) => t.tur === 'status')?.kim;

function IgnorJadval({ royxat }) {
  const tartib = [...royxat].sort((a, b) => a.gacha.localeCompare(b.gacha));
  return (
    <div className={s.jadvalWrap}>
      <table className={s.jadval}>
        <thead>
          <tr>
            <th>Риск тури</th>
            <th>Ташкилот / кесим</th>
            <th>Игнор гача</th>
            <th>Ким белгилаган</th>
            <th>Асос (риск)</th>
          </tr>
        </thead>
        <tbody>
          {tartib.length === 0 && (
            <tr>
              <td colSpan={5} className={s.bosh}>
                Фаол игнор йўқ
              </td>
            </tr>
          )}
          {tartib.map(({ gacha, r }) => {
            const yozuv = [...r.tarix].reverse().find((t) => t.tur === 'ignor');
            return (
              <tr key={r.kalit} className={s.qator} onClick={() => ot(`#/hujjatlar/${r.id}`)}>
                <td className={s.kenglik}>
                  <b className={s.mono}>{r.kKod}</b> {r.kNom}
                </td>
                <td className={s.kenglik}>
                  <div>{r.orgNom}</div>
                  <div className={s.kichik}>{r.kesimNom ? `${r.kesimTuri}: ${r.kesimNom}` : 'Ташкилот бўйича'}</div>
                </td>
                <td className={s.mono}>{sanaMatn(gacha)}</td>
                <td>
                  <div>{kimNom(yozuv?.kim)}</div>
                  <div className={s.kichik}>{vaqtMatn(yozuv?.vaqt)}</div>
                </td>
                <td>
                  <a href={`#/hujjatlar/${r.id}`} className={s.raqam} onClick={(ev) => ev.stopPropagation()}>
                    {r.raqam}
                  </a>
                  {yozuv?.izoh && <div className={s.kichik}>{yozuv.izoh}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
