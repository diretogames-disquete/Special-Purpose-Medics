/* ============================================================
   APP — top bar, decision log, outcome panel, debrief modal
   ============================================================ */

function DecisionLog({ log }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log.length]);
  return (
    <div className="panel decision-log">
      <div className="panel-header">
        <span className="marker">▮</span>
        <span>Decision Log</span>
        <span className="right">{log.length} ENTR{log.length === 1 ? "Y" : "IES"}</span>
      </div>
      <div className="panel-body" ref={ref}>
        <div className="log-list">
          {log.map((entry, i) =>
          <div key={i} className="log-line">
              <span className="log-time">T+{window.formatClock(entry.t)}</span>
              <span className={`log-tag ${entry.tag}`}>{entry.tag}</span>
              <span className={`log-msg ${entry.kind || ""}`}>{entry.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>);

}

function OutcomePanel({ survival, criticalDone, criticalMissed, contraTaken, elapsedSec, paused, finished, onStart, onPause, onReset, onResetMission, onEvac }) {
  const totalCrit = criticalDone.length + criticalMissed.length;
  let cls = "";
  if (survival >= 70) cls = "";else
  if (survival >= 35) cls = "warn";else
  cls = "danger";
  return (
    <div className="outcome-panel">
      <div className="outcome-head">Survival Probability · Live</div>
      <div className="survival-display">
        <div className={`survival-num ${cls}`}>{survival}<span style={{ fontSize: 22, color: "var(--ink-faint)" }}>%</span></div>
        <div className="survival-label">
          {survival >= 70 ? "Likely Survives" : survival >= 35 ? "Guarded" : "Likely Dies"}
        </div>
      </div>
      <div className="survival-bar">
        <div className="survival-fill" style={{ width: `${survival}%` }} />
      </div>

      <div className="outcome-stats">
        <div className="stat-tile">
          <div className="lbl">Critical Actions</div>
          <div className="val">{criticalDone.length}/{totalCrit}</div>
        </div>
        <div className="stat-tile">
          <div className="lbl">Contraindications</div>
          <div className="val" style={{ color: contraTaken.size > 0 ? "var(--danger)" : "var(--ink-bright)" }}>{contraTaken.size}</div>
        </div>
        <div className="stat-tile">
          <div className="lbl">Elapsed</div>
          <div className="val">{window.formatClock(elapsedSec)}</div>
        </div>
        <div className="stat-tile">
          <div className="lbl">Status</div>
          <div className="val" style={{ fontSize: 12, paddingTop: 4 }}>{finished ? "ENDED" : paused ? "PAUSED" : "RUNNING"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {!finished && (paused ?
        <button className="debrief-btn primary" style={{ flex: 1 }} onClick={onStart}>
            {elapsedSec === 0 ? "▶ START" : "▶ RESUME"}
          </button> :

        <button className="debrief-btn" style={{ flex: 1 }} onClick={onPause}>❚❚ PAUSE</button>)
        }
        <button className="debrief-btn" onClick={onReset} title="Reset just this patient">↺</button>
        <button className="debrief-btn danger" onClick={() => {
          if (window.confirm("Reset ALL patients and mission clock?\n\nThis wipes every patient's progress, the mission timer, and starts the scenario set from scratch.")) {
            onResetMission && onResetMission();
          }
        }} title="Mission reset — wipe ALL patients and clock">↺↺</button>
        {!finished && <button className="debrief-btn" onClick={onEvac} title="End scenario / EVAC">EVAC</button>}
      </div>
    </div>);

}

function Debrief({ scenario, criticalDone, criticalMissed, contraTaken, log, survival, outcome, onReplay, onNext }) {
  const verdictCls = outcome === "alive" ? "alive" : outcome === "guarded" ? "guarded" : outcome === "dead" ? "dead" : survival >= 70 ? "alive" : survival >= 35 ? "guarded" : "dead";
  const verdictText = verdictCls === "alive" ? "Casualty stabilized for evac" :
  verdictCls === "guarded" ? "Casualty unstable — high risk in transport" :
  "Casualty did not survive";
  return (
    <div className="debrief-backdrop">
      <div className="debrief">
        <div className="debrief-header">
          <span className="title">Debrief · {scenario.name} / {scenario.last4}</span>
          <span className={`verdict ${verdictCls}`}>{verdictText}</span>
        </div>
        <div className="debrief-body">

          <div className="debrief-section">
            <div className="sec-head">Survival Outcome</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 48, color:
                verdictCls === "alive" ? "var(--live)" :
                verdictCls === "guarded" ? "var(--warn)" : "var(--danger)",
                fontWeight: 600
              }}>{survival}%</span>
              <span style={{ color: "var(--ink-mute)" }}>
                vs textbook ceiling <b style={{ color: "var(--ink)" }}>{scenario.expectedSurvival}%</b> &nbsp;·&nbsp;
                untreated baseline <b style={{ color: "var(--ink)" }}>{scenario.baseSurvival}%</b>
              </span>
            </div>
          </div>

          <div className="debrief-section">
            <div className="sec-head">Critical Actions · {criticalDone.length} of {criticalDone.length + criticalMissed.length}</div>
            <div className="crit-list">
              {scenario.criticalActions.map((a) => {
                const wasDone = criticalDone.includes(a);
                return (
                  <div key={a.id} className={`crit-row ${wasDone ? "done" : "missed"}`}>
                    <span className="check">{wasDone ? "✓" : "✗"}</span>
                    <span className="desc">[{a.category}] {a.label}</span>
                    <span className="time-est">Ideal ≤ T+{String(a.byMin).padStart(2, "0")}:00</span>
                  </div>);

              })}
            </div>
          </div>

          {contraTaken.size > 0 &&
          <div className="debrief-section">
              <div className="sec-head" style={{ color: "var(--danger)" }}>Contraindicated Actions Taken</div>
              <div className="crit-list">
                {[...contraTaken].map((id) => {
                const contra = scenario.contraindications.find((c) => c.actionId === id);
                return (
                  <div key={id} className="crit-row missed">
                      <span className="check">⚠</span>
                      <span className="desc">{contra?.message || id}</span>
                      <span className="time-est"></span>
                    </div>);

              })}
              </div>
            </div>
          }

          <div className="debrief-section">
            <div className="sec-head">Clinical Reasoning</div>
            <div style={{ color: "var(--ink-mute)", fontSize: 11, lineHeight: 1.6 }}>
              {generateReasoning(scenario, criticalDone, criticalMissed, contraTaken)}
            </div>
          </div>

        </div>
        <div className="debrief-actions">
          <button className="debrief-btn" onClick={onReplay}>↺ REPLAY</button>
          <button className="debrief-btn primary" onClick={onNext}>NEXT PATIENT →</button>
        </div>
      </div>
    </div>);

}

function generateReasoning(scenario, done, missed, contraTaken) {
  const parts = [];
  // Top missed = biggest gap
  const topMissed = missed.sort((a, b) => b.weight - a.weight)[0];
  if (topMissed) {
    parts.push(`The highest-impact omission was: ${topMissed.label}. This action carries ${topMissed.weight} survival-weight points in this scenario.`);
  }
  if (contraTaken.size > 0) {
    parts.push(`You triggered ${contraTaken.size} contraindication${contraTaken.size > 1 ? "s" : ""} — each costs survival probability and signals a clinical-decision gap. Review the warnings above.`);
  }
  if (done.length === scenario.criticalActions.length && contraTaken.size === 0) {
    parts.push(`All critical actions completed without contraindication. Textbook execution.`);
  } else if (done.length / scenario.criticalActions.length >= 0.7) {
    parts.push(`MARCH sequence largely intact. Closing the gap on remaining items would push this casualty toward a survivable outcome.`);
  } else {
    parts.push(`MARCH discipline was incomplete. Walk through M→A→R→C→H on your next attempt — the priorities are sequenced for a reason.`);
  }
  return parts.join(" ");
}

/* ============================================================
   APP ROOT
   ============================================================ */
function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "difficulty": "strict",
    "hintMode": false,
    "showAnswers": false,
    "timeSpeed": 1,
    "pulseSound": "beep",
    "soundOn": true,
    "theme": "dark",
    "briefRate": 1,
    "glassPanels": true,
    "glassOpacity": 54,
    "bgCondition": true
  } /*EDITMODE-END*/;

  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [scenarioIdx, setScenarioIdx] = useState(0);

  /* Apply theme to the document root so every panel/variable swaps. */
  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme === "light" ? "light" : "dark";
  }, [t.theme]);

  /* Glass panels — translucent chrome so the WebGL field shows through. */
  React.useEffect(() => {
    document.body.classList.toggle("glass", !!t.glassPanels);
    if (window.PFC_BG) window.PFC_BG.setGlass(!!t.glassPanels);
  }, [t.glassPanels]);
  React.useEffect(() => {
    document.body.style.setProperty("--glass-alpha", String((t.glassOpacity ?? 62) / 100));
  }, [t.glassOpacity]);

  const engine = window.useScenarioEngine({
    scenarioIdx, setScenarioIdx,
    timeSpeed: t.timeSpeed,
    difficulty: t.difficulty,
    showAnswers: t.showAnswers
  });
  const { state, dispatch } = engine;
  const { scenario, vitals, taken, contraTaken, log, elapsedSec, paused, finished,
    survival, criticalDone, criticalMissed, toast, outcome, nextHint,
    tqStates, evacPriority, missionElapsedSec, missionRunning } = state;
  const { performAction, start, pause, reset, resetMission, evac, next, prev, pick, setToast,
    onTqApply, onTqConvert, setAVPU, setEvacPriority } = dispatch;

  /* ---- WebGL background tracks the patient's live acuity ----
     Driven by survival probability (and cardiac arrest), with the trace
     tempo following heart rate. Disabled when "Tint to condition" is off. */
  React.useEffect(() => {
    if (!window.PFC_BG) return;
    const dead = finished && outcome === "dead";
    const level = !t.bgCondition ? "stable"
      : state.arrested || dead || survival < 35 ? "critical"
      : survival < 70 ? "urgent"
      : "stable";
    window.PFC_BG.setCondition(level, { hr: state.arrested ? 0 : (vitals.hr || 0) });
  }, [survival, state.arrested, finished, outcome, vitals.hr, t.bgCondition]);

  /* ---- Sound monitor: drives the cardiac pulse audio + alarm tones ---- */
  React.useEffect(() => {
    if (!window.Sound) return;
    window.Sound.setPulseMode(t.soundOn ? t.pulseSound : "off");
  }, [t.pulseSound, t.soundOn]);

  React.useEffect(() => {
    if (!window.Sound) return;
    if (!missionRunning || finished || !t.soundOn) {
      window.Sound.stopMonitor();
      return;
    }
    window.Sound.init();
    window.Sound.startMonitor(() => ({ hr: vitals.hr, spo2: vitals.spo2, sys: vitals.sys }));
    return () => window.Sound.stopMonitor();
  }, [missionRunning, finished, t.soundOn, vitals.hr, vitals.spo2, vitals.sys]);

  /* ---- Asystole tone: a sustained flatline tone that holds while the
     patient is in arrest. It runs independently of the live monitor loop
     so it keeps sounding even after the scenario is finalized — until the
     operator resets or silences the monitor. ---- */
  React.useEffect(() => {
    if (!window.Sound) return;
    if (state.arrested && t.soundOn) {
      window.Sound.init();
      window.Sound.startAsystole();
    } else {
      window.Sound.stopAsystole();
    }
    return () => { if (window.Sound) window.Sound.stopAsystole(); };
  }, [state.arrested, t.soundOn]);

  // Use 'P' key to pause/resume; 'R' to reset
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "p" || e.key === "P") {paused ? start() : pause();}
      if (e.key === "r" || e.key === "R") {reset();}
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, start, pause, reset]);

  // Format clock display — mission clock keeps ticking across patient switches
  const recordTime = "T+" + window.formatClock(missionElapsedSec);
  const patientTime = "P+" + window.formatClock(elapsedSec);

  return (
    <div className="app">
      {/* TOP BAR */}
      <div className="topbar" data-comment-anchor="b228c54f0a-div-227-7">
        <span className="brand">
          <span className="dot"></span>
          <span>TCCC · PATIENT TREATMENT DASHBOARD</span>
        </span>
        <span className="sep"></span>
        <span>Scenario {scenarioIdx + 1} / {window.SCENARIOS.length}</span>
        <span className="sep"></span>
        <span style={{ color: "var(--ink)" }}>{scenario.callsign} · {scenario.name} {scenario.last4}</span>
        <div className="scn-bar">
          {window.SCENARIOS.map((s, i) =>
          <button key={s.id}
          className={`scn-pill ${i === scenarioIdx ? "active" : ""}`}
          onClick={() => pick(i)}>
              {String(i + 1).padStart(2, "0")} · {s.name}
            </button>
          )}
        </div>
        <div className="right">
          <button
            className="topbar-btn tweaks-btn"
            onClick={() => window.postMessage({ type: "__activate_edit_mode" }, "*")}
            title="Open Tweaks panel">
            ⚙ TWEAKS
          </button>
          <span className="clock" title="Mission clock — runs across patient switches">{recordTime}</span>
          <span className="clock-sub" title="Current patient elapsed">{patientTime}</span>
          <span className={`pill ${paused ? "warn" : finished ? "danger" : "live"}`}>
            {finished ? "ENDED" : paused ? "PAUSED" : "RUNNING"}
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <window.CasualtyPanel
        scenario={scenario}
        vitals={vitals}
        taken={taken}
        tqStates={tqStates}
        elapsedSec={elapsedSec}
        onTqApply={onTqApply}
        onTqConvert={onTqConvert}
        briefRate={t.briefRate} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        <window.VitalsPanel
          vitals={vitals}
          takenAVPU={vitals.avpu}
          onChangeAVPU={setAVPU}
          elapsedSec={elapsedSec}
          paused={paused} />
        
        <DecisionLog log={log} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        <window.TreatmentsPanel
          scenario={scenario}
          taken={taken}
          perform={performAction}
          nextHint={nextHint}
          hintMode={t.hintMode}
          showAnswers={t.showAnswers}
          evacPriority={evacPriority}
          setEvacPriority={setEvacPriority} />
        
        <OutcomePanel
          survival={survival}
          criticalDone={criticalDone}
          criticalMissed={criticalMissed}
          contraTaken={contraTaken}
          elapsedSec={elapsedSec}
          paused={paused}
          finished={finished}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onResetMission={resetMission}
          onEvac={evac} />
        
      </div>

      {/* Toast */}
      {toast &&
      <div className={`toast ${toast.kind === "good" ? "good" : ""}`}>{toast.msg}</div>
      }

      {/* Debrief */}
      {finished &&
      <Debrief
        scenario={scenario}
        criticalDone={criticalDone}
        criticalMissed={criticalMissed}
        contraTaken={contraTaken}
        log={log}
        survival={survival}
        outcome={outcome}
        onReplay={reset}
        onNext={() => {next();}} />

      }

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Display">
          <window.TweakRadio
            label="Theme"
            value={t.theme}
            options={[
            { value: "dark", label: "Night" },
            { value: "light", label: "Day" }]
            }
            onChange={(v) => setTweak("theme", v)} />

        </window.TweakSection>
        <window.TweakSection label="Background · WebGL">
          <window.TweakToggle
            label="Glass panels"
            value={t.glassPanels}
            onChange={(v) => setTweak("glassPanels", v)} />

          <window.TweakSlider
            label="Glass opacity"
            min={30} max={95} step={1}
            unit="%"
            value={t.glassOpacity ?? 62}
            onChange={(v) => setTweak("glassOpacity", v)} />

          <window.TweakToggle
            label="Tint to patient acuity"
            value={t.bgCondition !== false}
            onChange={(v) => setTweak("bgCondition", v)} />

        </window.TweakSection>
        <window.TweakSection label="Difficulty">
          <window.TweakRadio
            label="Grading"
            value={t.difficulty}
            options={[
            { value: "lenient", label: "Lenient" },
            { value: "strict", label: "Strict" }]
            }
            onChange={(v) => setTweak("difficulty", v)} />
          
        </window.TweakSection>
        <window.TweakSection label="Coaching">
          <window.TweakToggle
            label="Hint next critical action"
            value={t.hintMode}
            onChange={(v) => setTweak("hintMode", v)} />
          
          <window.TweakToggle
            label="Show full answer key"
            value={t.showAnswers}
            onChange={(v) => setTweak("showAnswers", v)} />
          
        </window.TweakSection>
        <window.TweakSection label="Time">
          <window.TweakSlider
            label="Sim speed"
            min={1} max={6} step={1}
            unit="×"
            value={t.timeSpeed}
            onChange={(v) => setTweak("timeSpeed", v)} />
          
        </window.TweakSection>
        <window.TweakSection label="Audio">
          <window.TweakToggle
            label="Sound on"
            value={t.soundOn}
            onChange={(v) => setTweak("soundOn", v)} />
          
          <window.TweakRadio
            label="Pulse sound"
            value={t.pulseSound}
            options={[
            { value: "beep", label: "Beep" },
            { value: "lubdub", label: "Lub-Dub" },
            { value: "off", label: "Off" }]
            }
            onChange={(v) => setTweak("pulseSound", v)} />
          
        </window.TweakSection>
        <window.TweakSection label="Patient Brief">
          <window.TweakSlider
            label="Narration speed"
            min={0.7} max={1.6} step={0.1}
            unit="×"
            value={t.briefRate}
            onChange={(v) => setTweak("briefRate", v)} />
          
        </window.TweakSection>
      </window.TweaksPanel>
    </div>);

}

window.App = App;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);