/* =====================================================================
 * SOF Field Formulary — UI click sounds (Web Audio, synthesized, offline)
 * Soft tactile ticks when tapping tiles/links, plus quiz feedback tones.
 * Lazily builds an AudioContext on first user gesture. Muted by default
 * until the user enables sound (persisted). Exposes window.SPM_SOUND.
 * ===================================================================== */
(function () {
  'use strict';
  var ctx = null, master = null, on = false;

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    return true;
  }
  function blip(freq, dur, type, peak, glideTo) {
    if (!on || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak || 0.18, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  var api = {
    click: function () { blip(420, 0.05, 'triangle', 0.10); },
    select: function () { blip(680, 0.07, 'triangle', 0.14, 880); },
    toggle: function () { blip(540, 0.06, 'square', 0.07); },
    correct: function () { blip(660, 0.10, 'sine', 0.16, 990); setTimeout(function () { blip(990, 0.12, 'sine', 0.14); }, 90); },
    wrong: function () { blip(200, 0.18, 'sawtooth', 0.12, 120); },
    setEnabled: function (v) { on = !!v; if (on) ensure(); },
    isEnabled: function () { return on; }
  };
  window.SPM_SOUND = api;
})();
