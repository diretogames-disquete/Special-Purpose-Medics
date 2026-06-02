/* Main App - TCCC 360° Casualty Dashboard */
/* global React, ReactDOM, BodyDiagram, VitalsPanel, TreatmentsTab, MedsTab, DripCalcTab, BloodTab, RefTab, nowHHMM, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect, TweakColor, useTweaks */

const STORAGE_KEY = 'tccc360-v1';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "tactical",
  "accent": "op",
  "density": "regular",
  "sectionStyle": "tactical",
  "showSparklines": true,
  "showGrid": true,
  "timeMode": "both",
  "glassPanels": true,
  "glassOpacity": 56,
  "bgCondition": true,
  "webglField": true,
  "soundOn": false,
  "soundMode": "lubdub",
  "soundVolume": 55
}/*EDITMODE-END*/;

const DEFAULT_STATE = {
  rosterNum: '',
  opName: 'ENDURING SHIELD',
  medic: 'SGT R. PHAM',
  name: 'DOE, J.',
  last4: '4521',
  gender: 'M',
  date: '',
  time: '',
  service: 'USA',
  unit: '',
  allergies: 'NKDA',
  bloodType: 'A+',
  evac: 'urgent',
  triage: '',
  weight: 90,
  mechanism: ['GSW', 'Blast'],
  acuteFindings: [],
  injuries: [
    { view:'front', x: 70, y: 130, type:'gsw' },
    { view:'front', x: 132, y: 280, type:'gsw' },
    { view:'back',  x: 110, y: 160, type:'gsw' },
  ],
  burnedRegions: [],
  tourniquets: {
    rArm: { active: false, type: '', time: '', position: '' },
    lArm: { active: false, type: '', time: '', position: '' },
    rLeg: { active: true,  type: 'CAT', time: '1342', position: 'Proximal' },
    lLeg: { active: false, type: '', time: '', position: '' },
  },
  vitals: [
    { time: '1338', hr: '128', sbp: '92',  dbp: '60', rr: '22', spo2: '94', pain: '8' },
    { time: '1345', hr: '118', sbp: '98',  dbp: '64', rr: '20', spo2: '96', pain: '6' },
    { time: '1352', hr: '110', sbp: '104', dbp: '68', rr: '18', spo2: '97', pain: '4' },
  ],
  draftVitals: { hr: '110', sbp: '104', dbp: '68', rr: '18', spo2: '97', pain: '4' },
  avpu: 'V',
  interventions: [
    'massive:Tourniquet applied',
    'massive:TXA 2g IV',
    'circ:IV established',
    'head:Hypothermia prevention kit',
  ],
  medsGiven: [
    { id: 1, time: '1343', name: 'Fentanyl OTFC', dose: '800 mcg' },
    { id: 2, time: '1346', name: 'TXA',           dose: '2 g IV' },
    { id: 3, time: '1350', name: 'Ketamine IV',   dose: '0.2 mg/kg' },
  ],
  fluidsGiven: [
    { id: 1, time: '1348', type: 'Whole Blood', vol: '500' },
  ],
  notes: '1340: PT received, GSW R thigh + L flank. CAT applied prox R thigh; bleeding controlled. IV L AC 18g. TXA 2g over 10 min. Permissive hypotension target SBP 90+. Pt warming with hypo kit.',
};

const MECHANISMS = ['Artillery', 'Blast', 'Blunt', 'Burn', 'Drone', 'Fall', 'Grenade', 'GSW', 'IED', 'Landmine', 'MVC', 'RPG', 'Other'];

const ACUTE_FINDINGS = [
  'Impalement',
  'Evisceration',
  'Amputation',
  'Open Chest',
  'Sucking Chest',
  'Flail Chest',
  'Open Abdomen',
  'Crush',
  'Avulsion',
  'Degloving',
  'Penetrating Head',
  'Spinal Injury',
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_STATE;
}

function App() {
  const [state, setState] = React.useState(loadState);
  const [tab, setTab] = React.useState('treatments');
  const [now, setNow] = React.useState(new Date());
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme attributes to <html>
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t.theme || 'tactical');
    root.setAttribute('data-accent', t.accent || 'op');
    root.setAttribute('data-density', t.density || 'regular');
    root.setAttribute('data-section-style', t.sectionStyle || 'tactical');
    root.style.setProperty('--grid-op', t.showGrid && t.theme !== 'paper' ? 0.18 : 0);
  }, [t.theme, t.accent, t.density, t.sectionStyle, t.showGrid]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const set = (k) => (v) => setState(prev => ({ ...prev, [k]: typeof v === 'function' ? v(prev[k]) : v }));

  const toggleMechanism = (m) => {
    setState(prev => ({
      ...prev,
      mechanism: prev.mechanism.includes(m)
        ? prev.mechanism.filter(x => x !== m)
        : [...prev.mechanism, m]
    }));
  };

  const toggleFinding = (f) => {
    setState(prev => {
      const list = prev.acuteFindings || [];
      return {
        ...prev,
        acuteFindings: list.includes(f) ? list.filter(x => x !== f) : [...list, f]
      };
    });
  };

  const setEvac = (level) => setState(prev => ({ ...prev, evac: prev.evac === level ? '' : level }));

  const z = (n) => String(n).padStart(2, '0');
  const zuluTime = `${z(now.getUTCHours())}${z(now.getUTCMinutes())}${z(now.getUTCSeconds())}Z`;
  const localTime = `${z(now.getHours())}:${z(now.getMinutes())}:${z(now.getSeconds())}`;
  const dateStr = now.toISOString().slice(0,10).replace(/-/g,'') + 'L';

  const activeTQs = Object.values(state.tourniquets).filter(t => t.active).length;
  const lastVital = state.vitals[state.vitals.length - 1] || {};

  // Glass mode + WebGL field controls (driven by Tweaks).
  React.useEffect(() => {
    document.body.classList.toggle('glass', t.glassPanels !== false);
  }, [t.glassPanels]);
  React.useEffect(() => {
    document.body.style.setProperty('--glass-alpha', String((t.glassOpacity ?? 56) / 100));
  }, [t.glassOpacity]);
  React.useEffect(() => {
    const c = document.getElementById('webgl-bg');
    if (c) c.style.display = (t.webglField === false) ? 'none' : 'block';
  }, [t.webglField]);

  // Heart sound (lub-dub / beep), beating at the patient's heart rate.
  React.useEffect(() => { window.HeartAudio && window.HeartAudio.setEnabled(!!t.soundOn); }, [t.soundOn]);
  React.useEffect(() => { window.HeartAudio && window.HeartAudio.setMode(t.soundMode || 'lubdub'); }, [t.soundMode]);
  React.useEffect(() => { window.HeartAudio && window.HeartAudio.setVolume((t.soundVolume ?? 55) / 100); }, [t.soundVolume]);
  React.useEffect(() => {
    if (!window.HeartAudio || !t.soundOn) return;
    const hr = +lastVital.hr;
    if (!hr) return;
    window.HeartAudio.beat();
    const id = setInterval(() => window.HeartAudio.beat(), 60000 / hr);
    return () => clearInterval(id);
  }, [t.soundOn, lastVital.hr]);

  // WebGL field tracks patient acuity from the latest vitals; tempo follows HR.
  React.useEffect(() => {
    if (!window.PFC_BG) return;
    const hr = +lastVital.hr, sbp = +lastVital.sbp, spo2 = +lastVital.spo2;
    const level = (t.bgCondition === false) ? 'stable'
      : ((sbp && sbp < 90) || (spo2 && spo2 < 90) || (hr && (hr > 130 || hr < 40))) ? 'critical'
      : ((sbp && sbp < 100) || (spo2 && spo2 < 94) || (hr && (hr > 110 || hr < 50))) ? 'urgent'
      : 'stable';
    window.PFC_BG.setCondition(level, { hr: hr || 0 });
  }, [lastVital.hr, lastVital.sbp, lastVital.spo2, t.bgCondition]);

  return (
    <div className="app">
      {/* ===== TOP BAR ===== */}
      <div className="topbar">
        <div className="brand"><span className="dot"></span><b>TCCC</b> · 360 CASUALTY VIEW · DD-1380</div>
        <div className="session">
          <span>OP <input className="session-input" value={state.opName} onChange={e=>set('opName')(e.target.value)} style={{width: `${Math.max(8, (state.opName||'').length)}ch`}}/></span>
          <span>MEDIC <input className="session-input" value={state.medic} onChange={e=>set('medic')(e.target.value)} style={{width: `${Math.max(8, (state.medic||'').length)}ch`}}/></span>
          <span>DTG <b>{
            t.timeMode === 'local' ? `${dateStr.slice(0,8)} ${localTime}`
            : t.timeMode === 'zulu' ? `${dateStr} ${zuluTime}`
            : `${dateStr} ${zuluTime}`
          }</b></span>
          <span>LOC <b>34.5°N 69.2°E</b></span>
        </div>
      </div>

      {/* ===== ROSTER HEADER ===== */}
      <div className="roster">
        <div className="cell">
          <div className="lbl">Name · Last4</div>
          <div className="val lg" style={{display:'flex', alignItems:'baseline', gap:'4px'}}>
            <input value={state.name} onChange={e=>set('name')(e.target.value)} style={{width:'180px'}}/>
            <span className="small">/</span>
            <input value={state.last4} onChange={e=>set('last4')(e.target.value)} maxLength="4" style={{width:'84px'}} className="last4-input"/>
          </div>
          <div className="findings-h">
            <span className="lbl" style={{margin:0}}>Acute Findings</span>
            <span className="findings-count">
              {state.acuteFindings && state.acuteFindings.length
                ? `${state.acuteFindings.length} flagged`
                : 'tap to flag'}
            </span>
          </div>
          <div className="findings-chips">
            {ACUTE_FINDINGS.map(f => (
              <div key={f}
                className={'fchip ' + ((state.acuteFindings||[]).includes(f) ? 'active' : '')}
                onClick={()=>toggleFinding(f)}>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Roster #</div>
          <div className="val">
            <input value={state.rosterNum} onChange={e=>set('rosterNum')(e.target.value)} placeholder="HO0332"/>
          </div>
          <div className="lbl" style={{marginTop:'6px'}}>Service · Unit</div>
          <div className="val mono" style={{fontSize:'12px'}}>
            <input value={state.service} onChange={e=>set('service')(e.target.value)} style={{width:'48px'}}/>
            <span className="muted"> · </span>
            <input value={state.unit} onChange={e=>set('unit')(e.target.value)} placeholder="A/2-75" style={{width:'90px'}}/>
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Sex · Wt</div>
          <div className="val">
            <span style={{display:'inline-flex', gap:'4px'}}>
              {['M','F'].map(g => (
                <button key={g} onClick={()=>set('gender')(g)} style={{
                  background: state.gender === g ? 'var(--op)' : 'transparent',
                  border: '1px solid ' + (state.gender === g ? 'var(--op)' : 'var(--line-2)'),
                  color: state.gender === g ? '#0c1410' : 'var(--fg-1)',
                  fontFamily: 'var(--mono)', fontSize: '12px', width: '24px', height: '24px',
                  borderRadius: '2px', cursor: 'pointer'
                }}>{g}</button>
              ))}
            </span>
          </div>
          <div className="lbl" style={{marginTop:'6px'}}>Weight</div>
          <div className="val mono" style={{fontSize:'13px'}}>
            <input type="number" value={state.weight} onChange={e=>set('weight')(Number(e.target.value)||0)} style={{width:'60px'}}/> kg
          </div>
        </div>
        <div className="cell">
          <div className="lbl">Blood Type</div>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'2px'}}>
            <span className="blood-chip">{state.bloodType}</span>
          </div>
          <div className="lbl" style={{marginTop:'6px'}}>Allergies</div>
          <div className="val mono" style={{fontSize:'12px', color: state.allergies==='NKDA'?'var(--op)':'var(--amber)'}}>
            <input value={state.allergies} onChange={e=>set('allergies')(e.target.value)}/>
          </div>
        </div>
        <div className="cell">
          <div className="lbl">EVAC Priority</div>
          <div className="evac">
            <button className={state.evac==='urgent'?'active urgent':''} onClick={()=>setEvac('urgent')}>Urgent</button>
            <button className={state.evac==='priority'?'active priority':''} onClick={()=>setEvac('priority')}>Priority</button>
            <button className={state.evac==='routine'?'active routine':''} onClick={()=>setEvac('routine')}>Routine</button>
          </div>
          <div className="lbl" style={{marginTop:'8px'}}>Triage</div>
          <div className="triage">
            {[
              {k:'Immediate',c:'var(--crit)'},
              {k:'Delayed',c:'var(--amber)'},
              {k:'Minimal',c:'var(--op)'},
              {k:'Expectant',c:'#555'}
            ].map(opt => {
              const isActive = state.triage === opt.k.toLowerCase();
              return (
                <button
                  key={opt.k}
                  className={'tri-btn ' + (isActive ? 'active' : '')}
                  style={{
                    '--tri-c': opt.c,
                    color: isActive ? '#fff' : opt.c,
                    background: isActive ? opt.c : 'transparent',
                    borderColor: opt.c
                  }}
                  onClick={()=>set('triage')(isActive ? '' : opt.k.toLowerCase())}
                  title={opt.k}
                >{opt.k.slice(0,3)}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="main">
        {/* ----- LEFT COLUMN: Body Diagram + Mechanism ----- */}
        <div className="col">
          <div className="scrollable">
            <div className="panel">
              <div className="panel-h">
                <span className="tick"></span><b>INJURY MAP</b>
                <span className="right">click body to mark · {state.injuries.length} marks · {activeTQs} TQ</span>
              </div>
              <BodyDiagram
                injuries={state.injuries}
                setInjuries={set('injuries')}
                tourniquets={state.tourniquets}
                setTourniquets={set('tourniquets')}
                burnedRegions={state.burnedRegions || []}
                setBurnedRegions={set('burnedRegions')}
                weightKg={state.weight}
              />
            </div>
            <div className="panel">
              <div className="panel-h"><span className="tick"></span><b>MECHANISM OF INJURY</b></div>
              <div className="panel-body">
                <div className="chips">
                  {MECHANISMS.map(m => (
                    <div key={m}
                      className={'chip ' + (state.mechanism.includes(m) ? 'active' : '')}
                      onClick={()=>toggleMechanism(m)}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----- CENTER COLUMN: Vitals + Notes ----- */}
        <div className="col">
          <div className="scrollable">
            <div className="panel">
              <div className="panel-h">
                <span className="tick"></span><b>SIGNS &amp; SYMPTOMS · LIVE</b>
                <span className="right">click any tile or cell to edit · latest: {lastVital.time || '—'}</span>
              </div>
              <VitalsPanel
                vitals={state.vitals}
                setVitals={set('vitals')}
                draft={state.draftVitals || { hr:'', sbp:'', dbp:'', rr:'', spo2:'', pain:'' }}
                setDraft={set('draftVitals')}
                avpu={state.avpu}
                setAVPU={set('avpu')}
                showSparklines={t.showSparklines}
              />
            </div>

            <div className="panel">
              <div className="panel-h"><span className="tick"></span><b>TQ &amp; MED · TIMELINE</b></div>
              <Timeline state={state} setState={setState} />
            </div>

            <div className="panel">
              <div className="panel-h"><span className="tick"></span><b>FIELD NOTES · MIST</b>
                <span className="right">auto-fills as data is entered</span>
              </div>
              <MistPanel state={state} setNotes={set('notes')} notes={state.notes}/>
            </div>
          </div>
        </div>

        {/* ----- RIGHT COLUMN: Tabs ----- */}
        <div className="col">
          <div className="tabs">
            {[
              ['treatments', 'Tx'],
              ['meds', 'Meds'],
              ['drip', 'Drip'],
              ['blood', 'Blood'],
              ['ref', 'Ref']
            ].map(([k, l]) => (
              <button key={k} className={tab===k ? 'active':''} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          {tab === 'treatments' && <TreatmentsTab interventions={state.interventions} setInterventions={set('interventions')} />}
          {tab === 'meds'       && <MedsTab medsGiven={state.medsGiven} setMedsGiven={set('medsGiven')} weight={state.weight} />}
          {tab === 'drip'       && <DripCalcTab patientKgInit={state.weight} />}
          {tab === 'blood'      && <BloodTab bloodType={state.bloodType} setBloodType={set('bloodType')} fluidsGiven={state.fluidsGiven} setFluidsGiven={set('fluidsGiven')} />}
          {tab === 'ref'        && <RefTab />}
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className="statusbar">
        <div className="seg"><span>●</span><b style={{color:'var(--op)'}}>SECURE</b></div>
        <div className="seg">PT <b>{state.name}</b></div>
        <div className="seg">EVAC <b style={{
          color: state.evac==='urgent'?'var(--crit)':state.evac==='priority'?'var(--amber)':'var(--op)'
        }}>{state.evac.toUpperCase() || '—'}</b></div>
        <div className="seg">TQ <b>{activeTQs}/4</b></div>
        <div className="seg">VITALS <b>{state.vitals.length} rec</b></div>
        <div className="seg">MEDS <b>{state.medsGiven.length}</b></div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px'}}>
          <button
            className="tweaks-btn"
            onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
            title="Open Tweaks panel"
          >
            <span className="tweaks-btn-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <line x1="3" y1="4" x2="13" y2="4"/>
                <line x1="3" y1="8" x2="13" y2="8"/>
                <line x1="3" y1="12" x2="13" y2="12"/>
                <circle cx="6" cy="4" r="1.6" fill="var(--bg-0)"/>
                <circle cx="10" cy="8" r="1.6" fill="var(--bg-0)"/>
                <circle cx="5" cy="12" r="1.6" fill="var(--bg-0)"/>
              </svg>
            </span>
            <span>TWEAKS</span>
          </button>
        </div>
        <div className="seg">
          {(t.timeMode === 'local' || t.timeMode === 'both') && <><b>{localTime}</b> LOC</>}
          {t.timeMode === 'both' && ' · '}
          {(t.timeMode === 'zulu' || t.timeMode === 'both') && <><b>{zuluTime}</b></>}
        </div>
        <div className="seg">
          <button onClick={() => {
            if (confirm('Reset all casualty data? This cannot be undone.')) {
              localStorage.removeItem(STORAGE_KEY);
              setState({ ...DEFAULT_STATE, name:'', last4:'', mechanism:[], injuries:[], vitals:[], medsGiven:[], interventions:[], fluidsGiven:[], notes:'', tourniquets:{rArm:{active:false,type:'',time:''},lArm:{active:false,type:'',time:''},rLeg:{active:false,type:'',time:''},lLeg:{active:false,type:'',time:''}} });
            }
          }} style={{background:'transparent', border:'none', color:'var(--fg-3)', fontFamily:'var(--mono)', fontSize:'10px', letterSpacing:'0.15em', cursor:'pointer', textTransform:'uppercase'}}>
            ⨯ NEW CASUALTY
          </button>
        </div>
      </div>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakSelect label="Mode" value={t.theme}
          options={[
            { value: 'tactical', label: 'Tactical (night)' },
            { value: 'day',      label: 'Day mode' },
            { value: 'paper',    label: 'DD1380 Paper' },
          ]}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSelect label="Accent" value={t.accent}
          options={[
            { value: 'op',    label: 'Operational Green' },
            { value: 'amber', label: 'Caution Amber' },
            { value: 'crit',  label: 'Critical Red' },
            { value: 'info',  label: 'Tactical Blue' },
          ]}
          onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Section labels" value={t.sectionStyle}
          options={[
            { value: 'tactical', label: 'Mono caps' },
            { value: 'dd1380',   label: 'Italic' },
          ]}
          onChange={(v) => setTweak('sectionStyle', v)} />

        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'roomy']}
          onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Grid backdrop" value={t.showGrid}
          onChange={(v) => setTweak('showGrid', v)} />
        <TweakToggle label="Vital sparklines" value={t.showSparklines}
          onChange={(v) => setTweak('showSparklines', v)} />

        <TweakSection label="Time" />
        <TweakRadio label="Display" value={t.timeMode}
          options={[
            { value: 'local', label: 'Local' },
            { value: 'zulu',  label: 'Zulu' },
            { value: 'both',  label: 'Both' },
          ]}
          onChange={(v) => setTweak('timeMode', v)} />

        <TweakSection label="Background · WebGL" />
        <TweakToggle label="WebGL field" value={t.webglField !== false}
          onChange={(v) => setTweak('webglField', v)} />
        <TweakToggle label="Glass panels" value={t.glassPanels !== false}
          onChange={(v) => setTweak('glassPanels', v)} />
        <TweakSlider label="Glass opacity" value={t.glassOpacity ?? 56}
          min={30} max={95} unit=" %"
          onChange={(v) => setTweak('glassOpacity', v)} />
        <TweakToggle label="Tint to patient acuity" value={t.bgCondition !== false}
          onChange={(v) => setTweak('bgCondition', v)} />

        <TweakSection label="Heart Sound" />
        <TweakToggle label="Sound" value={!!t.soundOn}
          onChange={(v) => {
            setTweak('soundOn', v);
            if (window.HeartAudio) { window.HeartAudio.setEnabled(v); if (v) window.HeartAudio.beat(); }
          }} />
        <TweakRadio label="Mode" value={t.soundMode || 'lubdub'}
          options={[
            { value: 'lubdub', label: 'Lub-Dub' },
            { value: 'beep',   label: 'Beep' },
          ]}
          onChange={(v) => { setTweak('soundMode', v); if (window.HeartAudio) { window.HeartAudio.setMode(v); if (t.soundOn) window.HeartAudio.beat(); } }} />
        <TweakSlider label="Volume" value={t.soundVolume ?? 55}
          min={0} max={100} unit=" %"
          onChange={(v) => setTweak('soundVolume', v)} />
      </TweaksPanel>

      {/* Separate drip & dosage calculator box (floating, with teaching mode) */}
      <window.DripDosageBox weight={state.weight} />
    </div>
  );
}

/* ---- Combined timeline of TQ + meds + vitals events ---- */
function Timeline({ state, setState }) {
  const events = [];
  state.medsGiven.forEach(m => events.push({
    t: m.time, k: 'med', label: m.name, sub: m.dose,
    onClear: () => setState(p => ({ ...p, medsGiven: p.medsGiven.filter(x => x.id !== m.id) }))
  }));
  state.fluidsGiven.forEach(m => events.push({
    t: m.time, k: 'fluid', label: m.type, sub: m.vol ? m.vol + ' mL' : '',
    onClear: () => setState(p => ({ ...p, fluidsGiven: p.fluidsGiven.filter(x => x.id !== m.id) }))
  }));
  state.vitals.forEach((v, idx) => events.push({
    t: v.time, k: 'vital',
    label: `HR ${v.hr} · BP ${v.sbp}/${v.dbp}`,
    sub: `RR ${v.rr} SpO₂ ${v.spo2}`,
    onClear: () => setState(p => ({ ...p, vitals: p.vitals.filter((_, i) => i !== idx) }))
  }));
  Object.entries(state.tourniquets).forEach(([k, tq]) => {
    if (tq.active && tq.time) {
      const side = { rArm:'R ARM', lArm:'L ARM', rLeg:'R LEG', lLeg:'L LEG' }[k];
      events.push({
        t: tq.time, k: 'tq', label: `TQ ${side}`, sub: [tq.type, tq.position].filter(Boolean).join(' · ') || 'applied',
        onClear: () => setState(p => ({
          ...p,
          tourniquets: { ...p.tourniquets, [k]: { active: false, type: '', time: '', position: '' } }
        }))
      });
    }
  });
  events.sort((a, b) => (a.t || '').localeCompare(b.t || ''));

  if (events.length === 0) {
    return <div style={{padding:'14px', fontFamily:'var(--mono)', fontSize:'11px', color:'var(--fg-3)'}}>No events yet.</div>;
  }

  // Visual timeline
  const times = events.map(e => parseTime(e.t)).filter(n => !isNaN(n));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const span = Math.max(1, t1 - t0);

  return (
    <div style={{padding:'4px 14px 14px'}}>
      <div style={{position:'relative', height: events.length * 26 + 30}}>
        {/* axis */}
        <div style={{position:'absolute', left:'72px', right:'24px', top:14, height:1, background:'var(--line-2)'}}></div>
        {/* tick labels */}
        <div style={{position:'absolute', left:'72px', right:'24px', top:0, display:'flex', justifyContent:'space-between', fontFamily:'var(--mono)', fontSize:'9px', color:'var(--fg-3)'}}>
          <span>{events[0]?.t || ''}</span>
          <span>{events[events.length-1]?.t || ''}</span>
        </div>
        {events.map((e, i) => {
          const tx = parseTime(e.t);
          const pct = isNaN(tx) ? 0 : ((tx - t0) / span) * 100;
          const color = e.k === 'tq' ? 'var(--op)'
                       : e.k === 'med' ? 'var(--amber)'
                       : e.k === 'fluid' ? 'var(--info)'
                       : 'var(--fg-2)';
          return (
            <div key={i} className="tl-row" style={{
              position:'absolute', top: 26 + i*22, left:0, right:0,
              display:'grid', gridTemplateColumns:'56px 1fr 22px',
              alignItems:'center', gap:'8px',
              fontFamily:'var(--mono)', fontSize:'11px'
            }}>
              <span style={{color:'var(--fg-2)', textAlign:'right'}}>{e.t || '----'}</span>
              <span style={{position:'relative', display:'block', height:'14px'}}>
                <span style={{
                  position:'absolute', top:'3px',
                  width:8, height:8, background: color, borderRadius: e.k==='tq'?'1px':'50%',
                  left: `calc(${pct}% - 4px)`,
                  boxShadow:`0 0 6px ${color}`
                }}></span>
                <span style={{position:'absolute', left:0, top:'-2px', color:'var(--fg-0)', whiteSpace:'nowrap'}}>
                  {e.label} <span style={{color:'var(--fg-2)'}}>· {e.sub}</span>
                </span>
              </span>
              <button className="tl-clear" onClick={e.onClear} title="Clear this event">×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseTime(t) {
  if (!t) return NaN;
  const s = String(t).replace(':','');
  const h = parseInt(s.slice(0,2));
  const m = parseInt(s.slice(2,4));
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

/* ---- Build MIST text from current casualty state ---- */
function buildMIST(state) {
  // M — Mechanism
  const M = state.mechanism && state.mechanism.length
    ? state.mechanism.join(' · ')
    : '—';

  // I — Injuries (count by type and view) + tourniquets
  const counts = { gsw: 0, burn: 0, frac: 0, shrap: 0 };
  (state.injuries || []).forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
  const front = (state.injuries || []).filter(i => i.view === 'front').length;
  const back  = (state.injuries || []).filter(i => i.view === 'back').length;
  const injParts = [];
  if (counts.gsw)   injParts.push(`${counts.gsw}× GSW`);
  if (counts.burn || (state.burnedRegions && state.burnedRegions.length)) {
    const burnTbsa = (typeof estimateBurnTBSA === 'function') ? estimateBurnTBSA(state.injuries, state.burnedRegions) : 0;
    if (burnTbsa > 0) injParts.push(`Burn ~${burnTbsa.toFixed(1)}% TBSA`);
    else if (counts.burn) injParts.push(`${counts.burn}× Burn`);
  }
  if (counts.frac)  injParts.push(`${counts.frac}× Frac`);
  if (counts.shrap) injParts.push(`${counts.shrap}× Shrap`);
  if (front || back) injParts.push(`(ant ${front}/post ${back})`);
  const tqActive = Object.entries(state.tourniquets || {})
    .filter(([_,t]) => t.active)
    .map(([k,t]) => {
      const side = { rArm:'R arm', lArm:'L arm', rLeg:'R leg', lLeg:'L leg' }[k];
      return `TQ ${side}${t.type ? ' '+t.type : ''}${t.position ? ' ('+t.position+')' : ''}${t.time ? ' @'+t.time : ''}`;
    });
  if (tqActive.length) injParts.push(...tqActive);
  if (state.acuteFindings && state.acuteFindings.length) {
    injParts.unshift(state.acuteFindings.join(' · '));
  }
  const I = injParts.length ? injParts.join(', ') : '—';

  // S — Signs (latest vital + AVPU). Prefer the live draft if it has data; else last recorded.
  const draft = state.draftVitals || {};
  const draftHasData = !!(draft.hr || draft.sbp || draft.dbp || draft.rr || draft.spo2 || draft.pain);
  const v = draftHasData
    ? { ...draft, time: '' }
    : (state.vitals || [])[state.vitals.length - 1];
  let S = '—';
  if (v) {
    const bits = [];
    if (v.hr)  bits.push(`HR ${v.hr}`);
    if (v.sbp || v.dbp) bits.push(`BP ${v.sbp||'?'}/${v.dbp||'?'}`);
    if (v.rr)  bits.push(`RR ${v.rr}`);
    if (v.spo2)bits.push(`SpO₂ ${v.spo2}`);
    if (v.pain)bits.push(`Pain ${v.pain}/10`);
    if (state.avpu) bits.push(`AVPU ${state.avpu}`);
    S = (v.time ? `@${v.time} ` : '') + bits.join(' · ');
  } else if (state.avpu) {
    S = `AVPU ${state.avpu}`;
  }

  // T — Treatments (interventions + meds + fluids)
  const tx = [];
  (state.interventions || []).forEach(s => {
    const [, label] = s.split(':');
    if (label) tx.push(label);
  });
  (state.medsGiven || []).forEach(m => {
    tx.push(`${m.name} ${m.dose}${m.time ? ' @'+m.time : ''}`);
  });
  (state.fluidsGiven || []).forEach(f => {
    tx.push(`${f.type}${f.vol ? ' '+f.vol+'mL' : ''}${f.time ? ' @'+f.time : ''}`);
  });
  const T = tx.length ? tx.join('; ') : '—';

  return { M, I, S, T };
}

/* ---- MIST auto-fill panel ---- */
function MistPanel({ state, notes, setNotes }) {
  const mist = buildMIST(state);
  const fullText = `M: ${mist.M}\nI: ${mist.I}\nS: ${mist.S}\nT: ${mist.T}`;
  const copyToNotes = () => {
    const sep = notes && notes.trim() ? '\n\n' : '';
    setNotes((notes || '') + sep + `--- MIST @ ${nowHHMM()} ---\n` + fullText);
  };
  return (
    <div style={{padding:'8px 14px 14px'}}>
      <div className="mist-grid">
        {[
          ['M', 'Mechanism',  mist.M],
          ['I', 'Injuries',   mist.I],
          ['S', 'Signs',      mist.S],
          ['T', 'Treatments', mist.T],
        ].map(([k, label, val]) => (
          <div className="mist-row" key={k}>
            <span className="mist-k"><b>{k}</b><span className="mist-lbl">{label}</span></span>
            <span className="mist-v">{val}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:'6px', marginTop:'10px', alignItems:'center'}}>
        <button className="mist-btn" onClick={copyToNotes} title="Snapshot current MIST to narrative notes">
          ⇣ APPEND TO NOTES
        </button>
        <span style={{flex:1}}></span>
        <span className="muted mono tiny" style={{letterSpacing:'0.1em'}}>NARRATIVE</span>
      </div>
      <textarea
        className="notes"
        value={notes}
        onChange={e=>setNotes(e.target.value)}
        placeholder="Free-text narrative. Click APPEND TO NOTES to stamp current MIST + time."
        style={{marginTop:'4px'}}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
