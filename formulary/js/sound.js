/* =====================================================================
 * SOF Field Formulary — UI click sounds + vitals audio (Web Audio, offline)
 * Soft tactile ticks when tapping tiles/links, quiz feedback tones, and an
 * interactive heartbeat (lub-dub) + blood-pressure pulse driven by a
 * scenario's vital signs. Lazily builds an AudioContext on first gesture.
 * Click sounds are muted until enabled (persisted); the heartbeat is an
 * explicit user action and plays regardless of the click-sound toggle.
 * Exposes window.SPM_SOUND.
 * ===================================================================== */
(function () {
  'use strict';
  var ctx = null, master = null, on = false, heartTimer = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    return true;
  }
  function blip(freq, dur, type, peak, glideTo) {
    if (!on || !ensure()) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak || 0.18, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  // A single soft "thump" (used for lub, dub, and BP pulses).
  function thump(t, f0, f1, peak, dur) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function lubDub(t) { thump(t, 70, 42, 0.34, 0.16); thump(t + 0.16, 58, 34, 0.22, 0.14); }

  var api = {
    click: function () { blip(420, 0.05, 'triangle', 0.10); },
    select: function () { blip(680, 0.07, 'triangle', 0.14, 880); },
    toggle: function () { blip(540, 0.06, 'square', 0.07); },
    correct: function () { blip(660, 0.10, 'sine', 0.16, 990); setTimeout(function () { blip(990, 0.12, 'sine', 0.14); }, 90); },
    wrong: function () { blip(200, 0.18, 'sawtooth', 0.12, 120); },
    // Play a run of heartbeats at the given rate (bpm). Always audible (explicit action).
    heart: function (bpm, beats, onTick, onDone) {
      if (!ensure()) return;
      api.stopHeart();
      bpm = Math.max(30, Math.min(220, bpm || 70)); beats = beats || 8;
      var interval = 60 / bpm, t0 = ctx.currentTime + 0.04, i = 0;
      for (i = 0; i < beats; i++) lubDub(t0 + i * interval);
      // visual callback per beat via setInterval aligned to interval
      var n = 0;
      if (onTick) onTick(0);
      heartTimer = setInterval(function () {
        n++; if (onTick) onTick(n);
        if (n >= beats) { clearInterval(heartTimer); heartTimer = null; if (onDone) onDone(); }
      }, interval * 1000);
    },
    stopHeart: function () { if (heartTimer) { clearInterval(heartTimer); heartTimer = null; } },
    // Two pulses spaced by the pulse pressure, pitch scaled to systolic.
    bp: function (sys, dia) {
      if (!ensure()) return;
      var t = ctx.currentTime + 0.03;
      var f = 60 + (sys - 80) * 0.5;
      thump(t, f + 30, f, 0.30, 0.16);
      thump(t + 0.22, (dia / sys) * (f + 30), (dia / sys) * f, 0.20, 0.16);
    },
    setEnabled: function (v) { on = !!v; if (on) ensure(); },
    isEnabled: function () { return on; }
  };
  window.SPM_SOUND = api;
})();
