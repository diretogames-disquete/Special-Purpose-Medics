/* global React */
/* Sound engine + Tweaks panel
   Web Audio synth — no external assets.
   Tones: ECG bleep (sync'd to HR), SpO2 pulse, critical alarm. */

const SOUND = (() => {
  let ctx = null;
  let masterGain = null;
  let ecgTimer = null;
  let spo2Timer = null;
  let alarmTimer = null;
  let state = { vol: 0.25, hr: 0, spo2: 100, critical: false, enabled: false };

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return false; }
      masterGain = ctx.createGain();
      masterGain.gain.value = state.vol;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function setVolume(v) {
    state.vol = v;
    if (masterGain) masterGain.gain.value = v;
  }

  // ECG bleep — short tonal blip
  function ecgBlip(pitch = 880) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // SpO2 pulse — drops in pitch with low SpO2
  function spo2Pulse() {
    if (!ctx) return;
    // 700 Hz at SpO2 100; drops to 500 at 88
    const f = 500 + (state.spo2 - 88) * (200 / 12);
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(Math.max(440, f), t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Critical alarm — repeating warble
  function alarmTone() {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880 + (i % 2 ? 200 : 0), t + i * 0.1);
      g.gain.setValueAtTime(0, t + i * 0.1);
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.08);
      osc.connect(g).connect(masterGain);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.1);
    }
  }

  // UI click — brief noisy tick
  function click() {
    if (!ctx || !state.enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Lub-Dub heart sound — S1 (low, mitral/tricuspid close) + S2 (~280ms later, aortic/pulmonic close)
  function lubDub() {
    if (!ctx) return;
    const t = ctx.currentTime;
    // S1 — "lub"
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 220;
    o1.type = 'sine';
    o1.frequency.setValueAtTime(70, t);
    o1.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.9, t + 0.012);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o1.connect(g1).connect(lp1).connect(masterGain);
    o1.start(t);
    o1.stop(t + 0.2);

    // S2 — "dub", ~280ms later, slightly higher pitch + shorter
    const t2 = t + 0.28;
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 280;
    o2.type = 'sine';
    o2.frequency.setValueAtTime(105, t2);
    o2.frequency.exponentialRampToValueAtTime(72, t2 + 0.09);
    g2.gain.setValueAtTime(0, t2);
    g2.gain.linearRampToValueAtTime(0.65, t2 + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);
    o2.connect(g2).connect(lp2).connect(masterGain);
    o2.start(t2);
    o2.stop(t2 + 0.16);
  }

  function reschedule() {
    if (ecgTimer) clearInterval(ecgTimer);
    if (spo2Timer) clearInterval(spo2Timer);
    if (alarmTimer) clearInterval(alarmTimer);
    ecgTimer = spo2Timer = alarmTimer = null;
    if (!state.enabled) return;
    if (state.hr > 0) {
      const ms = 60000 / state.hr;
      // Lub-Dub fires once per RR cycle; otherwise we play the short ECG bleep.
      ecgTimer = setInterval(state.lubDub ? lubDub : ecgBlip, ms);
    }
    if (state.spo2 > 0 && state.spo2 <= 100 && !state.lubDub) {
      // SpO2 pulse plays offset between ECG beeps; when lub-dub is on the
      // dub serves the same role so we skip it to avoid acoustic clutter.
      const ms = state.hr > 0 ? 60000 / state.hr : 1000;
      setTimeout(() => {
        spo2Timer = setInterval(spo2Pulse, ms);
      }, ms / 2);
    }
    if (state.critical) {
      alarmTimer = setInterval(alarmTone, 2200);
    }
  }

  function setVitals({ hr, spo2, critical }) {
    state.hr = hr || 0;
    state.spo2 = spo2 || 0;
    state.critical = !!critical;
    reschedule();
  }

  function setLubDub(on) {
    state.lubDub = !!on;
    reschedule();
  }

  function setEnabled(on) {
    state.enabled = !!on;
    if (on) ensure();
    reschedule();
  }

  return { ensure, setVolume, setVitals, setEnabled, setLubDub, click, getCtx: () => ctx };
})();

window.PCC_SOUND = SOUND;

// ────────────────────────────────────────────────────────────────
// TWEAK DEFAULTS — wrapped in EDITMODE markers so the host can rewrite
// ────────────────────────────────────────────────────────────────
window.PCC_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "soundEnabled": false,
  "soundVolume": 25,
  "lubDub": false,
  "ecgWave": true,
  "pulseHeart": true,
  "density": "regular",
  "showStudentNotes": true,
  "glassPanels": true,
  "glassOpacity": 62,
  "bgCondition": true
}/*EDITMODE-END*/;
