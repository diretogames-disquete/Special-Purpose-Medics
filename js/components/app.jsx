/* global React, ReactDOM */
const { useState, useEffect, useMemo, useCallback } = React;
const { ScenarioIndex, ScenarioMain, RightPanel } = window;
const useTweaks = window.useTweaks;

// =================================================================
// TOP BAR
// =================================================================
function TopBar({ s, total, idx, onOpenTweaks, soundEnabled, tweaksOpen, view, onToggleDocs }) {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const z = (n) => String(n).padStart(2, '0');
  return (
    <div className="topbar">
      <span className="brand">
        <span className="dot"></span>
        PFC · CASUALTY CARE
      </span>
      <span className="sep"></span>
      <span>SUBJECT AREA 20 · PROLONGED CASUALTY CARE</span>
      <span className="sep"></span>
      <span style={{ color: 'var(--ink)', letterSpacing: '0.14em' }}>
        SCENARIO {z(idx + 1)} / {z(total)}
      </span>
      <span className="sep"></span>
      <span style={{ color: 'var(--info)', letterSpacing: '0.12em', textTransform: 'none', fontSize: 11 }}>
        {s.ctl} · {s.title}
      </span>

      <span className="right">
        <span className="pill live">23 SCENARIOS · 2002–2025</span>
        <button
          className={'topbar-btn docs' + (view === 'docs' ? ' on' : '')}
          onClick={onToggleDocs}
          title={view === 'docs' ? 'Return to monitor view' : 'Open scenario documentation sheets'}
        >
          <span className="ico">▣</span>
          <span>{view === 'docs' ? 'Monitor' : 'Docs'}</span>
        </button>
        <button
          className={'topbar-btn tweaks' + (tweaksOpen ? ' on' : '')}
          onClick={onOpenTweaks}
          title="Open Tweaks panel"
        >
          <span className="ico">⚙</span>
          <span>Tweaks</span>
        </button>
        <span className="clock-sub">ZULU</span>
        <span className="clock">
          {z(clock.getUTCHours())}:{z(clock.getUTCMinutes())}:{z(clock.getUTCSeconds())}
        </span>
      </span>
    </div>
  );
}

// =================================================================
// FOOTER STRIP
// =================================================================
function FootStrip({ s, onPrev, onNext, idx, total }) {
  return (
    <div className="foot-strip">
      <span>23 SCENARIOS · 2002–2025</span>
      <span style={{ color: 'var(--ink-mute)' }}>·</span>
      <span>Socratic Teaching</span>
      <span style={{ color: 'var(--ink-mute)' }}>·</span>
      <span>Universal Design for Learning</span>
      <span className="right">
        <span><span className="kbd">←</span> <span className="kbd">→</span> NAVIGATE</span>
        <span><span className="kbd">/</span> FILTER</span>
        <button className="kbd" style={{ cursor: 'pointer', minWidth: 60 }} onClick={onPrev} disabled={idx === 0}>← PREV</button>
        <button className="kbd" style={{ cursor: 'pointer', minWidth: 60 }} onClick={onNext} disabled={idx === total - 1}>NEXT →</button>
      </span>
    </div>
  );
}

// =================================================================
// QUICK REFERENCE BOTTOM ROW
// =================================================================
function QuickReference() {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="marker">▮</span>
        <span>PCC Quick Reference</span>
        <span className="right">CROSS-SCENARIO · ALWAYS-ON</span>
      </div>
      <div className="panel-body">
        <div className="quickref-grid">
          <div className="quickref">
            <div className="qr-head">4-2-1 Rule · Maintenance Fluids</div>
            <ul className="qr-list">
              <li><b>4 mL/kg/hr</b> for first 10 kg</li>
              <li><b>2 mL/kg/hr</b> for next 10 kg</li>
              <li><b>1 mL/kg/hr</b> for each kg thereafter</li>
              <li>80 kg → <span className="hi">120 mL/hr</span></li>
            </ul>
          </div>
          <div className="quickref">
            <div className="qr-head">ETCO₂ Targets</div>
            <ul className="qr-list">
              <li>TBI patients: <span className="hi">35–40 mmHg</span></li>
              <li>Acute herniation: brief <span className="hi warn">25–30</span></li>
              <li>High ETCO₂ → ↑ RR or TV</li>
              <li>Low ETCO₂ → ↓ RR or TV</li>
            </ul>
          </div>
          <div className="quickref">
            <div className="qr-head">Sepsis · Hour-1 Bundle</div>
            <ul className="qr-list">
              <li><b>30 mL/kg</b> crystalloid w/in 3 h</li>
              <li>Broad-spec abx w/in <span className="hi warn">1 hour</span></li>
              <li>Source control (drain collections)</li>
              <li>Vasopressors if hypotensive despite fluids</li>
            </ul>
          </div>
          <div className="quickref">
            <div className="qr-head">RASS Sedation Scale</div>
            <ul className="qr-list">
              <li>+4 Combative · +3 V. Agitated</li>
              <li>+2 Agitated · +1 Restless</li>
              <li>&nbsp;0 Alert &amp; calm</li>
              <li>−1 Drowsy · <span className="hi">−2 Light (TARGET)</span></li>
              <li>−3 Moderate · −4 Deep · −5 Unarousable</li>
            </ul>
          </div>
          <div className="quickref">
            <div className="qr-head">Key Medications</div>
            <ul className="qr-list">
              <li><b>Ketamine</b> 0.5–2 mg/kg bolus, 0.5–2 mg/kg/hr inf.</li>
              <li><b>Midazolam</b> 0.05–0.1 mg/kg bolus</li>
              <li><b>Morphine</b> 4 mg IV q4h, 2 mg PRN</li>
              <li><b>Meropenem</b> 1 g IV (sepsis)</li>
              <li><b>Ceftriaxone</b> 2 g + Metronidazole 500 mg</li>
            </ul>
          </div>
          <div className="quickref">
            <div className="qr-head">MARCH-PAWS · PCC Pillars</div>
            <ul className="qr-list">
              <li><b>M</b>assive hemorrhage · <b>A</b>irway · <b>R</b>esp</li>
              <li><b>C</b>irculation · <b>H</b>ead/Hypothermia</li>
              <li><b>P</b>ain · <b>A</b>ntibiotics · <b>W</b>ounds · <b>S</b>plinting</li>
              <li>Reassess hourly · document everything</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// SOUND PROMPT — shown when sound is enabled but AudioContext not yet
// resumed (browser autoplay policy requires a user gesture).
// =================================================================
function SoundPrompt({ enabled, onActivate, onDismiss }) {
  const [needsClick, setNeedsClick] = useState(false);
  useEffect(() => {
    if (!enabled) { setNeedsClick(false); return; }
    const ctx = window.PCC_SOUND.getCtx();
    setNeedsClick(!ctx || ctx.state !== 'running');
    // poll for ctx state changes (some browsers fire 'statechange' on AudioContext)
    if (ctx) {
      const h = () => setNeedsClick(ctx.state !== 'running');
      ctx.addEventListener && ctx.addEventListener('statechange', h);
      return () => ctx.removeEventListener && ctx.removeEventListener('statechange', h);
    }
  }, [enabled]);
  if (!enabled || !needsClick) return null;
  return (
    <div className="sound-prompt">
      <span className="ico">♪</span>
      <span>Patient telemetry audio is queued — click to enable</span>
      <button onClick={() => { window.PCC_SOUND.ensure(); window.PCC_SOUND.click(); onActivate && onActivate(); }}>Activate</button>
      <button className="dismiss" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

// =================================================================
// APP
// =================================================================
function App() {
  const data = window.PCC_SCENARIOS;
  const [t, setTweak] = useTweaks(window.PCC_TWEAK_DEFAULTS);
  const [soundDismissed, setSoundDismissed] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('pfc.view') === 'docs' ? 'docs' : 'monitor'; } catch (e) { return 'monitor'; }
  });
  const toggleDocs = useCallback(() => {
    setView(v => {
      const next = v === 'docs' ? 'monitor' : 'docs';
      try { localStorage.setItem('pfc.view', next); } catch (e) {}
      return next;
    });
  }, []);

  const toggleTweaks = useCallback(() => {
    if (tweaksOpen) {
      window.postMessage({ type: '__deactivate_edit_mode' }, '*');
      setTweaksOpen(false);
    } else {
      window.postMessage({ type: '__activate_edit_mode' }, '*');
      setTweaksOpen(true);
    }
  }, [tweaksOpen]);

  // Listen for panel-driven open/dismiss events to keep button state in sync
  useEffect(() => {
    const onMsg = (e) => {
      const ty = e?.data?.type;
      if (ty === '__edit_mode_dismissed' || ty === '__deactivate_edit_mode') setTweaksOpen(false);
      else if (ty === '__activate_edit_mode') setTweaksOpen(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Apply pulseHeart toggle to body
  useEffect(() => {
    document.body.classList.toggle('no-pulse', !t.pulseHeart);
  }, [t.pulseHeart]);

  // Initial: from hash or first
  const [activeCtl, setActiveCtl] = useState(() => {
    const h = (location.hash || '').replace('#', '');
    return data.find(d => d.ctl === h) ? h : data[0].ctl;
  });

  useEffect(() => {
    history.replaceState(null, '', '#' + activeCtl);
    // scroll panels to top on change
    document.querySelectorAll('.panel-body').forEach(el => el.scrollTop = 0);
  }, [activeCtl]);

  const idx = data.findIndex(d => d.ctl === activeCtl);
  const s = data[idx];

  // Drive the WebGL background colour from the current patient's condition
  // (scenario priority → stable / urgent / critical) and the heartbeat
  // tempo from their heart rate. Disabled when "Tint to condition" is off.
  useEffect(() => {
    if (!window.PFC_BG || !s) return;
    const level = t.bgCondition === false
      ? 'stable'
      : s.priority === 0 ? 'critical'
      : s.priority === 1 ? 'urgent'
      : 'stable';
    const hr = s.vitalsParsed ? +s.vitalsParsed.hr || 0 : 0;
    window.PFC_BG.setCondition(level, { hr });
  }, [s && s.ctl, t.bgCondition]);

  const onPrev = useCallback(() => {
    if (idx > 0) setActiveCtl(data[idx - 1].ctl);
  }, [idx, data]);
  const onNext = useCallback(() => {
    if (idx < data.length - 1) setActiveCtl(data[idx + 1].ctl);
  }, [idx, data]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === '/') {
        e.preventDefault();
        const inp = document.querySelector('.idx-filter input');
        inp && inp.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  // Click sounds — only on interactive controls we own
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('.idx-item, .action-item, .tab, .q-item button.toggle, .topbar-btn');
      if (el) window.PCC_SOUND.click();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!s) return <div style={{ padding: 40 }}>No scenario loaded.</div>;

  return (
    <div className={'app' + (view === 'docs' ? ' docs-mode' : '')}>
      <div className="topbar-row"><TopBar s={s} total={data.length} idx={idx} onOpenTweaks={toggleTweaks} tweaksOpen={tweaksOpen} soundEnabled={t.soundEnabled} view={view} onToggleDocs={toggleDocs} /></div>
      {view === 'docs' ? (
        <window.DocsDashboard s={s} key={'docs-' + s.ctl} />
      ) : (
        <>
          <div className="col-left"><ScenarioIndex data={data} activeCtl={activeCtl} onPick={setActiveCtl} /></div>
          <ScenarioMain s={s} key={s.ctl} tweaks={t} />
          <div className="col-right"><RightPanel s={s} key={'r-' + s.ctl} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <QuickReference />
          </div>
        </>
      )}
      <FootStrip s={s} onPrev={onPrev} onNext={onNext} idx={idx} total={data.length} />

      <window.PCCTweaks tweaks={t} setTweak={setTweak} currentVitals={s.vitalsParsed} />
      {!soundDismissed && (
        <SoundPrompt
          enabled={t.soundEnabled}
          onActivate={() => setSoundDismissed(true)}
          onDismiss={() => setSoundDismissed(true)}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
