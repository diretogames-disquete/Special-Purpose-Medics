/* =====================================================================
 * Special Purpose Medic — COCOM Scenarios · region ambient-music engine
 *   Procedural WebAudio. One generative ambient theme per theater, flavored
 *   to the region by musical mode + timbre, layered over a SHARED
 *   tactical-medicine bed: a low drone, a slow heart-monitor blip, and a
 *   filtered "breath" wash. No audio files — fully self-contained so it
 *   survives the offline standalone. Opt-in only; never autoplays.
 *
 *   API on window.SPM_MUSIC:
 *     enable() / disable() / toggle() -> bool   start/stop the bed + scheduler
 *     isOn()                          -> bool
 *     setRegion(pfx)                  crossfade to a theater's theme
 *     region()                        -> current pfx
 *   The inline tab handler (setCocom) calls setRegion; a header button drives
 *   toggle(). Volume is intentionally low and the texture slow + sparse.
 * ===================================================================== */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { // no WebAudio — expose inert API so callers never throw
    window.SPM_MUSIC = { enable: function () {}, disable: function () {}, toggle: function () { return false; },
      isOn: function () { return false; }, setRegion: function () {}, region: function () { return null; }, available: false };
    return;
  }

  // Per-theater character. root = drone fundamental (Hz); scale = semitone
  // degrees of the regional mode; wave/droneType = timbre; bpm = pulse;
  // color = texture preset used by the scheduler.
  //   AFRICOM  — minor pentatonic, warm kalimba-ish plucks
  //   CENTCOM  — Hijaz / Phrygian-dominant (Middle-Eastern), reedy oud-ish
  //   INDOPACOM— In/Hirajoshi (Japanese), glassy koto-ish, sparse
  //   EUCOM    — natural minor, cold stacked fifths
  //   SOUTHCOM — Spanish Phrygian, nylon-string warmth, livelier
  //   NORTHCOM — Lydian, wide + arctic, very slow and sparse
  //   RANGER   — Dorian/Aeolian minor, martial low pulse, driving
  var REGIONS = {
    af: { name: 'AFRICOM',   root: 110.00, scale: [0, 3, 5, 7, 10],            wave: 'triangle', droneType: 'triangle', bpm: 64, color: 'warm' },
    ce: { name: 'CENTCOM',   root: 146.83, scale: [0, 1, 4, 5, 7, 8, 11],      wave: 'sawtooth', droneType: 'sawtooth', bpm: 54, color: 'reedy' },
    in: { name: 'INDOPACOM', root: 164.81, scale: [0, 2, 3, 7, 8],             wave: 'triangle', droneType: 'sine',     bpm: 50, color: 'glassy' },
    eu: { name: 'EUCOM',     root: 130.81, scale: [0, 2, 3, 5, 7, 8, 10],      wave: 'sawtooth', droneType: 'sawtooth', bpm: 58, color: 'cold' },
    so: { name: 'SOUTHCOM',  root: 164.81, scale: [0, 1, 4, 5, 7, 8, 10],      wave: 'triangle', droneType: 'triangle', bpm: 68, color: 'nylon' },
    no: { name: 'NORTHCOM',  root: 98.00,  scale: [0, 2, 4, 6, 7, 9, 11],      wave: 'sine',     droneType: 'sine',     bpm: 46, color: 'arctic' },
    rm: { name: 'RANGER',    root: 110.00, scale: [0, 2, 3, 5, 7, 8, 10],      wave: 'sawtooth', droneType: 'sawtooth', bpm: 72, color: 'martial' }
  };
  var TARGET_VOL = 0.16;

  var ctx = null, master = null, air = null, noiseBuf = null;
  var enabled = false, curPfx = 'af', cfg = REGIONS.af;
  var bed = null, schedTimer = null, nextTime = 0, beat = 0;

  function freq(root, semis) { return root * Math.pow(2, semis / 12); }

  function ensure() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    air = ctx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 2400; air.Q.value = 0.4;
    // simple feedback delay for a little space
    var delay = ctx.createDelay(1.0); delay.delayTime.value = 0.34;
    var fb = ctx.createGain(); fb.gain.value = 0.30;
    var wet = ctx.createGain(); wet.gain.value = 0.45;
    air.connect(master);
    air.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    master.connect(ctx.destination);
    var len = Math.floor(ctx.sampleRate * 2), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    noiseBuf = b;
  }

  function stopBed(at) {
    if (!bed) return;
    var b = bed; bed = null;
    try { b.gain.gain.cancelScheduledValues(at); b.gain.gain.setTargetAtTime(0.0001, at, 0.5); } catch (e) {}
    b.oscs.forEach(function (o) { try { o.stop(at + 2.2); } catch (e) {} });
  }

  function buildBed(c, at) {
    var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(air);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.7; lp.connect(g);
    var oscs = [];
    // drone stack: root (x2 detuned), fifth, octave — voiced from the region root
    [[0, -4], [0, 5], [7, 3], [12, -6]].forEach(function (p, i) {
      var o = ctx.createOscillator(); o.type = c.droneType;
      o.frequency.value = freq(c.root, p[0]); o.detune.value = p[1];
      var og = ctx.createGain(); og.gain.value = (i === 0 ? 0.55 : 0.26);
      o.connect(og); og.connect(lp); o.start(at); oscs.push(o);
    });
    // slow filter sweep for movement
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    var lg = ctx.createGain(); lg.gain.value = 240; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(at); oscs.push(lfo);
    g.gain.setTargetAtTime(0.5, at, 1.3); // fade in
    return { gain: g, oscs: oscs };
  }

  function pluck(f, at, vel) {
    var o = ctx.createOscillator(); o.type = cfg.wave; o.frequency.value = f;
    var flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = Math.min(5200, f * 6); flt.Q.value = 1.0;
    var g = ctx.createGain(); g.gain.value = 0.0001;
    o.connect(flt); flt.connect(g); g.connect(air);
    var dur = (cfg.color === 'glassy' || cfg.color === 'arctic') ? 1.8 : (cfg.color === 'martial' || cfg.color === 'nylon') ? 0.8 : 1.1;
    g.gain.exponentialRampToValueAtTime(0.15 * (vel || 1), at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.start(at); o.stop(at + dur + 0.06);
  }

  function lowPulse(f, at) { // martial heartbeat/march
    var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    var g = ctx.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(air);
    g.gain.exponentialRampToValueAtTime(0.13, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.start(at); o.stop(at + 0.56);
  }

  function monitorBlip(at) { // the tactical-medicine through-line
    [[0, 1568], [0.085, 2093]].forEach(function (p) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = p[1];
      var g = ctx.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(air);
      var t = at + p[0];
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
      o.start(t); o.stop(t + 0.14);
    });
    var n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.8;
    var g = ctx.createGain(); g.gain.value = 0.0001; n.connect(bp); bp.connect(g); g.connect(air);
    g.gain.linearRampToValueAtTime(0.018, at + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, at + 3.4);
    n.start(at); n.stop(at + 3.6);
  }

  function scheduler() {
    if (!enabled || !ctx) return;
    var ahead = ctx.currentTime + 0.12, spb = 60 / cfg.bpm;
    var density = cfg.color === 'arctic' ? 0.30 : cfg.color === 'martial' ? 0.62 : cfg.color === 'nylon' ? 0.58 : 0.46;
    while (nextTime < ahead) {
      if (Math.random() < density || beat % 8 === 0) {
        var deg = cfg.scale[Math.floor(Math.random() * cfg.scale.length)];
        var oct = (Math.random() < 0.5) ? 12 : (Math.random() < 0.6 ? 24 : 0);
        pluck(freq(cfg.root, deg + oct), nextTime, 0.6 + Math.random() * 0.4);
      }
      if (cfg.color === 'martial' && beat % 2 === 0) lowPulse(freq(cfg.root, -12), nextTime);
      if (beat % 8 === 0) monitorBlip(nextTime + spb * 0.5);
      nextTime += spb; beat++;
    }
    schedTimer = setTimeout(scheduler, 25);
  }

  function enable() {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
    enabled = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(TARGET_VOL, ctx.currentTime, 0.8);
    if (!bed) bed = buildBed(cfg, ctx.currentTime + 0.05);
    nextTime = ctx.currentTime + 0.12; beat = 0;
    if (!schedTimer) scheduler();
  }
  function disable() {
    enabled = false;
    if (schedTimer) { clearTimeout(schedTimer); schedTimer = null; }
    if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4); stopBed(ctx.currentTime + 0.45); }
  }
  function setRegion(pfx) {
    if (!REGIONS[pfx]) return;
    curPfx = pfx;
    if (enabled && ctx) {
      var at = ctx.currentTime;
      stopBed(at + 0.05);
      cfg = REGIONS[pfx];
      bed = buildBed(cfg, at + 0.1);
    } else {
      cfg = REGIONS[pfx];
    }
  }
  function toggle() { if (enabled) disable(); else enable(); return enabled; }

  window.SPM_MUSIC = {
    enable: enable, disable: disable, toggle: toggle,
    isOn: function () { return enabled; },
    setRegion: setRegion, region: function () { return curPfx; }, available: true
  };
})();
