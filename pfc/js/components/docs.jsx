/* global React */
/* =================================================================
 * DOCS DASHBOARD — Scenario-specific PFC Documentation
 * Sheets modelled on the actual PFC v25 Casualty Card layout.
 *
 *   1. PFC Casualty Card · Page 1   (vital-sign graph + Tx prompts)
 *   2. PFC Casualty Card · Page 2   (drugs, vent, nursing reminders)
 *   3. 12-Hour Care Plan            (T+0.5 → T+12.0)
 *   4. 24-Hour Care Plan            (T+1hr → T+24hr)
 *   5. PFC Basic Vitals Chart       (chart first, then trend)
 *   6. Telemedical Consultation Guide
 * ================================================================= */
const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD, useCallback: useCallbackD, useRef: useRefD } = React;

// =================================================================
// Per-scenario persistent state — backed by localStorage, keyed by
// scenario ctl + slot.  Resets cleanly when ctl changes.
// =================================================================
function useScenarioState(ctl, slot, computeInitial) {
  const key = `pfc.docs.${ctl}.${slot}`;
  const init = useRefD(computeInitial);
  init.current = computeInitial;
  const [val, setVal] = useStateD(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) {}
    return init.current();
  });
  // Reset whenever the storage key changes (scenario or slot)
  useEffectD(() => {
    try {
      const raw = localStorage.getItem(key);
      setVal(raw != null ? JSON.parse(raw) : init.current());
    } catch (e) { setVal(init.current()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffectD(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }, [key, val]);
  return [val, setVal];
}

// Cheap seeded RNG so each scenario gets a stable but distinct chart wobble.
function seedFromCtl(ctl) {
  const s = String(ctl);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function rand(seed, i) {
  // mulberry32-ish, parametrised by seed + offset
  let t = (seed + i * 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------- helpers
function findPatient(chars) {
  if (!chars) return null;
  return chars.find(c => /patient/i.test(c.who) || /patient/i.test(c.role)) || chars[1] || chars[0];
}
function findMedic(chars) {
  if (!chars) return null;
  return chars.find(c => /18D|medical sergeant|medic|instructor|provider/i.test(c.who + ' ' + c.role)) || chars[0];
}
function stripCtl(name) { return (name || '').replace(/\s*\(.*?\)\s*/g, '').trim(); }
function inferSex(who) {
  if (!who) return 'M';
  if (/she|her|female|sgt jane|jessica|sarah|maria|emily|amanda/i.test(who)) return 'F';
  return 'M';
}
function summaryStatus(s) {
  if (!s) return 'STABLE';
  if (s.priority === 0) return 'UNSTABLE · WORSENING';
  if (s.priority === 1) return 'UNSTABLE · TRENDING';
  return 'STABLE';
}
function evacLabel(p) { return p === 0 ? 'URGENT' : p === 1 ? 'PRIORITY' : 'ROUTINE'; }

// CtoF / FtoC
function cToF(c) { return c == null ? null : (c * 9/5) + 32; }

// =================================================================
// Scenario-specific physiology pattern — drift over time keyed by
// scenario text + priority.  Combined with the ctl-seeded jitter
// in synthVitals so every patient looks distinct.
// =================================================================
function scenarioPattern(s) {
  const text = ((s.title || '') + ' ' + (s.focus || '') + ' ' + (s.cat || '') + ' ' +
                (s.assessment?.[0]?.name || '') + ' ' + (s.presentation || '') + ' ' +
                (s.envBefore || '')).toLowerCase();
  // Drift coefficients applied across the time window.
  // value: amount of total drift (e.g. hr: 0.4 → +40 bpm rise across window for amp=100)
  const def = { hr: 0, bp: 0, rr: 0, spo2: 0, temp: 0, etco2: 0, jitter: 1, name: 'baseline' };
  if (/sepsis|infection|septic/.test(text))     return { ...def, hr:  0.18, bp: -0.10, temp:  0.04, jitter: 1.2, name: 'sepsis' };
  if (/hemorrh|blast|amput|massive|exsanguin/.test(text)) return { ...def, hr:  0.20, bp: -0.20, spo2: -0.03, jitter: 1.4, name: 'hemorrhage' };
  if (/shock\b|hypovol/.test(text))             return { ...def, hr:  0.16, bp: -0.16, spo2: -0.02, jitter: 1.3, name: 'shock' };
  if (/burn|tbsa|eschar/.test(text))            return { ...def, hr:  0.10, temp:  0.02, etco2: -0.02, jitter: 1.1, name: 'burn' };
  if (/tbi|head|brain|herniation|cushing/.test(text)) return { ...def, hr: -0.08, bp:  0.12, etco2:  0.05, jitter: 0.8, name: 'tbi' };
  if (/airway|ventil|pneumo|hemoth|respir|cric|intub/.test(text)) return { ...def, spo2: -0.06, rr:  0.30, etco2:  0.20, jitter: 1.2, name: 'respiratory' };
  if (/cardiac|arrest|arrhyth|pulse/.test(text)) return { ...def, hr:  0.10, bp: -0.10, jitter: 1.3, name: 'cardiac' };
  if (/maint|stabiliz|nursing|monitor|documentation|consult|coord/.test(text)) return { ...def, jitter: 0.5, name: 'stable' };
  if (/eval|assess|exam|efast|ultrasound/.test(text)) return { ...def, jitter: 0.7, name: 'assessment' };
  return def;
}

// =================================================================
// Shared atoms
// =================================================================
function FieldRow({ label, children, w = 1 }) {
  return (
    <div className={'fld w' + w}>
      <span className="fld-l">{label}</span>
      <span className="fld-v">{children}</span>
    </div>
  );
}
function FormSection({ title, meta, children, className = '' }) {
  return (
    <section className={'form-section ' + className}>
      <header>
        <span className="form-section-bar"></span>
        <h4>{title}</h4>
        {meta && <span className="form-section-meta">{meta}</span>}
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  );
}
function Stamp({ children, tone = 'mute' }) {
  return <span className={'doc-stamp s-' + tone}>{children}</span>;
}
function SheetHeader({ docNum, title, appx, ctl, version }) {
  return (
    <div className="sheet-header">
      <div className="sheet-id">
        <div className="dd-num">{docNum}</div>
        <div className="dd-title">{title}</div>
      </div>
      <div className="sheet-stamps">
        <Stamp tone="mute">CPG ID 72 · APPENDIX {appx}{version ? ' · ' + version : ''}</Stamp>
        <Stamp tone="live">SCENARIO #{ctl}</Stamp>
      </div>
    </div>
  );
}

// =================================================================
// PFC CASUALTY CARD · PAGE 1 — vital-sign graph + Tx prompt column
// =================================================================
const CARD_ROWS = [
  { v: 'MIN',   tx: 'Send MIST Report',                shade: 'beige' },
  { v: 'Other', tx: 'Stop Massive Bleeding',           shade: 'beige' },
  { v: 140,     tx: 'Pelvic / Feet Binder' },
  { v: 135,     tx: 'Convert TQ <4 hrs' },
  { v: 130,     tx: 'Open Airway' },
  { v: 125,     tx: 'Needle-D / Finger-T / Thoracostomy' },
  { v: 120,     tx: 'Initiate Blood Transfusion' },
  { v: 115,     tx: 'TXA 2g Slow Push (within 3 hrs)' },
  { v: 110,     tx: 'Calcium' },
  { v: 105,     tx: '2nd IV / IO' },
  { v: 100,     tx: 'Peripheral Pulses' },
  { v:  99,     tx: '',                                shade: 'shade' },
  { v:  98,     tx: 'Hypothermia Treatment / Prevention', shade: 'shade' },
  { v:  97,     tx: 'Analgesia Management',            shade: 'shade' },
  { v:  96,     tx: 'Procedural Sedation',             shade: 'shade' },
  { v:  95,     tx: 'Antibiotics / War-Wound Therapy', shade: 'shade' },
  { v:  94,     tx: 'Irrigate / Debride / Dress Wounds', shade: 'shade' },
  { v:  93,     tx: 'Tetanus Status' },
  { v:  92,     tx: 'Reduce / Pad / Splint Fracture' },
  { v:  91,     tx: 'Position / Pad Patient' },
  { v:  90,     tx: 'DVT Prophylaxis' },
  { v:  85,     tx: 'Fasciotomy' },
  { v:  80,     tx: 'Confirm TBSA & Fluids for Burn' },
  { v:  75,     tx: 'Escharotomy' },
  { v:  70,     tx: 'Teleconsult Prep & Call' },
  { v:  65,     tx: 'Expose Patient' },
  { v:  60,     tx: 'Reassess All Treatments' },
  { v:  55,     tx: 'Ultrasound · eFAST / RUSH / ONDS' },
  { v:  50,     tx: 'Detailed Exam' },
  { v:  45,     tx: 'Attach Monitors',                 shade: 'shade' },
  { v:  40,     tx: 'GCS / Neuro / MACE',              shade: 'shade' },
  { v:  38,     tx: 'NG / OG Tube',                    shade: 'shade' },
  { v:  37,     tx: 'Upgrade / Secure Airway',         shade: 'shade' },
  { v:  36,     tx: 'Awake / Post-Cric Checklist',     shade: 'shade' },
  { v:  35,     tx: 'BVM or Vent w/ PEEP',             shade: 'shade' },
  { v:  30,     tx: 'Pressors for Distributive Shock?', shade: 'shade' },
  { v:  25,     tx: 'Foley / Bladder Tap' },
  { v:  20,     tx: 'UA Dipstick' },
  { v:  15,     tx: 'Labs (if available)' },
  { v:  10,     tx: 'Adjust Vent Settings (ABG?)' },
  { v:   5,     tx: 'X-Ray / Imaging' },
  { v: 'Null',  tx: 'PreOp Eval' },
];

const KEY_GROUPS = [
  { from: 0,  span: 2,  rows: ['Charting Key', 'Use letter or symbol consistently'] },
  { from: 2,  span: 9,  rows: ['BP', '(s) Systolic ⌄', '(d) Diastolic ⌃'] },
  { from: 11, span: 6,  rows: ['(1) F-Temp X', '(2) SpO₂ ○'] },
  { from: 17, span: 12, rows: ['(p) Pulse ●', '(m) MAP △', '(SI) Shock Idx', 'SI = HR / Sys'] },
  { from: 29, span: 7,  rows: ['(e) ETCO₂ ▪', '(t) C-Temp X'] },
  { from: 36, span: 6,  rows: ['(r) Resp ○'] },
];

const VITAL_PLOTS = [
  { key: 'sys',   letter: 's', color: '#ef5350' },
  { key: 'dia',   letter: 'd', color: '#f4b04a' },
  { key: 'fTemp', letter: '1', color: '#c2a468' },
  { key: 'spo2',  letter: '2', color: '#c89cf0' },
  { key: 'hr',    letter: 'p', color: '#6fd99a' },
  { key: 'map',   letter: 'm', color: '#5ecae0' },
  { key: 'si',    letter: 'SI', color: '#cfead4' },
  { key: 'etco2', letter: 'e', color: '#b6efc7' },
  { key: 'cTemp', letter: 't', color: '#ef5350' },
  { key: 'rr',    letter: 'r', color: '#5ecae0' },
];

function findRowIdx(value) {
  let best = -1, bestDist = Infinity;
  CARD_ROWS.forEach((r, i) => {
    if (typeof r.v !== 'number') return;
    const d = Math.abs(r.v - value);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function synthVitals(s, cols) {
  const v = s.vitalsParsed || {};
  const baseHr = +v.hr || 80;
  const baseRr = +v.rr || 16;
  const baseSpo2 = +v.spo2 || 97;
  const baseTemp = +v.temp || 37;
  const baseEtco2 = +v.etco2 || 38;
  const baseBp = v.bp || '120/80';
  const [sysBp, diaBp] = baseBp.split('/').map(n => +n || 0);
  const pat = scenarioPattern(s);
  const seed = seedFromCtl(s.ctl);
  // Scaled jitter amplitudes (clinical noise)
  const jitter = (amp, i, phase = 0) =>
    (Math.sin(i * 0.55 + phase + (seed % 100) * 0.03) * 0.7 +
     (rand(seed, i + phase * 17) - 0.5) * 0.6) * amp * pat.jitter;
  // Drift over the window: linear t = i / (cols-1)
  const drift = (basis, coef, t) => basis * coef * t;

  return Array.from({ length: cols }, (_, i) => {
    const t = cols > 1 ? i / (cols - 1) : 0;
    const sys = Math.round((sysBp || 120) + drift(sysBp || 120, pat.bp, t)   + jitter(6, i, 0));
    const dia = Math.round((diaBp || 80)  + drift(diaBp || 80,  pat.bp, t)   + jitter(4, i, 0.5));
    const map = Math.round((sys + 2 * dia) / 3);
    const hr  = Math.round(baseHr + drift(baseHr, pat.hr, t)   + jitter(7, i, 1));
    return {
      sys, dia, map, hr,
      rr:   Math.round(baseRr  + drift(baseRr,   pat.rr,    t) + jitter(2, i, 2)),
      spo2: Math.min(100, Math.round(baseSpo2 + drift(baseSpo2, pat.spo2, t) + jitter(1.5, i, 3))),
      fTemp: Math.round(cToF(+(baseTemp + drift(baseTemp, pat.temp * 0.5, t) + jitter(0.3, i, 5)).toFixed(1))),
      cTemp: +((baseTemp + drift(baseTemp, pat.temp * 0.5, t) + jitter(0.3, i, 5))).toFixed(1),
      etco2: Math.round(baseEtco2 + drift(baseEtco2, pat.etco2, t) + jitter(3, i, 4)),
      si:    +(Math.round((hr / Math.max(40, sys)) * 100) / 100),
      pattern: pat.name,
    };
  });
}

function PfcCardPg1({ s }) {
  const cols = 12;
  const series = useMemoD(() => synthVitals(s, cols), [s.ctl]);
  const pattern = series[0]?.pattern || 'baseline';
  const placements = useMemoD(() => {
    // map: [rowIdx][colIdx] -> [{letter, color}]
    const out = CARD_ROWS.map(() => Array.from({ length: cols }, () => []));
    series.forEach((row, ci) => {
      VITAL_PLOTS.forEach(p => {
        let val = row[p.key];
        if (val == null || isNaN(val)) return;
        // shock index: SI is 0.5-1.5; scale to 50-150 for chart
        if (p.key === 'si') val = val * 100;
        // cTemp is 35-39 — plot near low rows where range hits (won't match well; skip)
        if (p.key === 'cTemp' && val < 50) return;
        // fTemp is 95-103 — fits 94-100 row range
        const ri = findRowIdx(val);
        if (ri >= 0) out[ri][ci].push({ l: p.letter, c: p.color, k: p.key });
      });
    });
    return out;
  }, [series]);

  // interactive: Tx prompt checklist (per scenario)
  const [txDone, setTxDone] = useScenarioState(s.ctl, 'card1.tx', () => ({}));
  const toggleTx = (idx) => setTxDone(prev => {
    const next = { ...prev, [idx]: !prev[idx] };
    if (!next[idx]) delete next[idx];
    return next;
  });

  // interactive: manual cell taps (user can add a custom mark)
  const [manual, setManual] = useScenarioState(s.ctl, 'card1.manual', () => ({}));
  const tapCell = (ri, ci) => {
    const k = ri + '|' + ci;
    setManual(prev => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = { l: '✓', c: 'var(--paper-accent)' };
      return next;
    });
  };
  const txCount = Object.keys(txDone).filter(k => txDone[k]).length;

  const day = 'D+0';
  const hour = 'H+12';
  const z = n => String(n).padStart(2, '0');
  const minLabels = Array.from({ length: cols }, (_, i) => z((i * 5) % 60));
  const hourLabels = Array.from({ length: cols }, (_, i) => z(i + 1));

  // index → key-group lookup
  const keyAt = ri => KEY_GROUPS.find(g => g.from === ri);

  return (
    <div className="pfc-card sheet" data-pattern={pattern}>
      <SheetHeader docNum="PFC CASUALTY CARD" title="PROLONGED FIELD CARE · v25 · PAGE 1 OF 2" appx="A" ctl={s.ctl} version="8 JUL 2023" />

      <div className="dd-grid tight pfc-meta">
        <FieldRow label="PATIENT NAME" w={3}>{stripCtl(findPatient(s.characters)?.who) || '—'}</FieldRow>
        <FieldRow label="DATE">{new Date().toISOString().slice(0,10)}</FieldRow>
        <FieldRow label="EVAC CAT">{evacLabel(s.priority)}</FieldRow>
        <FieldRow label="DAY">{day}</FieldRow>
        <FieldRow label="HOUR">{hour}</FieldRow>
        <FieldRow label="SCENARIO">#{s.ctl}</FieldRow>
      </div>

      <div className="pfc-trend-hint">
        <span className="th-l">Trend Pattern</span>
        <span className={'th-pip pat-' + pattern}>{pattern.toUpperCase()}</span>
        <span className="th-m">Click any time-cell to add a chart mark · Click any Tx prompt to check it off</span>
        <span className="th-r">Tx checked: <b>{txCount}</b>/{CARD_ROWS.filter(r => r.tx).length}</span>
      </div>

      <table className="pfc-grid">
        <colgroup>
          <col className="cg-key" />
          <col className="cg-val" />
          {Array.from({ length: cols }, (_, i) => <col key={i} className="cg-t" />)}
          <col className="cg-val" />
          <col className="cg-rx" />
        </colgroup>
        <thead>
          <tr className="hd-day-row">
            <th className="hd-meta" colSpan={2}>Day</th>
            <th className="hd-day-cell" colSpan={cols}>{day} · Hour {hour}</th>
            <th className="hd-meta" colSpan={2}>Day · {day}</th>
          </tr>
          <tr className="hd-hour-row">
            <th colSpan={2} className="hd-meta">Hour</th>
            {hourLabels.map((h, i) => <th key={i} className="hd-h">{h}</th>)}
            <th colSpan={2} className="hd-meta">Hour · {hour}</th>
          </tr>
          <tr className="hd-min-row">
            <th colSpan={2} className="hd-meta">Min</th>
            {minLabels.map((m, i) => <th key={i} className="hd-m">{m}</th>)}
            <th className="hd-meta">MIN</th>
            <th className="hd-meta tx-head">Treatment / Prompts · Checklist</th>
          </tr>
        </thead>
        <tbody>
          {CARD_ROWS.map((row, ri) => {
            const grp = keyAt(ri);
            return (
              <tr key={ri} className={'cr ' + (row.shade || '')}>
                {grp && (
                  <td rowSpan={grp.span} className={'key-cell key-grp-' + ri}>
                    {grp.rows.map((line, k) => <div key={k} className="key-line">{line}</div>)}
                  </td>
                )}
                <td className="val-l">{row.v}</td>
                {placements[ri].map((cellPlots, ci) => {
                  const k = ri + '|' + ci;
                  const m = manual[k];
                  return (
                    <td
                      key={ci}
                      className={'plot-cell' + (m ? ' has-manual' : '')}
                      onClick={() => tapCell(ri, ci)}
                      title={`Tap to mark · Row ${row.v} · Hour ${hourLabels[ci]}:${minLabels[ci]}`}
                    >
                      {cellPlots.map((p, k2) => (
                        <span key={k2} className={'plot plot-' + p.k} style={{ color: p.c }}>{p.l}</span>
                      ))}
                      {m && <span className="plot plot-manual" style={{ color: m.c }}>{m.l}</span>}
                    </td>
                  );
                })}
                <td className="val-r">{row.v}</td>
                <td
                  className={'rx-cell' + (row.tx ? ' tappable' : ' empty') + (txDone[ri] ? ' done' : '')}
                  onClick={row.tx ? () => toggleTx(ri) : undefined}
                  title={row.tx ? (txDone[ri] ? 'Click to un-check' : 'Click to mark complete') : ''}
                >
                  {row.tx && <span className="tx-bullet">{txDone[ri] ? '✓' : '○'}</span>}
                  <span className="tx-txt">{row.tx || '\u00A0'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pfc-legend-row">
        {VITAL_PLOTS.map(p => (
          <span key={p.key} className="pfc-leg" style={{ color: p.c }}>
            <b>{p.l}</b>
            <span>{({ sys: 'Systolic', dia: 'Diastolic', fTemp: 'F-Temp', spo2: 'SpO₂', hr: 'Pulse', map: 'MAP', si: 'Shock Idx', etco2: 'ETCO₂', cTemp: 'C-Temp', rr: 'Resp' })[p.key]}</span>
          </span>
        ))}
        <span className="pfc-leg manual" style={{ color: 'var(--paper-accent)' }}>
          <b>✓</b><span>User mark</span>
        </span>
      </div>
    </div>
  );
}

// =================================================================
// PFC CASUALTY CARD · PAGE 2 — drugs, vent, nursing reminders
// =================================================================
const NURSING_GROUPS = [
  { name: 'VITALS (as often as needed)', items: ['T, P, R, BP, SpO₂, ETCO₂'] },
  { name: 'INs / OUTs',                  items: ['IV / IO / NGT / OGT / Foley / Stool'] },
  { name: 'Pain / Sedation',             items: ['Maintenance & Procedural Bumps', 'Drips (Pain or TIVA / Sedation)'] },
  { name: 'HEENT',                       items: ['Suction / Clean / Moisten', 'Eye / Nose / Mouth / Ears'] },
  { name: 'Respiratory',                 items: ['Look / Listen / Feel', 'BVM / Vent / Oxygen'] },
  { name: 'Integumentary',               items: ['Look / Touch / Smell', 'Position / Padding / Move / Massage', 'Clean / Dry / Dress / Drain / Cover'] },
  { name: 'Gastrointestinal',            items: ['Look / Listen / Touch / Tap', 'Nausea / PPI / Nutrition'] },
  { name: 'Extra',                       items: ['Battery / Power', 'Stock / Re-Supply / Buy'] },
];

function PfcCardPg2({ s }) {
  const v = s.vitalsParsed || {};
  const initialDrugs = useMemoD(() => deriveDrugs(s), [s.ctl]);
  const initialVent = useMemoD(() => deriveVent(s), [s.ctl]);

  const [drugs, setDrugs] = useScenarioState(s.ctl, 'card2.drugs', () => initialDrugs);
  const [vent, setVent] = useScenarioState(s.ctl, 'card2.vent', () => initialVent);
  const [adjuncts, setAdjuncts] = useScenarioState(s.ctl, 'card2.adjuncts', () => ({
    shunt: /shunt/i.test(joined(s)),
    pelvic: /pelvic|packing/i.test(joined(s)),
    cspine: !/spine|tbi/i.test(joined(s)),
  }));
  const [gcs, setGcs] = useScenarioState(s.ctl, 'card2.gcs', () => ({
    eye: s.priority === 0 ? 3 : 4,
    oral: s.priority === 0 ? 4 : 5,
    motor: 6,
  }));
  const [io, setIo] = useScenarioState(s.ctl, 'card2.io', () => ({
    uop: guessUop(s),
    fluid: guessFluid(s),
    pain: v.pain ? v.pain + '/10' : '—',
    rass: s.priority === 0 ? '-3' : '-2',
    avpu: s.priority === 0 ? 'V (responds to voice)' : 'A (alert)',
  }));

  const updateDrug = (i, k, val) => setDrugs(arr => arr.map((d, j) => j === i ? { ...d, [k]: val } : d));
  const addDrug = () => setDrugs(arr => [...arr, { t: '', name: '', dose: '' }]);
  const removeDrug = i => setDrugs(arr => arr.filter((_, j) => j !== i));
  const updateVent = (k, val) => setVent(p => ({ ...p, [k]: val }));
  const toggleAdj = k => setAdjuncts(p => ({ ...p, [k]: !p[k] }));
  const gcsTotal = (+gcs.eye || 0) + (+gcs.oral || 0) + (+gcs.motor || 0);

  return (
    <div className="pfc-card sheet">
      <SheetHeader docNum="PFC CASUALTY CARD" title="PROLONGED FIELD CARE · v25 · PAGE 2 OF 2" appx="A" ctl={s.ctl} version="8 JUL 2023" />

      <div className="dd-grid tight pfc-meta">
        <FieldRow label="PATIENT NAME" w={3}>{stripCtl(findPatient(s.characters)?.who) || '—'}</FieldRow>
        <FieldRow label="DATE">{new Date().toISOString().slice(0,10)}</FieldRow>
        <FieldRow label="EVAC CAT">{evacLabel(s.priority)}</FieldRow>
        <FieldRow label="DAY">D+0</FieldRow>
        <FieldRow label="HOUR">H+12</FieldRow>
        <FieldRow label="SCENARIO">#{s.ctl}</FieldRow>
      </div>

      <div className="pfc-pg2-grid">
        {/* LEFT COLUMN: I/O · GCS · Drugs · Vent */}
        <div>
          <div className="bar-row out">
            <span>Urine Output (mL/hr)</span>
            <input className="row-fill" value={io.uop} onChange={e => setIo(p => ({...p, uop: e.target.value}))} />
          </div>
          <div className="bar-row in">
            <span>Fluid Input (mL/hr)</span>
            <input className="row-fill" value={io.fluid} onChange={e => setIo(p => ({...p, fluid: e.target.value}))} />
          </div>
          <div className="bar-row pain">
            <span>RASS / Pain Scale</span>
            <input className="row-fill" value={'Pain ' + io.pain + ' · RASS ' + io.rass} onChange={e => {
              const m = e.target.value.match(/Pain\s+([^·]+)·\s*RASS\s+(\S+)/);
              if (m) setIo(p => ({...p, pain: m[1].trim(), rass: m[2].trim()}));
              else setIo(p => ({...p, pain: e.target.value}));
            }} />
          </div>
          <div className="bar-row neuro">
            <span>AVPU / Neuro / MACE2</span>
            <input className="row-fill" value={io.avpu} onChange={e => setIo(p => ({...p, avpu: e.target.value}))} />
          </div>

          <div className="gcs-block">
            <div className="gcs-line"><span>Eye response (1-4)</span>
              <input className="gcs-input" type="number" min="1" max="4" value={gcs.eye} onChange={e => setGcs(p => ({...p, eye: +e.target.value || 0}))} />
            </div>
            <div className="gcs-line"><span>Oral response (1-5)</span>
              <input className="gcs-input" type="number" min="1" max="5" value={gcs.oral} onChange={e => setGcs(p => ({...p, oral: +e.target.value || 0}))} />
            </div>
            <div className="gcs-line"><span>Motor response (1-6)</span>
              <input className="gcs-input" type="number" min="1" max="6" value={gcs.motor} onChange={e => setGcs(p => ({...p, motor: +e.target.value || 0}))} />
            </div>
            <div className="gcs-line total"><span>GCS TOTAL</span><span>{gcsTotal}</span></div>
          </div>

          <FormSection title="Drug / Intervention" meta={`${drugs.filter(d => d.name).length} GIVEN · CLICK TO EDIT`}>
            <table className="drug-table">
              <thead>
                <tr><th>TIME</th><th>DRUG / INTERVENTION</th><th>DOSE / ROUTE</th><th></th></tr>
              </thead>
              <tbody>
                {drugs.map((d, i) => (
                  <tr key={i}>
                    <td><input value={d.t} placeholder="T+__" onChange={e => updateDrug(i, 't', e.target.value)} /></td>
                    <td><input value={d.name} placeholder="—" onChange={e => updateDrug(i, 'name', e.target.value)} /></td>
                    <td><input value={d.dose} placeholder="—" onChange={e => updateDrug(i, 'dose', e.target.value)} /></td>
                    <td><button className="row-x" onClick={() => removeDrug(i)} title="Remove">×</button></td>
                  </tr>
                ))}
                <tr className="add-row">
                  <td colSpan={4}><button className="add-btn" onClick={addDrug}>+ Add drug / intervention</button></td>
                </tr>
              </tbody>
            </table>
          </FormSection>

          <FormSection title="Ventilator Settings" meta={vent.active ? 'ACTIVE · EDITABLE' : 'NOT VENTILATED · EDITABLE'}>
            <table className="vent-table">
              <tbody>
                {[
                  ['mode', 'Ventilator Mode'],
                  ['flow', 'Flow Rate (LPM)'],
                  ['vt', 'Tidal Volume (Vt)'],
                  ['rr', 'Vent Rate (RR)'],
                  ['fio2', 'FiO₂ (%)'],
                  ['peep', 'PEEP'],
                  ['plat', 'Plateau (P-plat)'],
                  ['driveP', 'Drive Pressure (ΔP)'],
                  ['pip', 'Peak Insp. Pressure (PIP)'],
                  ['ie', 'I:E Ratio'],
                ].map(([k, label]) => (
                  <tr key={k}>
                    <td>{label}</td>
                    <td><input value={vent[k]} onChange={e => updateVent(k, e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FormSection>
        </div>

        {/* RIGHT COLUMN: Adjuncts + Nursing reminders */}
        <div>
          <FormSection title="Adjuncts &amp; Procedures">
            <div className="adj-list">
              <label className={'check-item' + (adjuncts.shunt ? ' on' : '')} onClick={e => { e.preventDefault(); toggleAdj('shunt'); }}>
                <span className="cb">{adjuncts.shunt ? '✓' : ''}</span><span className="ct">Shunt placed</span>
              </label>
              <label className={'check-item' + (adjuncts.pelvic ? ' on' : '')} onClick={e => { e.preventDefault(); toggleAdj('pelvic'); }}>
                <span className="cb">{adjuncts.pelvic ? '✓' : ''}</span><span className="ct">Preperitoneal Pelvic Packing</span>
              </label>
              <label className={'check-item' + (adjuncts.cspine ? ' on' : '')} onClick={e => { e.preventDefault(); toggleAdj('cspine'); }}>
                <span className="cb">{adjuncts.cspine ? '✓' : ''}</span><span className="ct">Clear C-Spine</span>
              </label>
            </div>
          </FormSection>

          <FormSection title="Nursing Care Reminders" meta="HOURLY / Q-H · CLICK TO TICK">
            <NursingChecklist ctl={s.ctl} />
          </FormSection>
        </div>
      </div>

      <div className="pfc-foot-link">Newest version available at prolongedfieldcare.org</div>
    </div>
  );
}

function NursingChecklist({ ctl }) {
  const [done, setDone] = useScenarioState(ctl, 'card2.nursing', () => ({}));
  const flatItems = useMemoD(() => {
    const out = [];
    NURSING_GROUPS.forEach(g => g.items.forEach(it => out.push(g.name + ' · ' + it)));
    return out;
  }, []);
  const toggle = k => setDone(p => { const n = { ...p }; if (n[k]) delete n[k]; else n[k] = true; return n; });
  const count = flatItems.filter(k => done[k]).length;
  return (
    <div className="nursing-groups">
      {NURSING_GROUPS.map((g, i) => (
        <div key={i} className="nurse-grp">
          <div className="nurse-grp-head">
            <span>{g.name}</span>
            <span className="nurse-count">{g.items.filter(it => done[g.name + ' · ' + it]).length}/{g.items.length}</span>
          </div>
          {g.items.map((it, j) => {
            const k = g.name + ' · ' + it;
            return (
              <label key={j} className={'nurse-line check-item' + (done[k] ? ' on' : '')} onClick={e => { e.preventDefault(); toggle(k); }}>
                <span className="cb">{done[k] ? '✓' : ''}</span>
                <span className="ct">{it}</span>
              </label>
            );
          })}
        </div>
      ))}
      <div className="nursing-tally">{count} of {flatItems.length} ticks · resets per scenario</div>
    </div>
  );
}

function joined(s) { return ((s.actions || []).join(' ') + ' ' + (s.focus || '') + ' ' + (s.cat || '') + ' ' + (s.presentation || '')).toLowerCase(); }
function guessUop(s) { return s.priority === 0 ? '< 0.3 ml/kg/hr (oliguric)' : '0.5 ml/kg/hr (adequate)'; }
function guessFluid(s) { return /sepsis|hypovol|shock/i.test(joined(s)) ? '150 ml/hr LR · 30 ml/kg bolus' : '120 ml/hr LR (maint)'; }

function deriveDrugs(s) {
  const acts = (s.actions || []).join(' ').toLowerCase();
  const out = [];
  const add = (t, name, dose) => out.push({ t, name, dose });
  if (/txa/i.test(acts)) add('T+05', 'TXA', '1 g IV slow push');
  if (/blood|transfusion|fwb/i.test(acts)) add('T+15', 'Whole Blood', '1 unit · O+ (assume)');
  if (/calcium/i.test(acts)) add('T+18', 'Calcium Gluconate', '1 g IV');
  if (/morphine|fentanyl|analges/i.test(acts)) add('T+30', 'Morphine', '4 mg IV');
  if (/keta/i.test(acts)) add('T+30', 'Ketamine', '20 mg IV bump');
  if (/sedation|midazolam/i.test(acts)) add('T+45', 'Midazolam', '2 mg IV');
  if (/anti(b|biot)/i.test(acts)) add('T+60', 'Ceftriaxone', '2 g IV');
  if (/sepsis|meropenem/i.test(acts)) add('T+60', 'Meropenem', '1 g IV');
  if (/tetan/i.test(acts)) add('T+90', 'Tetanus toxoid', '0.5 mL IM');
  if (out.length === 0) add('T+00', 'Saline lock flush', '5 mL NS');
  return out.slice(0, 8);
}

function deriveVent(s) {
  const acts = joined(s);
  const active = /vent|peep|intub|cric|airway upgrade/i.test(acts);
  if (!active) {
    return { active: false, mode: '—', flow: '—', vt: '—', rr: '—', fio2: '—', peep: '—', plat: '—', driveP: '—', pip: '—', ie: '—' };
  }
  return {
    active: true,
    mode: 'AC / VC',
    flow: '8 LPM',
    vt: '6 mL/kg (~420 mL)',
    rr: '14',
    fio2: '60 %',
    peep: '5 cmH₂O',
    plat: '< 30 cmH₂O',
    driveP: '< 15 cmH₂O',
    pip: '24 cmH₂O',
    ie: '1 : 2',
  };
}

// =================================================================
// CARE PLAN (12-h and 24-h) — categorized action grid
// =================================================================
const CARE_GROUPS = [
  { name: 'Vitals',     items: [
    { act: 'Check BP / HR / RR / T / SpO₂ / ETCO₂', iv: 'Q1H' },
    { act: 'Check Peripheral Pulses',               iv: 'Q1H' },
    { act: 'Check Skin Temp and Color',             iv: 'Q1H' },
    { act: 'Check Lactate',                         iv: 'Q4H' },
    { act: 'Check Blood Glucose',                   iv: 'Q8H' },
  ]},
  { name: 'Ins / Outs', items: [
    { act: 'Check Drip Rates / Fluids In',          iv: 'Q1H' },
    { act: 'Check Urine Output',                    iv: 'Q1H' },
    { act: 'Check Urine Dipstick',                  iv: 'Q1H' },
    { act: 'Perform NG / OG Tube Care',             iv: 'Q2H' },
    { act: 'Perform Foley Care',                    iv: 'Q4H' },
    { act: 'Flush PRN Locks',                       iv: 'Q4H' },
  ]},
  { name: 'Pain / Sedation', items: [
    { act: 'Check GCS / RASS / PAIN',               iv: 'Q1H' },
    { act: 'Give Pain Rx',                          iv: 'per Rx' },
    { act: 'Give Sedation Rx',                      iv: 'per Rx' },
  ]},
  { name: 'HEENT', items: [
    { act: 'Perform Tube Suctioning',               iv: 'PRN' },
    { act: 'Perform Oral Suctioning',               iv: 'PRN' },
    { act: 'Perform Nasal Care / Moisten',          iv: 'Q4H' },
    { act: 'Perform Oral Care / Moisten',           iv: 'Q4H' },
    { act: 'Apply Lip Balm',                        iv: 'Q1H' },
    { act: 'Apply Eye Ointment / Drops',            iv: 'per Rx' },
    { act: 'Brush Teeth',                           iv: 'Q12H' },
    { act: 'Change All Tape',                       iv: 'Q24H' },
  ]},
  { name: 'Respiratory', items: [
    { act: 'Check Ventilator Settings',             iv: 'Q1H' },
    { act: 'Auscultate Lungs',                      iv: 'Q2H' },
    { act: 'Turn, Cough, Deep Breathe',             iv: 'Q1H' },
    { act: 'Check Chest Drainage',                  iv: 'Q1H' },
  ]},
  { name: 'Integumentary', items: [
    { act: 'Check S/S Compartment Syndrome',        iv: 'Q2H' },
    { act: 'Reposition',                            iv: 'Q2H' },
    { act: 'Check Padding',                         iv: 'Q2H' },
    { act: 'Perform LE Massage',                    iv: 'Q4H' },
    { act: 'Check Dressings',                       iv: 'Q4H' },
    { act: 'Do A/P Limb ROM',                       iv: 'Q8H' },
    { act: 'Wash and Dry Skin',                     iv: 'Q24H' },
    { act: 'Perform Burn Skin Care',                iv: 'Q24H' },
    { act: 'Irrigate Wounds',                       iv: 'Q24H' },
    { act: 'Debride Wounds',                        iv: 'Q24H' },
    { act: 'Change Dressings',                      iv: 'Q24H' },
    { act: 'Give Antibiotics Rx',                   iv: 'Q24H' },
  ]},
  { name: 'Gastrointestinal', items: [
    { act: 'Give PPI Rx if indicated',              iv: 'per Rx' },
    { act: 'Give Antiemetic Rx',                    iv: 'per Rx' },
    { act: 'Auscultate Abdomen',                    iv: 'Q2H' },
    { act: 'Palpate Abdomen',                       iv: 'Q4H' },
    { act: 'Give Food / Nutrition',                 iv: 'Q8H' },
  ]},
  { name: 'Extra', items: [
    { act: 'Check O₂ Supply',                       iv: 'Q1H' },
    { act: 'Check / Change Batteries',              iv: 'Q4H' },
    { act: 'Compression Socks / Stockings',         iv: 'Q12H' },
  ]},
];

function CarePlanGrid({ s, span, label, headerLabel }) {
  // build column labels
  const cols = useMemoD(() => {
    if (span === 12) return Array.from({ length: 24 }, (_, i) => 'T+' + (i * 0.5).toFixed(1));
    return Array.from({ length: 24 }, (_, i) => 'T+' + (i + 1) + 'hr');
  }, [span]);

  const auto = useMemoD(() => autoMarks(s, span), [s.ctl, span]);
  // Per-scenario manual overrides: { "grpName|act|colIdx": true/false }
  const [overrides, setOverrides] = useScenarioState(s.ctl, 'plan' + span, () => ({}));

  const isChecked = (grp, act, ci) => {
    const k = grp + '|' + act + '|' + ci;
    if (k in overrides) return overrides[k];
    return auto[grp + '|' + act]?.includes(ci) || false;
  };
  const toggleCell = (grp, act, ci) => {
    const k = grp + '|' + act + '|' + ci;
    const current = isChecked(grp, act, ci);
    setOverrides(prev => {
      const next = { ...prev };
      // store explicit override that flips from current state
      next[k] = !current;
      return next;
    });
  };
  const resetAll = () => setOverrides({});

  // running tally
  const totalChecks = useMemoD(() => {
    let n = 0;
    CARE_GROUPS.forEach(g => g.items.forEach(it =>
      cols.forEach((_, ci) => { if (isChecked(g.name, it.act, ci)) n++; })
    ));
    return n;
  }, [overrides, auto, cols]);

  return (
    <div className="care-plan sheet">
      <SheetHeader docNum="PFC CARE PLAN" title={label} appx="B" ctl={s.ctl} />

      <div className="dd-grid tight pfc-meta">
        <FieldRow label="PATIENT ID" w={3}>{stripCtl(findPatient(s.characters)?.who) || '—'}</FieldRow>
        <FieldRow label="DATE">{new Date().toISOString().slice(0,10)}</FieldRow>
        <FieldRow label="SCENARIO">#{s.ctl}</FieldRow>
        <FieldRow label="EVAC">{evacLabel(s.priority)}</FieldRow>
        <FieldRow label="PLAN">{headerLabel}</FieldRow>
      </div>

      <div className="plan-hint">
        <span className="th-l">Interactive</span>
        <span className="th-m">Click any cell to toggle · Auto-ticks suggested by scenario actions ({scenarioPattern(s).name})</span>
        <span className="th-r">{totalChecks} ticks · <button className="ph-reset" onClick={resetAll}>↻ reset to auto</button></span>
      </div>

      <div className="care-table-wrap">
        <table className="care-table">
          <colgroup>
            <col className="cg-cat" />
            <col className="cg-act" />
            <col className="cg-iv" />
            {cols.map((_, i) => <col key={i} className="cg-tcol" />)}
          </colgroup>
          <thead>
            <tr>
              <th className="hd-cat">Cat.</th>
              <th className="hd-act">Action (suggested interval)</th>
              <th className="hd-iv">Time</th>
              {cols.map((c, i) => <th key={i} className="hd-tcol">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {CARE_GROUPS.map((grp, gi) => (
              <React.Fragment key={gi}>
                {grp.items.map((it, ii) => (
                  <tr key={gi + '-' + ii} className={'cr-act ' + ('cat-' + grp.name.replace(/[^a-z]/gi, '').toLowerCase())}>
                    {ii === 0 && (
                      <td rowSpan={grp.items.length} className={'cat-cell cat-' + grp.name.replace(/[^a-z]/gi, '').toLowerCase()}>
                        <span>{grp.name}</span>
                      </td>
                    )}
                    <td className="act-cell">{it.act}</td>
                    <td className="iv-cell">{it.iv}</td>
                    {cols.map((_, ci) => {
                      const checked = isChecked(grp.name, it.act, ci);
                      const k = grp.name + '|' + it.act + '|' + ci;
                      const isOverride = k in overrides;
                      return (
                        <td
                          key={ci}
                          className={'grid-cell tappable' + (checked ? ' on' : '') + (isOverride ? ' override' : '')}
                          onClick={() => toggleCell(grp.name, it.act, ci)}
                          title={cols[ci] + (checked ? ' · click to clear' : ' · click to mark')}
                        >
                          {checked ? <span className="grid-check">✓</span> : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function autoMarks(s, span) {
  // auto-tick action × column cells based on scenario actions + cadence
  const acts = joined(s);
  const stride = (iv) => {
    const u = iv.toUpperCase();
    if (u.includes('Q1H'))   return span === 12 ? 2  : 1;   // every hr
    if (u.includes('Q2H'))   return span === 12 ? 4  : 2;
    if (u.includes('Q4H'))   return span === 12 ? 8  : 4;
    if (u.includes('Q8H'))   return span === 12 ? 16 : 8;
    if (u.includes('Q12H'))  return span === 12 ? 24 : 12;
    if (u.includes('Q24H'))  return span === 12 ? 0  : 0;  // no in-window tick
    return 0;
  };
  const enabled = (act) => {
    // basic always-on: vitals, GCS/RASS, urine output, BP/HR/RR
    if (/Check BP|Peripheral Pulses|Skin Temp|GCS|Urine Output|Drip Rates|Lip Balm|Reposition|Auscultate Lungs|Padding|Tape|Tube Suctioning/i.test(act)) return true;
    if (/Vent/i.test(act) && /vent|peep|cric|intub/i.test(acts)) return true;
    if (/Chest Drainage/i.test(act) && /chest tube|hemo|pneumo/i.test(acts)) return true;
    if (/Burn/i.test(act) && /burn/i.test(acts)) return true;
    if (/Antibiotic/i.test(act) && /anti(b|biot)/i.test(acts)) return true;
    if (/Pain|Sedation/i.test(act) && /pain|analges|sedation|keta|morph/i.test(acts)) return true;
    if (/Nutrition/i.test(act) && /nutrition|food/i.test(acts)) return true;
    return false;
  };
  const out = {};
  for (const grp of CARE_GROUPS) {
    for (const it of grp.items) {
      if (!enabled(it.act)) continue;
      const st = stride(it.iv);
      if (st <= 0) continue;
      const ticks = [];
      const total = 24;
      for (let i = 0; i < total; i += st) ticks.push(i);
      out[grp.name + '|' + it.act] = ticks;
    }
  }
  return out;
}

function CarePlan12({ s }) { return <CarePlanGrid s={s} span={12} label="12-HOUR CARE PLAN · T+0.5 → T+12.0" headerLabel="12-hour" />; }
function CarePlan24({ s }) { return <CarePlanGrid s={s} span={24} label="24-HOUR CARE PLAN · T+1hr → T+24hr" headerLabel="24-hour" />; }

// =================================================================
// PFC BASIC VITALS CHART — chart first, then trend on flowsheet
// =================================================================
function BasicVitalsChart({ s }) {
  const ROWS = 24;
  const series = useMemoD(() => synthVitals(s, ROWS), [s.ctl]); // 24 rows
  const pattern = series[0]?.pattern || 'baseline';
  const z = n => String(n).padStart(2, '0');
  const t0 = useMemoD(() => Date.now(), [s.ctl]);

  // Build default rows once per scenario, then allow per-cell edits.
  const initialRows = useMemoD(() => series.map((row, i) => {
    const t = new Date(t0 - (ROWS - i) * 30 * 60 * 1000);
    return {
      ts: z(t.getUTCHours()) + ':' + z(t.getUTCMinutes()) + 'Z',
      neuro: i === ROWS - 1 && s.priority === 0 ? 'V · 13' : 'A · 15',
      rr: String(row.rr),
      etco2: String(row.etco2),
      spo2: String(row.spo2),
      hr: String(row.hr),
      bp: row.sys + '/' + row.dia,
      map: String(row.map),
      si: row.si.toFixed(2),
      temp: row.cTemp.toFixed(1) + '°C',
      uop: i % 2 === 0 ? '40 mL' : '—',
    };
  }), [series, t0, s.ctl, s.priority]);

  const [rows, setRows] = useScenarioState(s.ctl, 'vitals.rows', () => initialRows);
  const setCell = (i, k, val) => setRows(arr => arr.map((r, j) => j === i ? { ...r, [k]: val } : r));
  const reset = () => setRows(initialRows);

  // Pull narrative cues from the pattern
  const narrative = {
    sepsis:      'Progressive tachycardia + fever, MAP drift down.',
    hemorrhage:  'BP trending down, HR rising — compensated shock pattern.',
    shock:       'Hypotension with reflex tachycardia.',
    burn:        'HR elevated, mild fever — burn shock physiology.',
    tbi:         'Slowed HR + rising BP — Cushing reflex.',
    respiratory: 'SpO₂ drifting down, RR + ETCO₂ rising.',
    cardiac:     'Rate-pressure decoupling.',
    stable:      'Stable trend across the window.',
    assessment:  'Stable vitals — diagnostic encounter.',
    baseline:    'Baseline ambient noise only.',
  }[pattern] || 'Baseline trend.';

  return (
    <div className="vitals-chart sheet" data-pattern={pattern}>
      <SheetHeader docNum="PFC BASIC VITALS CHART" title="CHART VITALS FIRST · THEN TREND ON FLOWSHEET" appx="C" ctl={s.ctl} />

      <div className="dd-grid tight pfc-meta">
        <FieldRow label="PATIENT" w={3}>{stripCtl(findPatient(s.characters)?.who) || '—'}</FieldRow>
        <FieldRow label="DATE">{new Date().toISOString().slice(0,10)}</FieldRow>
        <FieldRow label="SCENARIO">#{s.ctl}</FieldRow>
        <FieldRow label="SAMPLES" w={2}>{rows.length} · every 30 min</FieldRow>
      </div>

      <div className="plan-hint">
        <span className="th-l">Trend Pattern</span>
        <span className={'th-pip pat-' + pattern}>{pattern.toUpperCase()}</span>
        <span className="th-m">{narrative} · Click any cell to override values.</span>
        <span className="th-r"><button className="ph-reset" onClick={reset}>↻ reset to scenario</button></span>
      </div>

      <table className="bvc-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Pain/LOC<br/>AVPU/GCS</th>
            <th>Resp<br/>Rate</th>
            <th>ETCO₂</th>
            <th>Pulse Ox</th>
            <th>Heart<br/>Rate</th>
            <th>Blood<br/>Pres</th>
            <th>MAP<br/>(S+2D)/3</th>
            <th>Shock Idx<br/>HR/Sys</th>
            <th>Temp</th>
            <th>UOP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === rows.length - 1 ? 'now' : ''}>
              <td className="t">{r.ts}</td>
              <td><input value={r.neuro} onChange={e => setCell(i, 'neuro', e.target.value)} /></td>
              <td><input value={r.rr}    onChange={e => setCell(i, 'rr', e.target.value)} /></td>
              <td><input value={r.etco2} onChange={e => setCell(i, 'etco2', e.target.value)} /></td>
              <td><input value={r.spo2}  onChange={e => setCell(i, 'spo2', e.target.value)} /></td>
              <td><input value={r.hr}    onChange={e => setCell(i, 'hr', e.target.value)} /></td>
              <td><input value={r.bp}    onChange={e => setCell(i, 'bp', e.target.value)} /></td>
              <td><input value={r.map}   onChange={e => setCell(i, 'map', e.target.value)} /></td>
              <td><input value={r.si}    onChange={e => setCell(i, 'si', e.target.value)} /></td>
              <td><input value={r.temp}  onChange={e => setCell(i, 'temp', e.target.value)} /></td>
              <td><input value={r.uop}   onChange={e => setCell(i, 'uop', e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =================================================================
// TELEMEDICAL CONSULTATION GUIDE — fully interactive
// =================================================================
const TELEMED_DEFAULTS = {
  pace_p: 'i2i / Tempus',
  pace_a: 'Sat phone',
  pace_c: 'SMS / encrypted text',
  pace_e: 'HF / VHF radio',
};

// Per-system recommendation suggestions (clinician-grade defaults).
const PLAN_OPTIONS = {
  Neuro:        ['Maintain GCS q1h, MACE2 q4h', 'Sedation goal RASS -2', 'Avoid hypotension (MAP > 65)', 'Elevate HOB 30°', 'Treat ICP if signs of herniation', 'Custom…'],
  CV:           ['Permissive hypotension if hemorrhage', 'MAP > 65 target', 'Vasopressors if MAP < 65 despite fluids', 'Repeat lactate q4h', 'Norepinephrine 5-20 mcg/min PRN', 'Custom…'],
  Pulm:         ['Lung-protective Vt 6 mL/kg', 'PEEP 5-10 cmH₂O', 'Treat pneumothorax — needle/finger', 'Sat goal > 92%', 'EtCO₂ 35-45', 'Custom…'],
  GI:           ['NG / OG to gravity', 'NPO until cleared', 'PPI prophylaxis', 'Enteral nutrition at 24 h', 'Antiemetic PRN', 'Custom…'],
  Renal:        ['Foley + UOP q1h', 'Target 0.5 mL/kg/hr', 'Bolus 250 mL if oliguric', 'Avoid nephrotoxins', 'Custom…'],
  Endocrine:    ['Check glucose q4h', 'Treat if < 70 or > 200', 'Hydrocortisone 100 mg if pressor-refractory', 'Custom…'],
  'MSK / Wound':['Irrigate, debride, dress q24h', 'Antibiotics per CPG', 'Splint/reduce fractures', 'Tetanus prophylaxis', 'Compartment checks q2h', 'Custom…'],
  'Tubes / Lines / Drains': ['Date and secure all lines', 'Sterile tx changes q72h', 'Drains: chart output q4h', 'Foley care q4h', 'Custom…'],
  Prophylaxis:  ['DVT prophylaxis at 24 h if stable', 'PPI / H2 blocker', 'Oral care q4h', 'Eye lubrication', 'Custom…'],
  Other:        ['Document AAR within 24 h', 'JTS pre-hospital notification', 'Custom…'],
};

function TelemedGuide({ s }) {
  const v = s.vitalsParsed || {};
  const medic = findMedic(s.characters);
  const patient = findPatient(s.characters);

  const [state, setState] = useScenarioState(s.ctl, 'telemed', () => ({
    pace: { ...TELEMED_DEFAULTS, p_addr: '', a_addr: '', c_addr: '', e_addr: '' },
    caller: stripCtl(medic?.who) || '',
    role: (medic?.role || '18D Medical Sergeant').split(',')[0],
    myContact: '',
    consultantPhone: '',
    altEmail: 'dha.jbsa.healthcare-ops.list.jts-prehospital@health.mil',
    age: 28,
    sex: inferSex(patient?.who) === 'F' ? 'female' : 'male',
    status: summaryStatus(s),
    moiDx: (s.assessment?.[0]?.name) || s.title,
    timeSince: '~' + guessDurationHrs(s) + ' h',
    evac: s.priority === 0 ? '< 1 h URGENT' : s.priority === 1 ? '< 4 h PRIORITY' : '< 24 h ROUTINE',
    needHelp: ((s.actions?.[0] || 'guidance with stabilization').replace(/^[A-Z][A-Z0-9 /\-\(\)]{2,}?:\s*/, '')).slice(0, 80),
    redFlags: s.priority === 0 ? 'Decompensation imminent — request URGENT EVAC.' :
              s.priority === 1 ? 'Trending unstable — monitor closely, evac within 2 h.' :
              'Stable trend — continue PCC, evac on schedule.',
    plan: Object.fromEntries(Object.keys(PLAN_OPTIONS).map(k => [k, PLAN_OPTIONS[k][0]])),
    planCustom: {},
    todo: ['', '', '', '', '', ''],
  }));

  const upd = (k, val) => setState(p => ({ ...p, [k]: val }));
  const updPace = (k, val) => setState(p => ({ ...p, pace: { ...p.pace, [k]: val } }));
  const updPlan = (k, val) => setState(p => ({ ...p, plan: { ...p.plan, [k]: val } }));
  const updPlanCustom = (k, val) => setState(p => ({ ...p, planCustom: { ...p.planCustom, [k]: val } }));
  const updTodo = (i, val) => setState(p => {
    const next = [...p.todo]; next[i] = val; return { ...p, todo: next };
  });

  return (
    <div className="vccc sheet">
      <SheetHeader docNum="TELEMEDICAL CONSULTATION GUIDE" title="VIRTUAL CRITICAL CARE CONSULTATION" appx="D" ctl={s.ctl} />
      <div className="vccc-banner">To be used with Prolonged Field Care Card · INTERACTIVE — all fields editable, suggestions pre-loaded from scenario</div>

      <div className="callout-box">
        <span className="cb-num">1</span>
        Before calling — e-mail image of casualty (wounds, environment), capabilities (back of page), and vital sign trends to
        <input className="ts-inline" value={state.altEmail} onChange={e => upd('altEmail', e.target.value)} />
      </div>
      <div className="callout-box">
        <span className="cb-num">2</span>
        If call not answered — call next number on PACE, or call back in 5–10 min.
      </div>
      <div className="callout-box">
        <span className="cb-num">3</span>
        If unable to provide information due to OPSEC — state so.
      </div>

      <FormSection title="PACE · Primary / Alt / Contingency / Emergency" meta="COMMS PLAN · EDITABLE">
        <table className="pace-table">
          <thead><tr><th>·</th><th>METHOD</th><th>ADDRESS / FREQ</th></tr></thead>
          <tbody>
            {[['p','P'],['a','A'],['c','C'],['e','E']].map(([k, letter]) => (
              <tr key={k}>
                <td>{letter}</td>
                <td>
                  <select value={state.pace['pace_' + k]} onChange={e => updPace('pace_' + k, e.target.value)}>
                    {['i2i / Tempus', 'Sat phone', 'SMS / encrypted text', 'HF / VHF radio', 'WhatsApp / Signal', 'VSee', 'FaceTime'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td><input className="ts-inline wide" value={state.pace[k + '_addr']} placeholder="address / freq" onChange={e => updPace(k + '_addr', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormSection>

      <FormSection title="Caller &amp; Consultant" meta="*** PAUSE TO CONFIRM CONTACT ***">
        <div className="vccc-fields">
          <FieldRow label="THIS IS"           w={2}><input className="ts-inline" value={state.caller} onChange={e => upd('caller', e.target.value)} /></FieldRow>
          <FieldRow label="JOB / POSITION"    w={2}>
            <select className="ts-inline" value={state.role} onChange={e => upd('role', e.target.value)}>
              {['18D Medical Sergeant', '68W Combat Medic', '18E Comms NCO', '18B Weapons NCO', 'Physician Assistant', 'Surgeon', 'Critical Care Nurse', 'Custom…'].map(o => <option key={o}>{o}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="MY CONTACT"        w={2}><input className="ts-inline" value={state.myContact} placeholder="SAT ____ · CELL ____" onChange={e => upd('myContact', e.target.value)} /></FieldRow>
          <FieldRow label="CONSULTANT #"      w={2}><input className="ts-inline" value={state.consultantPhone} placeholder="phone / DSN" onChange={e => upd('consultantPhone', e.target.value)} /></FieldRow>
          <FieldRow label="ALT E-MAIL"        w={4}><input className="ts-inline wide" value={state.altEmail} onChange={e => upd('altEmail', e.target.value)} /></FieldRow>
        </div>
      </FormSection>

      <FormSection title="Patient Summary">
        <p className="vccc-prose">
          I have a
          <input className="ts-inline tiny" type="number" min="16" max="80" value={state.age} onChange={e => upd('age', +e.target.value || 0)} />
          -year-old
          <select className="ts-inline" value={state.sex} onChange={e => upd('sex', e.target.value)}>
            <option>male</option><option>female</option>
          </select>
          , status
          <select className="ts-inline" value={state.status} onChange={e => upd('status', e.target.value)}>
            <option>STABLE</option>
            <option>UNSTABLE · TRENDING</option>
            <option>UNSTABLE · WORSENING</option>
          </select>
          , with the following:
        </p>
        <FieldRow label="MOI / KNOWN DX" w={4}><input className="ts-inline wide" value={state.moiDx} onChange={e => upd('moiDx', e.target.value)} /></FieldRow>
        <FieldRow label="LOCATION"       w={2}>{s.location}</FieldRow>
        <FieldRow label="TIME SINCE INJ" w={2}><input className="ts-inline" value={state.timeSince} onChange={e => upd('timeSince', e.target.value)} /></FieldRow>
        <FieldRow label="ANTICIPATED EVAC" w={4}>
          <select className="ts-inline wide" value={state.evac} onChange={e => upd('evac', e.target.value)}>
            <option>{'< 1 h URGENT'}</option>
            <option>{'< 4 h PRIORITY'}</option>
            <option>{'< 24 h ROUTINE'}</option>
          </select>
        </FieldRow>
        <FieldRow label="I NEED HELP WITH" w={4}><input className="ts-inline wide" value={state.needHelp} onChange={e => upd('needHelp', e.target.value)} /></FieldRow>
        <div className="vccc-inj">
          <div className="vccc-sub">Injuries / Problems / Symptoms · from scenario:</div>
          <ul>{(s.assessment || []).map((a, i) => <li key={i}>{a.name}{a.detail ? ' — ' + a.detail : ''}</li>)}</ul>
          <div className="vccc-sub">Treatments rendered · from scenario:</div>
          <ul>{(s.actions || []).slice(0, 4).map((a, i) => <li key={i}>{a.replace(/^[A-Z][A-Z0-9 /\-\(\)]{2,}?:\s*/, '')}</li>)}</ul>
        </div>
      </FormSection>

      <FormSection title="Current Vitals &amp; Trend" meta="FROM SCENARIO SNAPSHOT">
        <div className="vccc-vit-row">
          <span><b>HR</b> {v.hr || '—'}</span>
          <span><b>BP</b> {v.bp || '—'}</span>
          <span><b>RR</b> {v.rr || '—'}</span>
          <span><b>SpO₂</b> {v.spo2 || '—'}</span>
          <span><b>EtCO₂</b> {v.etco2 || '—'}</span>
          <span><b>Temp</b> {v.temp || '—'}</span>
          <span><b>UOP</b> ____ ml/hr</span>
          <span><b>GCS / AVPU</b> {s.priority === 0 ? 'V' : 'A'}</span>
        </div>
        <div className="vccc-exam">
          <FieldRow label="NEURO / EXT-MSK" w={2}>{(s.opqrst?.R) || '—'}</FieldRow>
          <FieldRow label="HEART / PULSES"  w={2}>{v.bp ? 'Regular, peripheral pulses palpable' : '—'}</FieldRow>
          <FieldRow label="LUNGS"           w={2}>{v.spo2 ? 'Equal bilaterally' : '—'}</FieldRow>
          <FieldRow label="SKIN / WOUNDS"   w={2}>{v.other || s.presentation}</FieldRow>
          <FieldRow label="ABD"             w={2}>{/abdom/i.test(v.other || '') ? v.other : 'Soft / non-distended'}</FieldRow>
          <FieldRow label="LABS · ABG / LAC" w={2}>Not available in PCC</FieldRow>
        </div>
      </FormSection>

      <FormSection title="Plans / Recommendations · By System" meta="CONSULTANT RECS · DROPDOWN SUGGESTIONS">
        <table className="vccc-plan">
          <thead><tr><th>PRI</th><th>SYSTEM / PROBLEM</th><th>RECOMMENDATION</th></tr></thead>
          <tbody>
            {Object.keys(PLAN_OPTIONS).map((sys, i) => (
              <tr key={sys}>
                <td>{i + 1}</td>
                <td>{sys}</td>
                <td className="plan-cell">
                  <select value={state.plan[sys]} onChange={e => updPlan(sys, e.target.value)}>
                    {PLAN_OPTIONS[sys].map(o => <option key={o}>{o}</option>)}
                  </select>
                  {state.plan[sys] === 'Custom…' && (
                    <input className="ts-inline wide" value={state.planCustom[sys] || ''} placeholder="enter custom recommendation"
                      onChange={e => updPlanCustom(sys, e.target.value)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormSection>

      <FormSection title="To-Do / Follow-Up / To-Stop · Notes" meta="EDITABLE">
        <ol className="todo-list">
          {state.todo.map((t, i) => (
            <li key={i}>
              <input className="ts-inline wide" value={t} placeholder="follow-up item" onChange={e => updTodo(i, e.target.value)} />
            </li>
          ))}
        </ol>
      </FormSection>

      <FormSection title="Red Flags / Sign-Off Statement" meta="READ AT END OF CALL">
        <textarea
          className="ts-textarea"
          value={state.redFlags}
          onChange={e => upd('redFlags', e.target.value)}
        />
      </FormSection>

      <FormSection title="Available Kit · Supplies / Equipment / Meds" meta="!! PHOTOGRAPH &amp; SEND BEFORE CALLING !!">
        <div className="cap-grid">
          {capabilityRows().map((row, i) => (
            <div key={i} className="cap-row">
              <span className="cap-l">{row.label}</span>
              <div className="cap-pills">
                {row.items.map((it, j) => <span key={j} className="cap-pill">{it}</span>)}
              </div>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

function guessDurationHrs(s) {
  const m = (s.location || '').match(/(\d+)\s*hours?/i);
  if (m) return +m[1];
  const m2 = (s.envBefore || '').match(/(\d+)\s*hours?/i);
  if (m2) return +m2[1];
  return s.priority === 0 ? 2 : s.priority === 1 ? 12 : 36;
}

function capabilityRows() {
  return [
    { label: 'IV ACCESS', items: ['IV ×2', 'IO (proximal humerus)', 'No central'] },
    { label: 'MONITOR',   items: ['Propaq M', 'Pulse-ox', 'EtCO₂ side-stream'] },
    { label: 'COMMS',     items: ['Sat phone', 'i2i Tempus', 'Local cell (limited)'] },
    { label: 'FLUIDS',    items: ['LR', 'Plasma-Lyte', '3% saline'] },
    { label: 'BLOOD',     items: ['FWB walking-blood-bank', 'FDP × 4'] },
    { label: 'MEDS',      items: ['Ketamine', 'Morphine', 'Midazolam', 'TXA', 'Meropenem'] },
    { label: 'AIRWAY',    items: ['Cric kit', 'ETT', 'BVM', 'Suction'] },
  ];
}

// =================================================================
// DOCS DASHBOARD — left nav + active sheet
// =================================================================
const DOC_TABS = [
  { id: 'card1',  appx: 'A', short: 'PFC CARD I',  name: 'PFC Casualty Card · Pg 1' },
  { id: 'card2',  appx: 'A', short: 'PFC CARD II', name: 'PFC Casualty Card · Pg 2' },
  { id: 'plan12', appx: 'B', short: '12-H PLAN',   name: '12-Hour Care Plan' },
  { id: 'plan24', appx: 'B', short: '24-H PLAN',   name: '24-Hour Care Plan' },
  { id: 'vitals', appx: 'C', short: 'VITALS',      name: 'Basic Vitals Chart' },
  { id: 'vccc',   appx: 'D', short: 'TELEMED',     name: 'Telemedical Consultation' },
];

function DocsDashboard({ s }) {
  const [doc, setDoc] = useStateD(() => {
    try {
      const saved = localStorage.getItem('pfc.docs.tab');
      return DOC_TABS.find(t => t.id === saved) ? saved : 'card1';
    } catch (e) { return 'card1'; }
  });
  useEffectD(() => { try { localStorage.setItem('pfc.docs.tab', doc); } catch (e) {} }, [doc]);

  return (
    <>
      <div className="docs-rail">
        <div className="docs-rail-head">
          <span className="marker">▣</span>
          DOCUMENTATION SHEETS
          <span className="right">CPG ID 72 · v25</span>
        </div>
        <div className="docs-rail-tabs">
          {DOC_TABS.map(t => (
            <button
              key={t.id}
              className={'docs-tab' + (doc === t.id ? ' on' : '')}
              onClick={() => setDoc(t.id)}
            >
              <span className="docs-appx">APPX {t.appx}</span>
              <span className="docs-name">{t.short}</span>
              {doc === t.id && <span className="docs-arrow">◆</span>}
            </button>
          ))}
        </div>
        <div className="docs-rail-meta">
          <div className="drm-row"><span>SCENARIO</span><b>#{s.ctl} · {s.title}</b></div>
          <div className="drm-row"><span>LOCATION</span><b>{s.location}</b></div>
          <div className="drm-row"><span>EVAC</span>
            <b className={s.priority === 0 ? 'crit' : s.priority === 1 ? 'warn' : 'ok'}>
              {evacLabel(s.priority)}
            </b>
          </div>
        </div>
        <div className="docs-rail-note">
          Sheets auto-fill from scenario data. Print or copy values to the official forms at <i>prolongedfieldcare.org</i>.
        </div>
      </div>

      <div className="docs-stage">
        <div className="docs-stage-bar">
          <span className="marker">▮</span>
          {DOC_TABS.find(t => t.id === doc)?.name}
          <span className="right">AUTO-FILLED FROM SCENARIO #{s.ctl}</span>
        </div>
        <div className="docs-stage-body">
          {doc === 'card1'  && <PfcCardPg1 s={s} />}
          {doc === 'card2'  && <PfcCardPg2 s={s} />}
          {doc === 'plan12' && <CarePlan12 s={s} />}
          {doc === 'plan24' && <CarePlan24 s={s} />}
          {doc === 'vitals' && <BasicVitalsChart s={s} />}
          {doc === 'vccc'   && <TelemedGuide s={s} />}
        </div>
      </div>
    </>
  );
}

window.DocsDashboard = DocsDashboard;
