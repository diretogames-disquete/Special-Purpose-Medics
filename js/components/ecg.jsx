/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// =================================================================
// PQRST · Physiologically-accurate ECG waveform
// =================================================================
// viewBox uses TIME on the X axis: 1 unit = 5 ms.
// Fixed intervals (P, PR, QRS, ST) and HR-dependent intervals (T via Bazett,
// TP fills the remainder of the R-R interval).  Animation scrolls at exactly
// one R-R per beat, so cycles arrive in real time.
//
//  ── Reference intervals (adult, lead II):
//     P wave        80 ms       atrial depolarization
//     PR interval   120–200 ms  (P + PR-segment)
//     QRS           70–110 ms   ventricular depolarization
//     ST segment    ~80 ms
//     QT interval   360–440 ms at HR 60; shortens via Bazett: QTc·√(RR/1000)
//     RR interval   60 000 / HR ms
// =================================================================

const MS_PER_UNIT = 5;    // 1 viewBox unit = 5 ms
const BASELINE_Y  = 20;   // viewBox 0..40

// =================================================================
// Per-lead amplitude profile.  Multipliers relative to lead II (1.0).
// Negative values invert that deflection (aVR, V1 T-wave, etc).
// Reference: standard 12-lead morphology, lead II = inferior view.
// =================================================================
const LEADS = {
  'I':   { p: 0.55, q: 0.35, r: 0.65, s: 0.45, t: 0.55,
           view: 'Lateral (RA→LA)' },
  'II':  { p: 1.00, q: 1.00, r: 1.00, s: 1.00, t: 1.00,
           view: 'Inferior (RA→LL) · rhythm strip' },
  'III': { p: 0.45, q: 0.55, r: 0.55, s: 0.35, t: 0.45,
           view: 'Inferior (LA→LL)' },
  'aVR': { p: -0.55, q: -0.40, r: -0.75, s: -0.30, t: -0.55,
           view: 'Right · all deflections inverted' },
  'aVL': { p: 0.30, q: 0.20, r: 0.50, s: 0.35, t: 0.35,
           view: 'High lateral' },
  'aVF': { p: 0.70, q: 0.60, r: 0.85, s: 0.65, t: 0.65,
           view: 'Inferior (foot)' },
  'V1':  { p: 0.30, q: 0.05, r: 0.25, s: 1.30, t: -0.40,
           view: 'Septal · rS pattern, inverted T (normal)' },
  'V2':  { p: 0.40, q: 0.05, r: 0.55, s: 1.40, t: 0.50,
           view: 'Septal' },
  'V3':  { p: 0.50, q: 0.15, r: 0.90, s: 1.00, t: 0.70,
           view: 'Anterior · transition zone' },
  'V4':  { p: 0.55, q: 0.20, r: 1.20, s: 0.50, t: 0.90,
           view: 'Anterior · dominant R' },
  'V5':  { p: 0.50, q: 0.15, r: 1.15, s: 0.20, t: 0.95,
           view: 'Lateral' },
  'V6':  { p: 0.45, q: 0.10, r: 1.00, s: 0.05, t: 0.85,
           view: 'Lateral · pure R' },
};
const LEAD_ORDER = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
window.ECG_LEADS = LEADS;
window.ECG_LEAD_ORDER = LEAD_ORDER;

function computeWave(hr) {
  const RR = 60000 / Math.max(20, hr || 60);   // ms
  const QTc = 380;                              // typical QT-corrected, ms
  const QT  = QTc * Math.sqrt(RR / 1000);       // Bazett-corrected
  const ST  = Math.max(60, Math.min(160, QT * 0.30));
  const T   = Math.max(80, Math.min(220, QT * 0.55));
  const P   = 80;
  const PRseg = 80;
  const QRS = 90;
  const consumed = P + PRseg + QRS + ST + T;
  const TP  = Math.max(20, RR - consumed);
  return { P, PRseg, QRS, ST, T, TP, RR, QT, PR: P + PRseg };
}

// Build a list of per-segment path data for one cycle.
// `amps` carries the per-lead deflection multipliers.
function buildSegments(durs, amps) {
  const u = ms => ms / MS_PER_UNIT;
  const y = BASELINE_Y;
  const a = amps || LEADS.II;
  let x = 0;
  const segs = [];

  // P wave — smooth bump.  Sign of pAmp controls polarity.
  const pW = u(durs.P);
  const pPeak = y - 4 * a.p;
  segs.push({
    id: 'P',
    label: 'P wave',
    desc: 'Atrial depolarization',
    duration: durs.P,
    x0: x, x1: x + pW,
    d: `M${x},${y} C${x + pW * 0.28},${y} ${x + pW * 0.35},${pPeak} ${x + pW * 0.5},${pPeak}` +
       ` C${x + pW * 0.65},${pPeak} ${x + pW * 0.72},${y} ${x + pW},${y}`,
  });
  x += pW;

  // PR segment — flat
  const prW = u(durs.PRseg);
  segs.push({
    id: 'PR',
    label: 'PR segment',
    desc: `AV-node delay · PR interval ${Math.round(durs.PR)} ms`,
    duration: durs.PRseg,
    x0: x, x1: x + prW,
    d: `M${x},${y} L${x + prW},${y}`,
  });
  x += prW;

  // QRS complex — Q dip, R spike, S dip.
  //   q > 0: downward Q (normal small dip)
  //   r > 0: upward R spike; r < 0: deep negative QRS (aVR)
  //   s > 0: downward S (normal); s < 0: upward S/no-S
  const qrsW = u(durs.QRS);
  const qX = x + qrsW * 0.22;
  const rX = x + qrsW * 0.45;
  const sX = x + qrsW * 0.72;
  const eX = x + qrsW;
  const qY = y + 2.5 * a.q;
  const rY = y - 18  * a.r;
  const sY = y + 9   * a.s;
  segs.push({
    id: 'QRS',
    label: 'QRS complex',
    desc: `Ventricular depolarization · ${Math.round(durs.QRS)} ms`,
    duration: durs.QRS,
    x0: x, x1: eX,
    d: `M${x},${y} L${qX},${qY} L${rX},${rY} L${sX},${sY} L${eX},${y}`,
  });
  x = eX;

  // ST segment — flat
  const stW = u(durs.ST);
  segs.push({
    id: 'ST',
    label: 'ST segment',
    desc: `Plateau · ${Math.round(durs.ST)} ms`,
    duration: durs.ST,
    x0: x, x1: x + stW,
    d: `M${x},${y} L${x + stW},${y}`,
  });
  x += stW;

  // T wave — rounded bump.  Sign of tAmp controls polarity (V1 inverts).
  const tW = u(durs.T);
  const tPeak = y - 7 * a.t;
  segs.push({
    id: 'T',
    label: 'T wave',
    desc: `Ventricular repolarization · QT ${Math.round(durs.QT)} ms`,
    duration: durs.T,
    x0: x, x1: x + tW,
    d: `M${x},${y} C${x + tW * 0.30},${y} ${x + tW * 0.35},${tPeak} ${x + tW * 0.5},${tPeak}` +
       ` C${x + tW * 0.65},${tPeak} ${x + tW * 0.70},${y} ${x + tW},${y}`,
  });
  x += tW;

  // TP segment — electrical diastole
  const tpW = u(durs.TP);
  segs.push({
    id: 'TP',
    label: 'TP segment',
    desc: `Electrical diastole · ${Math.round(durs.TP)} ms`,
    duration: durs.TP,
    x0: x, x1: x + tpW,
    d: `M${x},${y} L${x + tpW},${y}`,
  });

  return { segments: segs, cycleW: x + tpW };
}

// =================================================================
// Component
// =================================================================
function PqrstWave({ hr = 80, color = '#6fd99a', interactive = true, height = 150, visibleCycles = 4, lead = 'II' }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [tip, setTip] = useState(null);
  const svgRef = useRef(null);

  const amps = LEADS[lead] || LEADS.II;
  const durs = useMemo(() => computeWave(hr), [hr]);
  const { segments, cycleW } = useMemo(() => buildSegments(durs, amps), [durs, amps]);

  // Render cycles + 1 trailing cycle so the scroll loops seamlessly
  const renderedCycles = visibleCycles + 1;
  const totalW = cycleW * renderedCycles;

  // Animation duration: one RR per beat → one cycleW per (60/HR) seconds
  const beatSec = durs.RR / 1000;

  // Grid: 5mm-equivalent lines (200 ms = 40 units) heavier; 1mm (40 ms = 8 units) lighter
  const bigGrid = 40;   // 200ms
  const smGrid  = 8;    // 40ms

  // Hit-test pointer position → segment
  const onMove = (e) => {
    if (!interactive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * totalW;
    const localX = ((x % cycleW) + cycleW) % cycleW;
    const seg = segments.find(s => localX >= s.x0 && localX <= s.x1);
    if (seg) {
      setHoveredId(seg.id);
      setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, seg });
    } else {
      setHoveredId(null);
      setTip(null);
    }
  };
  const onLeave = () => { setHoveredId(null); setTip(null); };

  // Build interval annotations for the top of the strip (from the rightmost
  // "live" cycle so users see the latest).  Position on the second-from-last
  // rendered cycle for stable visual placement.
  const annoCycleOffset = (renderedCycles - 2) * cycleW;
  const annotations = [
    { id: 'P', start: 0, end: segments[0].x1, label: `P  ${Math.round(durs.P)}ms`, y: 4 },
    { id: 'PR', start: 0, end: segments[0].x1 + (segments[1].x1 - segments[1].x0), label: `PR  ${Math.round(durs.PR)}ms`, y: 38 },
    { id: 'QRS', start: segments[2].x0, end: segments[2].x1, label: `QRS  ${Math.round(durs.QRS)}ms`, y: 4 },
    { id: 'QT', start: segments[2].x0, end: segments[4].x1, label: `QT  ${Math.round(durs.QT)}ms`, y: 38 },
  ];

  return (
    <div className="pqrst-wrap" style={{ height }}>
      <svg
        ref={svgRef}
        className="pqrst-svg"
        viewBox={`0 0 ${totalW} 40`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        role="img"
        aria-label={`ECG · HR ${Math.round(hr)} bpm · RR ${Math.round(durs.RR)} ms`}
      >
        {/* grid — fine + coarse */}
        <g className="pqrst-grid fine">
          {Array.from({ length: Math.floor(totalW / smGrid) + 1 }).map((_, i) => (
            <line key={'sv' + i} x1={i * smGrid} y1="0" x2={i * smGrid} y2="40" />
          ))}
        </g>
        <g className="pqrst-grid coarse">
          {Array.from({ length: Math.floor(totalW / bigGrid) + 1 }).map((_, i) => (
            <line key={'cv' + i} x1={i * bigGrid} y1="0" x2={i * bigGrid} y2="40" />
          ))}
          {[10, 20, 30].map(y => (
            <line key={'h' + y} x1="0" y1={y} x2={totalW} y2={y} />
          ))}
        </g>

        {/* scrolling waveform group — one R-R per (60/HR) seconds */}
        <g
          className="pqrst-scroller"
          style={{
            animationDuration: beatSec + 's',
            '--cycle-w': cycleW + 'px',
          }}
        >
          {Array.from({ length: renderedCycles }).map((_, k) => (
            <g key={k} transform={`translate(${k * cycleW}, 0)`}>
              {segments.map(seg => (
                <path
                  key={seg.id}
                  className={'pqrst-seg seg-' + seg.id + (hoveredId === seg.id ? ' on' : '')}
                  d={seg.d}
                  stroke={color}
                  fill="none"
                />
              ))}
            </g>
          ))}

          {/* per-cycle interval brackets, scrolling with the strip */}
          {Array.from({ length: renderedCycles }).map((_, k) => (
            <g key={'a' + k} transform={`translate(${k * cycleW}, 0)`} className="pqrst-anno">
              {annotations.map(a => (
                <g key={a.id} className={'anno-' + a.id + (hoveredId === a.id ? ' on' : '')}>
                  <line x1={a.start} y1={a.y} x2={a.end} y2={a.y} />
                  <line x1={a.start} y1={a.y - 1.5} x2={a.start} y2={a.y + 1.5} />
                  <line x1={a.end}   y1={a.y - 1.5} x2={a.end}   y2={a.y + 1.5} />
                  <text x={(a.start + a.end) / 2} y={a.y - 2} className="anno-lbl">{a.label}</text>
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>

      {interactive && tip && (
        <div className="pqrst-tip" style={{ left: tip.x, top: tip.y }}>
          <div className="t-id">{tip.seg.label}</div>
          <div className="t-desc">{tip.seg.desc}</div>
        </div>
      )}

      {interactive && (
        <div className="pqrst-legend">
          <div className="leg-stats">
            <span><b>RR</b> {Math.round(durs.RR)} ms</span>
            <span><b>PR</b> {Math.round(durs.PR)} ms</span>
            <span><b>QRS</b> {Math.round(durs.QRS)} ms</span>
            <span><b>QT</b> {Math.round(durs.QT)} ms</span>
            <span><b>Rate</b> {Math.round(hr)} bpm</span>
          </div>
          <div className="leg-chips">
            {segments.filter(s => s.id === 'P' || s.id === 'QRS' || s.id === 'T').map(s => (
              <button
                key={s.id}
                className={'leg-chip' + (hoveredId === s.id ? ' on' : '')}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <span className="leg-letter">{s.id}</span>
                <span className="leg-text">{s.desc.split('·')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.PqrstWave = PqrstWave;
