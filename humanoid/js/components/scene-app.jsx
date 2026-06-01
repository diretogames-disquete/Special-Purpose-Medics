// scene-app.jsx — Humanoid casualty-reach scene

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pulse": 80,
  "sysBP": 104,
  "diaBP": 68,
  "resp": 18,
  "spo2": 97,
  "triage": "IMMEDIATE",
  "evac": "URGENT",
  "soundOn": false,
  "soundMode": "beep",
  "soundVolume": 0.55,
  "patientName": "RODRIGUES, J.",
  "patientRoster": "7004",
  "patientUnit": "USA · A/843",
  "patientSex": "M",
  "patientWeight": 90,
  "patientAllergies": "NKDA",
  "patientBlood": "A+",
  "cardOpacity": 16,
  "cardBlur": 24,
  "theme": "dark",
  "glowOn": true
}/*EDITMODE-END*/;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Innovation front ────────────────────────────────────────────────────────
// Real-world autonomous-systems programs that contextualize the brief:
// the robotic teammates the narrative calls for already exist in the field.
const INNOVATIONS = [
  { org: 'UTEP Aerospace Center', tag: 'Next-Gen UAS Frontier',
    focus: 'Research & training for next-generation unmanned aircraft',
    caps: ['Autonomy', 'Sensing & perception', 'Secure comms', 'AI', 'Cooperative / swarm', 'Real-time adaptation'] },
  { org: 'Frontier Robotics', tag: 'Subsea Autonomy',
    focus: 'Underwater robotics & platform-agnostic ROV enhancement',
    caps: ['Stereo vision', 'Edge computing', '3D mapping', 'SLAM', 'Autonomous inspection'] },
  { org: 'Fly4Future', tag: 'Autonomous UAV Research',
    focus: 'Fully autonomous research drones, indoor & outdoor',
    caps: ['AI training', 'Visual algorithms', 'Multi-robot', 'Swarm applications'] },
  { org: 'Frontline Robotics', tag: 'EW-Resilient Recon',
    focus: 'Reconnaissance in contested, GNSS-denied environments',
    caps: ['AI navigation', 'Payload support', 'ISR missions', 'GNSS-denied ops'] },
  { org: 'MoneyProUAV · 2026', tag: 'Field Trends',
    focus: 'Where combat & industrial UAVs are heading in 2026',
    caps: ['BVLOS', 'Fiber-optic control', 'Swarm tech', 'Autonomous combat drones'] },
  { org: 'Epoch AI', tag: 'Capability Benchmarks',
    focus: 'Evaluating what autonomous robots can actually do in 2026',
    caps: ['Industrial tasks', 'Household tasks', 'Capability evaluation'] },
  { org: 'Fdata', tag: 'Autonomous Mobile Robots',
    focus: 'AMRs for logistics, transport & humanoid handling',
    caps: ['LiDAR / camera nav', 'Warehouse transport', 'Pallet handling', 'Humanoid handling'] },
  { org: 'Failory · 2026', tag: 'Startup Landscape',
    focus: 'Drone & ground-robot startups to watch',
    caps: ['Open-source drone OS', 'Aerial intelligence', 'Delivery', 'Recon', 'Counter-drone'] },
];

// ── Status / clinical-range helpers ────────────────────────────────────────
// Returns "normal" | "warn" | "crit"
const statusPulse = (p) =>
  (p >= 60 && p <= 100) ? 'normal'
  : ((p >= 50 && p < 60) || (p > 100 && p <= 120)) ? 'warn'
  : 'crit';
const statusSys = (s) =>
  (s >= 90 && s <= 130) ? 'normal'
  : ((s >= 80 && s < 90) || (s > 130 && s <= 159)) ? 'warn'
  : 'crit';
const statusDia = (d) =>
  (d >= 60 && d <= 85) ? 'normal'
  : ((d >= 50 && d < 60) || (d > 85 && d <= 99)) ? 'warn'
  : 'crit';
const statusResp = (r) =>
  (r >= 12 && r <= 20) ? 'normal'
  : ((r >= 8 && r < 12) || (r > 20 && r <= 30)) ? 'warn'
  : 'crit';
const statusSpO2 = (s) =>
  (s >= 95) ? 'normal'
  : (s >= 90) ? 'warn'
  : 'crit';
const statusMAP = (m) =>
  (m >= 65 && m <= 100) ? 'normal'
  : ((m >= 60 && m < 65) || (m > 100 && m <= 110)) ? 'warn'
  : 'crit';
const mapLabel = (m) => {
  if (m < 60) return 'INADEQUATE';
  if (m < 65) return 'MARGINAL';
  if (m <= 100) return 'ADEQUATE PERFUSION';
  if (m <= 110) return 'ELEVATED';
  return 'CRITICAL HIGH';
};
const rank = { normal: 0, warn: 1, crit: 2 };
const worst = (...arr) => arr.reduce((a, b) => rank[a] >= rank[b] ? a : b);

// ── ECG waveform (PQRST) — based on Normal Sinus Rhythm shape ──────────────
// Amplitude in fraction of half-height. R at t≈0.20, T at t≈0.42.
const ECG_POINTS = [
  [0.00,  0.00],
  [0.04,  0.08],
  [0.07,  0.13],   // P peak
  [0.10,  0.06],
  [0.14,  0.00],
  [0.17,  0.00],
  [0.185,-0.18],   // Q
  [0.200, 1.10],   // R peak (sharp)
  [0.215,-0.42],   // S
  [0.235,-0.05],
  [0.27,  0.00],
  [0.37,  0.00],
  [0.42,  0.22],   // T peak
  [0.50,  0.04],
  [0.55,  0.00],
  [1.00,  0.00],
];
function ecgAt(t) {
  for (let i = 0; i < ECG_POINTS.length - 1; i++) {
    const [t0, y0] = ECG_POINTS[i];
    const [t1, y1] = ECG_POINTS[i+1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return y0 + (y1 - y0) * k;
    }
  }
  return 0;
}

// ── Heart-sound audio (Web Audio API) ──────────────────────────────────────
// Two modes: 'beep' (hospital-monitor tone) or 'lubdub' (S1 + S2 thump).
const HeartAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = false;
  let volume = 0.55;
  let toneHz = 880;
  let mode = 'beep';

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function thump(when, { f0, f1, dur, vol }) {
    if (!ctx || !masterGain || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f1, when + dur * 0.7);
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 0.6;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    osc.connect(lp).connect(gain).connect(masterGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function playBeep() {
    const c = ensure(); if (!c || !enabled) return;
    const when = c.currentTime;
    const dur = 0.055;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(toneHz, when);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.9, when + 0.004);
    gain.gain.setValueAtTime(0.9, when + dur * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    osc.connect(gain).connect(masterGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function playLubDub() {
    const c = ensure(); if (!c || !enabled) return;
    const t1 = c.currentTime;
    // S1 ("lub") — lower, longer
    thump(t1, { f0: 95, f1: 28, dur: 0.13, vol: 0.85 });
    // S2 ("dub") — slightly higher, shorter, ~140 ms later
    thump(t1 + 0.14, { f0: 125, f1: 40, dur: 0.09, vol: 0.6 });
  }

  return {
    setEnabled(v) { enabled = !!v; if (v) ensure(); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (masterGain) masterGain.gain.value = volume;
    },
    setMode(m) { mode = (m === 'lubdub') ? 'lubdub' : 'beep'; },
    setTone(hz) { toneHz = hz; },
    isEnabled() { return enabled; },
    // Fires one heart-sound event per beat. Mode decides waveform.
    beat() {
      if (!enabled) return;
      if (mode === 'lubdub') playLubDub();
      else playBeep();
    },
  };
})();

// ── ECG canvas ─────────────────────────────────────────────────────────────
function ECGTrace({ pulse, color, onBeat }) {
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ x: 0, y: null, last: 0, raf: 0, beatPos: 0 });
  const onBeatRef = React.useRef(onBeat);
  React.useEffect(() => { onBeatRef.current = onBeat; }, [onBeat]);
  const colorRef = React.useRef(color);
  React.useEffect(() => { colorRef.current = color; }, [color]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;
    const dpr = window.devicePixelRatio || 1;
    const getBg = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--canvas-bg').trim() || '#07090a';

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = getBg();
      ctx.fillRect(0, 0, w, h);
      stateRef.current.x = 0;
      stateRef.current.y = h * 0.55;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Re-paint background when theme changes
    const themeObs = new MutationObserver(() => {
      ctx.fillStyle = getBg();
      ctx.fillRect(0, 0, w, h);
      stateRef.current.x = 0;
      stateRef.current.y = h * 0.55;
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const baseline = () => h * 0.55;
    const amp = () => h * 0.40;
    const beatSec = () => 60 / pulse;
    const visibleBeats = 3;
    const sweepPxPerSec = () => w / (visibleBeats * beatSec());

    // Beat trigger — fire onBeat() once per beat when beatPos crosses the R-peak (0.20).
    const THRESH_R = 0.20;
    const crossed = (prev, next, thr) => {
      if (next >= prev) return prev < thr && next >= thr;
      // wrapped past 1
      return prev < thr || next >= thr;
    };

    const frame = (now) => {
      const s = stateRef.current;
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0;
      s.last = now;

      const dx = Math.max(0.5, sweepPxPerSec() * dt);
      let newX = s.x + dx;
      while (newX >= w) newX -= w;

      // CRT-style trail wipe
      const gap = Math.max(18, w * 0.045);
      ctx.fillStyle = getBg();
      if (newX + gap <= w) {
        ctx.fillRect(newX, 0, gap, h);
      } else {
        ctx.fillRect(newX, 0, w - newX, h);
        ctx.fillRect(0, 0, gap - (w - newX), h);
      }

      const newBeatPos = (s.beatPos + dt / beatSec()) % 1;
      // One beep per beat — fire at R-peak crossing.
      if (onBeatRef.current && crossed(s.beatPos, newBeatPos, THRESH_R)) {
        onBeatRef.current();
      }
      s.beatPos = newBeatPos;

      const targetY = baseline() - ecgAt(s.beatPos) * amp();
      const stroke = colorRef.current || '#4ade80';

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 7;

      if (newX > s.x) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(newX, targetY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(w, targetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(newX, targetY);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      s.x = newX;
      s.y = targetY;
      s.raf = requestAnimationFrame(frame);
    };
    stateRef.current.raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
      themeObs.disconnect();
    };
  }, [pulse]);

  return <canvas ref={canvasRef} />;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const SoundOnIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h2.5L9 3v10L5.5 10H3z" fill="currentColor" stroke="none" />
    <path d="M11 5.5c.9 1 .9 4 0 5" />
    <path d="M13 4c1.8 1.8 1.8 6.2 0 8" />
  </svg>
);
const SoundOffIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h2.5L9 3v10L5.5 10H3z" fill="currentColor" stroke="none" />
    <path d="M11 6l4 4M15 6l-4 4" />
  </svg>
);

// ── Stepper ────────────────────────────────────────────────────────────────
function Steppers({ onUp, onDown }) {
  return (
    <div className="steppers" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onUp} aria-label="increase">▲</button>
      <button type="button" onClick={onDown} aria-label="decrease">▼</button>
    </div>
  );
}

function VitalTile({ k, value, suffix, status, min, max, step = 1, className = '', onChange, headerRight }) {
  const inc = () => onChange(Math.min(max, value + step));
  const dec = () => onChange(Math.max(min, value - step));
  return (
    <div className={`vital ${className}`} data-status={status}>
      <div className="stack">
        <div className="k">
          <span>{k}</span>
          {headerRight}
        </div>
        <div className="v">{value}{suffix && <sup>{suffix}</sup>}</div>
      </div>
      <Steppers onUp={inc} onDown={dec} />
    </div>
  );
}

// ── Numeric field with ArrowUp / ArrowDown stepping ────────────────────────
function NumField({ value, min, max, onChange, width = '2.4ch' }) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  return (
    <input
      className="numfield"
      style={{ width }}
      value={value}
      inputMode="numeric"
      onChange={(e) => {
        const n = parseInt(e.target.value || '0', 10);
        if (!Number.isNaN(n)) onChange(clamp(n));
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp')   { e.preventDefault(); onChange(clamp(value + 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - 1)); }
      }}
      onWheel={(e) => {
        if (document.activeElement !== e.currentTarget) return;
        e.preventDefault();
        onChange(clamp(value + (e.deltaY < 0 ? 1 : -1)));
      }}
    />
  );
}

// ── BP tile with derived MAP (read-only) ───────────────────────────────────
function BPTile({ sys, dia, onSys, onDia }) {
  // MAP is purely a function of the BP inputs — read-only.
  const map = Math.round((sys + 2 * dia) / 3);
  const sStatus = statusSys(sys);
  const dStatus = statusDia(dia);
  const bpStatus = worst(sStatus, dStatus);
  const mStatus = statusMAP(map);
  return (
    <div className="vital bp-tile" data-status={bpStatus} data-map-status={mStatus}>
      <div className="bp-grid">
        <div className="bp-main">
          <div className="k">BP · sys / dia · mmHg</div>
          <div className="bp-fields">
            <div className="bp-cell">
              <NumField value={sys} min={60} max={220} onChange={onSys} />
              <span className="bp-step" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => onSys(Math.min(220, sys + 1))} aria-label="sys up">▴</button>
                <button type="button" onClick={() => onSys(Math.max(60, sys - 1))} aria-label="sys down">▾</button>
              </span>
            </div>
            <span className="sep">/</span>
            <div className="bp-cell">
              <NumField value={dia} min={30} max={140} onChange={onDia} />
              <span className="bp-step" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => onDia(Math.min(140, dia + 1))} aria-label="dia up">▴</button>
                <button type="button" onClick={() => onDia(Math.max(30, dia - 1))} aria-label="dia down">▾</button>
              </span>
            </div>
          </div>
        </div>
        <div className="bp-divider" />
        <div className="bp-map">
          <div className="k">MAP · derived</div>
          <div className="v">{map}<sup>mmHg</sup></div>
          <div className="status">{mapLabel(map)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Subject card (DD-1380 chrome) ──────────────────────────────────────────
const TRIAGE_OPTS = [
  { v: 'IMMEDIATE', label: 'IMM', cls: 'triage-imm' },
  { v: 'DELAYED',   label: 'DEL', cls: 'triage-del' },
  { v: 'MINIMAL',   label: 'MIN', cls: 'triage-min' },
  { v: 'EXPECTANT', label: 'EXP', cls: 'triage-exp' },
];
const EVAC_OPTS = [
  { v: 'URGENT',   cls: 'evac-urgent' },
  { v: 'PRIORITY', cls: 'evac-priority' },
  { v: 'ROUTINE',  cls: 'evac-routine' },
];

function SubjectCard({
  name, roster, unit, sex, weight, allergies, blood,
  evac, triage,
  onEvac, onTriage, onBlood,
}) {
  return (
    <div className="subject-card">
      <div className="sc-row sc-head">
        <div className="sc-headinfo">
          <div className="sc-name">{name}</div>
          <div className="sc-meta">#{roster} · {unit}</div>
        </div>
        <button
          type="button"
          className="sc-blood"
          onClick={onBlood}
          title="Cycle blood type"
        >{blood}</button>
      </div>
      <div className="sc-row sc-stats">
        <span><b>{sex}</b></span>
        <span className="sep">·</span>
        <span><b>{weight}</b> kg</span>
        <span className="sep">·</span>
        <span title="Allergies">{allergies}</span>
      </div>
      <div className="sc-row sc-chiprow">
        <div className="sc-k">Evac</div>
        <div className="sc-chips">
          {EVAC_OPTS.map(({ v, cls }) => (
            <button
              key={v} type="button"
              className={`sc-chip ${cls} ${evac === v ? 'active' : ''}`}
              onClick={() => onEvac(v)}
              title={v}
            >{v.slice(0, 3)}</button>
          ))}
        </div>
      </div>
      <div className="sc-row sc-chiprow">
        <div className="sc-k">Triage</div>
        <div className="sc-chips">
          {TRIAGE_OPTS.map(({ v, label, cls }) => (
            <button
              key={v} type="button"
              className={`sc-chip ${cls} ${triage === v ? 'active' : ''}`}
              onClick={() => onTriage(v)}
              title={v}
            >{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ZT clock ───────────────────────────────────────────────────────────────
function useClock(startMins = 21 * 60 + 3) {
  const [mins, setMins] = React.useState(startMins);
  React.useEffect(() => {
    const id = setInterval(() => setMins((m) => (m + 1) % (24 * 60)), 6000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const zt = useClock();

  // Pulse-driven CSS variable
  React.useEffect(() => {
    const beatMs = Math.round(60000 / t.pulse);
    document.documentElement.style.setProperty('--beat-ms', beatMs + 'ms');
  }, [t.pulse]);

  // Card transparency / blur tweaks
  React.useEffect(() => {
    document.documentElement.style.setProperty('--card-opacity', (t.cardOpacity / 100).toFixed(3));
    document.documentElement.style.setProperty('--card-blur', t.cardBlur + 'px');
  }, [t.cardOpacity, t.cardBlur]);

  // Theme
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme || 'dark');
  }, [t.theme]);

  // Cursor glow tracking
  const glowRef = React.useRef(null);
  React.useEffect(() => {
    if (!t.glowOn) return;
    let raf = null, tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    const handler = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--glow-x', tx + 'px');
          document.documentElement.style.setProperty('--glow-y', ty + 'px');
          raf = null;
        });
      }
    };
    window.addEventListener('mousemove', handler);
    window.addEventListener('pointermove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('pointermove', handler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [t.glowOn]);

  // Heart-sound state sync
  React.useEffect(() => {
    HeartAudio.setEnabled(!!t.soundOn);
  }, [t.soundOn]);
  React.useEffect(() => {
    HeartAudio.setVolume(t.soundVolume ?? 0.55);
  }, [t.soundVolume]);
  React.useEffect(() => {
    HeartAudio.setMode(t.soundMode || 'beep');
  }, [t.soundMode]);

  // Hide loader, strip Spline logo
  React.useEffect(() => {
    const viewer = document.querySelector('spline-viewer');
    const loader = document.getElementById('loader');
    if (!viewer || !loader) return;
    const hide = () => {
      loader.classList.add('hidden');
      setTimeout(() => loader && loader.remove(), 700);
    };
    viewer.addEventListener('load', hide);
    const fallback = setTimeout(hide, 8000);
    const stripLogo = () => {
      const root = viewer.shadowRoot;
      if (!root) return;
      const logo = root.getElementById('logo') || root.querySelector('#logo, a[href*="spline"], [part="logo"]');
      if (logo) logo.remove();
      if (!root.querySelector('#__hide_logo')) {
        const s = document.createElement('style');
        s.id = '__hide_logo';
        s.textContent = `#logo, a[href*="spline"], [part="logo"] { display:none !important; visibility:hidden !important; opacity:0 !important; pointer-events:none !important; }`;
        root.appendChild(s);
      }
    };
    let n = 0;
    const tick = setInterval(() => { stripLogo(); if (++n > 40) clearInterval(tick); }, 150);
    viewer.addEventListener('load', () => {
      stripLogo();
      if (viewer.shadowRoot) {
        new MutationObserver(stripLogo).observe(viewer.shadowRoot, { childList: true, subtree: true });
      }
    });
    return () => { clearTimeout(fallback); clearInterval(tick); };
  }, []);

  // Status calculations
  const pStat = statusPulse(t.pulse);
  const rStat = statusResp(t.resp);
  const sStat = statusSpO2(t.spo2);
  const map = Math.round((t.sysBP + 2 * t.diaBP) / 3);
  const bpOverall = worst(statusSys(t.sysBP), statusDia(t.diaBP), statusMAP(map));
  const overall = worst(pStat, rStat, sStat, bpOverall);

  // ECG color follows pulse status
  const statusColor = { normal: '#4ade80', warn: '#facc15', crit: '#ef4444' };
  const ecgColor = statusColor[pStat];
  const overallColor = statusColor[overall];

  // Glow color tied to overall patient state
  React.useEffect(() => {
    document.documentElement.style.setProperty('--glow-color', overallColor);
  }, [overallColor]);

  // WebGL ambient field tracks the patient's state — its motion behind the
  // glass text panel shifts green (stable) → amber (guarded) → red (critical),
  // and the field's pulse tempo follows the live heart rate.
  React.useEffect(() => {
    if (!window.PFC_BG) return;
    window.PFC_BG.setGlass(true); // brighten the field so it reads behind the humanoid
    const level = overall === 'crit' ? 'critical' : overall === 'warn' ? 'urgent' : 'stable';
    window.PFC_BG.setCondition(level, { hr: t.pulse });
  }, [overall, t.pulse]);

  // Audio toggle handler — must run inside a user gesture to satisfy autoplay
  const toggleSound = () => {
    const next = !t.soundOn;
    if (next) {
      // create / resume context inside the click
      HeartAudio.setEnabled(true);
      HeartAudio.beat();
    } else {
      HeartAudio.setEnabled(false);
    }
    setTweak('soundOn', next);
  };

  // One sound per pulse, fired from the ECG R-peak crossing.
  const handleBeat = React.useCallback(() => {
    HeartAudio.beat();
  }, []);

  const evacClass = t.evac.toLowerCase();

  return (
    <>
      {t.glowOn && <div className="cursor-glow" aria-hidden="true" />}
      <div className="frame">

        {/* TOP BAR */}
        <div className="topbar">
          <div className="left">
            <span className="beat-dot" aria-hidden="true" style={{ background: ecgColor, boxShadow: `0 0 8px ${ecgColor}` }}></span>
            <span className="crumb"><b>HUMANOID</b> · UNIT 01</span>
            <span className="sep"></span>
            <span className="crumb optional">CASE <b>7004</b> · ROSTER HOO332</span>
            <span className="sep optional"></span>
            <span className="crumb">ZT <b>{zt}</b></span>
            <button
              type="button"
              className="tweaks-btn"
              onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
              title="Open Vitals Tweaks"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="5" cy="4" r="1.5" />
                <line x1="5" y1="1" x2="5" y2="2.5" />
                <line x1="5" y1="5.5" x2="5" y2="15" />
                <circle cx="11" cy="8" r="1.5" />
                <line x1="11" y1="1" x2="11" y2="6.5" />
                <line x1="11" y1="9.5" x2="11" y2="15" />
              </svg>
              Vitals
            </button>
          </div>
          <div className="right">
            <span className="crumb" style={{ color: overall === 'crit' ? '#ef4444' : overall === 'warn' ? '#facc15' : 'var(--mint)' }}>
              {overall === 'crit' ? 'CRITICAL' : overall === 'warn' ? 'GUARDED' : 'STABLE'}
            </span>
            <span className="sep"></span>
            <span className={`badge ${evacClass}`}><span className="pip"></span> EVAC · {t.evac}</span>
          </div>
        </div>

        {/* STAGE */}
        <div className="stage">
          <spline-viewer url={(typeof window !== 'undefined' && window.__resources && window.__resources.splineScene) || 'scene.splinecode'} loading-anim-type="none"></spline-viewer>

          <div className="ticks" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>

          <div className="stage-corner-r">
            <span className="live"><span className="pip" style={{ background: ecgColor, boxShadow: `0 0 8px ${ecgColor}` }}></span> TELEMETRY · STREAMING</span>
            <span>LAT 34.8421° · LON 38.9956°</span>
            <span>UPLINK · MESH · 142 ms</span>
          </div>

          <SubjectCard
            name={t.patientName}
            roster={t.patientRoster}
            unit={t.patientUnit}
            sex={t.patientSex}
            weight={t.patientWeight}
            allergies={t.patientAllergies}
            blood={t.patientBlood}
            evac={t.evac}
            triage={t.triage}
            onEvac={(v) => setTweak('evac', v)}
            onTriage={(v) => setTweak('triage', v)}
            onBlood={() => {
              const i = BLOOD_TYPES.indexOf(t.patientBlood);
              setTweak('patientBlood', BLOOD_TYPES[(i + 1) % BLOOD_TYPES.length]);
            }}
          />
        </div>

        {/* PANEL */}
        <div className="panel">
          <div className="eyebrow"><span className="line"></span> Field Brief · 0001</div>
          <h1>The battlefield<br/>has changed.</h1>
          <div className="body">
            <p>Drone-saturated skies deny MEDEVAC. The <em>golden hour</em> stretches into days. And the most highly trained medics on earth are left carrying casualties out on their backs.</p>
            <p className="pull">It doesn't have to be this way.</p>
            <p>Robotic teammates — humanoid litter-bearers, autonomous resupply mules, tethered ISR streaming vitals to a surgeon a continent away — close the gap between point of injury and definitive care.</p>
            <p>They don't replace operators. They give them the <em>time</em>, the <em>supplies</em>, and the <em>reach</em> to keep a teammate breathing until exfil arrives.</p>
          </div>
          <div className="divider">
            <span className="rule"></span><span>Closing Statement</span><span className="rule"></span>
          </div>
          <div className="close">
            <div>
              <div className="label">Status</div>
              <div className="value mint">The technology exists.</div>
            </div>
            <div>
              <div className="label">Timing</div>
              <div className="value">The need is now.</div>
            </div>
          </div>

          {/* INNOVATION FRONT — real programs that prove the brief */}
          <div className="divider">
            <span className="rule"></span><span>The Innovation Front</span><span className="rule"></span>
          </div>
          <p className="innov-lead">
            These aren't concepts. Across autonomy, swarm, subsea and contested-EW
            domains, the building blocks of a robotic medical-reach chain are
            already fielded today.
          </p>
          <div className="innov-grid">
            {INNOVATIONS.map((it, i) => (
              <div className="innov-card" key={i}>
                <div className="ic-head">
                  <span className="ic-org">{it.org}</span>
                  <span className="ic-tag">{it.tag}</span>
                </div>
                <div className="ic-focus">{it.focus}</div>
                <div className="ic-caps">
                  {it.caps.map((c, j) => <span className="ic-cap" key={j}>{c}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="innov-foot">
            8 programs · autonomy · sensing · swarm · subsea · EW-resilient ISR · AMRs
          </div>
        </div>

        {/* BOTTOM VITALS */}
        <div className="bottom">
          <VitalTile
            k="Pulse"
            value={t.pulse}
            suffix="BPM"
            status={pStat}
            min={30} max={220}
            className="pulse-tile"
            onChange={(v) => setTweak('pulse', v)}
            headerRight={
              <button
                type="button"
                className={`audio-toggle ${t.soundOn ? 'on' : ''}`}
                onClick={toggleSound}
                aria-label={t.soundOn ? 'Mute heart sound' : 'Unmute heart sound'}
                title={t.soundOn ? 'Mute heart sound' : 'Heart sound · click to enable'}
              >
                {t.soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
              </button>
            }
          />
          <BPTile
            sys={t.sysBP} dia={t.diaBP}
            onSys={(v) => setTweak('sysBP', v)}
            onDia={(v) => setTweak('diaBP', v)}
          />
          <VitalTile k="Resp" value={t.resp} suffix="/MIN"
            status={rStat} min={4} max={60}
            onChange={(v) => setTweak('resp', v)} />
          <VitalTile k="SpO₂" value={t.spo2} suffix="%"
            status={sStat} min={50} max={100}
            onChange={(v) => setTweak('spo2', v)} />
          <div className="ecg" data-status={pStat}>
            <div className="k">ECG · Lead II</div>
            <ECGTrace pulse={t.pulse} color={ecgColor} onBeat={handleBeat} />
            <div className="bpm-tag">{t.pulse} bpm</div>
          </div>
        </div>

      </div>

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Vitals · Tweaks">
        <TweakSection label="Live Vitals" />
        <TweakSlider label="Pulse" value={t.pulse} min={30} max={220} unit=" bpm"
                     onChange={(v) => setTweak('pulse', v)} />
        <TweakSlider label="BP · Sys" value={t.sysBP} min={60} max={220} unit=" mmHg"
                     onChange={(v) => setTweak('sysBP', v)} />
        <TweakSlider label="BP · Dia" value={t.diaBP} min={30} max={140} unit=" mmHg"
                     onChange={(v) => setTweak('diaBP', v)} />
        <TweakSlider label="Resp" value={t.resp} min={4} max={60} unit=" /min"
                     onChange={(v) => setTweak('resp', v)} />
        <TweakSlider label="SpO₂" value={t.spo2} min={50} max={100} unit=" %"
                     onChange={(v) => setTweak('spo2', v)} />

        <TweakSection label="Triage" />
        <TweakSelect label="Triage cat." value={t.triage}
                     options={['IMMEDIATE', 'DELAYED', 'MINIMAL', 'EXPECTANT']}
                     onChange={(v) => setTweak('triage', v)} />
        <TweakRadio label="Evac priority" value={t.evac}
                    options={['URGENT', 'PRIORITY', 'ROUTINE']}
                    onChange={(v) => setTweak('evac', v)} />

        <TweakSection label="Display" />
        <TweakRadio label="Theme" value={t.theme || 'dark'}
                    options={['dark', 'light']}
                    onChange={(v) => setTweak('theme', v)} />
        <TweakToggle label="Gaze glow" value={!!t.glowOn}
                     onChange={(v) => setTweak('glowOn', v)} />

        <TweakSection label="Card" />
        <TweakSlider label="Opacity" value={t.cardOpacity}
                     min={0} max={100} unit=" %"
                     onChange={(v) => setTweak('cardOpacity', v)} />
        <TweakSlider label="Blur" value={t.cardBlur}
                     min={0} max={50} unit=" px"
                     onChange={(v) => setTweak('cardBlur', v)} />

        <TweakSection label="Patient" />
        <TweakText label="Name" value={t.patientName}
                   onChange={(v) => setTweak('patientName', v)} />
        <TweakText label="Roster #" value={t.patientRoster}
                   onChange={(v) => setTweak('patientRoster', v)} />
        <TweakText label="Svc · Unit" value={t.patientUnit}
                   onChange={(v) => setTweak('patientUnit', v)} />
        <TweakRadio label="Sex" value={t.patientSex}
                    options={['M', 'F']}
                    onChange={(v) => setTweak('patientSex', v)} />
        <TweakSlider label="Weight" value={t.patientWeight}
                     min={20} max={200} unit=" kg"
                     onChange={(v) => setTweak('patientWeight', v)} />
        <TweakSelect label="Blood" value={t.patientBlood}
                     options={BLOOD_TYPES}
                     onChange={(v) => setTweak('patientBlood', v)} />
        <TweakText label="Allergies" value={t.patientAllergies}
                   onChange={(v) => setTweak('patientAllergies', v)} />

        <TweakSection label="Heart sound" />
        <TweakToggle label="Audio" value={t.soundOn}
                     onChange={(v) => { setTweak('soundOn', v); HeartAudio.setEnabled(v); if (v) HeartAudio.beat(); }} />
        <TweakRadio label="Sound" value={t.soundMode || 'beep'}
                    options={['beep', 'lubdub']}
                    onChange={(v) => { setTweak('soundMode', v); HeartAudio.setMode(v); if (t.soundOn) HeartAudio.beat(); }} />
        <TweakSlider label="Volume" value={Math.round((t.soundVolume ?? 0.55) * 100)}
                     min={0} max={100} unit=" %"
                     onChange={(v) => setTweak('soundVolume', v / 100)} />

        <TweakSection label="Presets" />
        <div style={{ display: 'flex', gap: 6 }}>
          <TweakButton label="Normal" onClick={() => setTweak({ pulse: 78, sysBP: 118, diaBP: 76, resp: 14, spo2: 98, triage: 'DELAYED', evac: 'PRIORITY' })} />
          <TweakButton label="Brady" onClick={() => setTweak({ pulse: 46, sysBP: 102, diaBP: 64, resp: 11, spo2: 96, triage: 'DELAYED', evac: 'PRIORITY' })} secondary />
          <TweakButton label="Tachy" onClick={() => setTweak({ pulse: 132, sysBP: 96, diaBP: 60, resp: 24, spo2: 93, triage: 'IMMEDIATE', evac: 'URGENT' })} secondary />
          <TweakButton label="Shock" onClick={() => setTweak({ pulse: 152, sysBP: 78, diaBP: 50, resp: 30, spo2: 86, triage: 'IMMEDIATE', evac: 'URGENT' })} secondary />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
