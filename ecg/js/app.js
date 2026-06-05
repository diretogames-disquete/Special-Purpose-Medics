/* =====================================================================
 * SPM ECG Simulator — app logic (vanilla JS, no deps)
 *   - A scrolling single-lead monitor that streams ECG.makeSampler(id)
 *   - LEARN: browse rhythms, see criteria + clinical notes
 *   - GAME : identify the rhythm against the clock, with scoring
 *   - Web-Audio QRS beep + correct/incorrect tones, theme/glass tweaks,
 *     category-tinted WebGL field, back-to-hub.
 * ===================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var RHY = window.ECG.RHYTHMS;

  /* ---------- persisted state ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.ecg.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.ecg.' + k, v); } catch (e) {} }
  };
  var state = {
    mode: 'learn', theme: store.get('theme', 'dark'),
    glass: store.get('glass', '0') === '1', glassAlpha: parseFloat(store.get('glassAlpha', '0.6')),
    sound: store.get('sound', '0') === '1', cur: store.get('rhythm', 'nsr')
  };

  /* ---------- audio (beep + feedback) ---------- */
  var actx = null;
  function actxInit() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } }
  function beep(freq, dur, peak, type) {
    if (!state.sound || !actxInit() && !actx) return;
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak || 0.08, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var snd = {
    qrs: function () { beep(880, 0.06, 0.05, 'sine'); },
    correct: function () { beep(660, 0.1, 0.12, 'sine'); setTimeout(function () { beep(990, 0.12, 0.1, 'sine'); }, 90); },
    wrong: function () { beep(180, 0.22, 0.1, 'sawtooth'); }
  };

  /* ---------- the monitor ---------- */
  function Monitor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.pxPerMm = 6; this.mmPerSec = 25; this.mmPerMv = 9;
    this.sampleRate = 200; this.buf = []; this.sampler = null;
    this.t = 0; this.last = 0; this.acc = 0; this.raf = 0; this.running = false;
    this.beepIdx = 0; this.rrTimes = []; this.onHR = null; this.colors = {};
    this.readColors(); this.resize();
    var self = this; window.addEventListener('resize', function () { self.resize(); });
  }
  Monitor.prototype.readColors = function () {
    var cs = getComputedStyle(document.documentElement);
    this.colors = {
      grid: cs.getPropertyValue('--grid').trim() || '#0c2018',
      grid2: cs.getPropertyValue('--grid2').trim() || '#123226',
      trace: cs.getPropertyValue('--trace').trim() || '#27ff99'
    };
  };
  Monitor.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.cv.clientWidth || 900, h = Math.round(Math.min(300, Math.max(200, w * 0.30)));
    this.cv.style.height = h + 'px';
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
    this.pxPerSample = (this.mmPerSec * this.pxPerMm) / this.sampleRate;
    this.visN = Math.ceil(this.W / this.pxPerSample) + 4;
  };
  Monitor.prototype.setRhythm = function (id) {
    this.sampler = window.ECG.makeSampler(id);
    this.buf = []; this.t = 0; this.acc = 0; this.beepIdx = 0; this.rrTimes = [];
    // prefill one screen so it doesn't start empty
    var n = this.visN, dt = 1 / this.sampleRate;
    for (var i = 0; i < n; i++) { this.t = i * dt; this.buf.push(this.sampler.value(this.t)); }
  };
  Monitor.prototype.start = function () { if (this.running) return; this.running = true; this.last = performance.now(); var self = this; this.raf = requestAnimationFrame(function (n) { self.frame(n); }); };
  Monitor.prototype.stop = function () { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };
  Monitor.prototype.frame = function (now) {
    if (!this.running) return;
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.acc += dt;
    var step = 1 / this.sampleRate;
    while (this.acc >= step) {
      this.t += step; this.acc -= step;
      this.buf.push(this.sampler.value(this.t));
      if (this.buf.length > this.visN) this.buf.shift();
    }
    // QRS beep + HR from sampler.qrs that have passed
    var qs = this.sampler.qrsUpTo(this.t);
    while (this.beepIdx < qs.length && qs[this.beepIdx] <= this.t) {
      if (qs[this.beepIdx] >= this.t - 0.2) snd.qrs();
      this.rrTimes.push(qs[this.beepIdx]); this.beepIdx++;
    }
    if (this.rrTimes.length > 8) this.rrTimes = this.rrTimes.slice(-8);
    this.draw();
    var self = this; this.raf = requestAnimationFrame(function (n) { self.frame(n); });
    // HR readout
    if (this.onHR) {
      var hr = '--';
      if (this.rrTimes.length >= 3) {
        var rr = []; for (var i = 1; i < this.rrTimes.length; i++) rr.push(this.rrTimes[i] - this.rrTimes[i - 1]);
        rr.sort(function (a, b) { return a - b; }); var med = rr[Math.floor(rr.length / 2)];
        if (med > 0.15 && med < 4) hr = Math.round(60 / med);
      }
      this.onHR(hr);
    }
  };
  Monitor.prototype.draw = function () {
    var c = this.ctx, W = this.W, H = this.H, mm = this.pxPerMm;
    c.clearRect(0, 0, W, H);
    // grid
    c.lineWidth = 1; c.strokeStyle = this.colors.grid; c.beginPath();
    for (var x = 0; x <= W; x += mm) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); }
    for (var y = 0; y <= H; y += mm) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); }
    c.stroke();
    c.strokeStyle = this.colors.grid2; c.beginPath();
    for (var x2 = 0; x2 <= W; x2 += mm * 5) { c.moveTo(x2 + 0.5, 0); c.lineTo(x2 + 0.5, H); }
    for (var y2 = 0; y2 <= H; y2 += mm * 5) { c.moveTo(0, y2 + 0.5); c.lineTo(W, y2 + 0.5); }
    c.stroke();
    // trace
    var base = H * 0.62, sc = this.mmPerMv * mm;
    c.lineWidth = 2; c.strokeStyle = this.colors.trace; c.lineJoin = 'round'; c.lineCap = 'round';
    c.shadowColor = this.colors.trace; c.shadowBlur = 6;
    c.beginPath();
    var n = this.buf.length, px = this.pxPerSample;
    for (var i = 0; i < n; i++) {
      var X = W - (n - 1 - i) * px, Y = base - this.buf[i] * sc;
      if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
    }
    c.stroke(); c.shadowBlur = 0;
  };

  /* ---------- LEARN ---------- */
  var monitor, hrEl, nameEl, paceEl, info;
  function buildSidebar() {
    var sb = $('sidebar');
    var cats = {}; RHY.forEach(function (r) { (cats[r.cat] = cats[r.cat] || []).push(r); });
    var order = ['Sinus', 'Atrial', 'Junctional', 'AV Block', 'Ventricular', 'Paced', 'Arrest'];
    order.forEach(function (cat) {
      if (!cats[cat]) return;
      var g = el('div', 'cat'); g.appendChild(el('div', 'cat-h', cat));
      cats[cat].forEach(function (r) {
        var row = el('div', 'rhy'); row.dataset.id = r.id; row.setAttribute('role', 'button'); row.setAttribute('tabindex', '0');
        row.appendChild(el('span', 'rn', r.name));
        function open() { showRhythm(r.id); }
        row.addEventListener('click', open);
        row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        g.appendChild(row);
      });
      sb.appendChild(g);
    });
  }
  function showRhythm(id) {
    var r = window.ECG.byId(id); if (!r) return;
    state.cur = id; store.set('rhythm', id);
    $('sidebar').querySelectorAll('.rhy').forEach(function (x) { x.classList.toggle('act', x.dataset.id === id); });
    monitor.setRhythm(id);
    nameEl.textContent = r.name; paceEl.textContent = 'LEAD II · 25 mm/s · 10 mm/mV';
    // info
    info.innerHTML = '';
    info.appendChild(el('h2', null, r.name));
    info.appendChild(el('div', 'sub', r.cat + ' rhythm'));
    var grid = el('div', 'crit-grid');
    [['rate', 'Rate', r.rate], ['', 'Regularity', r.reg], ['', 'P wave', r.p], ['', 'PR interval', r.pr], ['qrs', 'QRS', r.qrs]].forEach(function (c) {
      var cell = el('div', 'crit' + (c[0] ? ' ' + c[0] : ''));
      cell.appendChild(el('div', 'cl', c[1])); cell.appendChild(el('div', 'cv', c[2])); grid.appendChild(cell);
    });
    info.appendChild(grid);
    function blk(cls, h, txt) { var b = el('div', 'blk' + (cls ? ' ' + cls : '')); b.appendChild(el('div', 'bh', h)); b.appendChild(el('p', null, txt)); return b; }
    info.appendChild(blk('', 'Recognition', r.features));
    info.appendChild(blk('', 'Clinical significance', r.clinical));
    info.appendChild(blk('mgmt', 'Management', r.mgmt));
    info.classList.add('v');
  }

  /* ---------- GAME ---------- */
  var game = { pool: [], i: 0, n: 10, score: 0, streak: 0, best: 0, answered: false, timer: 0, timeLeft: 0, tInt: null };
  var gameEl;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gamePool() {
    // exclude near-duplicates that look identical (junctional vs nsr-noP) to keep it fair
    return RHY.map(function (r) { return r.id; });
  }
  function buildGameSetup() {
    gameEl.innerHTML = '';
    var w = el('div', 'game-setup');
    w.appendChild(el('h1', null, 'Rhythm Challenge'));
    w.appendChild(el('p', null, 'A six-second strip scrolls across the monitor. Identify the rhythm before the timer runs out. Build a streak, beat your accuracy.'));
    var row = el('div', 'gs-row');
    var len = el('select'); [['10', '10 rounds'], ['20', '20 rounds'], ['endless', 'Endless']].forEach(function (p) { var o = el('option', null, p[1]); o.value = p[0]; len.appendChild(o); });
    row.appendChild(len);
    var start = el('button', 'btn', 'Start'); start.addEventListener('click', function () { startGame(len.value); });
    row.appendChild(start);
    w.appendChild(row);
    w.appendChild(el('p', null, 'Best streak: ' + (parseInt(store.get('best', '0'), 10) || 0)));
    gameEl.appendChild(w);
  }
  function startGame(lenVal) {
    game.pool = shuffle(gamePool()); game.i = 0; game.score = 0; game.streak = 0;
    game.best = parseInt(store.get('best', '0'), 10) || 0;
    game.endless = lenVal === 'endless'; game.n = game.endless ? Infinity : parseInt(lenVal, 10);
    renderRound();
  }
  function nextQuestionId() {
    if (game.i < game.pool.length) return game.pool[game.i];
    game.pool = shuffle(gamePool()); return game.pool[game.i % game.pool.length];
  }
  function renderRound() {
    if (!game.endless && game.i >= game.n) return finishGame();
    game.answered = false;
    var id = nextQuestionId(), r = window.ECG.byId(id);
    gameEl.innerHTML = '';
    // HUD
    var hud = el('div', 'hud');
    hud.appendChild(roundStat('Round', game.endless ? (game.i + 1) : (game.i + 1) + ' / ' + game.n));
    var sc = roundStat('Score', game.score); sc.classList.add('score'); hud.appendChild(sc);
    var st = roundStat('Streak', game.streak); st.classList.add('streak'); hud.appendChild(st);
    gameEl.appendChild(hud);
    // monitor
    var mwrap = el('div', 'monitor'); var cv = el('canvas'); mwrap.appendChild(cv);
    var hud2 = el('div', 'mon-hud'); hud2.appendChild(el('div', 'mon-lead', 'II'));
    var hr = el('div', 'mon-hr'); var hrb = el('b', null, '--'); var hrs = el('small', null, 'bpm'); hr.appendChild(hrb); hr.appendChild(hrs); hud2.appendChild(hr);
    mwrap.appendChild(hud2);
    mwrap.appendChild(el('div', 'mon-pace', 'LEAD II · 25 mm/s'));
    gameEl.appendChild(mwrap);
    // its own monitor instance
    if (game.mon) game.mon.stop();
    game.mon = new Monitor(cv); game.mon.onHR = function (v) { hrb.textContent = v; }; game.mon.setRhythm(id); game.mon.start();
    // timer bar
    var bar = el('div', 'gbar'); var fill = el('i'); bar.appendChild(fill); gameEl.appendChild(bar);
    gameEl.appendChild(el('div', 'q-prompt', 'What is this rhythm?'));
    // choices
    var choices = el('div', 'choices');
    var opts = makeChoices(r);
    var fb = el('div', 'feedback');
    opts.forEach(function (o, n) {
      var b = el('button', 'choice'); b.type = 'button';
      b.appendChild(el('span', 'ck', String.fromCharCode(65 + n)));
      b.appendChild(el('span', null, o.name));
      b.addEventListener('click', function () { answer(b, o.id === id, r, choices, fb); });
      choices.appendChild(b);
    });
    gameEl.appendChild(choices); gameEl.appendChild(fb);
    var nav = el('div', 'g-nav');
    var quit = el('button', 'btn sec', 'End'); quit.addEventListener('click', function () { if (game.mon) game.mon.stop(); buildGameSetup(); });
    var next = el('button', 'btn', game.endless ? 'Next →' : (game.i + 1 >= game.n ? 'Results' : 'Next →')); next.id = 'gNext'; next.style.visibility = 'hidden';
    next.addEventListener('click', function () { if (game.mon) game.mon.stop(); game.i++; renderRound(); });
    nav.appendChild(quit); nav.appendChild(next); gameEl.appendChild(nav);
    // countdown
    game.timeLeft = 22; fill.style.width = '100%';
    if (game.tInt) clearInterval(game.tInt);
    var t0 = performance.now();
    game.tInt = setInterval(function () {
      var elapsed = (performance.now() - t0) / 1000, left = Math.max(0, game.timeLeft - elapsed);
      fill.style.width = (left / game.timeLeft * 100) + '%';
      bar.classList.toggle('warn', left < 6);
      if (left <= 0) { clearInterval(game.tInt); if (!game.answered) answer(null, false, r, choices, fb); }
    }, 100);
  }
  function roundStat(label, val) { var s = el('div', 'stat'); s.appendChild(document.createTextNode(label + ' ')); s.appendChild(el('b', null, String(val))); return s; }
  function makeChoices(correct) {
    var same = RHY.filter(function (r) { return r.cat === correct.cat && r.id !== correct.id; });
    var other = RHY.filter(function (r) { return r.cat !== correct.cat; });
    var picks = [correct].concat(shuffle(same).slice(0, 2)).concat(shuffle(other));
    var seen = {}, out = [];
    for (var i = 0; i < picks.length && out.length < 4; i++) { if (!seen[picks[i].id]) { seen[picks[i].id] = 1; out.push({ id: picks[i].id, name: picks[i].name }); } }
    return shuffle(out);
  }
  function answer(btn, correct, r, choices, fb) {
    if (game.answered) return; game.answered = true;
    if (game.tInt) clearInterval(game.tInt);
    if (correct) { btn.classList.add('correct'); game.score++; game.streak++; snd.correct(); if (game.streak > game.best) { game.best = game.streak; store.set('best', String(game.best)); } }
    else { if (btn) btn.classList.add('wrong'); game.streak = 0; snd.wrong(); }
    choices.querySelectorAll('.choice').forEach(function (b) {
      b.disabled = true;
      if (b.querySelector('span:last-child').textContent === r.name) b.classList.add('correct');
    });
    fb.innerHTML = '<b>' + (correct ? 'Correct — ' : 'Answer: ') + r.name + '.</b> ' + r.features;
    fb.classList.add('v');
    var nx = $('gNext'); if (nx) nx.style.visibility = 'visible';
  }
  function finishGame() {
    if (game.mon) game.mon.stop();
    gameEl.innerHTML = '';
    var done = game.n === Infinity ? game.i : game.n;
    var pct = done ? Math.round(game.score / done * 100) : 0;
    var w = el('div', 'result');
    w.appendChild(el('div', 'big', pct + '%'));
    w.appendChild(el('div', 'lbl', game.score + ' / ' + done + ' correct · best streak ' + (parseInt(store.get('best', '0'), 10) || 0)));
    var again = el('button', 'btn', 'Play again'); again.addEventListener('click', buildGameSetup); w.appendChild(again);
    gameEl.appendChild(w);
    pct >= 70 ? snd.correct() : snd.wrong();
  }

  /* ---------- mode switch ---------- */
  function setMode(m) {
    state.mode = m;
    $('segLearn').classList.toggle('on', m === 'learn'); $('segLearn').setAttribute('aria-selected', String(m === 'learn'));
    $('segGame').classList.toggle('on', m === 'game'); $('segGame').setAttribute('aria-selected', String(m === 'game'));
    var learn = $('learnView'), gv = $('gameView');
    if (m === 'learn') {
      gv.classList.remove('v'); if (game.mon) game.mon.stop(); if (game.tInt) clearInterval(game.tInt);
      learn.style.display = ''; $('sidebar').style.display = '';
      monitor.start(); showRhythm(state.cur);
      if (window.SPM_BG) window.SPM_BG.setAccent([0.0, 0.78, 0.46]);
    } else {
      learn.style.display = 'none'; $('sidebar').style.display = 'none'; monitor.stop();
      gv.classList.add('v'); buildGameSetup();
      if (window.SPM_BG) window.SPM_BG.setAccent([1.0, 0.7, 0.0]);
    }
  }

  /* ---------- theme / glass / sound / tweaks ---------- */
  var themeSeg = { dark: null, light: null };
  function setTheme(th) {
    state.theme = th; document.documentElement.setAttribute('data-theme', th); store.set('theme', th);
    if (monitor) monitor.readColors(); if (game.mon) game.mon.readColors();
    if (themeSeg.dark) { themeSeg.dark.classList.toggle('on', th === 'dark'); themeSeg.light.classList.toggle('on', th === 'light'); }
    var q = $('themeQuick'); if (q) q.textContent = th === 'dark' ? '☾' : '☀';
  }
  function applyGlass() {
    document.body.classList.toggle('glass', state.glass);
    document.body.style.setProperty('--glass-alpha', String(state.glassAlpha));
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
    var inp = el('input'); inp.type = 'checkbox'; inp.checked = on; var tr = el('span', 'track'), th = el('span', 'thumb');
    lab.appendChild(inp); lab.appendChild(tr); lab.appendChild(th);
    function fire() { lab.setAttribute('aria-checked', String(inp.checked)); cb(inp.checked); }
    inp.addEventListener('change', fire);
    lab.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.checked = !inp.checked; fire(); } });
    return lab;
  }
  function buildTweaks() {
    var scrim = el('div', 'tweaks-scrim'); var panel = el('aside', 'tweaks'); panel.id = 'tweaksPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Tweaks'); panel.setAttribute('aria-hidden', 'true');
    var close = el('button', 'tw-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); panel.appendChild(close);
    panel.appendChild(el('h3', null, 'Tweaks')); panel.appendChild(el('div', 'tw-sub', 'Theme · field'));
    var gT = el('div', 'tw-group'); gT.appendChild(el('span', 'tw-label', 'Theme'));
    var tseg = el('div', 'tw-seg');
    var bD = el('button', state.theme === 'dark' ? 'on' : '', 'Monitor'); bD.type = 'button';
    var bL = el('button', state.theme === 'light' ? 'on' : '', 'Paper'); bL.type = 'button';
    tseg.appendChild(bD); tseg.appendChild(bL); gT.appendChild(tseg); panel.appendChild(gT);
    themeSeg.dark = bD; themeSeg.light = bL;
    bD.addEventListener('click', function () { setTheme('dark'); }); bL.addEventListener('click', function () { setTheme('light'); });
    var gF = el('div', 'tw-group'); gF.appendChild(el('span', 'tw-label', 'Ambient field'));
    var r1 = el('div', 'tw-row'); r1.appendChild(document.createTextNode('Glass panels')); r1.appendChild(mkSwitch(state.glass, function (v) { state.glass = v; applyGlass(); })); gF.appendChild(r1);
    var r2 = el('div', 'tw-row'); r2.style.display = 'block'; r2.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(state.glassAlpha); rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { state.glassAlpha = parseFloat(rng.value); applyGlass(); }); r2.appendChild(rng); gF.appendChild(r2);
    panel.appendChild(gF);
    document.body.appendChild(scrim); document.body.appendChild(panel);
    function open() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); }
    function shut() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', shut); scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) shut(); });
    $('tweaksBtn').addEventListener('click', open);
  }

  /* ---------- boot ---------- */
  monitor = new Monitor($('monCanvas'));
  hrEl = $('hrVal'); nameEl = $('monName'); paceEl = $('monPace'); info = $('info'); gameEl = $('gameView');
  monitor.onHR = function (v) { if (hrEl) hrEl.textContent = v; };
  buildSidebar(); buildTweaks();
  setTheme(state.theme); applyGlass(); setSound(state.sound);
  $('segLearn').addEventListener('click', function () { setMode('learn'); });
  $('segGame').addEventListener('click', function () { setMode('game'); });
  $('themeQuick').addEventListener('click', function () { setTheme(state.theme === 'dark' ? 'light' : 'dark'); });
  $('soundToggle').addEventListener('click', function () { setSound(!state.sound); if (state.sound && actx && actx.state === 'suspended') actx.resume(); });
  setMode('learn');
})();
