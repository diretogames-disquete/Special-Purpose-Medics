/* ============================================================
   CASUALTY PANEL — body diagrams, acute findings, tourniquets
   ============================================================ */

const ACUTE_FINDINGS = [
{ id: "impalement", label: "Impalement" },
{ id: "evisceration", label: "Evisceration" },
{ id: "amputation", label: "Amputation" },
{ id: "open_chest", label: "Open Chest" },
{ id: "sucking_chest", label: "Sucking Chest" },
{ id: "flail_chest", label: "Flail Chest" },
{ id: "open_abdomen", label: "Open Abdomen" },
{ id: "crush", label: "Crush" },
{ id: "avulsion", label: "Avulsion" },
{ id: "degloving", label: "Degloving" },
{ id: "penetrating_head", label: "Penetrating Head" },
{ id: "spinal_injury", label: "Spinal Injury" }];


/* --- simplified anatomical silhouette SVG paths (kept as fallback) --- */
function BodyFront() {return null;}
function BodyBack() {return null;}

/* --- injury markers — graphic, type-specific glyphs.
   Green is reserved for healthy / live state; injuries render in clinical
   reds, oranges, purples, and cyan so the body diagram reads as pathology. */
function Marker({ inj }) {
  const cx = inj.x * 100;
  const cy = inj.y * 220;
  const t = inj.type;

  // ENTRY GSW — small dark hole inside a crimson halo, with a faint pulse ring
  // for active bleeding and a few spatter droplets.
  if (t === "entry" || t === "gsw") {
    const c = "var(--gsw)";
    return (
      <g className="injury-mark entry">
        <circle cx={cx} cy={cy} r="5" fill="none" stroke={c} strokeWidth="0.35" opacity="0.45" className="bleed-pulse" />
        <circle cx={cx} cy={cy} r="2.4" fill={c} opacity="0.35" />
        <circle cx={cx} cy={cy} r="1.3" fill="#0a0c0d" stroke={c} strokeWidth="0.5" />
        {[[1.6,-2.6],[2.4,-1.0],[-2.2,-1.6],[-2.6,0.8],[1.4,2.8],[-0.6,3.0]].map((p,i) =>
        <circle key={i} cx={cx + p[0]} cy={cy + p[1]} r={0.4 + (i % 2) * 0.2} fill={c} opacity="0.75" />
        )}
      </g>);
  }

  // EXIT GSW — irregular jagged wound with avulsed-tissue silhouette
  if (t === "exit") {
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2;
      const r = 2.6 + (i % 2 ? 1.8 : 0.4) + Math.sin(i * 2.1) * 0.4;
      pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
    }
    return (
      <g className="injury-mark exit">
        <polygon points={pts.join(" ")} fill="var(--gsw-exit)" opacity="0.7" stroke="var(--gsw-exit)" strokeWidth="0.3" />
        <polygon points={pts.join(" ")} fill="none" stroke="#0a0c0d" strokeWidth="0.4" opacity="0.4" />
        <circle cx={cx} cy={cy} r="0.9" fill="#0a0c0d" />
      </g>);
  }

  // FRAG — cluster of small penetrations with a faint blast halo
  if (t === "frag") {
    const c = "var(--gsw)";
    const dots = [[0,0,1.2],[1.5,1,0.7],[-1.5,1,0.6],[0.5,-1.5,0.55],[-1.1,-1.1,0.6],[2.4,-0.5,0.5],[1.1,2.4,0.45],[-2.0,0.6,0.4]];
    return (
      <g className="injury-mark frag">
        <circle cx={cx} cy={cy} r="4.4" fill={c} opacity="0.14" />
        <circle cx={cx} cy={cy} r="5" fill="none" stroke={c} strokeWidth="0.25" opacity="0.4" className="bleed-pulse" />
        {dots.map((p, i) =>
        <circle key={i} cx={cx + p[0]} cy={cy + p[1]} r={p[2]} fill={c} />
        )}
      </g>);
  }

  // LAC — jagged slash, dark valley inside a crimson edge
  if (t === "lac") {
    const path = `M ${cx - 3.4} ${cy - 1.4} L ${cx - 1.6} ${cy + 0.6} L ${cx + 0.4} ${cy - 0.9} L ${cx + 2.4} ${cy + 1.1} L ${cx + 3.5} ${cy - 0.4}`;
    return (
      <g className="injury-mark lac">
        <path d={path} stroke="var(--lac)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d={path} stroke="#0a0c0d" strokeWidth="0.55" fill="none" strokeLinecap="round" />
      </g>);
  }

  // BURN — concentric heat rings; flame tongues only on full-thickness
  if (t === "burn" || t === "burn_partial" || t === "burn_full") {
    const full = t === "burn_full";
    const core = full ? "var(--burn-full)" : "var(--burn)";
    return (
      <g className="injury-mark burn">
        <circle cx={cx} cy={cy} r="5.2" fill={core} opacity="0.18" />
        <circle cx={cx} cy={cy} r="3.6" fill={core} opacity="0.36" />
        <circle cx={cx} cy={cy} r="2.0" fill={core} opacity={full ? 0.95 : 0.65} />
        {full && [0, 1.05, 2.1, 3.15, 4.2, 5.25].map((a, i) => {
          const sx = cx + Math.cos(a) * 2.4;
          const sy = cy + Math.sin(a) * 2.4;
          const ex = cx + Math.cos(a) * 4.0;
          const ey = cy + Math.sin(a) * 4.0;
          return <line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke={core} strokeWidth="0.55" strokeLinecap="round" />;
        })}
      </g>);
  }

  // CRUSH — bruise-zone ellipse with cross-hatched compression lines
  if (t === "crush") {
    const c = "var(--crush)";
    return (
      <g className="injury-mark crush">
        <ellipse cx={cx} cy={cy} rx="6.2" ry="4.2" fill={c} opacity="0.18" />
        <ellipse cx={cx} cy={cy} rx="4.2" ry="2.6" fill={c} opacity="0.42" />
        {[-4, -2, 0, 2, 4].map((d, i) =>
        <line key={i} x1={cx + d - 2} y1={cy - 1.6} x2={cx + d + 2} y2={cy + 1.6} stroke={c} strokeWidth="0.3" opacity="0.55" />
        )}
      </g>);
  }

  // FRAC — jagged lightning-bolt break in cyan (skeletal, not soft tissue)
  if (t === "frac") {
    const c = "var(--frac)";
    return (
      <g className="injury-mark frac">
        <path d={`M ${cx - 2.4} ${cy - 3.2} L ${cx - 0.4} ${cy - 0.6} L ${cx + 1.2} ${cy - 1.6} L ${cx - 0.9} ${cy + 1.3} L ${cx + 0.9} ${cy + 1.0} L ${cx - 0.9} ${cy + 3.4}`}
        stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>);
  }

  // AMPUTATION — dashed transection line + tapered stump silhouette
  if (t === "amputation") {
    const c = "var(--amp)";
    return (
      <g className="injury-mark amputation">
        <line x1={cx - 5.5} y1={cy} x2={cx + 5.5} y2={cy} stroke={c} strokeWidth="0.7" strokeDasharray="1.2 1" />
        <path d={`M ${cx - 3.2} ${cy + 0.4} Q ${cx} ${cy + 4.4} ${cx + 3.2} ${cy + 0.4} L ${cx - 3.2} ${cy + 0.4} Z`}
        fill={c} opacity="0.55" stroke={c} strokeWidth="0.4" />
        <path d={`M ${cx - 2} ${cy + 1.4} Q ${cx} ${cy + 3} ${cx + 2} ${cy + 1.4}`} stroke="#0a0c0d" strokeWidth="0.4" fill="none" />
      </g>);
  }

  // EVISCERATION — irregular abdominal defect with looped-bowel suggestion
  if (t === "evisceration") {
    const c = "var(--evisc)";
    return (
      <g className="injury-mark evisc">
        <path d={`M ${cx - 3.2} ${cy} C ${cx - 3.2} ${cy - 2.4} ${cx} ${cy - 3.6} ${cx + 2.2} ${cy - 2.6}
                 C ${cx + 4.2} ${cy - 1.6} ${cx + 3.6} ${cy + 1.8} ${cx + 1.6} ${cy + 2.8}
                 C ${cx - 0.6} ${cy + 3.6} ${cx - 3.6} ${cy + 1.6} ${cx - 3.2} ${cy} Z`}
        fill={c} opacity="0.6" stroke={c} strokeWidth="0.4" />
        <path d={`M ${cx - 1.6} ${cy - 0.2}
                 C ${cx - 1.6} ${cy - 1.2} ${cx - 0.4} ${cy - 1.2} ${cx - 0.4} ${cy - 0.2}
                 C ${cx - 0.4} ${cy + 0.8} ${cx + 0.8} ${cy + 0.8} ${cx + 0.8} ${cy - 0.2}
                 C ${cx + 0.8} ${cy - 1.2} ${cx + 1.8} ${cy - 1.2} ${cx + 1.8} ${cy - 0.2}`}
        stroke="#0a0c0d" strokeWidth="0.45" fill="none" />
      </g>);
  }

  return null;
}

function BodyView({ side, injuries, onClick }) {
  const filtered = injuries.filter((i) => i.view === side);
  const resKey = side === "front" ? "bodyFront" : "bodyBack";
  const fallback = side === "front" ? "assets/body-front.png" : "assets/body-back.png";
  const src = (window.__resources && window.__resources[resKey]) || fallback;
  return (
    <div className="body-view">
      <div className={`view-label-bar ${side === "front" ? "right" : "left"}`}>
        <span className="view-label-text">
          {side === "front" ? "ANT · FRONT" : "POST · BACK"}
        </span>
      </div>
      <div className="body-image-wrap">
        <img src={src} alt={side} className="body-image" draggable="false" />
        <svg viewBox="0 0 100 220" className="body-overlay" preserveAspectRatio="xMidYMid meet">
          <g>
            {filtered.map((inj, i) => <Marker key={i} inj={inj} />)}
          </g>
        </svg>
      </div>
    </div>);

}

function TqCell({ tq, tqState, elapsedSec, onApply, onConvert }) {
  const [modal, setModal] = React.useState(false);
  const applied = !!tqState;
  const timeSince = applied && tqState.appliedAt != null ? Math.max(0, elapsedSec - tqState.appliedAt) : 0;
  const minutes = Math.floor(timeSince / 60);
  const longApplied = minutes >= 6;

  return (
    <>
      <div className={`tq-cell ${applied ? "applied" : ""} ${longApplied ? "long" : ""}`}
      onClick={() => setModal(true)}>
        <div className="tq-head">
          <span>{tq.label}</span>
          <span className="tq-status">{applied ? "ON" : "OFF"}</span>
        </div>
        <div className="tq-row"><span>TYPE</span><span>{applied ? tqState.type : "—"}</span></div>
        <div className="tq-row" data-comment-anchor="87c4e8aabb-div-87-13"><span>SITE</span><span>{applied ? tqState.site : "—"}</span></div>
        <div className="tq-row"><span>TIME</span><span>{applied ? "T+" + window.formatClock(tqState.appliedAt) : "—"}</span></div>
        {applied &&
        <div className="tq-time-since">{minutes > 0 ? `↑ ${minutes}m applied` : "just applied"}</div>
        }
      </div>
      {modal &&
      <TqModal
        tq={tq}
        tqState={tqState}
        onClose={() => setModal(false)}
        onApply={(type, site) => {onApply(tq.key, type, site);setModal(false);}}
        onConvert={() => {onConvert && onConvert(tq.key);setModal(false);}} />

      }
    </>);

}

function TqModal({ tq, tqState, onClose, onApply, onConvert }) {
  const [type, setType] = React.useState(tqState?.type || "CAT Gen-7");
  const [site, setSite] = React.useState(tqState?.site || "HIGH & TIGHT");

  const types = ["CAT Gen-7", "SOFTT-W", "SAM-XT", "TMT", "Improvised"];
  const sites = ["HIGH & TIGHT", "2\" PROX WOUND", "JOINT-LINE"];

  return (
    <div className="tq-modal-backdrop" onClick={onClose}>
      <div className="tq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tq-title">Tourniquet · {tq.label.replace("TQ · ", "")}</div>
        <div className="tq-sub">Status: {tqState ? "APPLIED at T+" + window.formatClock(tqState.appliedAt) : "Not applied"}</div>

        <div className="tq-section">
          <div className="tq-section-label">Type</div>
          <div className="tq-options">
            {types.map((t) =>
            <button key={t} className={`tq-opt ${type === t ? "active" : ""}`} onClick={() => setType(t)}>{t}</button>
            )}
          </div>
        </div>

        <div className="tq-section">
          <div className="tq-section-label">Site</div>
          <div className="tq-options">
            {sites.map((s) =>
            <button key={s} className={`tq-opt ${site === s ? "active" : ""}`} onClick={() => setSite(s)}>{s}</button>
            )}
          </div>
        </div>

        <div className="tq-section" style={{ fontSize: 10, color: "var(--ink-mute)", lineHeight: 1.5 }}>
          <b style={{ color: "var(--warn)" }}>PEARL:</b> CAT Gen-7 is service-issue.
          High & tight for life-threatening extremity hemorrhage; convert to 2" proximal wound dressing in PFC ≥2 hrs only after definitive control.
        </div>

        <div className="tq-actions">
          <button className="tq-action" onClick={onClose}>CANCEL</button>
          {tqState && <button className="tq-action" onClick={onConvert}>CONVERT</button>}
          <button className="tq-action primary" onClick={() => onApply(type, site)}>
            {tqState ? "UPDATE" : "APPLY TQ"}
          </button>
        </div>
      </div>
    </div>);

}

window.TqCell = TqCell;
window.TqModal = TqModal;

/* ============================================================
   PATIENT BRIEF — speech-synthesis handoff
   Reads a structured MIST-style brief of the current patient using the
   browser's built-in Web Speech API. No external service required.
   ============================================================ */
function PatientBrief({ scenario, rate = 1.0, enhanced, onEnhanced }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [tone, setTone] = React.useState("calm");
  const [enhancing, setEnhancing] = React.useState(false);
  const [err, setErr] = React.useState("");

  // Stop any in-flight narration when the scenario changes.
  React.useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setErr("");
  }, [scenario.id]);

  // Strip mid-sentence interpunct/bullet glyphs, lightly expand a few common
  // trauma abbreviations so the TTS engine doesn't spell them out letter by
  // letter, and collapse whitespace.
  const speakable = (s) => String(s || "")
    .replace(/·|•/g, ", ")
    .replace(/\bICS\b/g, "I C S")
    .replace(/\bIED\b/g, "I E D")
    .replace(/\bBK\b/g, "below knee")
    .replace(/\bAK\b/g, "above knee")
    .replace(/\bSpO₂\b/gi, "S P O two")
    .replace(/\bGCS\b/g, "G C S")
    .replace(/\bTBSA\b/g, "T B S A")
    .replace(/\bIOTV\b/g, "I O T V")
    .replace(/\bLOC\b/g, "loss of consciousness")
    .replace(/\bMAP\b/g, "M A P")
    .replace(/\bHR\b/g, "heart rate")
    .replace(/\bBP\b/g, "blood pressure")
    .replace(/\bSBP\b/g, "systolic")
    .replace(/\s+/g, " ")
    .trim();

  const buildRaw = () => {
    const m = scenario.moi || {};
    const sex = scenario.sex === "M" ? "male" : scenario.sex === "F" ? "female" : "";
    const lines = [
      `Patient presentation. Patient last four ${scenario.last4.split("").join(" ")}, callsign ${scenario.callsign}.`,
      sex ? `${scenario.age}-year-old ${sex}.` : "",
      scenario.mechanism ? `Scene narrative. ${scenario.mechanism}` : "",
      m.event ? `Event: ${m.event}.` : "",
      m.forces ? `Forces: ${m.forces}.` : "",
      m.range ? `Range: ${m.range}.` : "",
      m.protection ? `Protection: ${m.protection}.` : "",
      m.timeline ? `Timeline: ${m.timeline}.` : "",
      m.findings ? `Findings on arrival: ${m.findings}.` : "",
      `Working diagnosis: ${scenario.diagnosis}.`
    ];
    return lines.filter(Boolean).join(" ");
  };
  // Narrate the LLM-enhanced brief when present, else the raw structured brief.
  const speakText = () => speakable(enhanced || buildRaw());

  // Call the serverless proxy (which holds the Claude key) to rewrite the brief
  // in the chosen tone. Falls back gracefully when no proxy is configured.
  const proxyCfg = () => (window.NARRATION_RESOLVE ? window.NARRATION_RESOLVE() : { url: "", token: "" });
  const enhance = async () => {
    const { url, token } = proxyCfg();
    if (!url) { setErr("Add your proxy URL in js/narration-config.js (see proxy/README)."); return; }
    setEnhancing(true); setErr("");
    try {
      const headers = { "content-type": "application/json" };
      if (token) headers["x-narration-token"] = token;
      const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ brief: buildRaw(), tone }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.text) throw new Error(data.error || ("HTTP " + r.status));
      onEnhanced && onEnhanced(data.text);
    } catch (e) {
      setErr(String((e && e.message) || e));
    } finally {
      setEnhancing(false);
    }
  };

  const start = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakText());
    u.rate = rate;
    u.pitch = 1.0;
    u.volume = 1.0;
    // Prefer an English voice if available; otherwise let the engine choose.
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|google|natural/i.test(v.name)) ||
               voices.find(v => /en[-_]US/i.test(v.lang)) ||
               voices.find(v => /^en/i.test(v.lang));
    if (en) u.voice = en;
    u.onend = () => { setSpeaking(false); setPaused(false); };
    u.onerror = () => { setSpeaking(false); setPaused(false); };
    window.speechSynthesis.speak(u);
    setSpeaking(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (!supported) return;
    if (paused) { window.speechSynthesis.resume(); setPaused(false); }
    else        { window.speechSynthesis.pause();  setPaused(true);  }
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className="brief-controls">
      <div className="brief-bar">
        <select className="brief-tone" value={tone} onChange={e => setTone(e.target.value)} title="Brief tone">
          <option value="calm">Calm</option>
          <option value="urgent">Urgent</option>
          <option value="instructor">Instructor</option>
        </select>
        <button className="brief-btn enhance" onClick={enhance} disabled={enhancing}
          title="Rewrite this brief in the selected tone (Claude, via your proxy)">
          {enhancing ? "⏳ Enhancing…" : enhanced ? "↻ Re-tone" : "✨ Enhance"}
        </button>
        {supported && (!speaking ?
          <button className="brief-btn primary" onClick={start} title="Narrate brief">▶ BRIEF</button> :
          <>
            <button className="brief-btn" onClick={togglePause} title={paused ? "Resume" : "Pause"}>{paused ? "▶" : "❚❚"}</button>
            <button className="brief-btn danger" onClick={stop} title="Stop">■</button>
            <span className="brief-status">{paused ? "PAUSED" : "NARRATING…"}</span>
          </>)}
        {!supported && <span className="brief-status">read-aloud n/a</span>}
        {enhanced && <span className="brief-chip" title="Spoken brief uses the enhanced tone">✨ {tone}</span>}
      </div>
      {err && <div className="brief-err">⚠ {err}</div>}
    </div>);
}

window.PatientBrief = PatientBrief;

function CasualtyPanel({ scenario, vitals, taken, tqStates, elapsedSec, onTqApply, onTqConvert, briefRate }) {
  // LLM-enhanced brief for the current patient (reset when the patient changes)
  const [briefEnhanced, setBriefEnhanced] = React.useState(null);
  React.useEffect(() => { setBriefEnhanced(null); }, [scenario.id]);
  // active injury tool (display only)
  const [tool, setTool] = useState("gsw");
  // editable name + last4 overrides, keyed by scenario id so each patient retains its own edits
  const [nameOverrides, setNameOverrides] = useState({});
  const [last4Overrides, setLast4Overrides] = useState({});
  const displayName = nameOverrides[scenario.id] ?? scenario.name;
  const displayLast4 = last4Overrides[scenario.id] ?? scenario.last4;

  return (
    <div className="panel casualty">
      <div className="panel-header">
        <span className="marker">▮</span>
        <span>TCCC · 360 Casualty View · DD-1380</span>
        <span className="right">{scenario.callsign}</span>
      </div>
      <div className="panel-body" data-comment-anchor="3fb42e3471-div-177-7">
        {/* Name & ID */}
        <div className="name-row">
          <div>
            <div className="label-mini">Name · Last4</div>
            <input
              type="text"
              className="name-field name-input"
              value={displayName}
              spellCheck={false}
              onChange={(e) => setNameOverrides((m) => ({ ...m, [scenario.id]: e.target.value }))}
              placeholder="LAST, FIRST" />
          </div>
          <div>
            <div className="label-mini">&nbsp;</div>
            <input
              type="text"
              className="id-field id-input"
              value={displayLast4}
              spellCheck={false}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => setLast4Overrides((m) => ({ ...m, [scenario.id]: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
              placeholder="0000" />
          </div>
        </div>

        {/* Mechanism */}
        <div className="mech-card">
          <div className="mech-head">
            <div className="mech-lbl">Mechanism · {scenario.diagnosis}</div>
            <PatientBrief scenario={scenario} rate={briefRate || 1.0}
              enhanced={briefEnhanced} onEnhanced={setBriefEnhanced} />
          </div>
          <div className="mech-narrative">{scenario.mechanism}</div>
          {briefEnhanced &&
          <div className="brief-enhanced">
              <div className="be-head"><span className="be-spark">✨</span> Enhanced brief · spoken handoff
                <button className="be-x" title="Discard enhanced brief" onClick={() => setBriefEnhanced(null)}>×</button>
              </div>
              <div className="be-body">{briefEnhanced}</div>
            </div>
          }
          {scenario.moi &&
          <div className="moi-grid">
              <div className="moi-row"><span className="moi-k">Event</span><span className="moi-v">{scenario.moi.event}</span></div>
              <div className="moi-row"><span className="moi-k">Forces</span><span className="moi-v">{scenario.moi.forces}</span></div>
              <div className="moi-row"><span className="moi-k">Range</span><span className="moi-v">{scenario.moi.range}</span></div>
              <div className="moi-row"><span className="moi-k">PPE</span><span className="moi-v">{scenario.moi.protection}</span></div>
              <div className="moi-row"><span className="moi-k">Timeline</span><span className="moi-v">{scenario.moi.timeline}</span></div>
              <div className="moi-row findings"><span className="moi-k">Findings</span><span className="moi-v">{scenario.moi.findings}</span></div>
            </div>
          }
        </div>

        {/* Acute findings */}
        <div className="findings-block">
          <div className="findings-head">
            <span className="lbl">Acute Findings</span>
            <span className="hint">Pre-flagged from scene</span>
          </div>
          <div className="findings-grid">
            {ACUTE_FINDINGS.map((f) =>
            <div key={f.id}
            className={`finding-chip ${scenario.acuteFindings.includes(f.id) ? "active" : ""}`}>
                {f.label}
              </div>
            )}
          </div>
        </div>

        {/* Injury legend — shows what each glyph means on the body diagram */}
        <div className="injury-tools" aria-label="Injury legend">
          <span className="injury-tool gsw"><span className="swatch" /> PENETRATING</span>
          <span className="injury-tool burn"><span className="swatch" /> BURN</span>
          <span className="injury-tool crush"><span className="swatch crush-swatch" /> CRUSH</span>
          <span className="injury-tool frac"><span className="swatch" /> FRAC</span>
          <span className="injury-tool amp"><span className="swatch amp-swatch" /> AMP / EVISC</span>
        </div>

        {/* Body diagrams */}
        <div className="body-grid">
          <BodyView side="front" injuries={scenario.injuries} />
          <BodyView side="back" injuries={scenario.injuries} />
        </div>

        {/* Tourniquets */}
        <div className="tq-grid">
          {[
          { key: "tq_right_arm", label: "TQ · R ARM" },
          { key: "tq_left_arm", label: "TQ · L ARM" },
          { key: "tq_right_leg", label: "TQ · R LEG" },
          { key: "tq_left_leg", label: "TQ · L LEG" }].
          map((tq) =>
          <TqCell
            key={tq.key}
            tq={tq}
            tqState={tqStates && tqStates[tq.key]}
            elapsedSec={elapsedSec}
            onApply={onTqApply}
            onConvert={onTqConvert} />

          )}
        </div>
      </div>
    </div>);

}

window.CasualtyPanel = CasualtyPanel;