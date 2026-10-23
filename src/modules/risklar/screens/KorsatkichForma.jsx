/*
 * Ko'rsatkich konstruktori — CRUD ning «C» va «U» qismi.
 *
 *   #/korsatkichlar/yangi[?guruh=moliya | ?nusxa=<id>]   yaratish
 *   #/korsatkichlar/<id>                                 tahrirlash
 *
 * Forma 5 bo'limdan iborat: asosiy ma'lumot → kesim → maydonlar (A, B) →
 * formula → chegaralar. O'ng tomonda joriy davr ma'lumoti bilan jonli
 * ko'rinish: darajalar taqsimoti va eng riskli tashkilotlar.
 */
import { useMemo, useState } from 'react';
import { mdiArrowLeft, mdiContentSave, mdiDeleteOutline, mdiLockOutline } from '@mdi/js';
import { Card, Button, Select, TextInput, TextArea, NumInput, Segment, Icon } from '@ds';
import { qiymatMatn, BIRLIK } from '../../../lib/format.js';
import { ot } from '../../../shell/marshrut.js';
import {
  GURUHLAR,
  KESIMLAR,
  FORMULALAR,
  MAYDON_TURLARI,
  formulaTop,
  natijaTuri,
  yangiSpek,
  spekdanKorsatkich,
  spekTekshir,
  keyingiRaqam
} from '../korsatkichlar/index.js';
import { hisobla, sanoq, standartFiltr } from '../hisob.js';
import { useRisklar } from '../holat.jsx';
import { DarajaBelgi, DarajaChiziq } from '../local/Daraja.jsx';
import s from './reestr.module.css';
import e from './ekran.module.css';

export default function KorsatkichForma({ id, params }) {
  const { korsatkichlar, spekler } = useRisklar();

  if (id) {
    const spek = spekler.find((x) => x.id === id);
    if (!spek) {
      const tizim = korsatkichlar.find((k) => k.id === id);
      return (
        <div className={e.sahifa}>
          <div className={s.topilmadi}>
            <Icon path={mdiLockOutline} size={28} />
            {tizim ? (
              <>
                <b>{tizim.kod} — тизим кўрсаткичи</b>
                <span>Унинг тузилмаси тизимда белгиланган ва таҳрирланмайди. Чегаралари ва параметрларини созлаш мумкин.</span>
                <Button onClick={() => ot(`#/sozlamalar/${tizim.id}`)}>Созламаларни очиш</Button>
              </>
            ) : (
              <>
                <b>Кўрсаткич топилмади</b>
                <span>У ўчирилган бўлиши мумкин.</span>
                <Button onClick={() => ot('#/korsatkichlar')}>Реестрга қайтиш</Button>
              </>
            )}
          </div>
        </div>
      );
    }
    return <Forma key={spek.id} bosh={spek} />;
  }

  const nusxa = params.nusxa && spekler.find((x) => x.id === params.nusxa);
  const bosh = nusxa
    ? { ...nusxa, id: '', raqam: 0, nom: `${nusxa.nom} (нусха)`, yaratilgan: undefined, yangilangan: undefined }
    : yangiSpek(GURUHLAR.some((g) => g.id === params.guruh) ? params.guruh : undefined);
  return <Forma key={`yangi-${params.nusxa ?? params.guruh ?? ''}`} bosh={bosh} />;
}

function Forma({ bosh }) {
  const { korsatkichlar, spekler, spekSaqla, spekOchir, davr } = useRisklar();
  const [spek, setSpek] = useState(bosh);
  const [urinish, setUrinish] = useState(false);
  const tahrir = !!bosh.id;

  const f = formulaTop(spek.formula);
  const tur = natijaTuri(spek);
  const xatolar = spekTekshir(spek, korsatkichlar);
  /* Nom xatolari faqat saqlashga urinishdan keyin — chegara xatolari darhol */
  const xato = (k) => (urinish || k.startsWith('standart.') ? xatolar[k] : undefined);
  const chegaraToza = !Object.keys(xatolar).some((k) => k.startsWith('standart.'));

  const ozgartir = (patch) => setSpek((x) => ({ ...x, ...patch }));
  const maydon = (kalit, patch) => setSpek((x) => ({ ...x, [kalit]: { ...x[kalit], ...patch } }));
  const chegara = (kalit, v) => setSpek((x) => ({ ...x, standart: { ...x.standart, [kalit]: v } }));

  /* Yo'nalish almashsa chegaralar tartibi ham teskari bo'lishi kerak */
  const yonalishAlmashtir = (yon) => {
    if (yon === spek.yonalish) return;
    const { chegara: c, orta: o, yuqori: y } = spek.standart;
    ozgartir({ yonalish: yon, standart: { chegara: y, orta: o, yuqori: c } });
  };

  const raqam = tahrir && bosh.guruh === spek.guruh ? bosh.raqam : keyingiRaqam(spek.guruh, spekler.filter((x) => x.id !== spek.id));
  const kod = `${GURUHLAR.find((g) => g.id === spek.guruh)?.qisqa ?? ''}${raqam}`;

  /* Jonli ko'rinish: nomlar bo'sh bo'lsa ham hisoblanadi */
  const korinish = useMemo(() => {
    if (!chegaraToza) return null;
    const k = {
      ...spekdanKorsatkich({
        ...spek,
        id: spek.id || 'korinish',
        raqam,
        nom: spek.nom || 'Янги кўрсаткич',
        a: { ...spek.a, nom: spek.a.nom || 'A' },
        b: { ...spek.b, nom: spek.b.nom || 'B' },
        natijaNom: spek.natijaNom || 'Натижа'
      }),
      keshsiz: true
    };
    const soz = { faol: true, ...spek.standart, parametrlar: {} };
    return { k, soz, natija: hisobla(k, davr, soz, standartFiltr(k)) };
  }, [spek, raqam, davr, chegaraToza]);

  const saqla = () => {
    setUrinish(true);
    if (Object.keys(xatolar).length) return;
    const saqlangan = spekSaqla({
      ...spek,
      nom: spek.nom.trim(),
      natijaNom: spek.natijaNom.trim(),
      ayirmaNom: spek.ayirmaNom.trim()
    });
    ot(`#/risklar/${saqlangan.guruh}/${saqlangan.id}`);
  };

  const ochir = () => {
    if (window.confirm(`«${bosh.nom}» кўрсаткичи ва унинг созламаси ўчирилади. Бу амални қайтариб бўлмайди.`)) {
      spekOchir(bosh.id);
      ot('#/korsatkichlar');
    }
  };

  const birlik = BIRLIK[tur] ?? '';
  const past = spek.yonalish === 'past';

  return (
    <div className={e.sahifa}>
      <header className={e.sarlavhaBlok}>
        <div className={e.sarlavhaMatn}>
          <a href="#/korsatkichlar" className={s.orqaga}>
            <Icon path={mdiArrowLeft} size={15} />
            Кўрсаткичлар реестри
          </a>
          <h1 className={e.h1}>
            <span className={e.kodBelgi}>{kod}</span> {tahrir ? 'Кўрсаткични таҳрирлаш' : 'Янги кўрсаткич'}
          </h1>
          <p className={e.tavsif}>
            Кўрсаткич иккита маълумот майдони (A ва B) ва улардан ҳисобланадиган натижадан иборат. Даража натижа
            бўйича аниқланади, ташкилот қатори эса кесимлардан йиғилади.
          </p>
        </div>
      </header>

      <div className={s.forma}>
        <div className={s.bolimlar}>
          {/* 1. Asosiy */}
          <Card title="1. Асосий маълумот">
            <div className={s.maydonlar}>
              <label className={s.maydon} htmlFor="f-guruh">
                <span className={s.yorliq}>Йўналиш</span>
                <Select id="f-guruh" value={spek.guruh} onChange={(v) => ozgartir({ guruh: v })} options={GURUHLAR.map((g) => ({ id: g.id, nom: g.nom }))} />
              </label>
              <label className={`${s.maydon} ${s.keng}`} htmlFor="f-nom">
                <span className={s.yorliq}>Номи *</span>
                <TextInput id="f-nom" value={spek.nom} onChange={(v) => ozgartir({ nom: v })} xato={xato('nom')} placeholder="Масалан: Дебитор қарздорлик улуши" />
                {xato('nom') && <span className={s.xato}>{xato('nom')}</span>}
              </label>
              <label className={`${s.maydon} ${s.keng}`} htmlFor="f-tavsif">
                <span className={s.yorliq}>Тавсиф</span>
                <TextArea
                  id="f-tavsif"
                  value={spek.tavsif}
                  onChange={(v) => ozgartir({ tavsif: v })}
                  placeholder="Масалан: Дебитор қарзи режадан {chegara} ва ундан кўп бўлган ташкилотлар."
                />
                <span className={s.yordam}>
                  <code>{'{chegara}'}</code>, <code>{'{orta}'}</code>, <code>{'{yuqori}'}</code> ўрнига созламадаги қиймат
                  қўйилади. Бўш қолса, тавсиф автоматик тузилади.
                </span>
              </label>
            </div>
          </Card>

          {/* 2. Kesim */}
          <Card title="2. Иккинчи даража (кесим)" sub="Ташкилот қатори очилганда нима кўринади">
            <div className={s.tanlovlar}>
              {KESIMLAR.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className={`${s.tanlov} ${spek.kesim === k.id ? s.tanlovOn : ''}`}
                  onClick={() => ozgartir({ kesim: k.id })}
                  aria-pressed={spek.kesim === k.id}
                >
                  <b>{k.nom}</b>
                  <span>{k.izoh}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* 3. Formula */}
          <Card title="3. Формула" sub="Натижа A ва B майдонларидан қандай ҳисобланади">
            <div className={s.tanlovlar}>
              {FORMULALAR.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  className={`${s.tanlov} ${spek.formula === x.id ? s.tanlovOn : ''}`}
                  onClick={() => ozgartir({ formula: x.id })}
                  aria-pressed={spek.formula === x.id}
                >
                  <b>{x.nom}</b>
                  <code className={s.ifoda}>{x.ifoda}</code>
                  <span>{x.misol}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* 4. Maydonlar */}
          <Card title="4. Маълумот майдонлари ва натижа">
            <div className={s.maydonlar}>
              <MaydonTahrir harf="A" v={spek.a} onChange={(p) => maydon('a', p)} xato={xato('a')} placeholder="Масалан: Касса ижроси" />
              {f.b && <MaydonTahrir harf="B" v={spek.b} onChange={(p) => maydon('b', p)} xato={xato('b')} placeholder="Масалан: Аниқланган режа" />}
              <label className={s.maydon} htmlFor="f-natija">
                <span className={s.yorliq}>
                  Натижа устуни * <span className={s.yordamIchki}>= {f.ifoda}{f.foiz ? ', %' : ''}</span>
                </span>
                <TextInput id="f-natija" value={spek.natijaNom} onChange={(v) => ozgartir({ natijaNom: v })} xato={xato('natijaNom')} placeholder="Масалан: Ўзлаштирилмаган, %" />
                {xato('natijaNom') && <span className={s.xato}>{xato('natijaNom')}</span>}
              </label>
              {f.ayirma && (
                <label className={s.maydon} htmlFor="f-ayirma">
                  <span className={s.yorliq}>
                    Оралиқ устун <span className={s.yordamIchki}>= {f.ayirmaIfoda}, ихтиёрий</span>
                  </span>
                  <TextInput id="f-ayirma" value={spek.ayirmaNom} onChange={(v) => ozgartir({ ayirmaNom: v })} placeholder="Масалан: Ўзлаштирилмаган сумма" />
                </label>
              )}
              {!f.foiz && (
                <div className={s.maydon}>
                  <span className={s.yorliq}>Ташкилот қаторида натижа</span>
                  <Segment
                    value={spek.jamlash}
                    onChange={(v) => ozgartir({ jamlash: v })}
                    options={[
                      { id: 'sum', nom: 'Кесимлар йиғиндиси' },
                      { id: 'max', nom: 'Энг ёмон кесим' }
                    ]}
                  />
                </div>
              )}
            </div>
            {f.foiz && (
              <p className={s.yordam}>
                Ташкилот қаторида A ва B кесимлар бўйича қўшилади ва фоиз йиғиндидан қайта ҳисобланади (ўртача фоиз
                олинмайди).
              </p>
            )}
          </Card>

          {/* 5. Chegaralar */}
          <Card title="5. Даража чегаралари" sub="Стандарт қийматлар — кейин «Созламалар»да ҳам ўзгартирилади">
            <div className={s.maydonlar}>
              <div className={`${s.maydon} ${s.keng}`}>
                <span className={s.yorliq}>Хавф йўналиши</span>
                <Segment
                  value={spek.yonalish}
                  onChange={yonalishAlmashtir}
                  options={[
                    { id: 'yuqori', nom: 'Натижа ошса хавф ортади ↑' },
                    { id: 'past', nom: 'Натижа камайса хавф ортади ↓' }
                  ]}
                />
              </div>
              {[
                { kalit: 'chegara', nom: 'Риск чегараси', d: 'past' },
                { kalit: 'orta', nom: 'Ўрта даража', d: 'orta' },
                { kalit: 'yuqori', nom: 'Юқори даража', d: 'yuqori' }
              ].map((m) => (
                <div key={m.kalit} className={s.maydon}>
                  <span className={s.yorliq}>
                    <DarajaBelgi daraja={m.d} kichik /> {m.nom} ({past ? '≤' : '≥'})
                  </span>
                  <NumInput
                    id={`f-${m.kalit}`}
                    value={spek.standart[m.kalit]}
                    onChange={(v) => chegara(m.kalit, v)}
                    birlik={birlik}
                    xato={xato(`standart.${m.kalit}`)}
                  />
                  {xato(`standart.${m.kalit}`) && <span className={s.xato}>{xato(`standart.${m.kalit}`)}</span>}
                </div>
              ))}
            </div>
          </Card>

          <div className={s.amalQator}>
            {tahrir && (
              <Button tur="xavf" ikon={mdiDeleteOutline} onClick={ochir}>
                Ўчириш
              </Button>
            )}
            <span className={e.bosliq} />
            {urinish && Object.keys(xatolar).length > 0 && <span className={s.xato}>Майдонларни тўлдиринг</span>}
            <Button onClick={() => ot('#/korsatkichlar')}>Бекор қилиш</Button>
            <Button tur="asosiy" ikon={mdiContentSave} onClick={saqla}>
              {tahrir ? 'Сақлаш' : 'Яратиш'}
            </Button>
          </div>
        </div>

        <aside className={s.korinish}>
          <Card title="Жонли кўриниш" sub={`${davr.nom} маълумоти бўйича`}>
            {korinish ? <Korinish {...korinish} tur={tur} /> : <div className={s.xato}>Чегараларни тузатинг</div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MaydonTahrir({ harf, v, onChange, xato, placeholder }) {
  return (
    <div className={s.maydon}>
      <label className={s.yorliq} htmlFor={`f-${harf}`}>
        <span className={s.harf}>{harf}</span> майдони *
      </label>
      <TextInput id={`f-${harf}`} value={v.nom} onChange={(nom) => onChange({ nom })} xato={xato} placeholder={placeholder} />
      <Segment value={v.tur} onChange={(tur) => onChange({ tur })} options={MAYDON_TURLARI} />
      {xato && <span className={s.xato}>{xato}</span>}
    </div>
  );
}

function Korinish({ k, soz, natija, tur }) {
  const yomon = [...natija.qatorlar]
    .filter((t) => t.qiymat != null)
    .sort((a, b) => (k.yonalish === 'past' ? a.qiymat - b.qiymat : b.qiymat - a.qiymat))
    .slice(0, 6);
  return (
    <div className={s.korinishIch}>
      <div className={s.korinishKod}>
        <span className={e.kodBelgi}>{k.kod}</span>
        <b>{k.nom}</b>
      </div>
      <p className={s.korinishTavsif}>{k.tavsif(soz)}</p>

      <div className={s.yorliq}>Даражалар (ташкилотлар)</div>
      <DarajaChiziq sanoq={sanoq(natija.qatorlar)} afsona balandlik={10} />

      <div className={s.yorliq}>Энг рискли ташкилотлар</div>
      <div className={s.top}>
        {yomon.map((t) => (
          <div key={t.id} className={s.topQator}>
            <span className={s.topNom} title={t.org.nom}>
              {t.org.nom}
            </span>
            <span className={s.mono}>{qiymatMatn(t.qiymat, tur)}</span>
            <DarajaBelgi daraja={t.daraja} kichik />
          </div>
        ))}
      </div>

      <div className={s.yorliq}>Жадвал устунлари</div>
      <div className={s.ustunlar}>
        <span>Ташкилот / {k.kesimNomi}</span>
        {k.ustunlar.map((u) => (
          <span key={u.kalit} className={u.kalit === k.asosiy ? s.ustunAsosiy : undefined}>
            {u.nom}
          </span>
        ))}
        <span>Даража</span>
      </div>
    </div>
  );
}
