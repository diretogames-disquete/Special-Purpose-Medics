/* Heart-sound engine for TCCC 360° — Web Audio, no external files.
   Two modes: 'beep' (monitor tone) or 'lubdub' (S1 + S2 thump).
   The app fires beat() once per cardiac cycle at the patient's heart rate. */
window.HeartAudio = (() => {
  let ctx = null, masterGain = null;
  let enabled = false, volume = 0.55, toneHz = 880, mode = 'lubdub';

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
    thump(t1,        { f0: 95,  f1: 28, dur: 0.13, vol: 0.85 }); // S1 "lub"
    thump(t1 + 0.14, { f0: 125, f1: 40, dur: 0.09, vol: 0.6  }); // S2 "dub"
  }

  return {
    setEnabled(v) { enabled = !!v; if (v) ensure(); },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (masterGain) masterGain.gain.value = volume; },
    setMode(m) { mode = (m === 'beep') ? 'beep' : 'lubdub'; },
    setTone(hz) { toneHz = hz; },
    isEnabled() { return enabled; },
    beat() { if (!enabled) return; (mode === 'beep') ? playBeep() : playLubDub(); },
  };
})();
