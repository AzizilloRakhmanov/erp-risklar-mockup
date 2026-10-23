/*
 * Risk hujjati (view page) — ishlov beruvchi uchun tartiblangan.
 *
 * Sahifa «nima qilish kerak» savolidan boshlanadi, ma'lumotnoma oxirida:
 *   1. sarlavha  — raqam, qisqa flow, status o'tish tugmalari
 *   2. holat     — 4 kartochka: joriy qiymat · muddat · status · mas'ul/ustuvorlik
 *                  (tahrir kartochkaning o'zida)
 *   3. keyingi qadam (ochiq) yoki yopilish natijasi (yopiq)
 *   4. risk obyekti — tashkilot, kesim, ko'rsatkich, manba
 *   5. qiymat dinamikasi · izohlar va fayllar
 *   o'ngda — tarix (filtr bilan)
 *   oxirida — 15 rekvizitning to'liq ro'yxati (yig'ilgan, audit uchun)
 */
import { useState } from 'react';
import {
  mdiArrowLeft,
  mdiOpenInNew,
  mdiEyeOffOutline,
  mdiPlusCircleOutline,
  mdiSwapHorizontal,
  mdiChartLine,
  mdiPaperclip,
  mdiCommentTextOutline,
  mdiPencilOutline,
  mdiCheckCircle,
  mdiCircleOutline,
  mdiCloseCircleOutline,
  mdiSend,
  mdiRobotOutline,
  mdiCheck,
  mdiClose,
  mdiDomain,
  mdiChartBoxOutline,
  mdiCreditCardOutline,
  mdiLightbulbOnOutline,
  mdiArrowDownRight,
  mdiArrowUpRight,
  mdiMinus,
  mdiCheckDecagramOutline,
  mdiChevronDown,
  mdiAccountEditOutline
} from '@mdi/js';
import { Card, Button, Icon, Select, TextInput, TextArea, Segment, useTooltip, Tooltip } from '@ds';
import { qiymatMatn } from '../../../lib/format.js';
import { DAVRLAR } from '../../../reference/davrlar.js';
import { FOYDALANUVCHILAR } from '../../../reference/foydalanuvchilar.js';
import { TASHKILOTLAR } from '../../../reference/tashkilotlar.js';
import { ot } from '../../../shell/marshrut.js';
import { GURUHLAR } from '../korsatkichlar/index.js';
import { darajaNom } from '../hisob.js';
import { DarajaBelgi } from '../local/Daraja.jsx';
import { useKenglik } from '../local/grafiklar.jsx';
import { useHujjatlar } from '../hujjat/holat.jsx';
import { StatusBelgi, UstuvorlikBelgi, MuddatBelgi, ManbaBelgi, FayllarRoyxati, FaylTanlash, kimNom } from '../hujjat/qismlar.jsx';
import { AmalOyna, IgnorOyna } from '../hujjat/oynalar.jsx';
import {
  OTISHLAR,
  OCHIQ,
  USTUVORLIKLAR,
  statusNom,
  ustuvorlikNom,
  muddatHolati,
  sababMatni,
  chegaraMatni,
  sanaMatn,
  vaqtMatn,
  kunFarqi,
  bugun,
  qiymatYozuvi
} from '../hujjat/model.js';
import s from '../hujjat/hujjat.module.css';
import e from './ekran.module.css';

const KEYINGI_QADAM = {
  yangi: 'Рискни ишга олинг: масъулни тайинланг ва ташкилотдан тушунтириш хати сўранг.',
  ijroda:
    'Ташкилотдан тушунтириш ва тасдиқловчи ҳужжатларни олинг. Ҳужжатлар тайёр бўлса — текширувга юборинг ёки «Бартараф этилди» деб ёпинг.',
  tekshiruvda:
    'Ҳужжатларни текширинг: камчилик бартараф этилган бўлса — тасдиқлаб ёпинг, етарли бўлмаса — қайта ишлашга қайтаринг.'
};

export default function HujjatKorish({ id }) {
  const { holat } = useHujjatlar();
  const r = holat.risklar.find((x) => x.id === id);
  const [otish, setOtish] = useState(null);
  const [ignorOyna, setIgnorOyna] = useState(false);

  if (!r) {
    return (
      <div className={e.sahifa}>
        <div className={s.topilmadi}>
          <b>Риск топилмади</b>
          <Button onClick={() => ot('#/hujjatlar')}>Рўйхатга қайтиш</Button>
        </div>
      </div>
    );
  }

  const ochiq = OCHIQ.has(r.status);
  const otishlar = OTISHLAR[r.status];

  return (
    <div className={e.sahifa}>
      {/* 1. Sarlavha */}
      <header className={s.hujjatBosh}>
        <div className={s.hujjatBoshChap}>
          <a href="#/hujjatlar" className={s.orqaga}>
            <Icon path={mdiArrowLeft} size={15} />
            Рисклар рўйхати
          </a>
          <h1 className={s.hujjatSarlavha}>
            <span className={s.mono}>{r.raqam}</span>
            <StatusBelgi status={r.status} />
          </h1>
          <div className={s.hujjatIzoh}>
            <b className={s.mono}>{r.kKod}</b> {r.kNom} · {r.orgNom}
          </div>
        </div>
        <div className={e.sarlavhaAmal}>
          {otishlar.map((o) => (
            <Button key={o.ga} tur={o.asosiy ? 'asosiy' : o.xavf ? 'xavf' : 'oddiy'} onClick={() => setOtish(o)}>
              {o.nom}
            </Button>
          ))}
        </div>
      </header>

      <Flow r={r} />

      {/* 2. Holat kartochkalari */}
      <div className={s.holatQator}>
        <QiymatKarta r={r} />
        <MuddatKarta r={r} />
        <StatusKarta r={r} />
        <MasulKarta r={r} />
      </div>

      <div className={s.korishTarmoq}>
        <div className={s.ustun}>
          {/* 3. Keyingi qadam yoki yopilish natijasi */}
          {ochiq ? (
            <div className={s.keyingi}>
              <Icon path={mdiLightbulbOnOutline} size={22} />
              <div className={s.keyingiMatn}>
                <b>Кейинги қадам</b>
                <span>{KEYINGI_QADAM[r.status]}</span>
                <span className={s.kichik}>
                  Маълумотлар янгиланганда қиймат нормага қайтса ({yopilishSharti(r)}), риск автоматик ёпилади.
                </span>
              </div>
              <div className={s.keyingiAmal}>
                {otishlar
                  .filter((o) => !o.xavf)
                  .map((o) => (
                    <Button key={o.ga} kichik tur={o.asosiy ? 'asosiy' : 'oddiy'} onClick={() => setOtish(o)}>
                      {o.nom}
                    </Button>
                  ))}
              </div>
            </div>
          ) : (
            <YopilishKarta r={r} />
          )}

          {/* 4. Risk obyekti */}
          <ObyektKarta r={r} onIgnor={() => setIgnorOyna(true)} />

          {/* 5. Dinamika va izohlar */}
          <Card title="Қиймат динамикаси" sub={`Ҳар бир маълумот давридаги қиймат · риск чегараси ${chegaraMatni(r)}`}>
            <QiymatGrafik r={r} />
          </Card>

          <IzohKarta r={r} />

          <Rekvizitlar r={r} />
        </div>

        <Card title="Тарих" sub={`${r.tarix.length} та ёзув · охиргиси тепада`} className={s.tarixKarta}>
          <Tarix r={r} />
        </Card>
      </div>

      {otish && <AmalOyna r={r} otish={otish} onYop={() => setOtish(null)} />}
      {ignorOyna && <IgnorOyna r={r} onYop={() => setIgnorOyna(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------ yordamchi */

const songgiStatus = (r) => [...r.tarix].reverse().find((t) => t.tur === 'status');
const sanaDavr = (id) => DAVRLAR.find((d) => d.id === id)?.nom ?? id;

/** «80,0% дан паст бўлса» — yopilish sharti matni */
function yopilishSharti(r) {
  return `${r.asosiyNom} ${qiymatMatn(r.chegaralar.chegara, r.tur)} дан ${r.yonalish === 'past' ? 'юқори' : 'паст'}`;
}

/** Holat kartochkasi: chap chetda urg'u chizig'i, katta qiymat */
function HolatKarta({ nom, urgu, children, tahrir, onTahrir }) {
  return (
    <section className={s.holatKarta} style={urgu ? { '--urgu': urgu } : undefined}>
      <div className={s.holatNom}>
        <span>{nom}</span>
        {onTahrir && !tahrir && (
          <button type="button" className={s.qalam} onClick={onTahrir} aria-label={`${nom} — ўзгартириш`} title="Ўзгартириш">
            <Icon path={mdiPencilOutline} size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/** Kartochka ichida tahrir: boshqaruv + ✓ ✕ */
function TahrirQator({ children, onSaqla, onBekor }) {
  return (
    <div className={s.tahrirQator}>
      {children}
      <button type="button" className={s.tahrirOk} onClick={onSaqla} aria-label="Сақлаш">
        <Icon path={mdiCheck} size={16} />
      </button>
      <button type="button" className={s.tahrirX} onClick={onBekor} aria-label="Бекор қилиш">
        <Icon path={mdiClose} size={16} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------- holat kartochkalari */

function QiymatKarta({ r }) {
  const ochiq = OCHIQ.has(r.status);
  const oxirgi = qiymatYozuvi(r.qiymatlar.at(-1));
  const farq = r.joriyQiymat - r.qiymat;
  /* «Yaxshilandi» — xavf kamaygan tomonga */
  const yaxshi = r.yonalish === 'past' ? farq > 0 : farq < 0;
  const birlik = r.tur === 'foiz' ? 'pp' : r.tur;
  return (
    <HolatKarta nom={ochiq ? 'Жорий қиймат' : 'Охирги қиймат'} urgu={`var(--xb-st-${r.joriyDaraja ?? 'norma'})`}>
      <div className={s.holatKatta}>
        <span className={s.mono}>{qiymatMatn(r.joriyQiymat, r.tur)}</span>
        <DarajaBelgi daraja={r.joriyDaraja} kichik />
      </div>
      <div className={s.holatSub}>
        {sanaDavr(oxirgi.davrId)} · чегара {chegaraMatni(r)}
      </div>
      {r.qiymatlar.length > 1 && farq !== 0 && (
        <div className={`${s.holatFarq} ${yaxshi ? s.farqYaxshi : s.farqYomon}`}>
          <Icon path={farq < 0 ? mdiArrowDownRight : mdiArrowUpRight} size={14} />
          аниқланганда {qiymatMatn(r.qiymat, r.tur)} — {qiymatMatn(Math.abs(farq), birlik)} {yaxshi ? 'яхшиланди' : 'ёмонлашди'}
        </div>
      )}
      {r.qiymatlar.length > 1 && farq === 0 && (
        <div className={s.holatFarq}>
          <Icon path={mdiMinus} size={14} />
          аниқланганидан бери ўзгармади
        </div>
      )}
    </HolatKarta>
  );
}

function MuddatKarta({ r }) {
  const { maydonOzgartir } = useHujjatlar();
  const [tahrir, setTahrir] = useState(false);
  const [qiymat, setQiymat] = useState(r.muddat);
  const h = muddatHolati(r);
  const ochiq = OCHIQ.has(r.status);
  const urgu = { otgan: 'var(--xb-err)', kechikib: 'var(--xb-err)', yaqin: 'var(--xb-warn)', muddatida: 'var(--xb-ok)' }[h];

  let katta;
  if (r.status === 'yopilgan') {
    const k = kunFarqi(r.muddat, r.yopilgan);
    katta = k > 0 ? `${k} кун кечикди` : 'Муддатида';
  } else if (r.status === 'bekor') katta = 'Бекор қилинган';
  else {
    const k = kunFarqi(bugun(), r.muddat);
    katta = k < 0 ? `${-k} кун ўтди` : k === 0 ? 'Бугун' : `${k} кун қолди`;
  }

  return (
    <HolatKarta nom="Муддат" urgu={urgu} tahrir={tahrir} onTahrir={ochiq ? () => setTahrir(true) : null}>
      <div className={`${s.holatKatta} ${h === 'otgan' || h === 'kechikib' ? s.qizil : ''}`}>{katta}</div>
      {tahrir ? (
        <TahrirQator
          onSaqla={() => {
            if (qiymat) maydonOzgartir(r.id, { muddat: qiymat });
            setTahrir(false);
          }}
          onBekor={() => {
            setQiymat(r.muddat);
            setTahrir(false);
          }}
        >
          <TextInput type="date" value={qiymat} onChange={setQiymat} id="m-muddat" />
        </TahrirQator>
      ) : (
        <div className={s.holatSub}>
          {sanaMatn(r.muddat)} гача · {ustuvorlikNom(r.ustuvorlik).toLowerCase()} устуворлик
        </div>
      )}
      <div className={s.holatFarq}>
        <MuddatBelgi r={r} />
      </div>
    </HolatKarta>
  );
}

function StatusKarta({ r }) {
  const t = songgiStatus(r);
  const dan = t?.vaqt ?? r.yaratilgan;
  const kun = kunFarqi(dan, r.yopilgan ?? bugun());
  return (
    <HolatKarta nom="Статус" urgu={OCHIQ.has(r.status) ? 'var(--xb-info)' : 'var(--xb-ok)'}>
      <div className={s.holatKatta}>{statusNom(r.status)}</div>
      <div className={s.holatSub}>
        {OCHIQ.has(r.status) ? `${vaqtMatn(dan)} дан бери · ${kun} кун` : vaqtMatn(r.yopilgan)}
      </div>
      <div className={s.holatFarq}>
        <Icon path={mdiAccountEditOutline} size={14} />
        {kimNom(t?.kim ?? r.muallif)}
      </div>
    </HolatKarta>
  );
}

function MasulKarta({ r }) {
  const { maydonOzgartir } = useHujjatlar();
  const [tahrir, setTahrir] = useState(false);
  const [masul, setMasul] = useState(r.masul ?? '');
  const [ust, setUst] = useState(r.ustuvorlik);
  const ochiq = OCHIQ.has(r.status);
  const u = FOYDALANUVCHILAR.find((x) => x.id === r.masul);
  return (
    <HolatKarta
      nom="Масъул ва устуворлик"
      urgu={{ yuqori: 'var(--xb-err)', orta: 'var(--xb-warn)', past: 'var(--xb-border-strong)' }[r.ustuvorlik]}
      tahrir={tahrir}
      onTahrir={ochiq ? () => setTahrir(true) : null}
    >
      {tahrir ? (
        <div className={s.tahrirBlok}>
          <Select
            id="m-masul"
            value={masul}
            onChange={setMasul}
            options={[{ id: '', nom: 'Тайинланмаган' }, ...FOYDALANUVCHILAR.map((x) => ({ id: x.id, nom: x.nom }))]}
          />
          <TahrirQator
            onSaqla={() => {
              maydonOzgartir(r.id, { masul: masul || null, ustuvorlik: ust });
              setTahrir(false);
            }}
            onBekor={() => {
              setMasul(r.masul ?? '');
              setUst(r.ustuvorlik);
              setTahrir(false);
            }}
          >
            <Segment value={ust} onChange={setUst} options={USTUVORLIKLAR} />
          </TahrirQator>
        </div>
      ) : (
        <>
          <div className={`${s.holatKatta} ${s.holatKattaMatn}`}>{u ? u.nom : <span className={s.xira}>Тайинланмаган</span>}</div>
          <div className={s.holatSub}>{u?.lavozim ?? 'Масъулни тайинланг'}</div>
          <div className={s.holatFarq}>
            <UstuvorlikBelgi u={r.ustuvorlik} />
          </div>
        </>
      )}
    </HolatKarta>
  );
}

/* ------------------------------------------------------- yopilish natijasi */

function YopilishKarta({ r }) {
  const t = [...r.tarix].reverse().find((x) => x.tur === 'status' && x.ga === r.status);
  const avto = r.yopilishAsosi === 'avto';
  return (
    <div className={`${s.yopilish} ${r.status === 'bekor' ? s.yopilishBekor : ''}`}>
      <Icon path={avto ? mdiRobotOutline : r.status === 'bekor' ? mdiCloseCircleOutline : mdiCheckDecagramOutline} size={24} />
      <div className={s.keyingiMatn}>
        <b>
          {r.status === 'bekor' ? 'Бекор қилинди' : avto ? 'Автоматик ёпилди — маълумот нормага қайтди' : 'Мануал ёпилди'}
        </b>
        <span className={s.kichik}>
          {vaqtMatn(r.yopilgan)} · {avto ? 'маълумотлар янгиланиши' : kimNom(t?.kim)} · <MuddatBelgi r={r} />
        </span>
        {r.yopilishIzohi && <div className={s.tarixIzoh}>{r.yopilishIzohi}</div>}
        {r.fayllar.length > 0 && <FayllarRoyxati fayllar={r.fayllar} />}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- risk obyekti */

function ObyektKarta({ r, onIgnor }) {
  const org = TASHKILOTLAR.find((o) => o.id === r.orgId);
  const ignorFaol = r.ignorGacha && r.ignorGacha >= bugun();
  return (
    <Card
      title="Риск объекти"
      extra={
        <Button kichik tur="shaffof" ikon={mdiOpenInNew} onClick={() => ot(`#/risklar/${r.guruh}/${r.kId}?org=${r.orgId}`)}>
          Ҳисоботда кўриш
        </Button>
      }
    >
      <div className={s.obyekt}>
        <ObyektQator ikon={mdiDomain} nom="Ташкилот">
          <b>{r.orgNom}</b>
          <span className={s.kichik}>
            ИНН {r.inn}
            {org ? ` · ${org.viloyat}` : ''}
          </span>
        </ObyektQator>
        <ObyektQator ikon={mdiCreditCardOutline} nom={r.kesimTuri ?? 'Кесим'}>
          {r.kesimNom ? (
            <>
              <b className={s.mono}>{r.kesimNom}</b>
              {r.kesimIzoh && <span className={s.kichik}>{r.kesimIzoh}</span>}
            </>
          ) : (
            <b>Ташкилот бўйича (кесимсиз)</b>
          )}
        </ObyektQator>
        <ObyektQator ikon={mdiChartBoxOutline} nom="Риск тури">
          <b>
            <span className={s.mono}>{r.kKod}</span> {r.kNom}
          </b>
          <span className={s.kichik}>{GURUHLAR.find((g) => g.id === r.guruh)?.nom}</span>
        </ObyektQator>
        <ObyektQator ikon={r.manba === 'avto' ? mdiRobotOutline : mdiAccountEditOutline} nom="Аниқланди">
          <b>
            {qiymatMatn(r.qiymat, r.tur)} · {darajaNom(r.daraja)}
          </b>
          <span className={s.kichik}>
            {sanaDavr(r.davrId)} маълумоти · <ManbaBelgi r={r} toliq /> · {vaqtMatn(r.yaratilgan)}
          </span>
        </ObyektQator>
      </div>
      <div className={`${s.ignorQator} ${ignorFaol ? s.ignorFaol : ''}`}>
        <Icon path={mdiEyeOffOutline} size={16} />
        <span>
          {ignorFaol
            ? `Игнор: ${sanaMatn(r.ignorGacha)} гача бу кесим бўйича янги риск автоматик яратилмайди`
            : r.ignorGacha
              ? `Игнор муддати ${sanaMatn(r.ignorGacha)} да тугаган`
              : 'Игнор муддати белгиланмаган'}
        </span>
        <Button kichik tur="shaffof" onClick={onIgnor}>
          {r.ignorGacha ? 'Ўзгартириш' : 'Белгилаш'}
        </Button>
      </div>
    </Card>
  );
}

function ObyektQator({ ikon, nom, children }) {
  return (
    <div className={s.obyektQator}>
      <span className={s.obyektIkon}>
        <Icon path={ikon} size={18} />
      </span>
      <div className={s.obyektMatn}>
        <span className={s.obyektNom}>{nom}</span>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ izohlar va fayllar */

function IzohKarta({ r }) {
  const { izohQosh } = useHujjatlar();
  const [izoh, setIzoh] = useState('');
  const [fayllar, setFayllar] = useState([]);
  const izohlar = r.tarix.filter((t) => t.tur === 'izoh');
  return (
    <Card title="Изоҳлар ва файллар" sub={`${izohlar.length} та изоҳ · ${r.fayllar.length} та файл`}>
      <div className={s.izohForma}>
        {r.fayllar.length > 0 && <FayllarRoyxati fayllar={r.fayllar} />}
        {izohlar
          .slice()
          .reverse()
          .map((t, i) => (
            <div key={i} className={s.izohBand}>
              <div className={s.tarixIzoh}>{t.izoh}</div>
              <span className={s.kichik}>
                {kimNom(t.kim)} · {vaqtMatn(t.vaqt)}
              </span>
            </div>
          ))}
        <TextArea id="k-izoh" value={izoh} onChange={setIzoh} placeholder="Изоҳ ёзинг (тарихга ёзилади)" qator={2} />
        <div className={s.izohAmal}>
          <FaylTanlash fayllar={fayllar} onChange={setFayllar} />
          <Button
            tur="asosiy"
            kichik
            ikon={mdiSend}
            disabled={!izoh.trim() && !fayllar.length}
            onClick={() => {
              izohQosh(r.id, izoh.trim(), fayllar);
              setIzoh('');
              setFayllar([]);
            }}
          >
            Қўшиш
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------- to'liq rekvizitlar */

function Rekvizitlar({ r }) {
  const t = [...r.tarix].reverse().find((x) => x.tur === 'status' && (x.ga === 'yopilgan' || x.ga === 'bekor'));
  const qatorlar = [
    ['Йўналиш', GURUHLAR.find((g) => g.id === r.guruh)?.nom],
    ['Риск тури (кўрсаткич)', `${r.kKod} · ${r.kNom}`],
    ['Рақам ва сана', `${r.raqam} · ${vaqtMatn(r.yaratilgan)}`],
    ['Устуворлик', ustuvorlikNom(r.ustuvorlik)],
    ['Ташкилот', `${r.orgNom} (ИНН ${r.inn})`],
    [r.kesimTuri ?? 'Кесим', r.kesimNom ? `${r.kesimNom}${r.kesimIzoh ? ' · ' + r.kesimIzoh : ''}` : 'Ташкилот бўйича'],
    ['Муддат', sanaMatn(r.muddat)],
    ['Статус', statusNom(r.status)],
    ['Риск ёпилган сана', vaqtMatn(r.yopilgan)],
    ['Яратилиш манбаси', r.manba === 'avto' ? 'Автоматик (маълумотлар янгиланиши)' : `Мануал · ${kimNom(r.muallif)}`],
    ['Ёпилиш асоси', r.yopilishAsosi === 'avto' ? 'Автоматик' : r.yopilishAsosi === 'manual' ? `Мануал · ${kimNom(t?.kim)}` : '—'],
    ['Риск қиймати', `${sababMatni(r)} · ${sanaDavr(r.davrId)}`],
    ['Ёпилиш изоҳи', r.yopilishIzohi ?? '—'],
    ['Файллар', r.fayllar.length ? r.fayllar.map((f) => f.nom).join(', ') : '—'],
    ['Игнор муддати', r.ignorGacha ? `${sanaMatn(r.ignorGacha)} гача` : '—']
  ];
  return (
    <details className={s.rekvizit}>
      <summary>
        <span>Барча реквизитлар</span>
        <span className={s.kichik}>15 та майдон — аудит ва чоп этиш учун</span>
        <Icon path={mdiChevronDown} size={18} />
      </summary>
      <dl className={s.rekvizitRoyxat}>
        {qatorlar.map(([nom, qiymat], i) => (
          <div key={nom} className={s.rekvizitQator}>
            <dt>
              <span className={s.maydonN}>{i + 1}</span>
              {nom}
            </dt>
            <dd>{qiymat ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/* ---------------------------------------------------------------- flow */

const QADAMLAR = ['yangi', 'ijroda', 'tekshiruvda', 'yopilgan'];

function Flow({ r }) {
  /* Har bir qadamga birinchi yetilgan vaqt */
  const vaqt = { yangi: r.yaratilgan };
  const kim = { yangi: r.muallif };
  for (const t of r.tarix) {
    if (t.tur === 'status' && !vaqt[t.ga]) {
      vaqt[t.ga] = t.vaqt;
      kim[t.ga] = t.kim;
    }
  }
  const qadamlar = r.status === 'bekor' ? [...QADAMLAR.slice(0, 3), 'bekor'] : QADAMLAR;
  const joriyIdx = qadamlar.indexOf(r.status);

  return (
    <ol className={s.flow}>
      {qadamlar.map((q, i) => {
        const otdi = i < joriyIdx;
        const joriy = i === joriyIdx;
        const tashlab = otdi && !vaqt[q];
        return (
          <li key={q} className={`${s.qadam} ${otdi ? s.qadamOtdi : ''} ${joriy ? s.qadamJoriy : ''} ${q === 'bekor' ? s.qadamBekor : ''}`}>
            <Icon path={q === 'bekor' ? mdiCloseCircleOutline : otdi || joriy ? mdiCheckCircle : mdiCircleOutline} size={18} />
            <div>
              <div className={s.qadamNom}>{statusNom(q)}</div>
              <div className={s.kichik}>
                {tashlab ? 'ўтказиб юборилди' : vaqt[q] && (otdi || joriy) ? `${vaqtMatn(vaqt[q])} · ${kimNom(kim[q])}` : 'кутилмоқда'}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------------- tarix */

const TARIX_IKON = {
  yaratildi: mdiPlusCircleOutline,
  status: mdiSwapHorizontal,
  daraja: mdiChartLine,
  fayl: mdiPaperclip,
  izoh: mdiCommentTextOutline,
  ignor: mdiEyeOffOutline
};

const TARIX_FILTR = [
  { id: '', nom: 'Барчаси' },
  { id: 'status', nom: 'Статус' },
  { id: 'malumot', nom: 'Маълумот' },
  { id: 'izoh', nom: 'Изоҳ ва файл' }
];
const filtrMos = (f, t) =>
  !f ||
  (f === 'status' && (t.tur === 'status' || t.tur === 'yaratildi')) ||
  (f === 'malumot' && (t.tur === 'daraja' || t.kim === 'tizim')) ||
  (f === 'izoh' && (t.tur === 'izoh' || t.tur === 'fayl'));

function tarixMatni(t) {
  switch (t.tur) {
    case 'yaratildi':
      return 'Риск яратилди';
    case 'status':
      return `Статус: ${statusNom(t.dan)} → ${statusNom(t.ga)}`;
    case 'daraja':
      return `Маълумот янгиланди: даража ${darajaNom(t.dan)} → ${darajaNom(t.ga)} (${t.izoh})`;
    case 'fayl':
      return 'Файл бириктирилди';
    case 'izoh':
      return 'Изоҳ қўшилди';
    case 'ignor':
      return `Игнор муддати: ${t.dan ? sanaMatn(t.dan) : '—'} → ${t.ga ? sanaMatn(t.ga) : 'олиб ташланди'}`;
    case 'ustuvorlik':
      return `Устуворлик: ${ustuvorlikNom(t.dan)} → ${ustuvorlikNom(t.ga)}`;
    case 'muddat':
      return `Муддат: ${sanaMatn(t.dan)} → ${sanaMatn(t.ga)}`;
    case 'masul':
      return `Масъул: ${kimNom(t.dan)} → ${kimNom(t.ga)}`;
    default:
      return t.tur;
  }
}

function Tarix({ r }) {
  const [filtr, setFiltr] = useState('');
  const royxat = [...r.tarix].reverse().filter((t) => filtrMos(filtr, t));
  return (
    <>
      <div className={s.tarixFiltr}>
        <Segment value={filtr} onChange={setFiltr} options={TARIX_FILTR} />
      </div>
      <ol className={s.tarix}>
        {royxat.length === 0 && <li className={s.xira}>Ёзув йўқ</li>}
        {royxat.map((t, i) => (
          <li key={i} className={`${s.tarixBand} ${t.kim === 'tizim' ? s.tarixTizim : ''}`}>
            <span className={s.tarixIkon}>
              <Icon path={TARIX_IKON[t.tur] ?? mdiPencilOutline} size={15} />
            </span>
            <div className={s.tarixMatn}>
              <div className={s.tarixSarlavha}>{tarixMatni(t)}</div>
              {t.izoh && t.tur !== 'daraja' && <div className={s.tarixIzoh}>{t.izoh}</div>}
              <div className={s.kichik}>
                {vaqtMatn(t.vaqt)} · {kimNom(t.kim)}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ------------------------------------------------------ qiymat grafigi */

function QiymatGrafik({ r }) {
  const [ref, w] = useKenglik();
  const tip = useTooltip();
  const nuqtalar = r.qiymatlar.map(qiymatYozuvi).map((x) => ({ ...x, davr: DAVRLAR.find((d) => d.id === x.davrId) }));
  const h = 180;
  const pad = { l: 44, r: 12, t: 14, b: 24 };
  const ch = r.chegaralar;
  const qiy = nuqtalar.map((n) => n.qiymat).filter((v) => v != null);
  const lo = Math.min(...qiy, ch.chegara, ch.yuqori, 0);
  const hi = Math.max(...qiy, ch.chegara, ch.yuqori) * 1.08 || 1;
  const x = (i) => pad.l + (nuqtalar.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (nuqtalar.length - 1)) * (w - pad.l - pad.r));
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (h - pad.t - pad.b);
  const yol = nuqtalar.map((n, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(n.qiymat).toFixed(1)}`).join(' ');

  return (
    <div ref={ref} className={s.grafik}>
      <svg width={w} height={h} role="img" aria-label="Риск қиймати динамикаси">
        {[
          { v: ch.chegara, d: 'past' },
          { v: ch.orta, d: 'orta' },
          { v: ch.yuqori, d: 'yuqori' }
        ].map((c) => (
          <g key={c.d}>
            <line x1={pad.l} x2={w - pad.r} y1={y(c.v)} y2={y(c.v)} className={s.chegaraChiziq} style={{ stroke: `var(--xb-st-${c.d})` }} />
            <text x={pad.l - 6} y={y(c.v) + 3} className={s.oqYorliq} textAnchor="end">
              {qiymatMatn(c.v, r.tur)}
            </text>
          </g>
        ))}
        <path d={yol} className={s.chiziq} />
        {nuqtalar.map((n, i) => (
          <g key={n.davrId}>
            <circle cx={x(i)} cy={y(n.qiymat)} r={5} fill={`var(--xb-st-${n.daraja ?? 'norma'})`} className={s.nuqta} />
            <circle
              cx={x(i)}
              cy={y(n.qiymat)}
              r={12}
              fill="transparent"
              tabIndex={0}
              {...tip.ulash(
                <>
                  <div className={s.tarixSarlavha}>{n.davr?.nom}</div>
                  <b className={s.mono}>{qiymatMatn(n.qiymat, r.tur)}</b> · {darajaNom(n.daraja)}
                </>
              )}
            />
            <text x={x(i)} y={h - 6} className={s.oqYorliq} textAnchor="middle">
              {n.davr?.qisqa}
            </text>
          </g>
        ))}
      </svg>
      <Tooltip {...tip} />
    </div>
  );
}
