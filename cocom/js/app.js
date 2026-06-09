/* =====================================================================
 * Special Purpose Medic — COCOM Scenarios · app logic (vanilla JS)
 *   Merges the AFRICOM and CENTCOM scenario sets into one browser with a
 *   COCOM switcher. Search / filter / expand / answers all scope to the
 *   ACTIVE theater. Adds the SPM treatment: WebGL ambient field tinted per
 *   COCOM, glass mode, theme + sound, back-to-hub, tweaks. The inline
 *   onclick handlers in the scenario markup call the window.* functions
 *   defined here.
 * ===================================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.cocom.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.cocom.' + k, v); } catch (e) {} }
  };

  // Per-COCOM WebGL accent (0..1 rgb): AFRICOM gold/savanna, CENTCOM desert cyan,
  // INDOPACOM jungle/maritime jade, EUCOM alpine/Baltic steel-blue, SOUTHCOM tropical green,
  // NORTHCOM arctic/homeland ice-blue, Ranger Medic regiment buckskin tan.
  var ACCENT = { af: [0.847, 0.635, 0.231], ce: [0.16, 0.78, 0.92], in: [0.20, 0.68, 0.60], eu: [0.42, 0.60, 0.88], so: [0.38, 0.78, 0.45], no: [0.55, 0.74, 0.86], rm: [0.74, 0.52, 0.30] };
  var tintOn = store.get('tint', '1') === '1';

  /* ---------- click sound (from the source) ---------- */
  var actx = null, soundOn = false;
  function actxInit() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } }
  function tick() {
    if (!soundOn || !actx) return;
    try {
      var t = actx.currentTime;
      [[760, 0.0], [1180, 0.045]].forEach(function (p) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0.0001, t + p[1]); g.gain.exponentialRampToValueAtTime(0.06, t + p[1] + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p[1] + 0.05);
        o.connect(g); g.connect(actx.destination); o.start(t + p[1]); o.stop(t + p[1] + 0.06);
      });
    } catch (e) {}
  }
  window.toggleSound = function (btn) {
    soundOn = !soundOn; actxInit();
    if (actx && actx.state === 'suspended') actx.resume();
    btn.classList.toggle('on', soundOn);
    btn.textContent = soundOn ? '◉ Sound' : '○ Sound';
    if (soundOn) tick();
  };

  /* ---------- active panel + scenario interactions ---------- */
  function activePanel() { return document.querySelector('.cocom-panel.active'); }
  window.toggleSc = function (id) { var e = $(id); if (e) e.classList.toggle('collapsed'); tick(); };
  window.expandAll = function (open) { var p = activePanel(); if (p) p.querySelectorAll('.scenario').forEach(function (s) { s.classList.toggle('collapsed', !open); }); tick(); };
  window.toggleAns = function (btn) { var qa = btn.parentElement; qa.classList.toggle('open'); qa.querySelector('.answer').classList.toggle('show'); tick(); };
  window.toggleAllAns = function () {
    var p = activePanel(); if (!p) return;
    var anyClosed = !!p.querySelector('.qa:not(.open)');
    p.querySelectorAll('.qa').forEach(function (qa) { qa.classList.toggle('open', anyClosed); qa.querySelector('.answer').classList.toggle('show', anyClosed); });
    if (anyClosed) window.expandAll(true);
    tick();
  };
  window.revealDiff = function (btn) { var box = btn.nextElementSibling; box.classList.add('revealed'); btn.style.display = 'none'; tick(); };
  window.revealAllDiff = function () { var p = activePanel(); if (!p) return; p.querySelectorAll('.diff-hidden').forEach(function (b) { b.classList.add('revealed'); }); p.querySelectorAll('.reveal-btn').forEach(function (b) { b.style.display = 'none'; }); tick(); };
  window.jumpTo = function (id) { var e = $(id); if (!e) return; e.classList.remove('collapsed'); e.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  window.toggleRefs = function (btn, id) { var b = $(id); b.classList.toggle('open'); btn.textContent = b.classList.contains('open') ? 'Hide references' : 'Show references'; tick(); };

  /* ---------- search + tag filter (scoped to active panel) ---------- */
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  var searchEl = $('searchBox');
  window.filterTag = function (btn) {
    var p = btn.closest('.cocom-panel');
    p.querySelectorAll('.fpill').forEach(function (x) { x.classList.remove('active'); });
    btn.classList.add('active'); p.dataset.tag = btn.getAttribute('data-tag');
    applyFilters(p);
    // Fold the pill cloud down to the active filter once a specific tag is
    // chosen, then bring the first matching scenario into view. "All" re-opens
    // the cloud for browsing.
    var specific = p.dataset.tag !== 'ALL';
    setFpillsCollapsed(p, specific);
    if (specific) {
      var first = null;
      p.querySelectorAll('.scenario').forEach(function (s) { if (!first && s.style.display !== 'none') first = s; });
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    tick();
  };
  // Collapse/expand a panel's filter cloud (collapsed = active pill + toggle only).
  function setFpillsCollapsed(p, collapsed) {
    var fp = p && p.querySelector('.fpills'); if (!fp) return;
    fp.classList.toggle('collapsed', !!collapsed);
    var tg = fp.querySelector('.fpill-toggle');
    if (tg) { tg.textContent = collapsed ? '▾ Filters' : '▴ Hide'; tg.setAttribute('aria-expanded', String(!collapsed)); }
  }
  // Inject a reopen/collapse toggle chip into every theater's pill cloud.
  function initFpills() {
    document.querySelectorAll('.cocom-panel .fpills').forEach(function (fp) {
      if (fp.querySelector('.fpill-toggle')) return;
      var tg = el('button', 'fpill-toggle', '▴ Hide'); tg.type = 'button';
      tg.setAttribute('aria-expanded', 'true'); tg.setAttribute('aria-label', 'Show or hide filters');
      tg.addEventListener('click', function () {
        setFpillsCollapsed(fp.closest('.cocom-panel'), !fp.classList.contains('collapsed'));
      });
      fp.insertBefore(tg, fp.firstChild);
    });
  }
  function applyFilters(p) {
    if (!p) return;
    var qn = norm(searchEl.value), toks = qn ? qn.split(' ') : [], tag = p.dataset.tag || 'ALL', shown = 0;
    p.querySelectorAll('.scenario').forEach(function (s) {
      var tags = s.getAttribute('data-tags') || '', blob = s.getAttribute('data-search') || '';
      var tagOk = (tag === 'ALL') || tags.split('||').indexOf(tag) > -1, qOk = true;
      for (var i = 0; i < toks.length; i++) { if (blob.indexOf(toks[i]) === -1) { qOk = false; break; } }
      var vis = tagOk && qOk; s.style.display = vis ? '' : 'none'; if (vis) shown++;
    });
    var nr = p.querySelector('.noresult'); if (nr) nr.style.display = shown ? 'none' : 'block';
  }
  if (searchEl) searchEl.addEventListener('input', function () { applyFilters(activePanel()); });

  /* ---------- PDF export ---------- */
  window.exportPDF = function () { var inc = incAns ? incAns.checked : true; document.body.classList.toggle('hide-answers-print', !inc); window.print(); };

  /* ---------- theme ---------- */
  window.toggleTheme = function (btn) {
    var h = document.documentElement;
    var nxt = (h.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
    h.setAttribute('data-theme', nxt); store.set('theme', nxt);
    if (btn) btn.textContent = (nxt === 'light') ? '☼ Light' : '☾ Dark';
    tick();
  };

  /* ---------- COCOM switch ---------- */
  function setCocom(pfx) {
    document.querySelectorAll('.cocom-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.pfx === pfx); });
    document.querySelectorAll('.cocom-seg button').forEach(function (b) { var on = b.dataset.pfx === pfx; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    if (window.SPM_BG && tintOn) window.SPM_BG.setAccent(ACCENT[pfx]);
    if (window.SPM_MUSIC) window.SPM_MUSIC.setRegion(pfx);
    applyFilters(activePanel());
    store.set('cocom', pfx);
    window.scrollTo(0, 0); tick();
  }
  window.setCocom = setCocom;

  /* ---------- glass / tweaks ---------- */
  var glassOn = store.get('glass', '0') === '1', glassAlpha = parseFloat(store.get('glassAlpha', '0.6'));
  var incAns;
  function applyGlass() {
    document.body.classList.toggle('glass', glassOn);
    document.body.style.setProperty('--glass-alpha', String(glassAlpha));
    if (window.SPM_BG) window.SPM_BG.setGlass(glassOn);
    store.set('glass', glassOn ? '1' : '0'); store.set('glassAlpha', String(glassAlpha));
  }
  function applyAccent() { if (window.SPM_BG) window.SPM_BG.setAccent(tintOn ? ACCENT[activePanel().dataset.pfx] : null); }
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
    panel.appendChild(el('h3', null, 'Tweaks')); panel.appendChild(el('div', 'tw-sub', 'Field · display · export'));
    var g = el('div', 'tw-group'); g.appendChild(el('span', 'tw-label', 'Ambient field'));
    var r1 = el('div', 'tw-row'); r1.appendChild(document.createTextNode('Glass panels')); r1.appendChild(mkSwitch(glassOn, function (v) { glassOn = v; applyGlass(); })); g.appendChild(r1);
    var r2 = el('div', 'tw-row'); r2.style.display = 'block'; r2.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(glassAlpha); rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { glassAlpha = parseFloat(rng.value); applyGlass(); }); r2.appendChild(rng); g.appendChild(r2);
    var r3 = el('div', 'tw-row'); r3.appendChild(document.createTextNode('Tint field to theater')); r3.appendChild(mkSwitch(tintOn, function (v) { tintOn = v; store.set('tint', v ? '1' : '0'); applyAccent(); })); g.appendChild(r3);
    panel.appendChild(g);
    var g2 = el('div', 'tw-group'); g2.appendChild(el('span', 'tw-label', 'PDF export'));
    var r4 = el('div', 'tw-row'); r4.appendChild(document.createTextNode('Include answer keys')); incAns = el('input'); incAns.type = 'checkbox'; incAns.id = 'ansInPdf'; incAns.checked = true; incAns.style.accentColor = 'var(--gold)'; incAns.style.width = '18px'; incAns.style.height = '18px'; r4.appendChild(incAns); g2.appendChild(r4);
    panel.appendChild(g2);
    document.body.appendChild(scrim); document.body.appendChild(panel);
    function open() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); }
    function shut() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', shut); scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) shut(); });
    $('tweaksBtn').addEventListener('click', open);
  }

  /* ---------- boot ---------- */
  document.querySelectorAll('.scenario').forEach(function (s) { s.classList.add('collapsed'); });
  buildTweaks();
  initFpills();
  // restore theme
  var th = store.get('theme', 'dark'); document.documentElement.setAttribute('data-theme', th);
  var tb = $('themeBtn'); if (tb) tb.textContent = th === 'light' ? '☼ Light' : '☾ Dark';
  applyGlass();
  setCocom(store.get('cocom', 'af'));
  // hub-style top-right sound toggle (animated EQ bars when on)
  var sndBtn = $('soundToggle');
  if (sndBtn) sndBtn.addEventListener('click', function () {
    soundOn = !soundOn; actxInit();
    if (actx && actx.state === 'suspended') actx.resume();
    sndBtn.classList.toggle('on', soundOn);
    sndBtn.setAttribute('aria-pressed', String(soundOn));
    sndBtn.title = 'Sound: ' + (soundOn ? 'on' : 'off');
    if (soundOn) tick();
  });
  // region ambient music toggle — themes per theater, low + slow tactical bed.
  // Browsers block autoplay, so a remembered "on" arms on the first user gesture.
  var musicBtn = $('musicBtn');
  if (musicBtn && window.SPM_MUSIC && window.SPM_MUSIC.available) {
    var syncMusicBtn = function (on) {
      musicBtn.classList.toggle('on', on);
      musicBtn.setAttribute('aria-pressed', String(on));
      musicBtn.textContent = on ? '♫ Music' : '♪ Music';
    };
    musicBtn.addEventListener('click', function () {
      if (window.SPM_MUSIC.isOn()) { window.SPM_MUSIC.disable(); syncMusicBtn(false); store.set('music', '0'); }
      else { window.SPM_MUSIC.setRegion(activePanel().dataset.pfx); window.SPM_MUSIC.enable(); syncMusicBtn(true); store.set('music', '1'); }
      tick();
    });
    // Default ON ("auto"): reflect the on-state and start the engine now.
    // Browsers suspend audio until the first user gesture, so resume on the
    // earliest interaction. Turning it off is remembered and skips auto-start.
    if (store.get('music', '1') === '1') {
      syncMusicBtn(true);
      window.SPM_MUSIC.setRegion(activePanel().dataset.pfx);
      window.SPM_MUSIC.enable();
      var armMusic = function () {
        document.removeEventListener('pointerdown', armMusic, true);
        document.removeEventListener('keydown', armMusic, true);
        if (window.SPM_MUSIC.isOn()) window.SPM_MUSIC.resume();
      };
      document.addEventListener('pointerdown', armMusic, true);
      document.addEventListener('keydown', armMusic, true);
    }
  }
  // '/' focuses search
  document.addEventListener('keydown', function (e) { if (e.key === '/' && document.activeElement !== searchEl) { e.preventDefault(); searchEl.focus(); } });
})();
