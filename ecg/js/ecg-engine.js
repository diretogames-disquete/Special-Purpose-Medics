/* =====================================================================
 * SPM ECG Simulator — waveform engine (original, dependency-free)
 * ---------------------------------------------------------------------
 * Synthesises a continuous single-lead (II) ECG signal in millivolts for a
 * library of cardiac rhythms. Each beat is built from Gaussian P/Q/R/S/T
 * components; baselines add fibrillatory / flutter / chaotic activity. A
 * Sampler streams value(t) over time and exposes the QRS times so the
 * monitor can beep and compute a rate. All clinical teaching text is
 * original and meant as a study aid — verify against ACLS / a 12-lead.
 *
 *   var s = ECG.makeSampler('afib');
 *   s.value(tSeconds);            // → mV
 *   s.qrsUpTo(tSeconds);          // → array of QRS times that have occurred
 * ===================================================================== */
(function () {
  'use strict';

  // Gaussian bump: amplitude `a` (mV), centre `c` (ms), width `w` (ms).
  function g(ms, c, a, w) { var d = ms - c; return a * Math.exp(-(d * d) / (2 * w * w)); }

  // ---- beat templates: value in mV given ms since the P-onset fiducial ----
  // Normal sinus complex. R sits ~200 ms after the fiducial.
  function tNormal(scale) {
    scale = scale || 1;
    return function (ms) {
      return g(ms, 70, 0.13, 16) + g(ms, 188, -0.07, 7) + g(ms, 200, 1.05 * scale, 9)
           + g(ms, 214, -0.22, 9) + g(ms, 360, 0.30, 40);
    };
  }
  // QRS-T only (no P) — junctional/AF/where atrial activity is absent.
  function tQRS(scale) {
    scale = scale || 1;
    return function (ms) {
      return g(ms, 188, -0.07, 7) + g(ms, 200, 1.05 * scale, 9) + g(ms, 214, -0.22, 9) + g(ms, 360, 0.30, 40);
    };
  }
  // Lone P wave (atrial activity, e.g. dissociated in 3rd-degree block).
  function tP(a) { a = a == null ? 0.14 : a; return function (ms) { return g(ms, 70, a, 16); }; }
  // Wide, bizarre ventricular complex (PVC/VT/idioventricular/BBB). dir flips axis.
  function tWide(dir, scale) {
    dir = dir || 1; scale = scale || 1;
    return function (ms) {
      return g(ms, 168, -0.18 * dir * scale, 16) + g(ms, 210, 1.05 * dir * scale, 30)
           + g(ms, 262, -0.34 * dir * scale, 24) + g(ms, 410, -0.5 * dir, 64);
    };
  }
  // Ventricular-paced complex: narrow pacing spike then a wide paced QRS.
  function tPaced() {
    var w = tWide(1, 1);
    return function (ms) { return g(ms, 150, 0.6, 1.7) + w(ms); };
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  // ---- baselines: value in mV given absolute t (seconds) ----
  function blFlat() { return 0; }
  function blWander(t) { return 0.025 * Math.sin(t * 2 * Math.PI * 0.25); }            // respiratory drift
  function blFib(t) {                                                                  // AF fibrillatory waves
    return 0.05 * Math.sin(t * 2 * Math.PI * 6.1) + 0.035 * Math.sin(t * 2 * Math.PI * 9.7 + 1.1)
         + 0.025 * Math.sin(t * 2 * Math.PI * 13.3 + 2.3);
  }
  function blFlutter(t) {                                                              // ~300/min sawtooth F waves
    var ph = (t * 5) % 1; return (0.5 - Math.abs(ph - 0.5) * 2) * 0.34 - 0.12;
  }
  function blVf(t) {                                                                   // coarse chaotic VF
    var f = 4.5 + 1.6 * Math.sin(t * 1.7);
    return 0.55 * Math.sin(t * 2 * Math.PI * f) * (0.7 + 0.3 * Math.sin(t * 3.1))
         + 0.18 * Math.sin(t * 2 * Math.PI * (f * 1.9) + 1.0) + (Math.random() - 0.5) * 0.08;
  }
  function blNoise(t) { return (Math.random() - 0.5) * 0.02; }

  // ---- rhythm specifications ----------------------------------------------
  // model.kind drives beat scheduling; the rest is teaching metadata.
  var RHYTHMS = [
    { id: 'nsr', name: 'Normal Sinus Rhythm', cat: 'Sinus', rate: '60–100', reg: 'Regular',
      p: 'Present, upright, 1 : 1 with QRS', pr: '0.12–0.20 s', qrs: '< 0.12 s (narrow)',
      features: 'Every P followed by a QRS; uniform morphology; rate 60–100.',
      clinical: 'The normal baseline. Establishes what "normal" looks like before you can call anything abnormal.',
      mgmt: 'None — physiologic.', model: { kind: 'sinus', rate: 75 } },

    { id: 'sbrady', name: 'Sinus Bradycardia', cat: 'Sinus', rate: '< 60', reg: 'Regular',
      p: 'Normal sinus P, 1 : 1', pr: '0.12–0.20 s', qrs: 'Narrow',
      features: 'Sinus rhythm with a rate below 60. Long, regular R-R intervals.',
      clinical: 'Normal in athletes/sleep; pathologic with hypotension, syncope, ischemia, or drug effect (beta-blockers, calcium-channel blockers).',
      mgmt: 'If unstable: atropine 1 mg IV; pacing / epinephrine or dopamine infusion if refractory.', model: { kind: 'sinus', rate: 44 } },

    { id: 'stach', name: 'Sinus Tachycardia', cat: 'Sinus', rate: '100–150+', reg: 'Regular',
      p: 'Normal sinus P, 1 : 1 (may bury in prior T)', pr: '0.12–0.20 s', qrs: 'Narrow',
      features: 'Sinus rhythm above 100. P waves present but may merge with the preceding T at fast rates.',
      clinical: 'Almost always a response to something — pain, fever, hypovolemia, hypoxia, anxiety, stimulants. Treat the cause, not the number.',
      mgmt: 'Find and fix the trigger (volume, oxygen, analgesia, antipyretics).', model: { kind: 'sinus', rate: 130 } },

    { id: 'sarr', name: 'Sinus Arrhythmia', cat: 'Sinus', rate: '60–100', reg: 'Irregular (phasic)',
      p: 'Normal sinus P, 1 : 1', pr: '0.12–0.20 s', qrs: 'Narrow',
      features: 'Sinus rhythm whose rate quickens on inspiration and slows on expiration — a cyclic, breathing-linked irregularity.',
      clinical: 'A normal variant, common in the young and healthy. Reflects vagal tone changes with respiration.',
      mgmt: 'None — benign.', model: { kind: 'sinusArr', rate: 72 } },

    { id: 'afib', name: 'Atrial Fibrillation', cat: 'Atrial', rate: 'Variable (often 110–160 untreated)', reg: 'Irregularly irregular',
      p: 'Absent — chaotic fibrillatory (f) waves', pr: 'Not measurable', qrs: 'Narrow',
      features: 'No discernible P waves, an undulating baseline, and an irregularly irregular ventricular response — the hallmark.',
      clinical: 'Most common sustained arrhythmia. Stasis in the atria → thromboembolic stroke risk. Rapid rates compromise filling.',
      mgmt: 'Rate control (diltiazem, beta-blocker); anticoagulate by risk; cardiovert if unstable.', model: { kind: 'afib', rate: 140 } },

    { id: 'aflutter', name: 'Atrial Flutter', cat: 'Atrial', rate: 'Atrial ~300; ventricular by ratio (e.g. 150 at 2:1)', reg: 'Often regular',
      p: 'Sawtooth flutter (F) waves', pr: 'N/A', qrs: 'Narrow',
      features: 'Classic sawtooth baseline at ~300/min with conduction ratios (2:1, 3:1, 4:1). 2:1 gives a regular ~150 ventricular rate.',
      clinical: 'A re-entry circuit, usually right atrium. Suspect it whenever a regular narrow tachycardia sits near 150.',
      mgmt: 'Rate control or cardiovert (low energy); anticoagulation considerations as in AF.', model: { kind: 'flutter', ratio: 3 } },

    { id: 'svt', name: 'Supraventricular Tachycardia', cat: 'Atrial', rate: '150–250', reg: 'Regular',
      p: 'Hidden or retrograde (rarely seen)', pr: 'Not measurable', qrs: 'Narrow',
      features: 'A regular, narrow-complex tachycardia, usually 150–250, with no clearly visible P waves — too fast to see them.',
      clinical: 'Re-entrant (AVNRT/AVRT). Often abrupt onset/offset, palpitations. Hemodynamically tolerated if not too fast/prolonged.',
      mgmt: 'Vagal maneuvers; adenosine 6 mg → 12 mg IV push; synchronized cardioversion if unstable.', model: { kind: 'sinus', rate: 190, noP: true } },

    { id: 'pac', name: 'Premature Atrial Contraction', cat: 'Atrial', rate: 'Underlying rate', reg: 'Irregular (with the early beat)',
      p: 'Early, abnormal P before the premature beat', pr: 'May differ', qrs: 'Narrow',
      features: 'An early beat arising from an ectopic atrial focus — abnormal P, narrow QRS, usually a non-compensatory pause after.',
      clinical: 'Generally benign; frequent PACs may herald atrial fibrillation. Triggers: caffeine, stress, stimulants.',
      mgmt: 'Usually none; reduce stimulants.', model: { kind: 'pac', rate: 75, every: 5 } },

    { id: 'pvc', name: 'Premature Ventricular Contraction', cat: 'Ventricular', rate: 'Underlying rate', reg: 'Irregular (with the early beat)',
      p: 'None before the ectopic', pr: 'N/A', qrs: 'Wide & bizarre (the PVC)',
      features: 'An early, wide, bizarre complex with no preceding P and a discordant T, typically followed by a full compensatory pause.',
      clinical: 'Common and often benign. Concerning when frequent, multiform, or in runs (→ VT). Note bigeminy/couplets.',
      mgmt: 'Treat the patient, not the PVCs; correct electrolytes/ischemia.', model: { kind: 'pvc', rate: 75, every: 4 } },

    { id: 'vtach', name: 'Ventricular Tachycardia (Monomorphic)', cat: 'Ventricular', rate: '100–250', reg: 'Regular',
      p: 'Absent / AV dissociation', pr: 'N/A', qrs: 'Wide (> 0.12 s), uniform',
      features: 'A run of wide, uniform complexes at a fast, regular rate. Three or more consecutive PVCs = VT.',
      clinical: 'Life-threatening. May be pulseless (→ defibrillate) or with a pulse. Can degenerate into VF.',
      mgmt: 'Pulseless: CPR + defibrillation. With pulse, unstable: synchronized cardioversion. Stable: amiodarone.', model: { kind: 'vt', rate: 180 } },

    { id: 'torsades', name: 'Torsades de Pointes', cat: 'Ventricular', rate: '200–250', reg: 'Irregular',
      p: 'Absent', pr: 'N/A', qrs: 'Wide, polymorphic — "twisting" amplitude',
      features: 'Polymorphic VT whose QRS amplitude waxes and wanes, appearing to twist around the baseline. Arises from a long QT.',
      clinical: 'Driven by QT prolongation (drugs, hypomagnesemia, hypokalemia). Can self-terminate or progress to VF.',
      mgmt: 'IV magnesium sulfate; correct K⁺; stop offending drugs; defibrillate if pulseless; overdrive pacing.', model: { kind: 'torsades', rate: 230 } },

    { id: 'vfib', name: 'Ventricular Fibrillation', cat: 'Ventricular', rate: 'None (chaotic)', reg: 'Chaotic',
      p: 'None', pr: 'N/A', qrs: 'None — chaotic undulations',
      features: 'A chaotic, irregular waveform with no identifiable P, QRS, or T. Coarse early, fine as it deteriorates.',
      clinical: 'Cardiac arrest. No effective cardiac output. The shockable rhythm of sudden cardiac death.',
      mgmt: 'Immediate CPR + defibrillation; epinephrine; amiodarone. Time is myocardium.', model: { kind: 'vfib' } },

    { id: 'asystole', name: 'Asystole', cat: 'Arrest', rate: '0', reg: 'Flat',
      p: 'None (or rare P-wave asystole)', pr: 'N/A', qrs: 'None',
      features: 'A flat or nearly flat line. Confirm in two leads and check leads/connections before calling it.',
      clinical: 'Cardiac arrest with no electrical activity. Non-shockable. Grim prognosis.',
      mgmt: 'High-quality CPR + epinephrine; treat reversible causes (H’s & T’s). Do NOT shock.', model: { kind: 'asystole' } },

    { id: 'avb1', name: '1st-Degree AV Block', cat: 'AV Block', rate: 'Underlying sinus', reg: 'Regular',
      p: 'Normal, 1 : 1', pr: 'Prolonged & constant (> 0.20 s)', qrs: 'Narrow',
      features: 'Every P conducts, but the PR interval is uniformly long (> 0.20 s). "A long-standing first-degree."',
      clinical: 'Usually benign; a marker of conduction-system aging, drug effect, or increased vagal tone.',
      mgmt: 'None if isolated; review AV-nodal blocking drugs.', model: { kind: 'avb1', rate: 70 } },

    { id: 'avb2a', name: '2nd-Degree AV Block, Type I (Wenckebach)', cat: 'AV Block', rate: 'Atrial > ventricular', reg: 'Irregular (grouped)',
      p: 'Present, more P’s than QRS', pr: 'Progressively lengthens until a QRS drops', qrs: 'Narrow',
      features: 'PR stretches beat-to-beat until a P fails to conduct (dropped QRS), then the cycle resets — "longer, longer, drop."',
      clinical: 'Usually AV-nodal and benign; often transient (inferior MI, vagal, drugs).',
      mgmt: 'Observe; atropine if symptomatic bradycardia.', model: { kind: 'avb2a', rate: 75 } },

    { id: 'avb2b', name: '2nd-Degree AV Block, Type II (Mobitz II)', cat: 'AV Block', rate: 'Atrial > ventricular', reg: 'Regular P–P; dropped QRS',
      p: 'Present, intermittent non-conducted P', pr: 'Constant on conducted beats', qrs: 'Often wide',
      features: 'Constant PR on conducted beats with sudden, intermittent dropped QRS complexes (no PR change before the drop).',
      clinical: 'Infranodal disease — unstable and prone to progress to complete block. Treat seriously.',
      mgmt: 'Pacing (transcutaneous → transvenous); atropine often ineffective and may worsen.', model: { kind: 'avb2b', rate: 75, ratio: 3 } },

    { id: 'avb3', name: '3rd-Degree (Complete) AV Block', cat: 'AV Block', rate: 'Atrial and ventricular independent', reg: 'Regular but dissociated',
      p: 'Present, marching through — no relation to QRS', pr: 'Varies (AV dissociation)', qrs: 'Narrow (junctional) or wide (ventricular escape)',
      features: 'Complete AV dissociation: P waves and QRS complexes each regular but unrelated. A slow escape rhythm drives the ventricles.',
      clinical: 'Hemodynamically dangerous; escape may fail. Emergent.',
      mgmt: 'Transcutaneous pacing; epinephrine/dopamine bridge; transvenous pacing.', model: { kind: 'avb3', atrial: 90, vent: 38 } },

    { id: 'junctional', name: 'Junctional Rhythm', cat: 'Junctional', rate: '40–60 (accelerated 60–100)', reg: 'Regular',
      p: 'Absent, inverted, or retrograde', pr: 'Short or none', qrs: 'Narrow',
      features: 'Narrow-complex escape from the AV junction. P waves absent or inverted (may precede, hide in, or follow the QRS).',
      clinical: 'A backup pacemaker when the SA node fails or is suppressed. Accelerated junctional suggests digoxin toxicity or ischemia.',
      mgmt: 'Treat the cause; atropine/pacing if symptomatic.', model: { kind: 'sinus', rate: 50, noP: true } },

    { id: 'idio', name: 'Idioventricular Rhythm', cat: 'Ventricular', rate: '20–40 (accelerated 40–100)', reg: 'Regular',
      p: 'Absent', pr: 'N/A', qrs: 'Wide & bizarre',
      features: 'A slow, regular, wide-complex ventricular escape rhythm with no P waves — the ventricle’s last-resort pacemaker.',
      clinical: 'Seen in failing hearts and after reperfusion (accelerated idioventricular rhythm, AIVR). Slow rates → poor output.',
      mgmt: 'Treat cause; pacing if symptomatic. Do not suppress an escape rhythm.', model: { kind: 'vt', rate: 38, wideScale: 1 } },

    { id: 'paced', name: 'Ventricular Paced Rhythm', cat: 'Paced', rate: 'Set by device (e.g. 60–80)', reg: 'Regular',
      p: 'Variable; pacer spike precedes QRS', pr: 'N/A', qrs: 'Wide, preceded by a pacing spike',
      features: 'A sharp pacing spike before each wide, paced QRS at the programmed rate. Atrial or AV spikes may also appear.',
      clinical: 'Confirms a functioning ventricular pacemaker. Watch for failure to capture/sense.',
      mgmt: 'Interrogate device for malfunction; magnet for asynchronous mode if needed.', model: { kind: 'paced', rate: 72 } }
  ];

  // ---- Sampler -------------------------------------------------------------
  function Sampler(spec) {
    this.m = spec.model;
    this.events = [];       // {t, fn, qrs}
    this.qrs = [];          // QRS times
    this.built = -1;        // seconds built to
    this._i = 0;            // moving window start index
    this._build(12);
  }
  Sampler.prototype._push = function (t, fn, isQ) { this.events.push({ t: t, fn: fn, qrs: !!isQ }); if (isQ) this.qrs.push(t); };

  // Extend the event schedule out to `to` seconds.
  Sampler.prototype._build = function (to) {
    var m = this.m, from = this.built < 0 ? 0 : this.built;
    if (m.kind === 'vfib' || m.kind === 'asystole') { this.built = to; return; }
    var rr;
    if (m.kind === 'sinus') {
      rr = 60 / m.rate; var tpl = m.noP ? tQRS(1) : tNormal(1);
      for (var t = Math.ceil(from / rr) * rr; t < to; t += rr) this._push(t, tpl, true);
    } else if (m.kind === 'sinusArr') {
      // phasic R-R with respiration
      var base = 60 / m.rate, t2 = from;
      // re-seed deterministic-ish from 0 each call window
      for (t2 = 0; t2 < to; ) { var k = base * (1 + 0.22 * Math.sin(t2 * 2 * Math.PI * 0.25)); if (t2 >= from) this._push(t2, tNormal(1), true); t2 += k; }
    } else if (m.kind === 'afib') {
      var mean = 60 / m.rate, t3 = 0;
      for (t3 = 0; t3 < to; ) { if (t3 >= from) this._push(t3, tQRS(rand(0.85, 1.12)), true); t3 += mean * rand(0.55, 1.5); }
    } else if (m.kind === 'flutter') {
      rr = (60 / 300) * m.ratio; for (var t4 = Math.ceil(from / rr) * rr; t4 < to; t4 += rr) this._push(t4, tQRS(1), true);
    } else if (m.kind === 'pac') {
      rr = 60 / m.rate; var n = 0;
      for (var t5 = Math.ceil(from / rr) * rr; t5 < to; t5 += rr) {
        n = Math.round(t5 / rr);
        if (n % m.every === 0 && n > 0) { var et = t5 - rr * 0.32; this._push(et, tNormal(0.9), true); } // early atrial beat
        else this._push(t5, tNormal(1), true);
      }
    } else if (m.kind === 'pvc') {
      rr = 60 / m.rate;
      for (var t6 = Math.ceil(from / rr) * rr; t6 < to; t6 += rr) {
        var n6 = Math.round(t6 / rr);
        if (n6 % m.every === 0 && n6 > 0) this._push(t6 - rr * 0.30, tWide(1, 1.1), true); // early wide beat (then compensatory gap)
        else this._push(t6, tNormal(1), true);
      }
    } else if (m.kind === 'vt') {
      rr = 60 / m.rate; var dir = 1;
      for (var t7 = Math.ceil(from / rr) * rr; t7 < to; t7 += rr) this._push(t7, tWide(1, m.wideScale || 1), true);
    } else if (m.kind === 'torsades') {
      rr = 60 / m.rate;
      for (var t8 = Math.ceil(from / rr) * rr; t8 < to; t8 += rr) {
        var env = Math.sin(t8 * 2 * Math.PI * 0.45);           // twisting envelope
        this._push(t8, tWide(env >= 0 ? 1 : -1, 0.5 + 0.9 * Math.abs(env)), true);
      }
    } else if (m.kind === 'avb1') {
      rr = 60 / m.rate; var pr1 = 0.30;
      for (var t9 = Math.ceil(from / rr) * rr; t9 < to; t9 += rr) { this._push(t9, tP(0.14), false); this._push(t9 + pr1, tQRS(1), true); }
    } else if (m.kind === 'avb2a') { // Wenckebach: PR lengthens then drop (4:3)
      var pp = 60 / m.rate, idx = 0;
      for (var t10 = 0; t10 < to; t10 += pp) {
        var phase = idx % 4;
        if (t10 >= from) this._push(t10, tP(0.14), false);
        if (phase < 3) { var pr = 0.16 + phase * 0.07; if (t10 >= from) this._push(t10 + pr, tQRS(1), true); }
        idx++;
      }
    } else if (m.kind === 'avb2b') { // Mobitz II: constant PR, drop every Nth (3:2)
      var pp2 = 60 / m.rate, idx2 = 0, R = m.ratio || 3;
      for (var t11 = 0; t11 < to; t11 += pp2) {
        if (t11 >= from) this._push(t11, tP(0.14), false);
        if ((idx2 % R) !== (R - 1)) { if (t11 >= from) this._push(t11 + 0.17, tWide(1, 0.9), true); }
        idx2++;
      }
    } else if (m.kind === 'avb3') { // AV dissociation: independent P and escape QRS
      var pa = 60 / m.atrial, pv = 60 / m.vent;
      for (var ta = Math.ceil(from / pa) * pa; ta < to; ta += pa) this._push(ta, tP(0.14), false);
      for (var tv = Math.ceil(from / pv) * pv; tv < to; tv += pv) this._push(tv, tWide(1, 0.85), true);
    } else if (m.kind === 'paced') {
      rr = 60 / m.rate; for (var tp = Math.ceil(from / rr) * rr; tp < to; tp += rr) this._push(tp, tPaced(), true);
    }
    this.events.sort(function (a, b) { return a.t - b.t; });
    this.qrs.sort(function (a, b) { return a - b; });
    this.built = to;
  };

  Sampler.prototype.value = function (t) {
    if (t + 1 > this.built) this._build(this.built + 12);
    var m = this.m, base = 0;
    if (m.kind === 'vfib') return blVf(t);
    if (m.kind === 'asystole') return blNoise(t) + 0.01 * Math.sin(t * 0.7);
    if (m.kind === 'afib') base = blFib(t);
    else if (m.kind === 'flutter') base = blFlutter(t);
    else base = blWander(t);
    // advance window pointer (playback is monotonic)
    var ev = this.events;
    while (this._i < ev.length && ev[this._i].t < t - 0.7) this._i++;
    var sum = 0;
    for (var i = this._i; i < ev.length; i++) {
      var e = ev[i]; if (e.t > t + 0.05) break;
      sum += e.fn((t - e.t) * 1000);
    }
    return base + sum;
  };

  // QRS times that have occurred up to time t (for beep + rate).
  Sampler.prototype.qrsUpTo = function (t) { if (t + 1 > this.built) this._build(this.built + 12); return this.qrs; };

  window.ECG = {
    RHYTHMS: RHYTHMS,
    byId: function (id) { for (var i = 0; i < RHYTHMS.length; i++) if (RHYTHMS[i].id === id) return RHYTHMS[i]; return null; },
    makeSampler: function (id) { var s = ECG.byId(id); return s ? new Sampler(s) : null; }
  };
})();
