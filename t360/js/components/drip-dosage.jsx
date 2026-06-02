/* Drip & Dosage — standalone calculator box with teaching mode.
   Realistic field formulas:
     • Continuous infusion:  mL/hr = dose / concentration ;  gtt/min = mL/hr × dropFactor ÷ 60
     • Weight bolus:         total = dose/kg × weight ;        draw = total ÷ stock concentration
     • Fluid drip:           gtt/min = volume × dropFactor ÷ time(min)
   Renders its own floating launcher; the app just mounts <window.DripDosageBox/>. */
/* global React */
(function () {
  const { useState, useMemo } = React;

  const round = (n, p = 1) => {
    if (!isFinite(n)) return '—';
    const f = Math.pow(10, p);
    const r = Math.round(n * f) / f;
    return (r % 1 === 0) ? String(r) : r.toFixed(p);
  };

  // Infusion presets (amount in bag · bag volume · starting dose) — realistic mixes.
  const INFUSION_PRESETS = {
    Norepinephrine: { amt: 4,    amtU: 'mg',  vol: 250, dose: 0.1, dU: 'mcg/kg/min', note: 'Start 0.05–0.3 mcg/kg/min, titrate to MAP ≥65' },
    Epinephrine:    { amt: 1,    amtU: 'mg',  vol: 250, dose: 0.1, dU: 'mcg/kg/min', note: '0.01–0.5 mcg/kg/min' },
    'Ketamine (inf)':{ amt: 250, amtU: 'mg',  vol: 250, dose: 0.3, dU: 'mg/kg/hr',   note: 'Analgesia 0.1–0.3 · dissociative 1–2 mg/kg/hr' },
    Fentanyl:       { amt: 1000, amtU: 'mcg', vol: 100, dose: 1,   dU: 'mcg/kg/hr',  note: '0.5–2 mcg/kg/hr' },
    Custom:         { amt: 4,    amtU: 'mg',  vol: 250, dose: 0.1, dU: 'mcg/kg/min', note: '' },
  };
  const DOSE_UNITS = ['mcg/kg/min', 'mcg/kg/hr', 'mg/kg/hr', 'mcg/min', 'mg/hr', 'units/hr'];
  const DROP_SETS = [10, 15, 20, 60];

  // dose → base amount per hour (mcg, or units), given weight
  function dosePerHourBase(doseVal, unit, kg) {
    switch (unit) {
      case 'mcg/kg/min': return doseVal * kg * 60;       // mcg/hr
      case 'mcg/kg/hr':  return doseVal * kg;            // mcg/hr
      case 'mg/kg/hr':   return doseVal * kg * 1000;     // mcg/hr
      case 'mcg/min':    return doseVal * 60;            // mcg/hr
      case 'mg/hr':      return doseVal * 1000;          // mcg/hr
      case 'units/hr':   return doseVal;                 // units/hr
      default: return NaN;
    }
  }
  const amtToBase = (amt, u) => u === 'mg' ? amt * 1000 : amt; // mcg, or units passthrough

  function Field({ label, children, hint }) {
    return (
      <label className="dd-field">
        <span className="dd-flabel">{label}{hint && <i className="dd-hint">{hint}</i>}</span>
        {children}
      </label>
    );
  }

  function Teach({ on, lines }) {
    if (!on) return null;
    return (
      <div className="dd-teach">
        <div className="dd-teach-h">▸ How this is calculated</div>
        {lines.map((l, i) => <div className="dd-teach-l" key={i}>{l}</div>)}
      </div>
    );
  }

  // ── Live IV drip chamber — drops fall at the computed cadence ─────────────
  // Fluid runs light blue; a blood product turns it blood-red with a pulsing
  // BLOOD badge beside the chamber.
  function DripVisual({ gttMin, blood }) {
    const ok = isFinite(gttMin) && gttMin > 0;
    const sec = ok ? 60 / gttMin : 0;
    // Clamp the animation period for visual sanity; the label shows the true rate.
    const dur = ok ? Math.max(0.28, Math.min(6, sec)) : 0;
    const stream = ok && sec < 0.28; // too fast to read as discrete drops
    return (
      <div className={"ddv-wrap" + (blood ? " blood" : "")}>
        <div className="ddv" title={ok ? Math.round(gttMin) + " drops/min" : ""}>
          <div className={"ddv-chamber" + (stream ? " stream" : "")}>
            <span className="ddv-spike" />
            {ok && !stream && <span className="ddv-drop" style={{ animationDuration: dur + "s" }} />}
            {stream && <span className="ddv-stream" />}
            <span className="ddv-pool" />
          </div>
          <span className="ddv-tube" />
          <div className="ddv-read">
            <b>{ok ? Math.round(gttMin) : "—"}</b> gtt/min
            <span className="ddv-sub">{ok ? (stream ? "continuous stream" : "1 drop / " + sec.toFixed(1) + " s") : "set a dose"}</span>
          </div>
        </div>
        {blood && <span className="ddv-blood"><span className="ddv-blood-dot" />BLOOD</span>}
      </div>
    );
  }

  // ── Continuous infusion ──────────────────────────────────────────────────
  function Infusion({ kg, teach }) {
    const [drug, setDrug] = useState('Norepinephrine');
    const pre = INFUSION_PRESETS[drug];
    const [amt, setAmt] = useState(pre.amt);
    const [amtU, setAmtU] = useState(pre.amtU);
    const [vol, setVol] = useState(pre.vol);
    const [dose, setDose] = useState(pre.dose);
    const [dU, setDU] = useState(pre.dU);
    const [drops, setDrops] = useState(60);

    const pickDrug = (d) => {
      setDrug(d);
      const p = INFUSION_PRESETS[d];
      setAmt(p.amt); setAmtU(p.amtU); setVol(p.vol); setDose(p.dose); setDU(p.dU);
    };

    const r = useMemo(() => {
      const isUnits = dU === 'units/hr';
      const concBase = amtToBase(amt, amtU) / vol;          // mcg/mL (or units/mL)
      const perHr = dosePerHourBase(dose, dU, kg);          // mcg/hr (or units/hr)
      const mlPerHr = perHr / concBase;
      const gttMin = mlPerHr * drops / 60;
      const secPerGtt = 60 / gttMin;
      const bagMin = vol / mlPerHr * 60;
      return { isUnits, concBase, perHr, mlPerHr, gttMin, secPerGtt, bagMin };
    }, [amt, amtU, vol, dose, dU, drops, kg]);

    const concU = amtU === 'units' ? 'units/mL' : (r.concBase < 1 ? 'mcg/mL' : 'mcg/mL');
    return (
      <div className="dd-calc">
        <Field label="Drug / mix">
          <select value={drug} onChange={e => pickDrug(e.target.value)}>
            {Object.keys(INFUSION_PRESETS).map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        {pre.note && <div className="dd-note">{pre.note}</div>}

        <div className="dd-row">
          <Field label="Drug in bag">
            <div className="dd-inline">
              <input type="number" value={amt} onChange={e => setAmt(+e.target.value || 0)} />
              <select value={amtU} onChange={e => setAmtU(e.target.value)}>
                <option>mg</option><option>mcg</option><option>units</option>
              </select>
            </div>
          </Field>
          <Field label="Bag volume" hint="mL">
            <input type="number" value={vol} onChange={e => setVol(+e.target.value || 1)} />
          </Field>
        </div>

        <div className="dd-row">
          <Field label="Patient weight" hint="kg">
            <input type="number" value={kg} readOnly title="Set on the roster header" />
          </Field>
          <Field label="Target dose">
            <div className="dd-inline">
              <input type="number" step="0.01" value={dose} onChange={e => setDose(+e.target.value || 0)} />
              <select value={dU} onChange={e => setDU(e.target.value)}>
                {DOSE_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </Field>
        </div>

        <Field label="Drop set" hint="gtt/mL">
          <div className="dd-seg">
            {DROP_SETS.map(d => (
              <button key={d} className={d === drops ? 'on' : ''} onClick={() => setDrops(d)}>
                {d === 60 ? '60 micro' : d}
              </button>
            ))}
          </div>
        </Field>

        <div className="dd-out dd-out-drip">
          <DripVisual gttMin={r.gttMin} />
          <div className="dd-out-figs">
            <div className="dd-big">
              <div><span className="dd-num">{round(r.mlPerHr, 1)}</span><span className="dd-u">mL / hr</span></div>
              <div><span className="dd-num">{round(r.gttMin, 0)}</span><span className="dd-u">gtt / min</span></div>
            </div>
            <div className="dd-line"><span>1 drop every</span><b>{round(r.secPerGtt, 1)} s</b></div>
            <div className="dd-line"><span>Bag concentration</span><b>{round(r.concBase, r.concBase < 10 ? 2 : 0)} {r.isUnits ? 'units/mL' : 'mcg/mL'}</b></div>
            <div className="dd-line"><span>Delivering</span><b>{round(r.perHr, 0)} {r.isUnits ? 'units/hr' : 'mcg/hr'}</b></div>
            <div className="dd-line"><span>Bag runs ~</span><b>{round(r.bagMin, 0)} min</b></div>
          </div>
        </div>

        <Teach on={teach} lines={[
          `Concentration = ${amt} ${amtU} ÷ ${vol} mL = ${round(r.concBase, 2)} ${r.isUnits ? 'units' : 'mcg'}/mL` + (amtU === 'mg' ? `  (${amt} mg = ${amt * 1000} mcg)` : ''),
          `Dose/hr = ${dose} ${dU}${dU.includes('/kg') ? ` × ${kg} kg` : ''}${dU.includes('/min') ? ' × 60' : ''} = ${round(r.perHr, 0)} ${r.isUnits ? 'units' : 'mcg'}/hr`,
          `mL/hr = dose/hr ÷ concentration = ${round(r.perHr, 0)} ÷ ${round(r.concBase, 2)} = ${round(r.mlPerHr, 1)} mL/hr`,
          `gtt/min = mL/hr × drop set ÷ 60 = ${round(r.mlPerHr, 1)} × ${drops} ÷ 60 = ${round(r.gttMin, 1)} gtt/min`,
        ]} />
      </div>
    );
  }

  // ── Weight-based bolus ───────────────────────────────────────────────────
  function Bolus({ kg, teach }) {
    const [dose, setDose] = useState(0.2);
    const [dU, setDU] = useState('mg/kg');
    const [stock, setStock] = useState(50);
    const [stockU, setStockU] = useState('mg/mL');

    const r = useMemo(() => {
      const perKg = dU.includes('/kg');
      const massU = dU.startsWith('mcg') ? 'mcg' : 'mg';
      let total = perKg ? dose * kg : dose;                       // in massU
      // convert total to stock mass unit
      const stockMassU = stockU.startsWith('mcg') ? 'mcg' : 'mg';
      let totalInStock = total;
      if (massU !== stockMassU) totalInStock = massU === 'mg' ? total * 1000 : total / 1000;
      const ml = totalInStock / stock;
      return { total, massU, ml };
    }, [dose, dU, stock, stockU, kg]);

    return (
      <div className="dd-calc">
        <div className="dd-row">
          <Field label="Patient weight" hint="kg">
            <input type="number" value={kg} readOnly />
          </Field>
          <Field label="Dose">
            <div className="dd-inline">
              <input type="number" step="0.01" value={dose} onChange={e => setDose(+e.target.value || 0)} />
              <select value={dU} onChange={e => setDU(e.target.value)}>
                <option>mg/kg</option><option>mcg/kg</option><option>mg</option><option>mcg</option>
              </select>
            </div>
          </Field>
        </div>
        <Field label="Stock concentration">
          <div className="dd-inline">
            <input type="number" step="0.1" value={stock} onChange={e => setStock(+e.target.value || 1)} />
            <select value={stockU} onChange={e => setStockU(e.target.value)}>
              <option>mg/mL</option><option>mcg/mL</option>
            </select>
          </div>
        </Field>
        <div className="dd-out">
          <div className="dd-big">
            <div><span className="dd-num">{round(r.total, 2)}</span><span className="dd-u">{r.massU} dose</span></div>
            <div><span className="dd-num">{round(r.ml, 2)}</span><span className="dd-u">mL to draw</span></div>
          </div>
        </div>
        <Teach on={teach} lines={[
          `Total dose = ${dose} ${dU}${dU.includes('/kg') ? ` × ${kg} kg` : ''} = ${round(r.total, 2)} ${r.massU}`,
          `Volume = total dose ÷ stock = ${round(r.total, 2)} ${r.massU} ÷ ${stock} ${stockU} = ${round(r.ml, 2)} mL`,
        ]} />
      </div>
    );
  }

  // ── Simple fluid drip ────────────────────────────────────────────────────
  function Fluid({ teach }) {
    const [vol, setVol] = useState(500);
    const [time, setTime] = useState(20);
    const [timeU, setTimeU] = useState('min');
    const [drops, setDrops] = useState(10);
    const [fluid, setFluid] = useState('Crystalloid (LR/NS)');
    const blood = fluid !== 'Crystalloid (LR/NS)';

    const r = useMemo(() => {
      const tMin = timeU === 'hr' ? time * 60 : time;
      const gttMin = vol * drops / tMin;
      const mlHr = vol / (tMin / 60);
      return { tMin, gttMin, mlHr, sec: 60 / gttMin };
    }, [vol, time, timeU, drops]);

    return (
      <div className="dd-calc">
        <Field label="Fluid / product">
          <select value={fluid} onChange={e => setFluid(e.target.value)}>
            <option>Crystalloid (LR/NS)</option>
            <option>Whole Blood</option>
            <option>PRBC</option>
            <option>Plasma</option>
            <option>LTOWB</option>
          </select>
        </Field>
        <div className="dd-row">
          <Field label="Volume" hint="mL">
            <input type="number" value={vol} onChange={e => setVol(+e.target.value || 0)} />
          </Field>
          <Field label="Over time">
            <div className="dd-inline">
              <input type="number" value={time} onChange={e => setTime(+e.target.value || 1)} />
              <select value={timeU} onChange={e => setTimeU(e.target.value)}>
                <option>min</option><option>hr</option>
              </select>
            </div>
          </Field>
        </div>
        <Field label="Drop set" hint="gtt/mL">
          <div className="dd-seg">
            {DROP_SETS.map(d => (
              <button key={d} className={d === drops ? 'on' : ''} onClick={() => setDrops(d)}>
                {d === 60 ? '60 micro' : d}
              </button>
            ))}
          </div>
        </Field>
        <div className="dd-out dd-out-drip">
          <DripVisual gttMin={r.gttMin} blood={blood} />
          <div className="dd-out-figs">
            <div className="dd-big">
              <div><span className="dd-num">{round(r.gttMin, 0)}</span><span className="dd-u">gtt / min</span></div>
              <div><span className="dd-num">{round(r.mlHr, 0)}</span><span className="dd-u">mL / hr</span></div>
            </div>
            <div className="dd-line"><span>1 drop every</span><b>{round(r.sec, 1)} s</b></div>
          </div>
        </div>
        <Teach on={teach} lines={[
          `Time in minutes = ${time} ${timeU}${timeU === 'hr' ? ` × 60 = ${r.tMin} min` : ''}`,
          `gtt/min = volume × drop set ÷ time = ${vol} × ${drops} ÷ ${r.tMin} = ${round(r.gttMin, 1)} gtt/min`,
          `mL/hr = volume ÷ hours = ${vol} ÷ ${round(r.tMin / 60, 2)} = ${round(r.mlHr, 0)} mL/hr`,
        ]} />
      </div>
    );
  }

  function DripDosageBox({ weight }) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('infusion');
    const [teach, setTeach] = useState(true);
    const kg = Number(weight) || 0;

    return (
      <>
        <button className={'dd-fab' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}
                title="Drip & dosage calculator">
          <span className="dd-fab-ic">💧</span><span>DRIP / DOSE</span>
        </button>
        {open && (
          <div className="dd-box" role="dialog" aria-label="Drip and dosage calculator">
            <div className="dd-head">
              <span className="dd-title"><span className="dd-tick"></span>DRIP &amp; DOSAGE</span>
              <button className={'dd-teach-toggle' + (teach ? ' on' : '')} onClick={() => setTeach(v => !v)}
                      title="Show the formula and worked steps">
                ◎ Teaching {teach ? 'ON' : 'OFF'}
              </button>
              <button className="dd-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="dd-modes">
              {[['infusion', 'Infusion'], ['bolus', 'Bolus dose'], ['fluid', 'Fluid drip']].map(([k, l]) => (
                <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>
              ))}
            </div>
            <div className="dd-body">
              {mode === 'infusion' && <Infusion kg={kg} teach={teach} />}
              {mode === 'bolus' && <Bolus kg={kg} teach={teach} />}
              {mode === 'fluid' && <Fluid teach={teach} />}
            </div>
            <div className="dd-foot">
              gtt/min = mL/hr × drop set ÷ 60 · weight {kg || '—'} kg from roster
            </div>
          </div>
        )}
      </>
    );
  }

  window.DripDosageBox = DripDosageBox;
})();
