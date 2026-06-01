/* ============================================================
   VITALS PANEL — pulse, BP, RR, SpO2, pain, AVPU + ECG
   ============================================================ */

/* Animated ECG waveform — driven by current HR */
function ECG({ hr, color = "#f4c243", height = 36 }) {
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ phase: 0, points: [] });

  React.useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let raf = 0;
    const W = cv.width = cv.clientWidth * 2;
    const H = cv.height = height * 2;
    ctx.scale(1, 1);

    // beats per second
    let last = performance.now();

    function pqrst(x) {
      // returns y in [-1, 1.6] across a single beat, x in [0,1]
      if (x < 0.10) return Math.sin(x * Math.PI / 0.10) * 0.10; // P
      if (x < 0.18) return 0;
      if (x < 0.21) return -0.25; // Q
      if (x < 0.24) return 1.6; // R
      if (x < 0.27) return -0.45; // S
      if (x < 0.34) return 0;
      if (x < 0.50) return Math.sin((x - 0.34) * Math.PI / 0.16) * 0.30; // T
      return 0;
    }

    function frame(t) {
      const dt = (t - last) / 1000;
      last = t;
      const beatPerSec = (hr || 60) / 60;
      stateRef.current.phase += dt * beatPerSec;
      const phase = stateRef.current.phase;

      // shift existing — fade colour follows the active theme so the trail
      // doesn't leave dark smudges on the light variant.
      const isLight = document.documentElement.dataset.theme === "light";
      ctx.fillStyle = isLight ? "rgba(255,255,255,0.32)" : "rgba(7,9,10,0.25)";
      ctx.fillRect(0, 0, W, H);

      // Asystole: HR has ceased. Render a flat trace — no PQRST — with a
      // faint baseline noise so it reads as a live (dead) signal, not a
      // disconnected lead.
      if (!hr || hr <= 0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        const baseY = H * 0.55;
        const N = 240;
        for (let i = 0; i < N; i++) {
          const px = i / N * W;
          const py = baseY + (Math.random() - 0.5) * 0.6;
          if (i === 0) ctx.moveTo(px, py);else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        raf = requestAnimationFrame(frame);
        return;
      }

      // draw the recent ~3 seconds of waveform
      const winSec = 3;
      const N = 240;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      for (let i = 0; i < N; i++) {
        const tt = i / N * winSec; // seconds before now
        const beat = phase - (winSec - tt) * beatPerSec; // beat index at this past moment
        const frac = beat - Math.floor(beat);
        const y = pqrst(frac);
        const px = i / N * W;
        const py = H * 0.55 - y * H * 0.32;
        if (i === 0) ctx.moveTo(px, py);else
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [hr, color, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height, display: "block" }} />;
}

function VitalsPanel({ vitals, takenAVPU, onChangeAVPU, elapsedSec, paused }) {
  const map = window.computeMAP(vitals.sys, vitals.dia);
  const hrCls = window.classifyHR(vitals.hr);
  const bpCls = window.classifyBP(vitals.sys);
  const rrCls = window.classifyRR(vitals.rr);
  const spCls = window.classifySpO2(vitals.spo2);
  const mapCls = window.classifyMAP(map);

  // BP marker position 40–225 scale
  const bpPct = Math.max(0, Math.min(100, (vitals.sys - 40) / (225 - 40) * 100));

  const ecgColor = hrCls === "bad" ? "var(--danger)" : hrCls === "warn" ? "var(--warn)" : "var(--live)";

  return (
    <div className="panel">
      <div className="panel-header" data-comment-anchor="2b0e1db9f0-div-89-7">
        <span className="marker">▮</span>
        <span>Signs & Symptoms · {paused ? "Paused" : "Live"}</span>
        <span className="right">CLICK ANY TILE OR CELL TO EDIT · LATEST: {window.formatClock(elapsedSec)}</span>
      </div>
      <div className="vitals-grid">
        {/* PULSE */}
        <div className="vital pulse" data-comment-anchor="64cb9cf268-div-96-9">
          <div className="vital-label">Pulse</div>
          <div className="vital-value">
            <span className={`num ${hrCls}`}>{Math.round(vitals.hr)}</span>
            <span className="unit">bpm</span>
          </div>
          <div className="controls">
            <button>▲</button>
            <button>▼</button>
            <button
              className={`heart pulsate ${hrCls}`}
              style={vitals.hr > 0
                ? { animationDuration: `${60 / Math.max(20, vitals.hr)}s` }
                : { animation: "none", opacity: 0.55 }}
              title={vitals.hr > 0
                ? "Heart pulsates at current rate · sound options in Tweaks"
                : "Asystole — pulse has ceased"}>
              ♥
            </button>
          </div>
          <div className="ecg">
            <ECG hr={vitals.hr} color={
            hrCls === "bad" ? "#ef5350" : hrCls === "warn" ? "#f4b04a" : "#6fd99a"
            } />
          </div>
        </div>

        {/* BP */}
        <div className="vital bp">
          <div className="bp-row">
            <div className="vital-label">BP · Sys/Dia · mmHg</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 60, fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em", paddingRight: 36 }}>
              <span>SYS</span>
              <span>DIA</span>
            </div>
          </div>
          <div className="bp-row">
            <div className="bp-num-box">
              <span className="bp-large">{Math.round(vitals.sys)}</span>
            </div>
            <span className="slash">/</span>
            <div className="bp-num-box">
              <span className="bp-large">{Math.round(vitals.dia)}</span>
            </div>
            <div className="controls" style={{ position: "static", marginLeft: 6 }}>
              <button>▲</button>
              <button>▼</button>
            </div>
          </div>
          <div>
            <div className="bp-scale">
              <div className="bp-marker" style={{ left: `${bpPct}%` }} />
            </div>
            <div className="bp-scale-labels">
              <span>40</span><span>90</span><span>120</span><span>160</span><span>225</span>
            </div>
          </div>
          <div className="map-row">
            <span>MAP <span className="map-val" style={{ color:
                mapCls === "bad" ? "var(--danger)" : mapCls === "warn" ? "var(--warn)" : "var(--live)"
              }}>{map}</span> mmHg</span>
            <span className={`perfusion ${mapCls === "good" ? "" : "bad"}`}>
              {mapCls === "good" ? "ADEQUATE PERFUSION" :
              mapCls === "warn" ? "BORDERLINE PERFUSION" : "INADEQUATE PERFUSION"}
            </span>
          </div>
        </div>

        {/* RESP */}
        <div className="vital resp">
          <div className="vital-label">Resp</div>
          <div className="vital-value">
            <span className={`num ${rrCls}`}>{Math.round(vitals.rr)}</span>
            <span className="unit">/min</span>
          </div>
          <div className="controls">
            <button>▲</button>
            <button>▼</button>
          </div>
        </div>

        {/* SPO2 */}
        <div className="vital spo2">
          <div className="vital-label">SpO₂</div>
          <div className="vital-value">
            <span className={`num ${spCls}`}>{Math.round(vitals.spo2)}</span>
            <span className="unit">%</span>
          </div>
          <div className="controls">
            <button>▲</button>
            <button>▼</button>
          </div>
        </div>

        {/* AVPU */}
        <div className="avpu-row" data-comment-anchor="bc0407ee17-div-182-9">
          {["A", "V", "P", "U"].map((letter) =>
          <button key={letter}
          className={`avpu-btn ${vitals.avpu === letter ? "active" : ""}`}
          onClick={() => onChangeAVPU && onChangeAVPU(letter)}>
              {letter}
            </button>
          )}
        </div>

        {/* PAIN */}
        <div className="vital pain">
          <div>
            <div className="vital-label">Pain</div>
            <div className="vital-value">
              <span className="pain-num">{Math.round(vitals.pain)}</span>
              <span className="unit">/10</span>
            </div>
          </div>
          <div className="pain-scale">
            {Array.from({ length: 10 }).map((_, i) =>
            <div key={i}
            className={`pain-block ${i < vitals.pain ? "fill" : ""} ${vitals.pain >= 8 ? "bad" : ""}`} />
            )}
          </div>
          <div className="controls" style={{ position: "static" }}>
            <button>▲</button>
            <button>▼</button>
          </div>
        </div>
      </div>

      {/* AVPU + GCS readout */}
      <div className="avpu-block" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="mental-grid">
          <div className="mental-col">
            <div className="avpu-label">AVPU · Mental Status</div>
            <div className="avpu-readout">
              <span className={`avpu-letter avpu-${vitals.avpu}`}>{vitals.avpu}</span>
              <span className="avpu-note">
                {vitals.avpu === "A" && "Alert & oriented"}
                {vitals.avpu === "V" && "Responds to verbal"}
                {vitals.avpu === "P" && "Responds to pain only"}
                {vitals.avpu === "U" && "Unresponsive"}
              </span>
            </div>
          </div>
          <div className="mental-col">
            <div className="avpu-label">
              GCS · Glasgow Coma Scale
              <span className="gcs-band-tag" style={{
                color: vitals.gcs >= 13 ? "var(--live)" : vitals.gcs >= 9 ? "var(--warn)" : "var(--danger)"
              }}>
                {vitals.gcs >= 13 ? "MILD" : vitals.gcs >= 9 ? "MODERATE" : "SEVERE"}
              </span>
            </div>
            <div className="gcs-readout">
              <div className={`gcs-num ${vitals.gcs >= 13 ? "good" : vitals.gcs >= 9 ? "warn" : "bad"}`}>
                {vitals.gcs ?? 15}
              </div>
              <div className="gcs-scale-wrap">
                <div className="gcs-scale">
                  <div className="gcs-zone severe" />
                  <div className="gcs-zone moderate" />
                  <div className="gcs-zone mild" />
                  <div className="gcs-marker" style={{
                    left: `${Math.max(0, Math.min(100, ((vitals.gcs ?? 15) - 3) / 12 * 100))}%`
                  }} />
                </div>
                <div className="gcs-scale-labels">
                  <span>3</span><span>8</span><span>12</span><span>15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

window.VitalsPanel = VitalsPanel;