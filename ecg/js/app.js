/* =====================================================================
 * SPM ECG Simulator — app logic (vanilla JS, no deps)
 *   Modes: LEARN (browse rhythms + criteria) · 12-LEAD (derived montage)
 *          BUILDER (sliders reshape the rhythm live) · GAME (identify it)
 *   Bigger, centred monitor; Web-Audio QRS beep + feedback; theme/glass
 *   tweaks; category-tinted WebGL field; back-to-hub.
 * ===================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var RHY = window.ECG.RHYTHMS;

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.ecg.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.ecg.' + k, v); } catch (e) {} }
  };
  var state = {
    mode: 'learn', theme: store.get('theme', 'dark'),
    glass: store.get('glass', '0') === '1', glassAlpha: parseFloat(store.get('glassAlpha', '0.6')),
    sound: store.get('sound', '0') === '1', cur: store.get('rhythm', 'nsr'), tw: store.get('tw', 'afib')
  };

  /* ---------- audio ---------- */
  var actx = null;
  function actxInit() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } return actx; }
  function beep(freq, dur, peak, type) {
    if (!state.sound || !actxInit()) return;
    if (actx.state === 'suspended') actx.resume();
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak || 0.06, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var snd = {
    qrs: function () { beep(880, 0.06, 0.05, 'sine'); },
    correct: function () { beep(660, 0.1, 0.11, 'sine'); setTimeout(function () { beep(990, 0.12, 0.09, 'sine'); }, 90); },
    wrong: function () { beep(180, 0.22, 0.1, 'sawtooth'); }
  };

  /* ---------- shared drawing ---------- */
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    return { grid: cs.getPropertyValue('--grid').trim() || '#0c2018', grid2: cs.getPropertyValue('--grid2').trim() || '#123226', trace: cs.getPropertyValue('--trace').trim() || '#27ff99' };
  }
  function drawGrid(c, W, H, mm, col) {
    c.lineWidth = 1; c.strokeStyle = col.grid; c.beginPath();
    for (var x = 0; x <= W; x += mm) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); }
    for (var y = 0; y <= H; y += mm) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); }
    c.stroke();
    c.strokeStyle = col.grid2; c.beginPath();
    for (var x2 = 0; x2 <= W; x2 += mm * 5) { c.moveTo(x2 + 0.5, 0); c.lineTo(x2 + 0.5, H); }
    for (var y2 = 0; y2 <= H; y2 += mm * 5) { c.moveTo(0, y2 + 0.5); c.lineTo(W, y2 + 0.5); }
    c.stroke();
  }
  function drawTrace(c, W, buf, n, px, base, scale, col, lw) {
    c.lineWidth = lw || 2; c.strokeStyle = col.trace; c.lineJoin = 'round'; c.lineCap = 'round';
    c.shadowColor = col.trace; c.shadowBlur = lw > 1.5 ? 6 : 3; c.beginPath();
    var start = Math.max(0, buf.length - n);
    for (var i = start; i < buf.length; i++) {
      var X = W - (buf.length - 1 - i) * px, Y = base - buf[i] * scale;
      if (i === start) c.moveTo(X, Y); else c.lineTo(X, Y);
    }
    c.stroke(); c.shadowBlur = 0;
  }
  function medianHR(times) {
    if (times.length < 3) return '--';
    var rr = []; for (var i = 1; i < times.length; i++) rr.push(times[i] - times[i - 1]);
    rr.sort(function (a, b) { return a - b; }); var m = rr[Math.floor(rr.length / 2)];
    return (m > 0.15 && m < 4) ? Math.round(60 / m) : '--';
  }

  /* ---------- single-lead monitor ---------- */
  function Monitor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.pxPerMm = 7; this.mmPerSec = 25; this.mmPerMv = 10; this.sampleRate = 200;
    this.buf = []; this.sampler = null; this.t = 0; this.last = 0; this.acc = 0; this.raf = 0; this.running = false;
    this.beepIdx = 0; this.rrTimes = []; this.onHR = null; this.col = readColors();
    var self = this; this.resize(); this._rs = function () { self.resize(); }; window.addEventListener('resize', this._rs);
  }
  Monitor.prototype.readColors = function () { this.col = readColors(); };
  Monitor.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.cv.clientWidth || 940, h = Math.round(Math.min(460, Math.max(300, w * 0.42)));
    this.cv.style.height = h + 'px'; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.W = w; this.H = h;
    this.px = (this.mmPerSec * this.pxPerMm) / this.sampleRate; this.visN = Math.ceil(this.W / this.px) + 4;
  };
  Monitor.prototype.setSampler = function (s) {
    this.sampler = s; this.buf = []; this.t = 0; this.acc = 0; this.beepIdx = 0; this.rrTimes = [];
    var dt = 1 / this.sampleRate; for (var i = 0; i < this.visN; i++) { this.t = i * dt; this.buf.push(s.value(this.t)); }
  };
  Monitor.prototype.setRhythm = function (id) { this.setSampler(window.ECG.makeSampler(id)); };
  Monitor.prototype.start = function () { if (this.running || !this.sampler) return; this.running = true; this.last = performance.now(); var self = this; this.raf = requestAnimationFrame(function (n) { self.frame(n); }); };
  Monitor.prototype.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  Monitor.prototype.frame = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.acc += dt;
    var step = 1 / this.sampleRate;
    while (this.acc >= step) { this.t += step; this.acc -= step; this.buf.push(this.sampler.value(this.t)); if (this.buf.length > this.visN) this.buf.shift(); }
    var qs = this.sampler.qrsUpTo(this.t);
    while (this.beepIdx < qs.length && qs[this.beepIdx] <= this.t) { if (qs[this.beepIdx] >= this.t - 0.2) snd.qrs(); this.rrTimes.push(qs[this.beepIdx]); this.beepIdx++; }
    if (this.rrTimes.length > 8) this.rrTimes = this.rrTimes.slice(-8);
    var c = this.ctx; c.clearRect(0, 0, this.W, this.H); drawGrid(c, this.W, this.H, this.pxPerMm, this.col);
    drawTrace(c, this.W, this.buf, this.visN, this.px, this.H * 0.6, this.mmPerMv * this.pxPerMm, this.col, 2.2);
    if (this.onHR) this.onHR(medianHR(this.rrTimes));
    var self = this; this.raf = requestAnimationFrame(function (n) { self.frame(n); });
  };

  /* ---------- derived 12-lead montage ---------- */
  function TwelveLead(grid, hrCb) {
    this.grid = grid; this.hrCb = hrCb; this.pxPerMm = 4.6; this.mmPerSec = 25; this.mmPerMv = 7; this.sampleRate = 200;
    this.buf = []; this.sampler = null; this.t = 0; this.last = 0; this.acc = 0; this.raf = 0; this.running = false; this.beepIdx = 0; this.rrTimes = [];
    this.col = readColors(); this.cells = []; this._make();
    var self = this; this._rs = function () { self.resize(); }; window.addEventListener('resize', this._rs);
  }
  TwelveLead.prototype._make = function () {
    this.grid.innerHTML = '';
    var self = this;
    window.ECG.LEADS.forEach(function (L) {
      var cell = el('div', 'tw-cell'); var lab = el('div', 'tw-lab', L.n); var cv = el('canvas');
      cell.appendChild(lab); cell.appendChild(cv); self.grid.appendChild(cell);
      self.cells.push({ name: L.n, gain: L.k, cv: cv, ctx: cv.getContext('2d') });
    });
    var strip = el('div', 'tw-cell tw-strip'); strip.appendChild(el('div', 'tw-lab', 'II · rhythm strip'));
    var scv = el('canvas'); strip.appendChild(scv); this.grid.appendChild(strip);
    this.strip = { cv: scv, ctx: scv.getContext('2d') };
    this.resize();
  };
  TwelveLead.prototype.readColors = function () { this.col = readColors(); };
  TwelveLead.prototype._szCanvas = function (cv, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 200;
    cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); return { w: w, h: h };
  };
  TwelveLead.prototype.resize = function () {
    var self = this; this.px = (this.mmPerSec * this.pxPerMm) / this.sampleRate;
    this.cells.forEach(function (c) { var s = self._szCanvas(c.cv, 96); c.W = s.w; c.H = s.h; c.visN = Math.ceil(s.w / self.px) + 4; });
    var ss = this._szCanvas(this.strip.cv, 120); this.strip.W = ss.w; this.strip.H = ss.h; this.strip.visN = Math.ceil(ss.w / this.px) + 4;
    this.maxN = Math.max(this.strip.visN, 1);
  };
  TwelveLead.prototype.setRhythm = function (id) {
    this.sampler = window.ECG.makeSampler(id); this.buf = []; this.t = 0; this.acc = 0; this.beepIdx = 0; this.rrTimes = [];
    var dt = 1 / this.sampleRate; for (var i = 0; i < this.maxN; i++) { this.t = i * dt; this.buf.push(this.sampler.value(this.t)); }
  };
  TwelveLead.prototype.start = function () { if (this.running || !this.sampler) return; this.running = true; this.last = performance.now(); var self = this; this.raf = requestAnimationFrame(function (n) { self.frame(n); }); };
  TwelveLead.prototype.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  TwelveLead.prototype.frame = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.acc += dt; var step = 1 / this.sampleRate;
    while (this.acc >= step) { this.t += step; this.acc -= step; this.buf.push(this.sampler.value(this.t)); if (this.buf.length > this.maxN) this.buf.shift(); }
    var qs = this.sampler.qrsUpTo(this.t);
    while (this.beepIdx < qs.length && qs[this.beepIdx] <= this.t) { if (qs[this.beepIdx] >= this.t - 0.2) snd.qrs(); this.rrTimes.push(qs[this.beepIdx]); this.beepIdx++; }
    if (this.rrTimes.length > 8) this.rrTimes = this.rrTimes.slice(-8);
    var self = this, col = this.col, scl = this.mmPerMv * this.pxPerMm;
    this.cells.forEach(function (c) {
      var x = c.ctx; x.clearRect(0, 0, c.W, c.H); drawGrid(x, c.W, c.H, self.pxPerMm, col);
      var scaled = []; var st = Math.max(0, self.buf.length - c.visN);
      for (var i = st; i < self.buf.length; i++) scaled.push(self.buf[i] * c.gain);
      drawTrace(x, c.W, scaled, c.visN, self.px, c.H * 0.55, scl, col, 1.6);
    });
    var sp = this.strip; sp.ctx.clearRect(0, 0, sp.W, sp.H); drawGrid(sp.ctx, sp.W, sp.H, this.pxPerMm, col);
    drawTrace(sp.ctx, sp.W, this.buf, sp.visN, this.px, sp.H * 0.55, scl, col, 1.8);
    if (this.hrCb) this.hrCb(medianHR(this.rrTimes));
    this.raf = requestAnimationFrame(function (n) { self.frame(n); });
  };

  /* ---------- LEARN ---------- */
  var monitor, info;
  function buildSidebar() {
    var sb = $('sidebar'); var cats = {}; RHY.forEach(function (r) { (cats[r.cat] = cats[r.cat] || []).push(r); });
    ['Sinus', 'Atrial', 'Junctional', 'AV Block', 'Ventricular', 'Paced', 'Arrest'].forEach(function (cat) {
      if (!cats[cat]) return; var g = el('div', 'cat'); g.appendChild(el('div', 'cat-h', cat));
      cats[cat].forEach(function (r) {
        var row = el('div', 'rhy'); row.dataset.id = r.id; row.setAttribute('role', 'button'); row.setAttribute('tabindex', '0');
        row.appendChild(el('span', 'rn', r.name));
        function open() { showRhythm(r.id); }
        row.addEventListener('click', open); row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        g.appendChild(row);
      });
      sb.appendChild(g);
    });
  }
  function showRhythm(id) {
    var r = window.ECG.byId(id); if (!r) return; state.cur = id; store.set('rhythm', id);
    $('sidebar').querySelectorAll('.rhy').forEach(function (x) { x.classList.toggle('act', x.dataset.id === id); });
    monitor.setRhythm(id);
    $('monName').textContent = r.name; $('monPace').textContent = 'LEAD II · 25 mm/s · 10 mm/mV';
    info.innerHTML = '';
    info.appendChild(el('h2', null, r.name)); info.appendChild(el('div', 'sub', r.cat + ' rhythm'));
    var grid = el('div', 'crit-grid');
    [['rate', 'Rate', r.rate], ['', 'Regularity', r.reg], ['', 'P wave', r.p], ['', 'PR interval', r.pr], ['qrs', 'QRS', r.qrs]].forEach(function (c) {
      var cell = el('div', 'crit' + (c[0] ? ' ' + c[0] : '')); cell.appendChild(el('div', 'cl', c[1])); cell.appendChild(el('div', 'cv', c[2])); grid.appendChild(cell);
    });
    info.appendChild(grid);
    function blk(cls, h, txt) { var b = el('div', 'blk' + (cls ? ' ' + cls : '')); b.appendChild(el('div', 'bh', h)); b.appendChild(el('p', null, txt)); return b; }
    info.appendChild(blk('', 'Recognition', r.features)); info.appendChild(blk('', 'Clinical significance', r.clinical)); info.appendChild(blk('mgmt', 'Management', r.mgmt));
    info.classList.add('v');
  }

  /* ---------- 12-LEAD ---------- */
  var twelve;
  function initTwelve() {
    var sel = $('twSel');
    RHY.forEach(function (r) { var o = el('option', null, r.name); o.value = r.id; sel.appendChild(o); });
    sel.value = state.tw;
    twelve = new TwelveLead($('twGrid'), function (v) { $('tw12hr').textContent = v; });
    sel.addEventListener('change', function () { state.tw = sel.value; store.set('tw', sel.value); twelve.setRhythm(sel.value); });
  }

  /* ---------- BUILDER ---------- */
  var bmon, bparams;
  function fmtSec(v) { return v.toFixed(2) + ' s'; }
  function initBuilder() {
    bparams = { rate: 75, pr: 0.16, qrsW: 0.09, pAmp: 0.13, st: 0, tAmp: 0.30, irregular: false };
    bmon = new Monitor($('bMon')); bmon.onHR = function (v) { $('bHr').textContent = v; };
    var box = $('bCtrls'); box.innerHTML = '';
    var defs = [
      ['rate', 'Heart rate', 30, 200, 1, function (v) { return v + ' bpm'; }],
      ['pr', 'PR interval', 0.08, 0.40, 0.01, fmtSec],
      ['qrsW', 'QRS width', 0.06, 0.20, 0.005, fmtSec],
      ['pAmp', 'P wave amplitude', 0, 0.30, 0.01, function (v) { return v <= 0 ? 'absent' : v.toFixed(2) + ' mV'; }],
      ['st', 'ST segment', -0.4, 0.6, 0.02, function (v) { return (v > 0 ? '+' : '') + v.toFixed(2) + ' mV'; }],
      ['tAmp', 'T wave amplitude', -0.5, 0.6, 0.02, function (v) { return (v < 0 ? 'inverted ' : '') + v.toFixed(2) + ' mV'; }]
    ];
    defs.forEach(function (d) {
      var ctrl = el('div', 'bctrl');
      var head = el('div', 'bctrl-h'); head.appendChild(el('span', null, d[1])); var val = el('span', 'bctrl-v', d[5](bparams[d[0]])); head.appendChild(val);
      var rng = el('input'); rng.type = 'range'; rng.min = d[2]; rng.max = d[3]; rng.step = d[4]; rng.value = bparams[d[0]]; rng.className = 'tw-range'; rng.setAttribute('aria-label', d[1]);
      rng.addEventListener('input', function () { bparams[d[0]] = parseFloat(rng.value); val.textContent = d[5](bparams[d[0]]); if (bmon.sampler) bmon.sampler.replan(bmon.t); });
      ctrl.appendChild(head); ctrl.appendChild(rng); box.appendChild(ctrl);
    });
    // irregular toggle
    var ir = el('div', 'bctrl'); var irh = el('div', 'bctrl-h'); irh.appendChild(el('span', null, 'Irregular rhythm'));
    var sw = mkSwitch(false, function (v) { bparams.irregular = v; if (bmon.sampler) bmon.sampler.replan(bmon.t); }); irh.appendChild(sw); ir.appendChild(irh); box.appendChild(ir);
    // presets
    var pre = el('div', 'bpresets');
    [['NSR', { rate: 75, pr: 0.16, qrsW: 0.09, pAmp: 0.13, st: 0, tAmp: 0.30, irregular: false }],
     ['Bradycardia', { rate: 44, pr: 0.18, qrsW: 0.09, pAmp: 0.13, st: 0, tAmp: 0.28, irregular: false }],
     ['Tachycardia', { rate: 135, pr: 0.14, qrsW: 0.09, pAmp: 0.12, st: 0, tAmp: 0.26, irregular: false }],
     ['1° AV block', { rate: 70, pr: 0.32, qrsW: 0.09, pAmp: 0.14, st: 0, tAmp: 0.30, irregular: false }],
     ['Wide QRS', { rate: 90, pr: 0.16, qrsW: 0.17, pAmp: 0.05, st: 0, tAmp: -0.3, irregular: false }],
     ['ST elevation', { rate: 80, pr: 0.16, qrsW: 0.10, pAmp: 0.13, st: 0.45, tAmp: 0.4, irregular: false }]
    ].forEach(function (p) {
      var b = el('button', 'bpreset', p[0]); b.type = 'button';
      b.addEventListener('click', function () { applyPreset(p[1]); });
      pre.appendChild(b);
    });
    var preWrap = el('div', 'bctrl bctrl-wide'); preWrap.appendChild(el('div', 'bctrl-h', 'Presets')); preWrap.appendChild(pre); box.appendChild(preWrap);
    bmon.setSampler(window.ECG.makeCustom(bparams));
    function applyPreset(p) {
      for (var k in p) bparams[k] = p[k];
      // refresh control widgets
      box.querySelectorAll('.bctrl').forEach(function () {});
      defs.forEach(function (d, i) {
        var ctrl = box.children[i]; if (!ctrl) return; var rng = ctrl.querySelector('input[type=range]'); var val = ctrl.querySelector('.bctrl-v');
        if (rng) rng.value = bparams[d[0]]; if (val) val.textContent = d[5](bparams[d[0]]);
      });
      var swInput = ir.querySelector('input[type=checkbox]'); if (swInput) { swInput.checked = bparams.irregular; sw.setAttribute('aria-checked', String(bparams.irregular)); }
      if (bmon.sampler) bmon.sampler.replan(bmon.t);
    }
  }

  /* ---------- GAME ---------- */
  var game = { pool: [], i: 0, n: 10, score: 0, streak: 0, answered: false, tInt: null, mon: null, endless: false }, gameEl;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function buildGameSetup() {
    if (game.mon) game.mon.stop(); if (game.tInt) clearInterval(game.tInt);
    gameEl.innerHTML = '';
    var w = el('div', 'game-setup');
    w.appendChild(el('h1', null, 'Rhythm Challenge'));
    w.appendChild(el('p', null, 'A live strip scrolls across the monitor. Identify the rhythm before the timer runs out — build a streak and beat your accuracy.'));
    var row = el('div', 'gs-row');
    var len = el('select'); [['10', '10 rounds'], ['20', '20 rounds'], ['endless', 'Endless']].forEach(function (p) { var o = el('option', null, p[1]); o.value = p[0]; len.appendChild(o); }); row.appendChild(len);
    var start = el('button', 'btn', 'Start'); start.addEventListener('click', function () { startGame(len.value); }); row.appendChild(start);
    w.appendChild(row); w.appendChild(el('p', null, 'Best streak: ' + (parseInt(store.get('best', '0'), 10) || 0)));
    gameEl.appendChild(w);
  }
  function startGame(lenVal) { game.pool = shuffle(RHY.map(function (r) { return r.id; })); game.i = 0; game.score = 0; game.streak = 0; game.endless = lenVal === 'endless'; game.n = game.endless ? Infinity : parseInt(lenVal, 10); renderRound(); }
  function renderRound() {
    if (!game.endless && game.i >= game.n) return finishGame();
    game.answered = false;
    var id = game.i < game.pool.length ? game.pool[game.i] : (game.pool = shuffle(RHY.map(function (r) { return r.id; })))[game.i % game.pool.length];
    var r = window.ECG.byId(id);
    gameEl.innerHTML = '';
    var hud = el('div', 'hud');
    hud.appendChild(stat('Round', game.endless ? (game.i + 1) : (game.i + 1) + ' / ' + game.n));
    var sc = stat('Score', game.score); sc.classList.add('score'); hud.appendChild(sc);
    var st = stat('Streak', game.streak); st.classList.add('streak'); hud.appendChild(st);
    gameEl.appendChild(hud);
    var mwrap = el('div', 'monitor'); var cv = el('canvas'); mwrap.appendChild(cv);
    var h2 = el('div', 'mon-hud'); h2.appendChild(el('div', 'mon-lead', 'II')); var hr = el('div', 'mon-hr'); var hrb = el('b', null, '--'); hr.appendChild(hrb); hr.appendChild(el('small', null, 'bpm')); h2.appendChild(hr); mwrap.appendChild(h2);
    mwrap.appendChild(el('div', 'mon-pace', 'LEAD II · 25 mm/s'));
    gameEl.appendChild(mwrap);
    if (game.mon) game.mon.stop(); game.mon = new Monitor(cv); game.mon.resize(); game.mon.onHR = function (v) { hrb.textContent = v; }; game.mon.setRhythm(id); game.mon.start();
    var bar = el('div', 'gbar'); var fill = el('i'); bar.appendChild(fill); gameEl.appendChild(bar);
    gameEl.appendChild(el('div', 'q-prompt', 'What is this rhythm?'));
    var choices = el('div', 'choices'); var opts = makeChoices(r); var fb = el('div', 'feedback');
    opts.forEach(function (o, n) {
      var b = el('button', 'choice'); b.type = 'button'; b.appendChild(el('span', 'ck', String.fromCharCode(65 + n))); b.appendChild(el('span', null, o.name));
      b.addEventListener('click', function () { answer(b, o.id === id, r, choices, fb); }); choices.appendChild(b);
    });
    gameEl.appendChild(choices); gameEl.appendChild(fb);
    var nav = el('div', 'g-nav');
    var quit = el('button', 'btn sec', 'End'); quit.addEventListener('click', buildGameSetup);
    var next = el('button', 'btn', (!game.endless && game.i + 1 >= game.n) ? 'Results' : 'Next →'); next.id = 'gNext'; next.style.visibility = 'hidden';
    next.addEventListener('click', function () { if (game.mon) game.mon.stop(); game.i++; renderRound(); });
    nav.appendChild(quit); nav.appendChild(next); gameEl.appendChild(nav);
    var total = 22, t0 = performance.now(); fill.style.width = '100%';
    if (game.tInt) clearInterval(game.tInt);
    game.tInt = setInterval(function () {
      var left = Math.max(0, total - (performance.now() - t0) / 1000); fill.style.width = (left / total * 100) + '%'; bar.classList.toggle('warn', left < 6);
      if (left <= 0) { clearInterval(game.tInt); if (!game.answered) answer(null, false, r, choices, fb); }
    }, 100);
  }
  function stat(label, val) { var s = el('div', 'stat'); s.appendChild(document.createTextNode(label + ' ')); s.appendChild(el('b', null, String(val))); return s; }
  function makeChoices(correct) {
    var same = RHY.filter(function (r) { return r.cat === correct.cat && r.id !== correct.id; });
    var other = RHY.filter(function (r) { return r.cat !== correct.cat; });
    var picks = [correct].concat(shuffle(same).slice(0, 2)).concat(shuffle(other)); var seen = {}, out = [];
    for (var i = 0; i < picks.length && out.length < 4; i++) if (!seen[picks[i].id]) { seen[picks[i].id] = 1; out.push({ id: picks[i].id, name: picks[i].name }); }
    return shuffle(out);
  }
  function answer(btn, correct, r, choices, fb) {
    if (game.answered) return; game.answered = true; if (game.tInt) clearInterval(game.tInt);
    if (correct) { btn.classList.add('correct'); game.score++; game.streak++; snd.correct(); var best = parseInt(store.get('best', '0'), 10) || 0; if (game.streak > best) store.set('best', String(game.streak)); }
    else { if (btn) btn.classList.add('wrong'); game.streak = 0; snd.wrong(); }
    choices.querySelectorAll('.choice').forEach(function (b) { b.disabled = true; if (b.querySelector('span:last-child').textContent === r.name) b.classList.add('correct'); });
    fb.innerHTML = '<b>' + (correct ? 'Correct — ' : 'Answer: ') + r.name + '.</b> ' + r.features; fb.classList.add('v');
    var nx = $('gNext'); if (nx) nx.style.visibility = 'visible';
  }
  function finishGame() {
    if (game.mon) game.mon.stop(); gameEl.innerHTML = '';
    var done = game.endless ? game.i : game.n, pct = done ? Math.round(game.score / done * 100) : 0;
    var w = el('div', 'result'); w.appendChild(el('div', 'big', pct + '%'));
    w.appendChild(el('div', 'lbl', game.score + ' / ' + done + ' correct · best streak ' + (parseInt(store.get('best', '0'), 10) || 0)));
    var again = el('button', 'btn', 'Play again'); again.addEventListener('click', buildGameSetup); w.appendChild(again); gameEl.appendChild(w);
    pct >= 70 ? snd.correct() : snd.wrong();
  }

  /* ---------- modes ---------- */
  var VIEWS = { learn: 'learnView', twelve: 'twelveView', builder: 'builderView', game: 'gameView' };
  var ACC = { learn: [0, 0.78, 0.46], twelve: [0, 0.83, 1.0], builder: [0.7, 0.53, 1.0], game: [1.0, 0.7, 0.0] };
  function setMode(m) {
    state.mode = m;
    [['segLearn', 'learn'], ['seg12', 'twelve'], ['segBuild', 'builder'], ['segGame', 'game']].forEach(function (p) {
      var on = p[1] === m, b = $(p[0]); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }
    });
    document.body.classList.toggle('solo', m !== 'learn');
    Object.keys(VIEWS).forEach(function (k) { var v = $(VIEWS[k]); if (v) v.classList.toggle('v', k === m); });
    // stop all engines, start the active one
    monitor.stop(); if (twelve) twelve.stop(); if (bmon) bmon.stop(); if (game.mon) game.mon.stop(); if (game.tInt) clearInterval(game.tInt);
    if (m === 'learn') { monitor.start(); showRhythm(state.cur); }
    else if (m === 'twelve') { twelve.setRhythm($('twSel').value); twelve.readColors(); twelve.start(); }
    else if (m === 'builder') { bmon.readColors(); if (!bmon.sampler) bmon.setSampler(window.ECG.makeCustom(bparams)); bmon.start(); }
    else { buildGameSetup(); }
    if (window.SPM_BG) window.SPM_BG.setAccent(ACC[m]);
  }

  /* ---------- theme / glass / sound / tweaks ---------- */
  var themeSeg = { dark: null, light: null };
  function setTheme(th) {
    state.theme = th; document.documentElement.setAttribute('data-theme', th); store.set('theme', th);
    [monitor, twelve, bmon, game.mon].forEach(function (mm) { if (mm) mm.readColors(); });
    if (themeSeg.dark) { themeSeg.dark.classList.toggle('on', th === 'dark'); themeSeg.light.classList.toggle('on', th === 'light'); }
    var q = $('themeQuick'); if (q) q.textContent = th === 'dark' ? '☾' : '☀';
  }
  function applyGlass() {
    document.body.classList.toggle('glass', state.glass); document.body.style.setProperty('--glass-alpha', String(state.glassAlpha));
    if (window.SPM_BG) window.SPM_BG.setGlass(state.glass);
    store.set('glass', state.glass ? '1' : '0'); store.set('glassAlpha', String(state.glassAlpha));
  }
  function setSound(on) {
    state.sound = on; if (on) actxInit();
    var b = $('soundToggle'); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = 'Sound: ' + (on ? 'on' : 'off'); }
    store.set('sound', on ? '1' : '0');
  }
  function mkSwitch(on, cb) {
    var lab = el('label', 'switch'); lab.tabIndex = 0; lab.setAttribute('role', 'switch'); lab.setAttribute('aria-checked', String(on));
    var inp = el('input'); inp.type = 'checkbox'; inp.checked = on; var tr = el('span', 'track'), th = el('span', 'thumb'); lab.appendChild(inp); lab.appendChild(tr); lab.appendChild(th);
    function fire() { lab.setAttribute('aria-checked', String(inp.checked)); cb(inp.checked); }
    inp.addEventListener('change', fire); lab.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.checked = !inp.checked; fire(); } });
    return lab;
  }
  function buildTweaks() {
    var scrim = el('div', 'tweaks-scrim'); var panel = el('aside', 'tweaks'); panel.id = 'tweaksPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Tweaks'); panel.setAttribute('aria-hidden', 'true');
    var close = el('button', 'tw-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); panel.appendChild(close);
    panel.appendChild(el('h3', null, 'Tweaks')); panel.appendChild(el('div', 'tw-sub', 'Theme · field'));
    var gT = el('div', 'tw-group'); gT.appendChild(el('span', 'tw-label', 'Theme'));
    var tseg = el('div', 'tw-seg'); var bD = el('button', state.theme === 'dark' ? 'on' : '', 'Monitor'); bD.type = 'button'; var bL = el('button', state.theme === 'light' ? 'on' : '', 'Paper'); bL.type = 'button';
    tseg.appendChild(bD); tseg.appendChild(bL); gT.appendChild(tseg); panel.appendChild(gT); themeSeg.dark = bD; themeSeg.light = bL;
    bD.addEventListener('click', function () { setTheme('dark'); }); bL.addEventListener('click', function () { setTheme('light'); });
    var gF = el('div', 'tw-group'); gF.appendChild(el('span', 'tw-label', 'Ambient field'));
    var r1 = el('div', 'tw-row'); r1.appendChild(document.createTextNode('Glass panels')); r1.appendChild(mkSwitch(state.glass, function (v) { state.glass = v; applyGlass(); })); gF.appendChild(r1);
    var r2 = el('div', 'tw-row'); r2.style.display = 'block'; r2.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(state.glassAlpha); rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { state.glassAlpha = parseFloat(rng.value); applyGlass(); }); r2.appendChild(rng); gF.appendChild(r2); panel.appendChild(gF);
    document.body.appendChild(scrim); document.body.appendChild(panel);
    function open() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); }
    function shut() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', shut); scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) shut(); });
    $('tweaksBtn').addEventListener('click', open);
  }

  /* ---------- boot ---------- */
  monitor = new Monitor($('monCanvas')); monitor.onHR = function (v) { var h = $('hrVal'); if (h) h.textContent = v; };
  info = $('info'); gameEl = $('gameView');
  buildSidebar(); initTwelve(); initBuilder(); buildTweaks();
  setTheme(state.theme); applyGlass(); setSound(state.sound);
  $('segLearn').addEventListener('click', function () { setMode('learn'); });
  $('seg12').addEventListener('click', function () { setMode('twelve'); });
  $('segBuild').addEventListener('click', function () { setMode('builder'); });
  $('segGame').addEventListener('click', function () { setMode('game'); });
  $('themeQuick').addEventListener('click', function () { setTheme(state.theme === 'dark' ? 'light' : 'dark'); });
  $('soundToggle').addEventListener('click', function () { setSound(!state.sound); if (state.sound && actx && actx.state === 'suspended') actx.resume(); });
  setMode('learn');
})();
