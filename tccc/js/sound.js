/* ============================================================
   SOUND — procedural audio via Web Audio API
   No audio files; everything synthesized.

   Init lazily on first user gesture (browser autoplay policy).
   Listens for events from engine via window.dispatchEvent.
   ============================================================ */

(function() {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let monitorTimer = null;
  let pulseMode = "beep"; // "beep" | "lubdub" | "off"
  let monitorState = { hr: 80, beatPhase: 0, alarm: null, alarmTimer: null };
  let asystoleNodes = null; // { osc, osc2, gain } — sustained flatline tone while in arrest

  function init() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn("Web Audio unavailable", e);
    }
    return ctx;
  }

  function envelope(node, t0, attack, sustain, release, peak = 1.0) {
    node.gain.cancelScheduledValues(t0);
    node.gain.setValueAtTime(0, t0);
    node.gain.linearRampToValueAtTime(peak, t0 + attack);
    node.gain.linearRampToValueAtTime(peak, t0 + attack + sustain);
    node.gain.linearRampToValueAtTime(0, t0 + attack + sustain + release);
  }

  /* ---- Atomic tones ---- */
  function tone({ freq = 880, type = "sine", duration = 0.15, attack = 0.005, release = 0.05, gain = 0.3, when = 0, detune = 0 }) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.value = detune;
    envelope(g, t0, attack, duration - attack - release, release, gain);
    osc.connect(g).connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  function noise({ duration = 0.1, gain = 0.2, when = 0, filterFreq = 1200, filterQ = 1 }) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = "bandpass";
    flt.frequency.value = filterFreq;
    flt.Q.value = filterQ;
    const g = ctx.createGain();
    envelope(g, t0, 0.002, duration - 0.04, 0.03, gain);
    src.connect(flt).connect(g).connect(masterGain);
    src.start(t0);
    src.stop(t0 + duration + 0.05);
  }

  /* ---- Composed cues ---- */
  const Cue = {
    heartbeat() { // single QRS beep — short clipped sine like a vitals monitor
      tone({ freq: 740, type: "sine", duration: 0.06, attack: 0.002, release: 0.04, gain: 0.18 });
    },
    lubdub() { // "S1 (lub) — S2 (dub)" cardiac auscultation, two thumps
      // S1 — low, longer
      tone({ freq: 70,  type: "sine", duration: 0.14, attack: 0.005, release: 0.10, gain: 0.32 });
      tone({ freq: 110, type: "sine", duration: 0.12, attack: 0.005, release: 0.09, gain: 0.18 });
      // S2 — higher, shorter, slightly later (~0.30s after S1, normal cardiac timing)
      tone({ freq: 95,  type: "sine", duration: 0.10, attack: 0.005, release: 0.08, gain: 0.26, when: 0.28 });
      tone({ freq: 140, type: "sine", duration: 0.09, attack: 0.005, release: 0.07, gain: 0.14, when: 0.28 });
    },
    alarmWarn() { // two-tone gentle alarm
      tone({ freq: 880, type: "square", duration: 0.08, gain: 0.10 });
      tone({ freq: 660, type: "square", duration: 0.08, gain: 0.10, when: 0.12 });
    },
    alarmBad() { // urgent triple beep
      tone({ freq: 1000, type: "square", duration: 0.10, gain: 0.16 });
      tone({ freq: 1000, type: "square", duration: 0.10, gain: 0.16, when: 0.15 });
      tone({ freq: 1200, type: "square", duration: 0.10, gain: 0.16, when: 0.30 });
    },
    confirm() { // pleasant ascending chime
      tone({ freq: 660, type: "triangle", duration: 0.10, gain: 0.20 });
      tone({ freq: 880, type: "triangle", duration: 0.14, gain: 0.20, when: 0.07 });
    },
    contraindication() { // buzzer
      tone({ freq: 180, type: "sawtooth", duration: 0.25, gain: 0.18 });
      tone({ freq: 140, type: "sawtooth", duration: 0.30, gain: 0.16, when: 0.05 });
    },
    tourniquet() { // ratchet — repeated noise clicks
      for (let i = 0; i < 8; i++) {
        noise({ duration: 0.025, gain: 0.18, when: i * 0.05, filterFreq: 2400, filterQ: 2 });
      }
      tone({ freq: 220, type: "square", duration: 0.10, gain: 0.18, when: 0.45 });
    },
    injection() { // soft "pssh"
      noise({ duration: 0.32, gain: 0.10, filterFreq: 800 });
    },
    radioChirp() { // EVAC call
      tone({ freq: 880, type: "square", duration: 0.06, gain: 0.18 });
      tone({ freq: 1320, type: "square", duration: 0.06, gain: 0.18, when: 0.08 });
      tone({ freq: 660, type: "square", duration: 0.10, gain: 0.18, when: 0.18 });
    },
    flatline() { // long mid-frequency monotone
      if (!ctx || muted) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      envelope(g, t0, 0.05, 2.4, 0.4, 0.35);
      osc.connect(g).connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 3);
    },
    defibCharge() { // ascending whine
      if (!ctx || muted) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 1.4);
      envelope(g, t0, 0.05, 1.3, 0.05, 0.12);
      osc.connect(g).connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 1.6);
    },
    pageClick() {
      tone({ freq: 1800, type: "square", duration: 0.025, gain: 0.06 });
    }
  };

  /* ---- Live monitor loop — heartbeat + sustained alarm tone ---- */
  function startMonitor(getState) {
    stopMonitor();
    monitorTimer = setInterval(() => {
      if (!ctx || muted) return;
      const s = getState() || {};
      const hr = Math.max(0, s.hr || 0);
      const spo2 = s.spo2 || 100;
      const sys = s.sys || 120;
      // schedule beats — beat every 60/hr seconds since last
      const now = performance.now() / 1000;
      const interval = hr > 0 ? 60 / hr : 999;
      if (!monitorState.lastBeat || now - monitorState.lastBeat >= interval) {
        if (hr > 0 && pulseMode !== "off") {
          if (pulseMode === "lubdub") {
            Cue.lubdub();
          } else {
            // pitch reflects SpO₂ — lower as desats (the classic pulse-ox tone)
            const baseFreq = 500 + Math.max(0, Math.min(40, spo2 - 60)) * 10;
            tone({ freq: baseFreq, type: "sine", duration: 0.06, attack: 0.002, release: 0.04, gain: 0.14 });
          }
        }
        monitorState.lastBeat = now;
      }
      // periodic alarm for severe vitals — but stay silent during asystole;
      // the sustained flatline tone covers the audible signal there.
      if (!monitorState.alarmTime) monitorState.alarmTime = 0;
      if (!asystoleNodes && now - monitorState.alarmTime >= 4) {
        if (hr === 0 || sys < 70 || spo2 < 88) {
          Cue.alarmBad();
        } else if (hr > 130 || hr < 50 || sys < 90 || spo2 < 92) {
          Cue.alarmWarn();
        }
        monitorState.alarmTime = now;
      }
    }, 100);
  }

  function stopMonitor() {
    if (monitorTimer) clearInterval(monitorTimer);
    monitorTimer = null;
    monitorState = { hr: 80, beatPhase: 0, alarm: null, alarmTimer: null, lastBeat: 0, alarmTime: 0 };
  }

  /* ---- Sustained asystole tone — the continuous monotone that accompanies
     a dead patient until the operator silences the monitor / resets. ----- */
  function startAsystole() {
    init();
    if (!ctx || muted) return;
    if (asystoleNodes) return; // already sounding
    const t0 = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // slight detune for that "warbly" hardware feel
    const g    = ctx.createGain();
    osc.type = "sine";
    osc2.type = "sine";
    osc.frequency.value = 660;
    osc2.frequency.value = 660;
    osc2.detune.value = 8;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.08);
    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc2.start(t0);
    asystoleNodes = { osc, osc2, gain: g };
  }

  function stopAsystole() {
    if (!asystoleNodes || !ctx) return;
    const { osc, osc2, gain } = asystoleNodes;
    const tEnd = ctx.currentTime + 0.12;
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, tEnd);
      osc.stop(tEnd + 0.02);
      osc2.stop(tEnd + 0.02);
    } catch (e) {}
    asystoleNodes = null;
  }

  /* ---- Public API ---- */
  window.Sound = {
    init, // call on first user gesture
    mute(v) { muted = v; if (muted && masterGain) masterGain.gain.value = 0;
                          else if (masterGain) masterGain.gain.value = 0.5; },
    isMuted() { return muted; },
    setPulseMode(mode) {
      if (mode === "beep" || mode === "lubdub" || mode === "off") pulseMode = mode;
    },
    getPulseMode() { return pulseMode; },
    play(cueName) {
      init();
      const c = Cue[cueName];
      if (c) c();
    },
    startMonitor,
    stopMonitor,
    startAsystole,
    stopAsystole
  };
})();
