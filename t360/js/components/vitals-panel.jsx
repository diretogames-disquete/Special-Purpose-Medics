/* Vitals timeline + log */
/* global React */

function Sparkline({ data, color = 'var(--op)', width = 90, height = 24 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1 || 1)) * width;
        const y = height - ((v - min) / range) * height;
        return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
      })}
    </svg>
  );
}

function VitalTile({ label, value, unit, sparkData, status, onChange, editable, placeholder, step = 1, min = 0, max = 999, defaultStart = 0 }) {
  const [editing, setEditing] = React.useState(false);
  const [tmp, setTmp] = React.useState('');
  const start = () => {
    if (!editable) return;
    setTmp(value === '—' || value == null ? '' : String(value));
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    onChange && onChange(tmp);
  };
  const bump = (delta) => {
    if (!editable || !onChange) return;
    const n = Number(value);
    let v = isNaN(n) || value === '—' || value === '' || value == null ? defaultStart : n + delta;
    if (v < min) v = min;
    if (v > max) v = max;
    onChange(String(v));
  };
  return (
    <div className={'vital ' + (status || '')}>
      <div className="v-lbl">{label}</div>
      {editing ? (
        <div className="v-val">
          <input autoFocus value={tmp}
            onChange={e=>setTmp(e.target.value)}
            onBlur={commit}
            onKeyDown={e=>{ if (e.key==='Enter') commit(); if (e.key==='Escape') setEditing(false); }}
            style={{
              width: '70%', background: 'transparent',
              border: '1px solid var(--accent)', borderRadius: 2,
              color: 'inherit', font: 'inherit', padding: '0 4px', outline: 'none'
            }}/>
          <span className="u">{unit}</span>
        </div>
      ) : (
        <div className="v-val" onClick={start}
          style={{cursor: editable ? 'text' : 'default'}}
          title={editable ? 'click to type · ▲▼ to step' : ''}>
          {value}<span className="u">{unit}</span>
        </div>
      )}
      <div className="v-spark">
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData}
            color={status==='crit' ? 'var(--crit)' : status==='warn' ? 'var(--amber)' : 'var(--op)'} />
        )}
      </div>
      {editable && (
        <div className="v-step">
          <button onClick={()=>bump(step)}  aria-label={`${label} up`}>▲</button>
          <button onClick={()=>bump(-step)} aria-label={`${label} down`}>▼</button>
        </div>
      )}
    </div>
  );
}

// Shared AudioContext for ECG beeps — created on first user gesture
// (browsers block audio playback until then).
let __ecgAudioCtx = null;
function __getEcgAudioCtx() {
  if (__ecgAudioCtx) return __ecgAudioCtx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    __ecgAudioCtx = new AC();
  } catch (e) { return null; }
  return __ecgAudioCtx;
}
if (typeof window !== 'undefined' && !window.__ecgAudioUnlockBound) {
  window.__ecgAudioUnlockBound = true;
  const unlock = () => {
    const ctx = __getEcgAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  };
  window.addEventListener('pointerdown', unlock, { once: false, passive: true });
  window.addEventListener('keydown', unlock, { once: false, passive: true });
}

// Patient-monitor "pip": a soft, slightly-detuned sine pair with a quick
// pitch-drop envelope — closer to a hospital pulse oximeter than a square beep.
function ecgPip(baseFreq = 1000) {
  const ctx = __getEcgAudioCtx();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const dur = 0.085;

  // Body — sine with a tiny pitch dip for that "boop" character
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(baseFreq, t);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, t + dur);

  // Subtle upper harmonic for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(baseFreq * 2, t);
  osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.76, t + dur);

  const harmGain = ctx.createGain();
  harmGain.gain.value = 0.18;

  // Envelope — fast attack, exponential decay
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  // Lowpass softens the edge
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  lp.Q.value = 0.4;

  osc1.connect(env);
  osc2.connect(harmGain).connect(env);
  env.connect(lp).connect(ctx.destination);
  osc1.start(t); osc2.start(t);
  osc1.stop(t + dur + 0.02); osc2.stop(t + dur + 0.02);
}

function ECGWave({ bpm, status, muted }) {
  const gRef = React.useRef(null);
  const mutedRef = React.useRef(muted);
  mutedRef.current = muted;
  const statusRef = React.useRef(status);
  statusRef.current = status;

  // Real ECG physiology: the P / QRS / T complex keeps a roughly constant
  // width (~400ms). Only the flat baseline (TP segment) between beats
  // stretches at low rates and compresses at high rates. When the beat
  // gets so short the complex would overlap, we scale the complex down
  // (mirrors real-world QT-shortening at tachycardia).
  const safeBpm = Math.max(20, Math.min(220, Number(bpm) || 80));
  const PAPER_SPEED = 60; // viewBox units per second
  const beatW = (60 / safeBpm) * PAPER_SPEED;
  const viewW = 120;
  const beats = Math.max(6, Math.ceil((viewW * 3) / beatW) + 2);

  // Nominal complex layout (in seconds, relative to beat start):
  const NOM = {
    P_START: 0.04, P_END: 0.12,
    QRS_S:   0.18, QRS_E: 0.26,
    T_S:     0.30, T_E:   0.44,
    TOTAL:   0.46,
  };
  const MIN_BASELINE = 0.06; // seconds — minimum flat TP gap so beats never touch
  const beatSec = 60 / safeBpm;
  const complexScale = Math.min(1, Math.max(0.55, (beatSec - MIN_BASELINE) / NOM.TOTAL));
  const s = (sec) => sec * complexScale * PAPER_SPEED; // → viewBox units
  const P_START = s(NOM.P_START);
  const P_END   = s(NOM.P_END);
  const QRS_S   = s(NOM.QRS_S);
  const QRS_E   = s(NOM.QRS_E);
  const T_S     = s(NOM.T_S);
  const T_E     = s(NOM.T_E);
  const R_TIME  = s(NOM.QRS_S + 0.03);

  // Keep current rate accessible to the long-running RAF without restarting it
  // each time bpm changes (so visual scroll + beep cadence stay in lock-step).
  const beatSecRef = React.useRef(beatSec);
  const beatWRef = React.useRef(beatW);
  const rTimeRef = React.useRef(R_TIME);
  beatSecRef.current = beatSec;
  beatWRef.current   = beatW;
  rTimeRef.current   = R_TIME;

  React.useEffect(() => {
    let raf;
    let last = performance.now();
    let offset = 0;
    let timeSinceBeep = 0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); // clamp big tab-switch gaps
      last = now;
      const bW = beatWRef.current;
      const bSec = beatSecRef.current;
      offset = (offset + PAPER_SPEED * dt) % bW;

      // Rate-locked beep cadence — independent of render rate or BPM changes.
      timeSinceBeep += dt;
      if (timeSinceBeep >= bSec) {
        timeSinceBeep -= bSec;
        if (timeSinceBeep > bSec) timeSinceBeep = 0; // resync if BPM jumped fast
        if (!mutedRef.current) {
          const st = statusRef.current;
          const freq = st === 'crit' ? 880 : st === 'warn' ? 950 : 1040;
          ecgPip(freq);
        }
      }

      if (gRef.current) {
        gRef.current.setAttribute('transform', `translate(${-offset} 0)`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // single long-running loop

  // Build one beat at offset x. The complex sits at the start of the beat,
  // followed by a flat TP segment until the next beat begins.
  const onebeat = (x0) => {
    const x = x0;
    const qSm = s(0.01); // small Q dip
    const qDip = s(0.02);
    const rUp  = s(0.03);
    return (
      `M ${x} 15 L ${x + P_START} 15 ` +
      `Q ${x + (P_START + P_END) / 2} 11.5 ${x + P_END} 15 ` +
      `L ${x + QRS_S} 15 ` +
      `L ${x + QRS_S + qSm} 16.5 ` +
      `L ${x + QRS_S + qDip} 2.5 ` +
      `L ${x + QRS_S + rUp} 27 ` +
      `L ${x + QRS_E} 15 ` +
      `L ${x + T_S} 15 ` +
      `Q ${x + (T_S + T_E) / 2} 10 ${x + T_E} 15 ` +
      `L ${x + beatW} 15`
    );
  };

  let d = '';
  for (let i = 0; i < beats; i++) d += onebeat(i * beatW) + ' ';

  return (
    <div className="ecg-wrap" aria-hidden="true">
      <svg viewBox={`0 0 ${viewW} 30`} preserveAspectRatio="none" className="ecg-wave">
        <g ref={gRef}>
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function ECGMuteButton({ muted, onToggle }) {
  return (
    <button
      type="button"
      className={'ecg-mute ' + (muted ? 'is-muted' : '')}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-label={muted ? 'Unmute heart-rate tone' : 'Mute heart-rate tone'}
      title={muted ? 'Unmute tone' : 'Mute tone'}
      tabIndex="-1"
    >
      {muted ? (
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
          <path d="M2 6h2.5L7.5 3.5v9L4.5 10H2z" fill="currentColor"/>
          <path d="M10 6l4 4M14 6l-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
          <path d="M2 6h2.5L7.5 3.5v9L4.5 10H2z" fill="currentColor"/>
          <path d="M10 5.5c.9.8 1.3 1.7 1.3 2.5 0 .8-.4 1.7-1.3 2.5M12 3.5c1.7 1.3 2.4 2.9 2.4 4.5 0 1.6-.7 3.2-2.4 4.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

function PulseTile({ hr, setField, sparkData, status }) {
  const onChange = setField('hr');
  const [muted, setMuted] = React.useState(() => {
    try { return localStorage.getItem('tccc-ecg-muted') === '1'; } catch (e) { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('tccc-ecg-muted', muted ? '1' : '0'); } catch (e) {}
  }, [muted]);
  const bump = (delta) => {
    const n = Number(hr);
    let v = isNaN(n) || hr === '' || hr == null ? 80 : n + delta;
    if (v < 20) v = 20;
    if (v > 250) v = 250;
    onChange(String(v));
  };
  return (
    <div className={'vital pulse-tile ' + (status || '')}>
      <div className="v-lbl">PULSE</div>
      <div className="v-val">
        <input
          className="hr-input"
          value={hr || ''}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="—"
          inputMode="numeric"
          maxLength="3"
          aria-label="Heart rate"
        />
        <span className="u">bpm</span>
      </div>
      <ECGWave bpm={Number(hr)} status={status} muted={muted} />
      <div className="v-step v-step-with-mute">
        <button onClick={()=>bump(1)} aria-label="HR up" tabIndex="-1">▲</button>
        <button onClick={()=>bump(-1)} aria-label="HR down" tabIndex="-1">▼</button>
        <ECGMuteButton muted={muted} onToggle={() => setMuted(m => !m)} />
      </div>
    </div>
  );
}

function BPTile({ draft, setDraft, sparkData, status }) {
  const sbp = draft.sbp || '';
  const dbp = draft.dbp || '';

  // Functional setters — always read the latest prev to avoid stale closures
  const setS = (v) => setDraft(prev => ({ ...prev, sbp: v.replace(/[^0-9]/g, '') }));
  const setD = (v) => setDraft(prev => ({ ...prev, dbp: v.replace(/[^0-9]/g, '') }));
  const bumpS = (delta) => setDraft(prev => {
    const cur = prev.sbp;
    const n = Number(cur);
    const v = (isNaN(n) || cur === '' || cur == null) ? 100 : Math.max(40, Math.min(260, n + delta));
    return { ...prev, sbp: String(v) };
  });
  const bumpD = (delta) => setDraft(prev => {
    const cur = prev.dbp;
    const n = Number(cur);
    const v = (isNaN(n) || cur === '' || cur == null) ? 60 : Math.max(20, Math.min(160, n + delta));
    return { ...prev, dbp: String(v) };
  });

  // MAP — live
  const sN = Number(sbp), dN = Number(dbp);
  const mapVal = (!isNaN(sN) && !isNaN(dN) && sN > 0 && dN > 0)
    ? Math.round(dN + (sN - dN) / 3)
    : null;
  const mapStatus = mapVal == null ? 'idle'
    : mapVal < 60 ? 'crit'
    : mapVal < 65 ? 'warn'
    : mapVal > 110 ? 'warn'
    : 'ok';

  const sbpPct = !isNaN(sN) && sN > 0 ? Math.max(0, Math.min(100, ((sN - 40) / (220 - 40)) * 100)) : null;
  const dbpPct = !isNaN(dN) && dN > 0 ? Math.max(0, Math.min(100, ((dN - 20) / (140 - 20)) * 100)) : null;

  return (
    <div className={'vital bp-tile ' + (status || '')}>
      <div className="v-lbl">BP <span className="bp-range-hint">SYS / DIA · mmHg</span></div>
      <div className="bp-pair">
        <div className="bp-col">
          <span className="bp-col-lbl">SYS</span>
          <input
            className="bp-input"
            value={sbp}
            onChange={e => setS(e.target.value)}
            placeholder="—"
            inputMode="numeric"
            maxLength="3"
            aria-label="Systolic"
          />
          <div className="bp-step">
            <button type="button" onClick={()=>bumpS(2)} tabIndex="-1">▲</button>
            <button type="button" onClick={()=>bumpS(-2)} tabIndex="-1">▼</button>
          </div>
        </div>
        <span className="bp-slash">/</span>
        <div className="bp-col">
          <span className="bp-col-lbl">DIA</span>
          <input
            className="bp-input"
            value={dbp}
            onChange={e => setD(e.target.value)}
            placeholder="—"
            inputMode="numeric"
            maxLength="3"
            aria-label="Diastolic"
          />
          <div className="bp-step">
            <button type="button" onClick={()=>bumpD(2)} tabIndex="-1">▲</button>
            <button type="button" onClick={()=>bumpD(-2)} tabIndex="-1">▼</button>
          </div>
        </div>
      </div>

      {/* Range bar */}
      <div className="bp-range">
        <div className="bp-range-track">
          <div className="bp-zone bp-zone-crit-low" />
          <div className="bp-zone bp-zone-warn-low" />
          <div className="bp-zone bp-zone-ok" />
          <div className="bp-zone bp-zone-warn-high" />
          <div className="bp-zone bp-zone-crit-high" />
          {sbpPct != null && <div className="bp-marker bp-marker-s" style={{left:`${sbpPct}%`}} title={`SBP ${sbp}`} />}
          {dbpPct != null && <div className="bp-marker bp-marker-d" style={{left:`${dbpPct}%`}} title={`DBP ${dbp}`} />}
        </div>
        <div className="bp-range-ticks">
          <span>40</span><span>90</span><span>120</span><span>160</span><span>220</span>
        </div>
      </div>

      {/* MAP */}
      <div className={'bp-map bp-map-' + mapStatus}>
        <span className="bp-map-lbl">MAP</span>
        <span className="bp-map-val">{mapVal != null ? mapVal : '—'}<span className="bp-map-u"> mmHg</span></span>
        <span className="bp-map-note">
          {mapVal == null ? 'target 65+ for perfusion'
            : mapVal < 60 ? 'low — perfusion risk'
            : mapVal < 65 ? 'borderline'
            : mapVal > 110 ? 'high'
            : 'adequate perfusion'}
        </span>
      </div>

      <div className="v-spark">
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData}
            color={status==='crit' ? 'var(--crit)' : status==='warn' ? 'var(--amber)' : 'var(--op)'} />
        )}
      </div>
    </div>
  );
}

function classifyHR(v) {
  if (!v) return null;
  if (v < 50 || v > 120) return 'crit';
  if (v < 60 || v > 100) return 'warn';
  return 'ok';
}
function classifySBP(v) {
  if (!v) return null;
  if (v < 90 || v > 180) return 'crit';
  if (v < 100 || v > 160) return 'warn';
  return 'ok';
}
function classifyRR(v) {
  if (!v) return null;
  if (v < 10 || v > 24) return 'crit';
  if (v < 12 || v > 20) return 'warn';
  return 'ok';
}
function classifySpO2(v) {
  if (!v) return null;
  if (v < 90) return 'crit';
  if (v < 94) return 'warn';
  return 'ok';
}
function classifyPain(v) {
  if (v == null) return null;
  if (v >= 7) return 'crit';
  if (v >= 4) return 'warn';
  return 'ok';
}

function VitalsPanel({ vitals, setVitals, draft, setDraft, avpu, setAVPU, showSparklines = true }) {
  const series = (k) => showSparklines ? vitals.map(v => Number(v[k])).filter(n => !isNaN(n) && n > 0) : [];

  const setField = (k) => (v) => setDraft(prev => ({ ...prev, [k]: v }));

  // Recording: log + reset draft + start countdown timers
  const [lastRecordedAt, setLastRecordedAt] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (lastRecordedAt == null) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [lastRecordedAt]);

  const recordVitals = () => {
    const entry = { time: nowHHMM(), ...draft };
    setVitals(prev => [...prev, entry]);
    setDraft({ hr:'', sbp:'', dbp:'', rr:'', spo2:'', pain:'' });
    setLastRecordedAt(Date.now());
  };
  const dismissReminders = () => setLastRecordedAt(null);

  const hasAnyDraft = !!(draft.hr || draft.sbp || draft.dbp || draft.rr || draft.spo2 || draft.pain);

  // Countdown helpers
  const renderCountdown = (mins) => {
    if (lastRecordedAt == null) return null;
    const totalMs = mins * 60 * 1000;
    const elapsed = Date.now() - lastRecordedAt;
    const remaining = totalMs - elapsed;
    let cls = 'cd';
    let txt;
    if (remaining > 0) {
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      txt = `${m}:${String(s).padStart(2,'0')}`;
      if (remaining < 30000) cls += ' cd-warn';
    } else {
      const over = Math.abs(remaining);
      const m = Math.floor(over / 60000);
      const s = Math.floor((over % 60000) / 1000);
      txt = `+${m}:${String(s).padStart(2,'0')}`;
      cls += ' cd-due';
    }
    return (
      <div className={cls} key={mins}>
        <span className="cd-lbl">{mins} MIN</span>
        <span className="cd-val">{txt}</span>
      </div>
    );
  };

  const addRow = () => {
    setVitals(prev => [...prev, { time: nowHHMM(), hr: '', sbp: '', dbp: '', rr: '', spo2: '', pain: '' }]);
  };

  const updateCell = (i, k, val) => {
    setVitals(prev => prev.map((row, idx) => idx === i ? { ...row, [k]: val } : row));
  };

  const removeRow = (i) => {
    setVitals(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="vitals-grid">
        <PulseTile hr={draft.hr} setField={setField} sparkData={series('hr')} status={classifyHR(Number(draft.hr))} />
        <BPTile draft={draft} setDraft={setDraft}
          sparkData={series('sbp')} status={classifySBP(Number(draft.sbp))} />
        <VitalTile label="Resp" value={draft.rr || '—'} unit=" /min" editable
          onChange={setField('rr')}
          step={1} min={4} max={60} defaultStart={16}
          sparkData={series('rr')} status={classifyRR(Number(draft.rr))} />
        <VitalTile label="SpO₂" value={draft.spo2 || '—'} unit=" %" editable
          onChange={setField('spo2')}
          step={1} min={50} max={100} defaultStart={97}
          sparkData={series('spo2')} status={classifySpO2(Number(draft.spo2))} />
        <VitalTile label="Pain" value={draft.pain || '—'} unit=" /10" editable
          onChange={setField('pain')}
          step={1} min={0} max={10} defaultStart={0}
          sparkData={series('pain')} status={classifyPain(Number(draft.pain))} />
        <div className="vital avpu-tile">
          <div className="v-lbl">AVPU · Mental Status</div>
          <div className="avpu">
            {['A','V','P','U'].map(x => (
              <button key={x} className={avpu===x ? 'active':''} onClick={()=>setAVPU(x)}>{x}</button>
            ))}
          </div>
          <div className="tiny muted mono" style={{marginTop:'4px', letterSpacing:'0.05em'}}>
            {{A:'Alert',V:'Responds to verbal',P:'Responds to pain',U:'Unresponsive'}[avpu] || 'Set status'}
          </div>
        </div>
      </div>

      {/* Record vitals action bar */}
      <div className="record-bar">
        <div className="rb-hint">
          {hasAnyDraft
            ? <>Reading staged · click <b>RECORD</b> to log at {nowHHMM()}</>
            : lastRecordedAt != null
              ? <>Logged at {new Date(lastRecordedAt).toTimeString().slice(0,5).replace(':','')} · awaiting next reading</>
              : <>Step or type values above to stage a reading.</>}
        </div>
        {lastRecordedAt != null && (
          <div className="cd-row" title="Re-check reminders — click × to dismiss" key={tick}>
            {renderCountdown(3)}
            {renderCountdown(5)}
            <button className="cd-x" onClick={dismissReminders} title="Dismiss reminders">×</button>
          </div>
        )}
        <button
          className="record-btn"
          disabled={!hasAnyDraft}
          onClick={recordVitals}
          title="Append the current values to the vital log and start re-check reminders"
        >
          ▶ RECORD VITALS
        </button>
      </div>

      <div className="panel">
        <div className="panel-h"><span className="tick"></span><b>VITAL LOG</b>
          <span className="right">{vitals.length} recorded · click cell to edit</span>
        </div>
        <div style={{maxHeight:'180px', overflowY:'auto'}}>
          <table className="vlog">
            <thead>
              <tr>
                <th>Time</th>
                <th>HR</th>
                <th>BP</th>
                <th>RR</th>
                <th>SpO₂</th>
                <th>Pain</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vitals.map((row, i) => (
                <tr key={i}>
                  <td className="time">
                    <input value={row.time} onChange={e=>updateCell(i,'time',e.target.value)} style={{width:'48px'}}/>
                  </td>
                  <td><input value={row.hr} onChange={e=>updateCell(i,'hr',e.target.value)} style={{width:'40px'}}/></td>
                  <td>
                    <input value={row.sbp} onChange={e=>updateCell(i,'sbp',e.target.value)} style={{width:'34px'}}/>
                    /
                    <input value={row.dbp} onChange={e=>updateCell(i,'dbp',e.target.value)} style={{width:'34px'}}/>
                  </td>
                  <td><input value={row.rr} onChange={e=>updateCell(i,'rr',e.target.value)} style={{width:'34px'}}/></td>
                  <td><input value={row.spo2} onChange={e=>updateCell(i,'spo2',e.target.value)} style={{width:'40px'}}/></td>
                  <td><input value={row.pain} onChange={e=>updateCell(i,'pain',e.target.value)} style={{width:'34px'}}/></td>
                  <td>
                    <button onClick={()=>removeRow(i)} style={{background:'transparent',border:'none',color:'var(--fg-3)',cursor:'pointer',fontFamily:'var(--mono)'}}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="7" style={{textAlign:'center', padding:'8px'}}>
                  <button onClick={addRow} style={{background:'transparent',border:'1px dashed var(--line-2)',color:'var(--fg-2)',fontFamily:'var(--mono)',fontSize:'10px',letterSpacing:'0.15em',padding:'4px 14px',cursor:'pointer',borderRadius:'2px',textTransform:'uppercase'}}>+ Add Blank Row</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VitalsPanel });
