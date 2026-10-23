/*
 * Risk hujjati oynalari:
 *   RiskYaratOyna — manual risk (hisobotdan yoki ro'yxatdan)
 *   AmalOyna      — status o'tishi: izoh, fayl, ignor muddati
 *   IgnorOyna     — ignor muddatini belgilash / olib tashlash
 */
import { useMemo, useState } from 'react';
import { mdiOpenInNew } from '@mdi/js';
import { Modal, Button, Select, TextArea, TextInput, Segment, Field, Icon } from '@ds';
import { qiymatMatn } from '../../../lib/format.js';
import { TASHKILOTLAR } from '../../../reference/tashkilotlar.js';
import { FOYDALANUVCHILAR } from '../../../reference/foydalanuvchilar.js';
import { GURUHLAR, asosiyUstun } from '../korsatkichlar/index.js';
import { hisobla } from '../hisob.js';
import { useRisklar } from '../holat.jsx';
import { DarajaBelgi } from '../local/Daraja.jsx';
import { useHujjatlar } from './holat.jsx';
import { FaylTanlash } from './qismlar.jsx';
import { USTUVORLIKLAR, OCHIQ, riskKaliti, muddatHisobla, hozir, kunQosh, bugun, sanaMatn } from './model.js';
import s from './hujjat.module.css';

/* ------------------------------------------------------- manual risk */

/**
 * `bosh`: { kId?, orgId?, kesimId? } — hisobotdan ochilganda oldindan to'ladi.
 * Qiymat va daraja tanlangan davrning joriy ma'lumotidan olinadi.
 */
export function RiskYaratOyna({ ochiq, onYop, bosh = {}, onYaratildi }) {
  const { korsatkichlar, sozlamalar, davr } = useRisklar();
  const { holat, riskYarat, foydalanuvchi } = useHujjatlar();
  const boshK = korsatkichlar.find((k) => k.id === bosh.kId) ?? korsatkichlar[0];
  const [guruh, setGuruh] = useState(boshK.guruh);
  const [kId, setKId] = useState(boshK.id);
  const [orgId, setOrgId] = useState(bosh.orgId ?? TASHKILOTLAR[0].id);
  const [kesimId, setKesimId] = useState(bosh.kesimId ?? '');
  const [ustuvorlik, setUstuvorlik] = useState(null);
  const [muddat, setMuddat] = useState(null);
  const [masul, setMasul] = useState(foydalanuvchi.id);
  const [izoh, setIzoh] = useState('');
  const [urinish, setUrinish] = useState(false);

  const k = korsatkichlar.find((x) => x.id === kId) ?? boshK;
  const soz = sozlamalar[k.id];
  const natija = useMemo(() => hisobla(k, davr, soz, {}), [k, davr, soz]);
  const t = natija.qatorlar.find((x) => x.org.id === orgId);
  const b = t?.bolalar.find((x) => x.id === kesimId) ?? null;
  const qiymat = b ? b.qiymat : t?.qiymat;
  const daraja = b ? b.daraja : t?.daraja;
  const u = asosiyUstun(k);

  const ust = ustuvorlik ?? (daraja && daraja !== 'norma' ? daraja : 'orta');
  const mud = muddat ?? muddatHisobla(hozir(), ust, holat.sozlama);
  const kalit = riskKaliti(k.id, b?.id, orgId);
  const mavjud = holat.risklar.find((r) => r.kalit === kalit && OCHIQ.has(r.status));
  const xato = !izoh.trim() ? 'Изоҳ мажбурий: риск нима учун яратилаётганини ёзинг' : mavjud ? 'Бу кесим бўйича очиқ риск бор' : null;

  const yarat = () => {
    setUrinish(true);
    if (xato || !t) return;
    const r = riskYarat({
      k,
      soz,
      org: t.org,
      bola: b?.bola,
      qiymat,
      daraja,
      davr,
      ustuvorlik: ust,
      muddat: mud,
      masul,
      izoh: izoh.trim()
    });
    onYaratildi?.(r);
    onYop();
  };

  return (
    <Modal
      ochiq={ochiq}
      onYop={onYop}
      sarlavha="Риск яратиш"
      sub={`Мануал · муаллиф: ${foydalanuvchi.nom} · маълумот: ${davr.nom}`}
      kenglik={720}
      amallar={
        <>
          <Button onClick={onYop}>Бекор қилиш</Button>
          <Button tur="asosiy" onClick={yarat} disabled={!!mavjud}>
            Яратиш
          </Button>
        </>
      }
    >
      <div className={s.forma}>
        <Field label="Йўналиш" htmlFor="ry-g">
          <Select
            id="ry-g"
            value={guruh}
            onChange={(g) => {
              setGuruh(g);
              const birinchi = korsatkichlar.find((x) => x.guruh === g);
              setKId(birinchi.id);
              setKesimId('');
            }}
            options={GURUHLAR.map((g) => ({ id: g.id, nom: g.nom }))}
          />
        </Field>
        <Field label="Риск тури (кўрсаткич)" htmlFor="ry-k">
          <Select
            id="ry-k"
            value={kId}
            onChange={(v) => {
              setKId(v);
              setKesimId('');
            }}
            options={korsatkichlar.filter((x) => x.guruh === guruh).map((x) => ({ id: x.id, nom: `${x.kod} · ${x.nom}` }))}
          />
        </Field>
        <Field label="Ташкилот" htmlFor="ry-o">
          <Select
            id="ry-o"
            value={orgId}
            onChange={(v) => {
              setOrgId(v);
              setKesimId('');
            }}
            options={TASHKILOTLAR.map((o) => ({ id: o.id, nom: o.nom }))}
          />
        </Field>
        <Field label={k.kesimNomi} htmlFor="ry-ks">
          <Select
            id="ry-ks"
            value={kesimId}
            onChange={setKesimId}
            options={[
              { id: '', nom: 'Ташкилот бўйича (кесимсиз)' },
              ...(t?.bolalar ?? []).map((x) => ({ id: x.id, nom: `${x.bola.nom}${x.bola.izoh ? ' · ' + x.bola.izoh : ''}` }))
            ]}
          />
        </Field>

        <div className={s.qiymatBlok}>
          <span className={s.xira}>{u.nom}:</span>
          <b className={s.mono}>{qiymatMatn(qiymat, u.tur)}</b>
          <DarajaBelgi daraja={daraja} kichik />
          <span className={s.xira}>
            риск чегараси {k.yonalish === 'past' ? '≤' : '≥'} {qiymatMatn(soz.chegara, u.tur)}
          </span>
        </div>
        {mavjud && (
          <div className={s.ogoh}>
            Бу кесим бўйича очиқ риск мавжуд:{' '}
            <a href={`#/hujjatlar/${mavjud.id}`}>
              {mavjud.raqam} <Icon path={mdiOpenInNew} size={12} />
            </a>
          </div>
        )}

        <Field label="Устуворлик">
          <Segment
            value={ust}
            onChange={(v) => {
              setUstuvorlik(v);
              setMuddat(null);
            }}
            options={USTUVORLIKLAR}
          />
        </Field>
        <Field label="Бартараф этиш муддати" htmlFor="ry-m" izoh={`Устуворлик бўйича стандарт: ${holat.sozlama.muddat[ust]} кун`}>
          <TextInput id="ry-m" type="date" value={mud} min={bugun()} onChange={setMuddat} />
        </Field>
        <Field label="Масъул" htmlFor="ry-ms">
          <Select id="ry-ms" value={masul} onChange={setMasul} options={FOYDALANUVCHILAR.map((x) => ({ id: x.id, nom: `${x.nom} · ${x.lavozim}` }))} />
        </Field>
        <Field label="Изоҳ *" htmlFor="ry-i" xato={urinish ? xato : null} keng>
          <TextArea id="ry-i" value={izoh} onChange={setIzoh} placeholder="Масалан: тенденция ёмонлашмоқда, ташкилотдан тушунтириш сўраш керак" />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------- status o'tishi */

const IGNOR_VARIANTLAR = [
  { id: '', nom: 'Йўқ' },
  { id: '30', nom: '1 ой' },
  { id: '90', nom: '3 ой' },
  { id: '180', nom: '6 ой' },
  { id: 'boshqa', nom: 'Сана' }
];

export function AmalOyna({ r, otish, onYop }) {
  const { statusOzgartir } = useHujjatlar();
  const [izoh, setIzoh] = useState('');
  const [fayllar, setFayllar] = useState([]);
  const [ignor, setIgnor] = useState('');
  const [ignorSana, setIgnorSana] = useState(kunQosh(bugun(), 60).slice(0, 10));
  const [urinish, setUrinish] = useState(false);
  if (!otish) return null;

  const izohShart = otish.izohShart || otish.yopish;
  const xato = izohShart && !izoh.trim() ? 'Изоҳ мажбурий' : null;
  const ignorGacha = !ignor ? null : ignor === 'boshqa' ? ignorSana : kunQosh(bugun(), Number(ignor)).slice(0, 10);

  const bajar = () => {
    setUrinish(true);
    if (xato) return;
    statusOzgartir(r.id, otish.ga, { izoh: izoh.trim(), fayllar, ignorGacha: otish.yopish ? ignorGacha : null });
    onYop();
  };

  return (
    <Modal
      ochiq
      onYop={onYop}
      sarlavha={otish.nom}
      sub={`${r.raqam} · ${r.orgNom}`}
      kenglik={600}
      amallar={
        <>
          <Button onClick={onYop}>Бекор қилиш</Button>
          <Button tur={otish.xavf ? 'xavf' : 'asosiy'} onClick={bajar}>
            {otish.nom}
          </Button>
        </>
      }
    >
      <div className={s.forma}>
        <Field label={`Изоҳ${izohShart ? ' *' : ''}`} htmlFor="am-i" xato={urinish ? xato : null} keng>
          <TextArea
            id="am-i"
            value={izoh}
            onChange={setIzoh}
            placeholder={otish.yopish ? 'Риск қандай бартараф этилди? Қандай ҳужжат асосида?' : 'Изоҳ'}
            qator={4}
          />
        </Field>
        {(otish.yopish || otish.ga === 'tekshiruvda') && (
          <Field label="Тасдиқловчи файллар" keng izoh="PDF, Excel, расм — ихтиёрий, бир нечта файл мумкин">
            <FaylTanlash fayllar={fayllar} onChange={setFayllar} />
          </Field>
        )}
        {otish.yopish && (
          <Field
            label="Игнор муддати"
            keng
            izoh="Шу муддат давомида бу ташкилот ва кесим бўйича риск чегарадан ошса ҳам автоматик яратилмайди"
          >
            <Segment value={ignor} onChange={setIgnor} options={IGNOR_VARIANTLAR} />
            {ignor === 'boshqa' && <TextInput type="date" value={ignorSana} min={bugun()} onChange={setIgnorSana} />}
            {ignorGacha && <span className={s.xira}>{sanaMatn(ignorGacha)} гача автоматик яратилмайди</span>}
          </Field>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------- ignor */

export function IgnorOyna({ r, onYop }) {
  const { ignorBelgila } = useHujjatlar();
  const [sana, setSana] = useState(r.ignorGacha ?? kunQosh(bugun(), 90).slice(0, 10));
  const [izoh, setIzoh] = useState('');
  return (
    <Modal
      ochiq
      onYop={onYop}
      sarlavha="Игнор муддати"
      sub={`${r.kKod} · ${r.orgNom}${r.kesimNom ? ' · ' + r.kesimNom : ''}`}
      amallar={
        <>
          {r.ignorGacha && (
            <Button
              tur="xavf"
              onClick={() => {
                ignorBelgila(r.id, null, izoh.trim() || 'Игнор бекор қилинди');
                onYop();
              }}
            >
              Игнорни олиб ташлаш
            </Button>
          )}
          <span style={{ flex: 1 }} />
          <Button onClick={onYop}>Бекор қилиш</Button>
          <Button
            tur="asosiy"
            onClick={() => {
              ignorBelgila(r.id, sana, izoh.trim());
              onYop();
            }}
          >
            Сақлаш
          </Button>
        </>
      }
    >
      <div className={s.forma}>
        <p className={`${s.xira} ${s.keng}`}>
          Белгиланган санагача маълумотлар янгиланганда бу кесим чегарадан ошса ҳам янги риск яратилмайди. Очиқ риск ўз ҳолида
          қолади.
        </p>
        <Field label="Қайси санагача" htmlFor="ig-s">
          <TextInput id="ig-s" type="date" value={sana} min={bugun()} onChange={setSana} />
        </Field>
        <Field label="Асос" htmlFor="ig-i" keng>
          <TextArea id="ig-i" value={izoh} onChange={setIzoh} placeholder="Масалан: ташкилот қайта ташкил этилмоқда, штат жадвали тасдиқланишини кутиш" />
        </Field>
      </div>
    </Modal>
  );
}
