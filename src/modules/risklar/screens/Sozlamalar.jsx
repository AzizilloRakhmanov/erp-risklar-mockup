/*
 * Ko'rsatkichlar sozlamasi.
 *
 * Har bir ko'rsatkich uchun BIR XIL shakl: faol/o'chiq, uchta daraja
 * chegarasi (asosiy ko'rsatkich birligida) va maxsus parametrlar. Maxsus
 * parametrlar ko'rsatkich ta'rifidagi `parametrlar` ro'yxatidan avtomatik
 * chiziladi — yangi parametr qo'shish uchun bu ekran o'zgarmaydi.
 *
 * O'zgarish avval qoralamada turadi: joriy davr ma'lumotida natija jonli
 * ko'rsatiladi («hozir» va «yangi sozlama bilan»), «Сақлаш» bosilgandan
 * keyingina barcha hisobotlarga qo'llanadi.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mdiContentSave, mdiRestore, mdiOpenInNew, mdiCheck } from '@mdi/js';
import { Card, Button, Toggle, NumInput, Segment, Select, Icon, useTooltip, Tooltip } from '@ds';
import { qiymatMatn, son, BIRLIK } from '../../../lib/format.js';
import { ot } from '../../../shell/marshrut.js';
import { GURUHLAR, asosiyUstun } from '../korsatkichlar/index.js';
import { hisobla, sanoq, standartFiltr, darajaNom } from '../hisob.js';
import { useRisklar, tekshir, ozgarganmi, standartSozlama } from '../holat.jsx';
import { DarajaBelgi, DarajaChiziq } from '../local/Daraja.jsx';
import s from './ekran.module.css';

export default function Sozlamalar({ id }) {
  const { korsatkichlar, sozlamalar, hammasiniTikla } = useRisklar();
  const k = korsatkichlar.find((x) => x.id === id) ?? korsatkichlar[0];
  const ifloslik = useRef(false);
  const onIflos = useCallback((v) => {
    ifloslik.current = v;
  }, []);

  const tanla = (yangi) => {
    if (ifloslik.current && !window.confirm('Сақланмаган ўзгаришлар бор. Улардан воз кечасизми?')) return;
    ot(`#/sozlamalar/${yangi}`);
  };

  const ozgarganlar = korsatkichlar.filter((x) => ozgarganmi(x, sozlamalar[x.id])).length;

  return (
    <div className={s.sahifa}>
      <header className={s.sarlavhaBlok}>
        <div className={s.sarlavhaMatn}>
          <div className={s.crumb}>Созламалар</div>
          <h1 className={s.h1}>Кўрсаткичлар созламаси</h1>
          <p className={s.tavsif}>
            {korsatkichlar.length} та кўрсаткичнинг ҳар бири бир хил тузилмада созланади: фаоллик, учта даража чегараси ва кўрсаткичга хос
            параметрлар. Ўзгариш сақлангандан кейин барча ҳисобот ва бошқарув панелига дарҳол қўлланади.
          </p>
        </div>
        <div className={s.sarlavhaAmal}>
          <Button
            ikon={mdiRestore}
            disabled={!ozgarganlar}
            onClick={() => {
              if (window.confirm(`Барча ${korsatkichlar.length} та кўрсаткич созламаси стандарт ҳолатга қайтарилади. Давом этасизми?`)) {
                ifloslik.current = false;
                hammasiniTikla();
              }
            }}
          >
            Барчасини тиклаш{ozgarganlar ? ` (${ozgarganlar})` : ''}
          </Button>
        </div>
      </header>

      <div className={s.sozTarmoq}>
        <nav className={s.sozRoyxat} aria-label="Кўрсаткичлар">
          {GURUHLAR.map((g) => (
            <div key={g.id} className={s.sozGuruh}>
              <div className={s.sozGuruhNom}>{g.nom}</div>
              {korsatkichlar.filter((x) => x.guruh === g.id).map((x) => {
                const sz = sozlamalar[x.id];
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`${s.sozBand} ${x.id === k.id ? s.sozBandFaol : ''}`}
                    onClick={() => tanla(x.id)}
                    aria-current={x.id === k.id ? 'page' : undefined}
                  >
                    <span className={`${s.kodBelgi} ${sz.faol ? '' : s.kodOchiq}`}>{x.kod}</span>
                    <span className={s.sozBandNom}>{x.nom}</span>
                    {!sz.faol ? (
                      <span className={s.ochirilgan}>ўчиқ</span>
                    ) : ozgarganmi(x, sz) ? (
                      <span className={s.ozgargan} title="Стандартдан фарқ қилади" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <Muharrir key={k.id} k={k} onIflos={onIflos} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- muharrir */

function Muharrir({ k, onIflos }) {
  const { sozlamalar, saqla, davr } = useRisklar();
  const saqlangan = sozlamalar[k.id];
  const [qoralama, setQoralama] = useState(saqlangan);
  const [saqlandi, setSaqlandi] = useState(false);
  const asosiy = asosiyUstun(k);
  const birlik = BIRLIK[asosiy.tur] ?? '';

  const xatolar = tekshir(k, qoralama);
  const toza = Object.keys(xatolar).length === 0;
  const iflos = JSON.stringify(qoralama) !== JSON.stringify(saqlangan);
  useEffect(() => onIflos(iflos), [iflos, onIflos]);

  const ozgartir = (patch) => {
    setSaqlandi(false);
    setQoralama((e) => ({ ...e, ...patch }));
  };
  const parametr = (kalit, v) => ozgartir({ parametrlar: { ...qoralama.parametrlar, [kalit]: v } });

  const hozir = useMemo(() => hisobla(k, davr, saqlangan, standartFiltr(k)), [k, davr, saqlangan]);
  const yangi = useMemo(
    () => (toza ? hisobla(k, davr, qoralama, standartFiltr(k)) : null),
    [k, davr, qoralama, toza]
  );

  const past = k.yonalish === 'past';
  const chegaraMaydonlari = [
    { kalit: 'chegara', nom: 'Риск чегараси', izoh: `Шундан ${past ? 'паст' : 'юқори'} бўлса — «Паст» даража`, d: 'past' },
    { kalit: 'orta', nom: 'Ўрта даража', izoh: `Шундан ${past ? 'паст' : 'юқори'} — «Ўрта»`, d: 'orta' },
    { kalit: 'yuqori', nom: 'Юқори даража', izoh: `Шундан ${past ? 'паст' : 'юқори'} — «Юқори»`, d: 'yuqori' }
  ];

  return (
    <div className={s.muharrir}>
      <Card
        title={
          <span className={s.muharrirSarlavha}>
            <span className={s.kodBelgi}>{k.kod}</span>
            {k.nom}
          </span>
        }
        sub={k.guruhNom}
        extra={
          <Button kichik tur="shaffof" ikon={mdiOpenInNew} onClick={() => ot(`#/risklar/${k.guruh}/${k.id}`)}>
            Ҳисоботни очиш
          </Button>
        }
      >
        <p className={s.tavsifJonli}>{toza ? k.tavsif(qoralama) : k.tavsif(saqlangan)}</p>

        {/* ---------- Umumiy qism: barcha ko'rsatkichda bir xil ---------- */}
        <div className={s.sozBolim}>
          <div className={s.sozBolimNom}>Умумий</div>
          <div className={s.sozQator}>
            <div>
              <div className={s.maydonNom}>Ҳолати</div>
              <div className={s.maydonIzoh}>Ўчирилган кўрсаткич бошқарув панели ва йиғма ҳисобларда иштирок этмайди</div>
            </div>
            <Toggle id="faol" on={qoralama.faol} onChange={(v) => ozgartir({ faol: v })} label={qoralama.faol ? 'Фаол' : 'Ўчирилган'} />
          </div>
          <div className={s.sozQator}>
            <div>
              <div className={s.maydonNom}>Асосий кўрсаткич</div>
              <div className={s.maydonIzoh}>Даража шу қийматдан аниқланади; иккинчи даража — {k.kesimNomi.toLowerCase()}</div>
            </div>
            <div className={s.maydonQiymat}>
              {asosiy.nom} · {past ? 'камайса хавф ортади ↓' : 'ошса хавф ортади ↑'}
            </div>
          </div>
        </div>

        <div className={s.sozBolim}>
          <div className={s.sozBolimNom}>Даража чегаралари</div>
          {chegaraMaydonlari.map((m) => (
            <div key={m.kalit} className={s.sozQator}>
              <div>
                <div className={s.maydonNom}>
                  <DarajaBelgi daraja={m.d} kichik /> {m.nom}
                </div>
                <div className={s.maydonIzoh}>{m.izoh}</div>
              </div>
              <div className={s.maydonKirit}>
                <NumInput
                  id={`s-${m.kalit}`}
                  value={qoralama[m.kalit]}
                  onChange={(v) => ozgartir({ [m.kalit]: v })}
                  birlik={birlik}
                  xato={xatolar[m.kalit]}
                />
                {xatolar[m.kalit] && <div className={s.xato}>{xatolar[m.kalit]}</div>}
              </div>
            </div>
          ))}
          <Shkala k={k} soz={toza ? qoralama : saqlangan} natija={yangi ?? hozir} tur={asosiy.tur} />
        </div>

        {k.parametrlar.length > 0 && (
          <div className={s.sozBolim}>
            <div className={s.sozBolimNom}>Кўрсаткичга хос параметрлар</div>
            {k.parametrlar.map((p) => (
              <div key={p.kalit} className={s.sozQator}>
                <div>
                  <div className={s.maydonNom}>{p.nom}</div>
                  {p.izoh && <div className={s.maydonIzoh}>{p.izoh}</div>}
                </div>
                <div className={s.maydonKirit}>
                  <ParametrMaydon p={p} v={qoralama.parametrlar[p.kalit]} onChange={(v) => parametr(p.kalit, v)} xato={xatolar[`p.${p.kalit}`]} />
                  {xatolar[`p.${p.kalit}`] && <div className={s.xato}>{xatolar[`p.${p.kalit}`]}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={s.sozAmallar}>
          <Button
            ikon={mdiRestore}
            tur="shaffof"
            disabled={JSON.stringify(qoralama) === JSON.stringify(standartSozlama(k))}
            onClick={() => ozgartir(standartSozlama(k))}
          >
            Стандарт қийматлар
          </Button>
          <span className={s.bosliq} />
          {saqlandi && !iflos && (
            <span className={s.saqlandi}>
              <Icon path={mdiCheck} size={14} />
              Сақланди
            </span>
          )}
          <Button disabled={!iflos} onClick={() => setQoralama(saqlangan)}>
            Бекор қилиш
          </Button>
          <Button
            tur="asosiy"
            ikon={mdiContentSave}
            disabled={!iflos || !toza}
            onClick={() => {
              saqla(k.id, qoralama);
              setSaqlandi(true);
            }}
          >
            Сақлаш
          </Button>
        </div>
      </Card>

      <div className={s.muharrirYon}>
        <Card title="Таъсири" sub={`${davr.nom} маълумоти бўйича`}>
          <div className={s.tasirBlok}>
            <div className={s.tasirNom}>Ҳозирги созлама</div>
            <DarajaChiziq sanoq={sanoq(hozir.qatorlar)} afsona balandlik={10} />
          </div>
          <div className={s.tasirBlok}>
            <div className={s.tasirNom}>Янги созлама билан {iflos ? '' : '(ўзгариш йўқ)'}</div>
            {yangi ? (
              <DarajaChiziq sanoq={sanoq(yangi.qatorlar)} afsona balandlik={10} />
            ) : (
              <div className={s.xato}>Хатоларни тузатинг</div>
            )}
          </div>
          {yangi && iflos && <OzgarishRoyxati hozir={hozir} yangi={yangi} />}
        </Card>
      </div>
    </div>
  );
}

function ParametrMaydon({ p, v, onChange, xato }) {
  if (p.tur === 'mantiq') return <Toggle id={`p-${p.kalit}`} on={v} onChange={onChange} label={v ? 'Ҳа' : 'Йўқ'} />;
  if (p.tur === 'tanlov') {
    return p.variantlar.length <= 3 && p.variantlar.every((x) => x.nom.length < 24) ? (
      <Segment value={v} onChange={onChange} options={p.variantlar} />
    ) : (
      <Select id={`p-${p.kalit}`} value={v} onChange={onChange} options={p.variantlar} />
    );
  }
  return (
    <NumInput
      id={`p-${p.kalit}`}
      value={v}
      onChange={onChange}
      birlik={BIRLIK[p.tur]}
      xato={xato}
      kenglik={p.tur === 'summa' ? 200 : undefined}
    />
  );
}

/** Darajasi o'zgaradigan tashkilotlar */
function OzgarishRoyxati({ hozir, yangi }) {
  const farqlar = yangi.qatorlar
    .map((t) => ({ t, eski: hozir.qatorlar.find((x) => x.id === t.id)?.daraja }))
    .filter((x) => x.eski !== x.t.daraja);
  if (!farqlar.length) return <div className={s.maydonIzoh}>Ташкилотлар даражаси ўзгармайди.</div>;
  return (
    <div className={s.farqlar}>
      <div className={s.tasirNom}>Даражаси ўзгарадиганлар: {farqlar.length}</div>
      {farqlar.slice(0, 8).map(({ t, eski }) => (
        <div key={t.id} className={s.farq}>
          <span className={s.farqNom} title={t.org.nom}>
            {t.org.nom}
          </span>
          <DarajaBelgi daraja={eski} kichik />
          <span className={s.xira}>→</span>
          <DarajaBelgi daraja={t.daraja} kichik />
        </div>
      ))}
      {farqlar.length > 8 && <div className={s.maydonIzoh}>ва яна {farqlar.length - 8} та</div>}
    </div>
  );
}

/**
 * Shkala: daraja zonalari va joriy davrdagi tashkilotlar nuqta sifatida.
 * Chegarani o'zgartirsangiz, zonalar va nuqtalar rangi darhol siljiydi.
 */
function Shkala({ k, soz, natija, tur }) {
  const tip = useTooltip();
  const qiymatlar = natija.qatorlar.filter((t) => t.qiymat != null);
  const eng = Math.max(...qiymatlar.map((t) => t.qiymat), soz.chegara, soz.orta, soz.yuqori, 0) * 1.1 || 1;
  const x = (v) => `${Math.max(0, Math.min(100, (v / eng) * 100))}%`;
  const past = k.yonalish === 'past';
  const zonalar = past
    ? [
        { d: 'yuqori', a: 0, b: soz.yuqori },
        { d: 'orta', a: soz.yuqori, b: soz.orta },
        { d: 'past', a: soz.orta, b: soz.chegara },
        { d: 'norma', a: soz.chegara, b: eng }
      ]
    : [
        { d: 'norma', a: 0, b: soz.chegara },
        { d: 'past', a: soz.chegara, b: soz.orta },
        { d: 'orta', a: soz.orta, b: soz.yuqori },
        { d: 'yuqori', a: soz.yuqori, b: eng }
      ];

  return (
    <div className={s.shkala}>
      <div className={s.shkalaIz}>
        {zonalar.map((z) => (
          <span
            key={z.d}
            className={s.zona}
            data-d={z.d}
            style={{ left: x(z.a), width: `calc(${x(z.b)} - ${x(z.a)})` }}
            title={darajaNom(z.d)}
          />
        ))}
        {qiymatlar.map((t, i) => (
          <span
            key={t.id}
            className={s.nuqta}
            style={{ left: x(t.qiymat), top: 6 + (i % 3) * 9, background: `var(--xb-st-${t.daraja})` }}
            tabIndex={0}
            {...tip.ulash(
              <>
                <div>{t.org.nom}</div>
                <b>{qiymatMatn(t.qiymat, tur)}</b> · {darajaNom(t.daraja)}
              </>
            )}
          />
        ))}
      </div>
      <div className={s.shkalaOq}>
        <span style={{ left: 0 }}>0</span>
        {[soz.chegara, soz.orta, soz.yuqori].map((v, i) => (
          <span key={i} style={{ left: x(v) }}>
            {son(v, Number.isInteger(v) ? 0 : 1)}
          </span>
        ))}
      </div>
      <Tooltip {...tip} />
    </div>
  );
}
