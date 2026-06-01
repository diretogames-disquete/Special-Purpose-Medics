/* Right column: Treatments, Drug Log, Drip Calc, Blood, Reference */
/* global React */

const DRUG_REFERENCE = [
  { cat: 'Narcotics / Analgesia' },
  { name: 'Ketamine', route: 'IV', dose: '0.1–0.2 mg/kg', sedDose: '1.0–2.0 mg/kg', onset: '30–60s', peak: '~1 min', dur: '10–15 min', use: 'Pain · Deep sedation' },
  { name: 'Ketamine', route: 'IM', dose: '0.5–0.75 mg/kg', sedDose: '4–5 mg/kg', onset: '1–5 min', peak: '5–15 min', dur: '20–30 min', use: 'Pain · Deep sedation' },
  { name: 'Fentanyl',  route: 'IV', dose: '25–100 mcg', onset: '2 min', peak: '5–15 min', dur: '30–60 min', use: 'Severe pain' },
  { name: 'Fentanyl',  route: 'IM', dose: '50–100 mcg', onset: '5–15 min', dur: '1–2 hrs', use: 'Severe pain' },
  { name: 'Fentanyl',  route: 'PO (lozenge)', dose: '800 mcg', onset: '15–60 min', dur: '5–15 hrs ½ life', use: 'Pain (TCCC OTFC)' },
  { name: 'Morphine',  route: 'IV', dose: '2.5–10 mg', onset: '<5 min', peak: '10 min', dur: '1–4 hrs', use: 'Pain' },
  { name: 'Morphine',  route: 'IM', dose: '1–2 mg', onset: '10–30 min', dur: '30–60 min', use: 'Pain' },
  { name: 'Percocet',  route: 'PO', dose: '1–2 tabs', onset: '1 hr', dur: '4–6 hrs', use: 'Pain (Oxy/APAP)' },
  { name: 'Dilaudid',  route: 'IM', dose: '1–2 mg', onset: '15 min', dur: '2–6 hrs', use: 'Severe pain' },

  { cat: 'Sedatives' },
  { name: 'Midazolam', route: 'IV/IM', dose: '5–10 mg', onset: '1–5 min', peak: '~1 min IV', dur: '20–50 min', use: 'Sedation · Seizure' },
  { name: 'Diazepam',  route: 'IV', dose: '5–10 mg', onset: '1–3 min', dur: '2–4 hrs', use: 'Seizure · Spasm' },

  { cat: 'Reversal Agents' },
  { name: 'Naloxone',  route: 'IV/IM', dose: '0.4–2.0 mg q2–3 min', onset: '1–2 min', dur: '30–60 min', use: 'Narcotic OD' },
  { name: 'Flumazenil',route: 'IV', dose: '0.2 mg → 0.1 mg q1 min · max 1 mg', onset: '1 min', dur: '20–50 min', use: 'Benzo OD' },

  { cat: 'Crush / Hyperkalemia' },
  { name: 'Calcium Gluconate', route: 'IV', dose: '10 mL slow over 3 min (3 g if no CaCl)', use: 'Hyperkalemia' },
  { name: 'Calcium Chloride',  route: 'IV/IO', dose: '1 g slow q4 units blood', use: 'Hyperkalemia · Massive Tx' },
  { name: 'Insulin + D50',     route: 'IV', dose: '10 U + 50 mL D50', use: 'Hyperkalemia' },
  { name: 'Albuterol',         route: 'NEB', dose: '2.5 mg / 3 mL (12 mL of 0.083%)', use: 'Hyperkalemia · Bronchospasm' },
  { name: 'TXA',               route: 'IV',  dose: '2 g over 10 min', use: 'Hemorrhage <3h' },

  { cat: 'Epi Drip · 1:10,000' },
  { name: '50 mL bag',  route: '+1 mL (100 mcg)',  dose: '4 mcg/min', onset: '10 gtt: 20 d/min · 15 gtt: 30 d/min' },
  { name: '100 mL bag', route: '+2 mL (200 mcg)',  dose: '4 mcg/min', onset: '10 gtt: 10 d/min · 15 gtt: 15 d/min' },
  { name: '250 mL bag', route: '+5 mL (500 mcg)',  dose: '4 mcg/min', onset: '10 gtt: 4 d/min · 15 gtt: 6 d/min' },
  { name: '500 mL bag', route: '+10 mL (1 mg)',    dose: '4 mcg/min', onset: '10 gtt: 2 d/min · 15 gtt: 3 d/min' },
  { name: '1000 mL bag',route: '+20 mL (2 mg)',    dose: '4 mcg/min', onset: '10 gtt: 1 d/min · 15 gtt: 1–2 d/min' },
];

function TreatmentsTab({ interventions, setInterventions }) {
  const CATEGORIES = [
    { key: 'massive', label: 'Massive Hemorrhage', items: ['Tourniquet applied', 'Wound packed', 'Pressure dressing', 'Junctional TQ', 'TXA 2g IV'] },
    { key: 'airway',  label: 'Airway', items: ['Chin-lift / Jaw-thrust', 'NPA placed', 'Cric performed', 'Recovery position'] },
    { key: 'resp',    label: 'Respiration', items: ['Chest seal R', 'Chest seal L', 'Needle decomp R', 'Needle decomp L', 'O₂ administered'] },
    { key: 'circ',    label: 'Circulation', items: ['IV established', 'IO established', 'Pelvic binder', 'Fluids started'] },
    { key: 'head',    label: 'Head/Hypothermia', items: ['Hypothermia prevention kit', 'C-spine immobilized', 'Eye shield'] },
  ];
  const toggle = (id) => {
    setInterventions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  return (
    <div className="scrollable">
      {CATEGORIES.map(cat => (
        <div className="panel" key={cat.key}>
          <div className="panel-h"><span className="tick"></span><b>{cat.label}</b></div>
          <div className="panel-body">
            <div className="chips">
              {cat.items.map(item => {
                const id = cat.key + ':' + item;
                return (
                  <div key={id}
                    className={'chip ' + (interventions.includes(id) ? 'active' : '')}
                    onClick={()=>toggle(id)}>
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MedsTab({ medsGiven, setMedsGiven, weight }) {
  const w = Number(weight) || 0;
  const quickAdd = (name, dose) => {
    setMedsGiven(prev => [...prev, { time: nowHHMM(), name, dose, id: Date.now() }]);
  };
  const remove = (id) => setMedsGiven(prev => prev.filter(m => m.id !== id));

  // Each med can declare:
  //   perKg: amount per kg (in `unit`)
  //   unit:  base unit ('mg' | 'mcg' | 'g')
  //   min/max: clamp the calculated value
  //   round: nearest unit to round to (default 1)
  // If perKg is absent the dose is flat.
  const COMMON = [
    { name: 'Ketamine IV',   baseDose: '0.2 mg/kg', perKg: 0.2,  unit: 'mg',  round: 1,  cat: 'Analgesia' },
    { name: 'Ketamine IV',   baseDose: '1.5 mg/kg', perKg: 1.5,  unit: 'mg',  round: 5,  cat: 'Sedation' },
    { name: 'Ketamine IM',   baseDose: '4 mg/kg',   perKg: 4,    unit: 'mg',  round: 10, cat: 'Sedation' },
    { name: 'Fentanyl IV',   baseDose: '1 mcg/kg',  perKg: 1,    unit: 'mcg', round: 25, min: 25, max: 100, cat: 'Analgesia' },
    { name: 'Fentanyl OTFC', baseDose: '800 mcg',                                                         cat: 'Analgesia' },
    { name: 'Morphine IV',   baseDose: '0.1 mg/kg', perKg: 0.1,  unit: 'mg',  round: 1,  min: 2.5, max: 10, cat: 'Analgesia' },
    { name: 'Midazolam IV',  baseDose: '0.05 mg/kg',perKg: 0.05, unit: 'mg',  round: 0.5,min: 1, max: 10,   cat: 'Sedation' },
    { name: 'TXA',           baseDose: '2 g IV',                                                          cat: 'Antifibrinolytic' },
    { name: 'Ondansetron',   baseDose: '4 mg ODT',                                                        cat: 'Antiemetic' },
    { name: 'Naloxone',      baseDose: '0.4 mg IV',                                                       cat: 'Reversal' },
    { name: 'Calcium Gluc.', baseDose: '1 g IV',                                                          cat: 'Electrolyte' },
    { name: 'Ceftriaxone',   baseDose: '1 g IV',                                                          cat: 'Antibiotic' },
  ];

  // Compute display dose + the value to log
  const computeDose = (d) => {
    if (!d.perKg || !w) return { display: d.baseDose, logged: d.baseDose, calc: null };
    let raw = d.perKg * w;
    if (d.min != null) raw = Math.max(d.min, raw);
    if (d.max != null) raw = Math.min(d.max, raw);
    const r = d.round || 1;
    const rounded = Math.round(raw / r) * r;
    const numStr = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
    const calc = `${numStr} ${d.unit}`;
    return {
      display: `${calc} @ ${w}kg`,
      logged: `${calc} (${d.baseDose})`,
      calc,
      base: d.baseDose
    };
  };

  return (
    <div className="scrollable">
      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Administered</b>
          <span className="right">{medsGiven.length} recorded · pt {w || '—'} kg</span>
        </div>
        {medsGiven.length === 0 && (
          <div style={{padding:'14px', color:'var(--fg-3)', fontFamily:'var(--mono)', fontSize:'11px'}}>
            No medications logged. Tap a drug below to record.
          </div>
        )}
        {medsGiven.map(m => (
          <div className="drug-given" key={m.id}>
            <span className="gtime">{m.time}</span>
            <span className="gname">{m.name} <span className="gdose">· {m.dose}</span></span>
            <button className="gx" onClick={()=>remove(m.id)}>×</button>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Quick Administer</b>
          <span className="right">{w ? `doses for ${w} kg` : 'set weight to calc'}</span>
        </div>
        <div className="drug-list">
          {COMMON.map((d, i) => {
            const calc = computeDose(d);
            return (
              <div className="drug-row" key={i} onClick={()=>quickAdd(d.name, calc.logged)}>
                <div>
                  <div className="d-name">{d.name}</div>
                  <div className="d-cat">{d.cat}</div>
                </div>
                <div className="d-dose-stack">
                  {calc.calc ? (
                    <>
                      <div className="d-calc">{calc.calc}</div>
                      <div className="d-base">{d.baseDose}</div>
                    </>
                  ) : (
                    <div className="d-calc d-flat">{d.baseDose}</div>
                  )}
                </div>
                <button className="d-add" onClick={(e)=>{e.stopPropagation(); quickAdd(d.name, calc.logged);}}>GIVE</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DripCalcTab({ patientKgInit }) {
  const [drug, setDrug] = React.useState('Ketamine');
  const [dose, setDose] = React.useState(1.5); // mg/kg/hr
  const [doseUnit, setDoseUnit] = React.useState('mg/kg/hr');
  const [weight, setWeight] = React.useState(patientKgInit || 90);
  const [bag, setBag] = React.useState(250);
  const [gtt, setGtt] = React.useState(15);
  const [concPerMl, setConcPerMl] = React.useState(100); // mg/mL stock

  // Derived
  const mgPerHr = doseUnit === 'mg/kg/hr' ? weight * dose
                 : doseUnit === 'mg/kg/min' ? weight * dose * 60
                 : weight * dose * 60 / 1000; // mcg/kg/min
  const mgPerMin = mgPerHr / 60;
  const mgInBag = mgPerHr; // 1 hr of drug
  const mlToDraw = mgInBag / concPerMl;
  const ratio = (mgInBag / bag).toFixed(2); // mg per mL in bag
  const mlPerMin = mgPerMin / (mgInBag / bag);
  const gttsPerMin = mlPerMin * gtt;
  const secPerGtt = 60 / gttsPerMin;
  const bagDurationMin = bag / mlPerMin;

  return (
    <div className="scrollable">
      <div className="calc">
        <div className="calc-field">
          <label>Drug</label>
          <select value={drug} onChange={e=>setDrug(e.target.value)}>
            <option>Ketamine</option>
            <option>Fentanyl</option>
            <option>Epinephrine</option>
            <option>Custom</option>
          </select>
        </div>
        <div className="calc-row">
          <div className="calc-field">
            <label>Pt Weight (kg)</label>
            <input type="number" value={weight} onChange={e=>setWeight(Number(e.target.value)||0)} />
          </div>
          <div className="calc-field">
            <label>Target Dose</label>
            <div style={{display:'flex', gap:'4px'}}>
              <input type="number" step="0.1" value={dose} onChange={e=>setDose(Number(e.target.value)||0)} style={{flex:1}}/>
              <select value={doseUnit} onChange={e=>setDoseUnit(e.target.value)} style={{flex:1.2}}>
                <option>mg/kg/hr</option>
                <option>mg/kg/min</option>
                <option>mcg/kg/min</option>
              </select>
            </div>
          </div>
        </div>
        <div className="calc-row">
          <div className="calc-field">
            <label>Bag Size (mL)</label>
            <select value={bag} onChange={e=>setBag(Number(e.target.value))}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
            </select>
          </div>
          <div className="calc-field">
            <label>Drop Set (gtt/mL)</label>
            <select value={gtt} onChange={e=>setGtt(Number(e.target.value))}>
              <option value="10">10 gtt</option>
              <option value="15">15 gtt</option>
              <option value="20">20 gtt</option>
              <option value="60">60 gtt (micro)</option>
            </select>
          </div>
        </div>
        <div className="calc-field">
          <label>Stock Concentration (mg/mL)</label>
          <input type="number" value={concPerMl} onChange={e=>setConcPerMl(Number(e.target.value)||1)} />
        </div>

        <div className="dropper" title={`~${gttsPerMin.toFixed(1)} drops/min`}>
          <div className="pipe"></div>
          <div className="drop" style={{ animationDuration: Math.max(0.4, Math.min(8, secPerGtt)) + 's' }}></div>
          <div className="pool"></div>
        </div>

        <div className="calc-output">
          <div>
            <div className="o-lbl">Drip Rate</div>
            <div className="o-val">{isFinite(gttsPerMin) ? gttsPerMin.toFixed(1) : '—'}<span className="u">gtt / min</span></div>
          </div>
          <div className="o-line"><span className="k">1 drop every</span><span className="v">{isFinite(secPerGtt) ? secPerGtt.toFixed(1) : '—'} sec</span></div>
          <div className="o-line"><span className="k">Bag concentration</span><span className="v">{ratio} mg / mL</span></div>
          <div className="o-line"><span className="k">Draw into bag</span><span className="v">{mlToDraw.toFixed(2)} mL ({mgInBag.toFixed(0)} mg)</span></div>
          <div className="o-line"><span className="k">Infusion rate</span><span className="v">{mlPerMin.toFixed(2)} mL/min · {(mlPerMin*60).toFixed(1)} mL/hr</span></div>
          <div className="o-line"><span className="k">Bag duration</span><span className="v">~{isFinite(bagDurationMin) ? Math.round(bagDurationMin) : '—'} min</span></div>
        </div>

        <div style={{
          padding:'10px 12px', fontFamily:'var(--mono)', fontSize:'10.5px',
          color:'var(--fg-2)', borderTop:'1px solid var(--line)', lineHeight:1.7
        }}>
          <div style={{color:'var(--amber)', letterSpacing:'0.15em', fontSize:'9px', marginBottom:'4px'}}>FIELD CHEAT · KETAMINE</div>
          1.5 mg/kg/hr · 90 kg → 135 mg in 250 mL bag<br/>
          250 mL × 15 gtt / 3600 s ≈ 1 gtt/sec<br/>
          Induct with ~150–200 mg, then maintain at calculated rate.
        </div>
      </div>
    </div>
  );
}

const BLOOD_COMPAT = {
  'O-':  { donateTo: ['ALL'],                              receiveFrom: ['O-'] },
  'O+':  { donateTo: ['O+','A+','B+','AB+'],               receiveFrom: ['O-','O+'] },
  'A-':  { donateTo: ['A-','A+','AB-','AB+'],              receiveFrom: ['O-','A-'] },
  'A+':  { donateTo: ['A+','AB+'],                         receiveFrom: ['O-','O+','A-','A+'] },
  'B-':  { donateTo: ['B-','B+','AB-','AB+'],              receiveFrom: ['O-','B-'] },
  'B+':  { donateTo: ['B+','AB+'],                         receiveFrom: ['O-','O+','B-','B+'] },
  'AB-': { donateTo: ['AB-','AB+'],                        receiveFrom: ['O-','A-','B-','AB-'] },
  'AB+': { donateTo: ['AB+'],                              receiveFrom: ['ALL'] },
};
const BLOOD_TYPES = ['O-','O+','A-','A+','B-','B+','AB-','AB+'];

function BloodTab({ bloodType, setBloodType, fluidsGiven, setFluidsGiven }) {
  const compat = BLOOD_COMPAT[bloodType] || { donateTo: [], receiveFrom: [] };
  return (
    <div className="scrollable">
      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Casualty Blood Type</b>
          <span className="right">tap to select</span>
        </div>
        <div className="blood-grid">
          {BLOOD_TYPES.map(bt => (
            <div
              key={bt}
              className={'blood-cell ' + (bt === bloodType ? 'self' : '')}
              onClick={()=>setBloodType(bt)}>
              <div className="bt">{bt}</div>
              <div className="role">{bt === bloodType ? 'SELF' : ''}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Compatibility · {bloodType}</b></div>
        <div style={{padding:'8px 14px', fontFamily:'var(--mono)', fontSize:'11px'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'8px'}}>
            <span style={{color:'var(--op)', fontSize:'9px', letterSpacing:'0.15em'}}>RECEIVE FROM ←</span>
            <span style={{color:'var(--fg-0)'}}>{compat.receiveFrom.join(' · ')}</span>
          </div>
          <div style={{display:'flex', alignItems:'baseline', gap:'8px'}}>
            <span style={{color:'var(--info)', fontSize:'9px', letterSpacing:'0.15em'}}>DONATE TO →</span>
            <span style={{color:'var(--fg-0)'}}>{compat.donateTo.join(' · ')}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Fluids · IV Drops/min</b>
          <span className="right">mL/hr → gtt/min</span>
        </div>
        <div className="fluid-row head"><span>mL/hr</span><span>10 gtt set</span><span>15 gtt set</span></div>
        {[50, 75, 100, 125, 150, 175, 200, 250, 500, 1000].map(r => (
          <div className="fluid-row" key={r}>
            <span className="num">{r}</span>
            <span className="num">{Math.round((r/60)*10)}</span>
            <span className="num">{Math.round((r/60)*15)}</span>
          </div>
        ))}
        <div style={{padding:'10px 14px', fontFamily:'var(--mono)', fontSize:'10px', color:'var(--fg-2)', borderTop:'1px solid var(--line)'}}>
          Crush: 1–2 L crystalloid bolus · 1 L/hr to UOP &gt;100–200 mL/hr
        </div>
      </div>

      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>Products Administered</b></div>
        <FluidLog log={fluidsGiven} setLog={setFluidsGiven} />
      </div>
    </div>
  );
}

function FluidLog({ log, setLog }) {
  const add = (type) => setLog(prev => [...prev, { time: nowHHMM(), type, vol: '', id: Date.now() }]);
  const upd = (id, k, v) => setLog(prev => prev.map(x => x.id === id ? {...x, [k]: v} : x));
  const rm = (id) => setLog(prev => prev.filter(x => x.id !== id));
  return (
    <div>
      <div style={{display:'flex', flexWrap:'wrap', gap:'4px', padding:'8px 14px'}}>
        {['Whole Blood','PRBC','Plasma','LR','NS','Hextend'].map(t => (
          <button key={t} onClick={()=>add(t)} style={{
            background:'transparent', border:'1px solid var(--line-2)',
            color:'var(--fg-1)', fontFamily:'var(--mono)', fontSize:'10px',
            letterSpacing:'0.1em', padding:'4px 8px', cursor:'pointer',
            borderRadius:'2px', textTransform:'uppercase'
          }}>+ {t}</button>
        ))}
      </div>
      {log.length === 0 ? (
        <div style={{padding:'4px 14px 14px', fontFamily:'var(--mono)', fontSize:'11px', color:'var(--fg-3)'}}>No fluids logged.</div>
      ) : (
        <table className="vlog">
          <thead><tr><th>Time</th><th>Type</th><th>Vol (mL)</th><th></th></tr></thead>
          <tbody>
            {log.map(x => (
              <tr key={x.id}>
                <td className="time"><input value={x.time} onChange={e=>upd(x.id,'time',e.target.value)} style={{width:'48px'}}/></td>
                <td>{x.type}</td>
                <td><input value={x.vol} onChange={e=>upd(x.id,'vol',e.target.value)} placeholder="—" style={{width:'60px'}}/></td>
                <td><button onClick={()=>rm(x.id)} style={{background:'transparent',border:'none',color:'var(--fg-3)',cursor:'pointer',fontFamily:'var(--mono)'}}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RefTab() {
  return (
    <div className="scrollable">
      <table className="ref-table">
        <thead>
          <tr><th>Drug · Route</th><th>Dose</th><th>Onset / Peak / Dur</th><th>Use</th></tr>
        </thead>
        <tbody>
          {DRUG_REFERENCE.map((r, i) => {
            if (r.cat) return <tr className="cat-row" key={i}><td colSpan="4">{r.cat}</td></tr>;
            const timing = [r.onset, r.peak, r.dur].filter(Boolean).join(' · ');
            const dose = r.sedDose ? `${r.dose}  /  sed ${r.sedDose}` : r.dose;
            return (
              <tr key={i}>
                <td><span className="name">{r.name}</span> <span className="muted">{r.route}</span></td>
                <td>{dose}</td>
                <td>{timing}</td>
                <td className="muted">{r.use || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { TreatmentsTab, MedsTab, DripCalcTab, BloodTab, RefTab, DRUG_REFERENCE });
