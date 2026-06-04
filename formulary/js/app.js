/* =====================================================================
 * Special Purpose Medic Drug Box — app logic (vanilla JS, no deps)
 *   Robust drug reference: category sidebar, search/filter, per-drug
 *   reference + case scenarios, a full quiz engine (every drug), UI click
 *   sounds, theme/glass tweaks, and a category-tinted WebGL field.
 * ===================================================================== */
(function () {
  'use strict';
  var DRUGS = (window.FORMULARY_DRUGS || []).slice();
  var $ = function (id) { return document.getElementById(id); };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var esc = function (s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var snd = window.SPM_SOUND || { click: function () {}, select: function () {}, toggle: function () {}, correct: function () {}, wrong: function () {}, setEnabled: function () {} };

  /* ---------- category config ---------- */
  var CAT_COLORS = {
    'Analgesics & Pain Management': '#ff6b6b', 'Local Anesthetics': '#f472b6', 'Antibiotics': '#38bdf8',
    'Antifungals': '#a78bfa', 'Antimalarials': '#fbbf24', 'Antiparasitics': '#facc15', 'Antivirals': '#22d3ee',
    'Cardiovascular & Emergency': '#ff3b3b', 'Respiratory': '#00d4ff', 'CNS & Neurological': '#c084fc',
    'Sedation & RSI': '#818cf8', 'Reversal Agents': '#4ade80', 'Muscle Relaxants': '#fb923c',
    'Antiemetics': '#34d399', 'Antihistamines': '#60a5fa', 'Corticosteroids': '#f0a500', 'GI Drugs': '#a3e635',
    'ENT & Decongestants': '#2dd4bf', 'Antimigraine': '#e879f9', 'Altitude & Environmental': '#7dd3fc',
    'IV Fluids & Electrolytes': '#22d3ee', 'Hemostatic Agents': '#ef4444', 'Sleep Aids': '#a78bfa',
    'Topical/Ophthalmic/Otic': '#5eead4', 'CBRN & Antidotes': '#fde047', 'Envenomation & Antivenom': '#fb7185',
    'Endocrine & Metabolic': '#fcd34d', 'STI Treatment': '#c084fc', 'Dermatology': '#fda4af'
  };
  function catColor(c) {
    if (CAT_COLORS[c]) return CAT_COLORS[c];
    var h = 0; for (var i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) % 360;
    return 'hsl(' + h + ',70%,62%)';
  }
  var CAT_ORDER = ['Analgesics & Pain Management', 'Local Anesthetics', 'Sedation & RSI', 'Muscle Relaxants',
    'Reversal Agents', 'Cardiovascular & Emergency', 'Hemostatic Agents', 'IV Fluids & Electrolytes', 'Respiratory',
    'CNS & Neurological', 'Antiemetics', 'Antihistamines', 'Corticosteroids', 'GI Drugs', 'ENT & Decongestants',
    'Antimigraine', 'Sleep Aids', 'Antibiotics', 'Antifungals', 'Antivirals', 'Antimalarials', 'Antiparasitics',
    'STI Treatment', 'CBRN & Antidotes', 'Envenomation & Antivenom', 'Altitude & Environmental',
    'Endocrine & Metabolic', 'Dermatology', 'Topical/Ophthalmic/Otic'];
  function catRank(c) { var i = CAT_ORDER.indexOf(c); return i < 0 ? 999 : i; }
  function hex01(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return null;
    var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  /* ---------- search text ---------- */
  DRUGS.forEach(function (d) {
    var sc = (d.scenarios || []).map(function (s) { return s.scenario + ' ' + s.context + ' ' + s.primary; }).join(' ');
    d._s = [d.name, d.brand, (d.aka || []).join(' '), d.cls, d.cat, d.mech, d.ind, d.contra, d.se, d.notes, sc].join(' ').toLowerCase();
    d._n = d.name.toLowerCase();
  });

  /* ---------- persisted state ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.rx.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.rx.' + k, v); } catch (e) {} }
  };
  var state = {
    view: 'ref', q: '', filters: new Set(), cur: -1,
    theme: store.get('theme', 'dark'), glass: store.get('glass', '0') === '1',
    glassAlpha: parseFloat(store.get('glassAlpha', '0.62')), tint: store.get('tint', '1') === '1',
    sound: store.get('sound', '0') === '1'
  };

  /* ---------- DOM ---------- */
  var sidebar = $('sidebar'), main = $('main'), welcome = $('welcome'), rlist = $('rlist'),
      detail = $('detail'), quizEl = $('quiz'), noRes = $('noResults'), counter = $('counter');
  var linkById = {};

  /* ---------- sidebar ---------- */
  function dutyBadge(d) {
    var f = document.createDocumentFragment();
    if (d.duty === 'go' || d.duty === 'limited' || d.duty === 'nogo') {
      f.appendChild(el('span', 'db ' + d.duty, d.duty === 'go' ? 'GO' : d.duty === 'limited' ? 'LTD' : 'NO-GO'));
    }
    if (d.tccc) f.appendChild(el('span', 'db tccc', 'TCCC'));
    return f;
  }
  function buildSidebar() {
    var groups = {};
    DRUGS.forEach(function (d) { (groups[d.cat] = groups[d.cat] || []).push(d); });
    Object.keys(groups).sort(function (a, b) { return catRank(a) - catRank(b) || a.localeCompare(b); }).forEach(function (cat) {
      var col = catColor(cat);
      var g = el('div', 'cat-group'); g.dataset.cat = cat;
      var head = el('div', 'cat-head'); head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0'); head.setAttribute('aria-expanded', 'false');
      var dot = el('span', 'cat-dot'); dot.style.background = col;
      head.appendChild(dot); head.appendChild(el('span', 'cat-name', cat));
      head.appendChild(el('span', 'cat-count', String(groups[cat].length)));
      head.appendChild(el('span', 'cat-chev', '▸'));
      function tg() { var op = g.classList.toggle('open'); head.setAttribute('aria-expanded', String(op)); snd.click(); }
      head.addEventListener('click', tg);
      head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
      g.appendChild(head);
      var box = el('div', 'cat-drugs');
      groups[cat].sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (d) {
        var lk = el('div', 'drug-link'); lk.dataset.id = d.id; lk.style.setProperty('--cc', col);
        lk.setAttribute('role', 'button'); lk.setAttribute('tabindex', '0');
        lk.appendChild(el('span', 'dl-name', d.name));
        lk.appendChild(dutyBadge(d));
        function open() { snd.select(); showDrug(d.id); }
        lk.addEventListener('click', open);
        lk.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        box.appendChild(lk); linkById[d.id] = lk;
      });
      g.appendChild(box); sidebar.appendChild(g);
    });
  }

  /* ---------- detail ---------- */
  function refCell(label, val, cls) {
    if (!val) return null;
    var c = el('div', 'ref-cell' + (cls ? ' ' + cls : ''));
    c.appendChild(el('div', 'rl', label));
    c.appendChild(el('div', 'rv', val));
    return c;
  }
  function kvTable(rows) {
    var t = el('table', 'scen-table'); var any = false;
    rows.forEach(function (r) {
      if (!r[1]) return; any = true;
      var tr = el('tr'); if (r[2]) tr.className = r[2];
      var k = el('td', 'k', r[0]); var v = el('td'); v.innerHTML = boldify(r[1]);
      tr.appendChild(k); tr.appendChild(v); t.appendChild(tr);
    });
    return any ? t : null;
  }
  function boldify(s) {
    return esc(s).replace(/(Onset:|Provocation:|Quality:|Radiation:|Severity:|Time:|Signs\/Symptoms:|Allergies:|Medications:|Past Pertinent History:|Last Oral Intake:|Events:)/g, '<b>$1</b>');
  }
  function parseVitals(str) {
    var hr = /Heart Rate:\s*(\d+)/i.exec(str), bp = /Blood Pressure:\s*(\d+)\s*\/\s*(\d+)/i.exec(str);
    return { hr: hr ? +hr[1] : null, sys: bp ? +bp[1] : null, dia: bp ? +bp[2] : null };
  }
  // Interactive vital-signs row: tap HR for a lub-dub heartbeat at that rate,
  // tap BP to reveal the MAP and hear a pressure pulse.
  function buildVitalsCell(str) {
    var v = parseVitals(str), wrap = el('div', 'vitals-int');
    str.split('|').forEach(function (seg) {
      seg = seg.trim(); if (!seg) return;
      if (/heart rate/i.test(seg) && v.hr) {
        var c = el('button', 'vi vi-hr'); c.type = 'button';
        c.innerHTML = '<span class="vi-ico">♥</span> ' + esc(seg) + ' <span class="vi-play">▶</span>';
        c.title = 'Play heartbeat at ' + v.hr + ' bpm';
        c.addEventListener('click', function () {
          c.classList.add('beating');
          if (window.SPM_SOUND) window.SPM_SOUND.heart(v.hr, Math.max(6, Math.round(v.hr / 9)),
            function (n) { c.classList.toggle('pulse'); }, function () { c.classList.remove('beating', 'pulse'); });
        });
        wrap.appendChild(c);
      } else if (/blood pressure/i.test(seg) && v.sys) {
        var map = Math.round(v.dia + (v.sys - v.dia) / 3);
        var c2 = el('button', 'vi vi-bp'); c2.type = 'button';
        c2.innerHTML = '<span class="vi-ico">🩸</span> ' + esc(seg) + ' <span class="vi-map">MAP ' + map + '</span>';
        c2.title = 'MAP = ' + map + ' mmHg — tap for a pressure pulse';
        c2.addEventListener('click', function () { c2.classList.add('on'); if (window.SPM_SOUND) window.SPM_SOUND.bp(v.sys, v.dia); });
        wrap.appendChild(c2);
      } else {
        wrap.appendChild(el('span', 'vi vi-txt', seg));
      }
    });
    return wrap;
  }
  function scenarioBlock(d) {
    var scs = d.scenarios || []; if (!scs.length) return null;
    var col = catColor(d.cat);
    var wrap = el('div', 'scen'); wrap.style.setProperty('--cc', col);
    var head = el('div', 'scen-head'); head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0'); head.setAttribute('aria-expanded', 'true');
    head.appendChild(el('span', 'sh-ico', '🎯'));
    head.appendChild(el('h3', null, 'Field Scenario' + (scs.length > 1 ? ' (' + scs.length + ')' : '')));
    head.appendChild(el('span', 'cat-chev', '▾'));
    var bodyWrap = el('div');
    wrap.appendChild(head);
    if (scs.length > 1) {
      var tabs = el('div', 'scen-tabs');
      scs.forEach(function (s, i) {
        var b = el('div', 'scen-tab' + (i === 0 ? ' on' : ''), 'Case ' + (i + 1)); b.style.setProperty('--cc', col);
        b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0');
        function pick() { snd.click(); tabs.querySelectorAll('.scen-tab').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); render(i); }
        b.addEventListener('click', pick);
        b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        tabs.appendChild(b);
      });
      wrap.appendChild(tabs);
    }
    wrap.appendChild(bodyWrap);
    function render(i) {
      var s = scs[i]; bodyWrap.innerHTML = '';
      var body = el('div', 'scen-body');
      function sec(label, text, boxed) {
        if (!text) return;
        var d2 = el('div', 'scen-sec');
        d2.appendChild(el('div', 'scen-sl', label));
        var t = el('div', boxed ? 'scen-cx' : 'scen-st'); t.textContent = text; d2.appendChild(t);
        body.appendChild(d2);
      }
      sec('Scenario', s.scenario, false);
      sec('Real-World Context', s.context, true);
      // Assessment table — vital signs row is interactive (heartbeat + MAP).
      var aRows = [['OPQRST', s.opqrst, 'b'], ['SAMPLE', s.sample, 'b'], ['Vital Signs', s.vitals, 'vitals'], ['Physical Exam', s.exam, 't']];
      var aTbl = el('table', 'scen-table'), anyA = false;
      aRows.forEach(function (r) {
        if (!r[1]) return; anyA = true;
        var tr = el('tr'), k = el('td', 'k', r[0]), vtd = el('td');
        if (r[2] === 'vitals') vtd.appendChild(buildVitalsCell(r[1]));
        else if (r[2] === 'b') vtd.innerHTML = boldify(r[1]);
        else vtd.textContent = r[1];
        tr.appendChild(k); tr.appendChild(vtd); aTbl.appendChild(tr);
      });
      if (anyA) { var as = el('div', 'scen-sec'); as.appendChild(el('div', 'scen-sl', 'Assessment')); as.appendChild(aTbl); body.appendChild(as); }
      // Diagnosis — blurred by default; peek on hover, or click to reveal/hide.
      if (s.diagnosis) {
        var ds = el('div', 'scen-sec');
        var dh = el('div', 'scen-sl dx-head'); dh.appendChild(document.createTextNode('Diagnosis'));
        var rev = el('button', 'dx-toggle', 'Reveal'); rev.type = 'button'; rev.setAttribute('aria-pressed', 'false');
        dh.appendChild(rev); ds.appendChild(dh);
        var dxt = el('div', 'scen-st dx-blur'); dxt.textContent = s.diagnosis;
        rev.addEventListener('click', function () { var r = dxt.classList.toggle('revealed'); rev.textContent = r ? 'Hide' : 'Reveal'; rev.setAttribute('aria-pressed', String(r)); snd.click(); });
        ds.appendChild(dxt); body.appendChild(ds);
      }
      var tTbl = kvTable([['Primary', s.primary], ['Alternative', s.alternative], ['Avoid', s.avoid]]);
      if (tTbl) { var ts = el('div', 'scen-sec'); ts.appendChild(el('div', 'scen-sl', 'Treatment Protocol')); ts.appendChild(tTbl); body.appendChild(ts); }
      var rTbl = kvTable([['Duty Status', s.dutyStatus], ['Onset / Duration', s.onsetDuration], ['Cognitive Impact', s.cognitive], ['Field Considerations', s.field]]);
      if (rTbl) { var rs = el('div', 'scen-sec'); rs.appendChild(el('div', 'scen-sl', 'Operational Readiness')); rs.appendChild(rTbl); body.appendChild(rs); }
      bodyWrap.appendChild(body);
    }
    render(0);
    function toggleBody() { var open = bodyWrap.style.display !== 'none'; bodyWrap.style.display = open ? 'none' : ''; head.setAttribute('aria-expanded', String(!open)); head.querySelector('.cat-chev').textContent = open ? '▸' : '▾'; snd.click(); }
    head.addEventListener('click', toggleBody);
    head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBody(); } });
    return wrap;
  }
  function showDrug(id) {
    var d = DRUGS.find(function (x) { return x.id === id; }); if (!d) return;
    var col = catColor(d.cat);
    detail.style.setProperty('--cc', col); detail.innerHTML = '';
    var head = el('div', 'd-head');
    head.appendChild(el('div', 'd-title', d.name));
    if (d.brand) head.appendChild(el('div', 'd-brand', d.brand));
    var badges = el('div', 'd-badges');
    badges.appendChild(el('span', 'd-cat', d.cat));
    if (d.duty === 'go' || d.duty === 'limited' || d.duty === 'nogo') badges.appendChild(el('span', 'db ' + d.duty, d.duty === 'go' ? 'GO' : d.duty === 'limited' ? 'LIMITED' : 'NO-GO'));
    if (d.tccc) badges.appendChild(el('span', 'db tccc', 'TCCC'));
    head.appendChild(badges);
    if (d.aka && d.aka.length) {
      var ar = el('div', 'aka-row'); ar.appendChild(el('span', 'aka-lbl', 'Also known as'));
      d.aka.forEach(function (n) { ar.appendChild(el('span', 'aka', n)); });
      head.appendChild(ar);
    }
    detail.appendChild(head);
    var grid = el('div', 'ref-grid');
    [refCell('Class', d.cls), refCell('Mechanism', d.mech), refCell('Dose', d.dose, 'dose'),
     refCell('Indications', d.ind), refCell('Contraindications', d.contra, 'contra'),
     refCell('Side Effects', d.se), refCell('Field Notes', d.notes)].forEach(function (c) { if (c) grid.appendChild(c); });
    detail.appendChild(grid);
    var sb = scenarioBlock(d); if (sb) detail.appendChild(sb);

    welcome.style.display = 'none'; rlist.classList.remove('v'); quizEl.classList.remove('v');
    detail.classList.add('v'); state.cur = id;
    Object.keys(linkById).forEach(function (k) { linkById[k].classList.toggle('act', +k === id); });
    var lk = linkById[id]; if (lk) { lk.closest('.cat-group').classList.add('open'); }
    if (state.tint && window.SPM_BG) { var rgb = hex01(col); if (rgb) window.SPM_BG.setAccent(rgb); }
    main.scrollTo(0, 0);
  }

  /* ---------- search / filter ---------- */
  function run() {
    var q = state.q, words = q ? q.split(/\s+/).filter(function (w) { return w.length > 1 || q.length === 1; }) : [];
    var hasF = words.length > 0 || state.filters.size > 0, vis = 0, hits = [];
    DRUGS.forEach(function (d) {
      var lk = linkById[d.id]; var ok = true;
      state.filters.forEach(function (f) {
        if (f === 'tccc' && !d.tccc) ok = false;
        if (f === 'go' && d.duty !== 'go') ok = false;
        if (f === 'nogo' && d.duty !== 'nogo') ok = false;
      });
      if (ok && words.length) ok = words.every(function (w) { return d._s.indexOf(w) !== -1; });
      lk.classList.toggle('hid', !ok);
      if (ok) { vis++; if (words.length) hits.push(d); }
    });
    counter.innerHTML = '<b>' + vis + '</b> / ' + DRUGS.length + ' meds';
    sidebar.querySelectorAll('.cat-group').forEach(function (g) {
      var hasVis = g.querySelector('.drug-link:not(.hid)');
      if (hasF) g.classList.toggle('open', !!hasVis);
    });
    if (state.view !== 'ref') return;
    if (words.length && hits.length) {
      welcome.style.display = 'none'; detail.classList.remove('v'); noRes.style.display = 'none';
      rlist.innerHTML = '';
      hits.slice(0, 60).forEach(function (d) {
        var col = catColor(d.cat);
        var ri = el('div', 'ri'); ri.setAttribute('role', 'button'); ri.setAttribute('tabindex', '0');
        var rd = el('span', 'rd'); rd.style.background = col; ri.appendChild(rd);
        var box = el('div');
        box.appendChild(el('div', 'rn', d.name));
        box.appendChild(el('div', 'rc', d.cat));
        var pos = d._s.indexOf(words[0]);
        if (pos >= 0) {
          var s = Math.max(0, pos - 40), e = Math.min(d._s.length, pos + 90);
          var snip = (s > 0 ? '…' : '') + d._s.substring(s, e) + (e < d._s.length ? '…' : '');
          var rm = el('div', 'rc'); rm.style.color = 'var(--tx2)'; rm.style.textTransform = 'none';
          var safe = esc(snip);
          words.forEach(function (w) { safe = safe.replace(new RegExp('(' + w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
          rm.innerHTML = safe; box.appendChild(rm);
        }
        ri.appendChild(box);
        ri.appendChild(dutyBadge(d));
        function open() { snd.select(); showDrug(d.id); }
        ri.addEventListener('click', open);
        ri.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
        rlist.appendChild(ri);
      });
      rlist.classList.add('v');
    } else if (words.length && !hits.length) {
      welcome.style.display = 'none'; detail.classList.remove('v'); rlist.classList.remove('v'); noRes.style.display = 'block';
    } else {
      noRes.style.display = 'none'; rlist.classList.remove('v');
      if (state.cur >= 0 && !linkById[state.cur].classList.contains('hid')) { showDrug(state.cur); }
      else if (state.cur < 0) { welcome.style.display = ''; detail.classList.remove('v'); }
    }
  }

  /* ---------- quiz ---------- */
  var quiz = { pool: [], idx: 0, score: 0, answered: false };
  function allQuestions() {
    var qs = [];
    DRUGS.forEach(function (d) { (d.quiz || []).forEach(function (q) { qs.push({ q: q, drug: d }); }); });
    return qs;
  }
  function buildQuizSetup() {
    quizEl.innerHTML = '';
    var wrap = el('div', 'quiz-setup');
    wrap.appendChild(el('h2', null, 'Drug Box Quiz'));
    var total = allQuestions().length;
    wrap.appendChild(el('p', null, total + ' questions across ' + DRUGS.length + ' medications. Choose a category and length.'));
    var ctrl = el('div', 'quiz-controls');
    var catSel = el('select'); catSel.id = 'quizCat';
    var optAll = el('option', null, 'All categories'); optAll.value = '__all'; catSel.appendChild(optAll);
    Array.from(new Set(DRUGS.map(function (d) { return d.cat; }))).sort(function (a, b) { return catRank(a) - catRank(b); })
      .forEach(function (c) { var o = el('option', null, c); o.value = c; catSel.appendChild(o); });
    var lvlSel = el('select'); lvlSel.id = 'quizLvl'; lvlSel.setAttribute('aria-label', 'Difficulty level');
    [['__all', 'All levels'], ['1', 'Level 1 · Recall'], ['2', 'Level 2 · Application'], ['3', 'Level 3 · Reasoning']].forEach(function (p) { var o = el('option', null, p[1]); o.value = p[0]; lvlSel.appendChild(o); });
    var lenSel = el('select'); lenSel.id = 'quizLen'; lenSel.setAttribute('aria-label', 'Number of questions');
    [['10', '10 questions'], ['20', '20 questions'], ['40', '40 questions'], ['all', 'All in selection']].forEach(function (p) { var o = el('option', null, p[1]); o.value = p[0]; lenSel.appendChild(o); });
    lenSel.value = '20';
    ctrl.appendChild(catSel); ctrl.appendChild(lvlSel); ctrl.appendChild(lenSel);
    var start = el('button', 'btn', 'Start Quiz'); start.addEventListener('click', function () { snd.select(); startQuiz(catSel.value, lenSel.value, lvlSel.value); });
    ctrl.appendChild(start);
    wrap.appendChild(ctrl);
    quizEl.appendChild(wrap);
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz(cat, len, level) {
    var pool = allQuestions().filter(function (x) {
      var lv = x.q.level || 1;
      return (cat === '__all' || x.drug.cat === cat) && (!level || level === '__all' || lv === +level);
    });
    shuffle(pool);
    if (len !== 'all') pool = pool.slice(0, parseInt(len, 10));
    quiz = { pool: pool, idx: 0, score: 0, answered: false };
    renderQuestion();
  }
  function renderQuestion() {
    quizEl.innerHTML = '';
    if (quiz.idx >= quiz.pool.length) return finishQuiz();
    var item = quiz.pool[quiz.idx], q = item.q, d = item.drug, col = catColor(d.cat);
    var prog = el('div', 'quiz-prog');
    prog.appendChild(el('span', null, 'Question ' + (quiz.idx + 1) + ' / ' + quiz.pool.length));
    var sc = el('span', 'score'); sc.innerHTML = 'Score <b>' + quiz.score + '</b>'; prog.appendChild(sc);
    quizEl.appendChild(prog);
    var bar = el('div', 'quiz-bar'); var fill = el('i'); fill.style.width = (quiz.idx / quiz.pool.length * 100) + '%'; bar.appendChild(fill); quizEl.appendChild(bar);
    var card = el('div', 'q-card'); card.style.setProperty('--cc', col);
    var lvl = q.level || 1;
    var qhead = el('div', 'q-head');
    var qc = el('div', 'q-cat', d.name + ' · ' + d.cat); qc.style.color = col;
    var lb = el('span', 'q-level l' + lvl, 'L' + lvl + ' · ' + (lvl === 1 ? 'Recall' : lvl === 2 ? 'Application' : 'Reasoning'));
    qhead.appendChild(qc); qhead.appendChild(lb); card.appendChild(qhead);
    card.appendChild(el('div', 'q-text', q.q));
    var choices = el('div', 'q-choices');
    var order = shuffle(q.choices.map(function (c, i) { return { c: c, i: i }; }));
    var explain = el('div', 'q-explain');
    quiz.answered = false;
    order.forEach(function (o, n) {
      var b = el('button', 'q-choice'); b.type = 'button';
      b.appendChild(el('span', 'qk', String.fromCharCode(65 + n)));
      b.appendChild(el('span', null, o.c));
      b.addEventListener('click', function () {
        if (quiz.answered) return; quiz.answered = true;
        var correct = o.i === q.answer;
        if (correct) { b.classList.add('correct'); quiz.score++; snd.correct(); }
        else { b.classList.add('wrong'); snd.wrong(); }
        choices.querySelectorAll('.q-choice').forEach(function (x, xi) {
          x.disabled = true;
          if (order[xi].i === q.answer) x.classList.add('correct');
        });
        explain.innerHTML = '<b>' + (correct ? 'Correct.' : 'Answer: ' + esc(q.choices[q.answer])) + '</b> ' + esc(q.explain || '');
        explain.classList.add('v');
        nextBtn.textContent = quiz.idx + 1 >= quiz.pool.length ? 'See Results' : 'Next →';
      });
      choices.appendChild(b);
    });
    card.appendChild(choices); card.appendChild(explain);
    var nav = el('div', 'q-nav');
    var quitBtn = el('button', 'btn sec', 'End Quiz'); quitBtn.addEventListener('click', function () { snd.click(); buildQuizSetup(); });
    var nextBtn = el('button', 'btn', 'Skip →'); nextBtn.addEventListener('click', function () { snd.click(); quiz.idx++; renderQuestion(); });
    nav.appendChild(quitBtn); nav.appendChild(nextBtn);
    card.appendChild(nav);
    quizEl.appendChild(card);
    if (state.tint && window.SPM_BG) { var rgb = hex01(col); if (rgb) window.SPM_BG.setAccent(rgb); }
  }
  function finishQuiz() {
    var pct = quiz.pool.length ? Math.round(quiz.score / quiz.pool.length * 100) : 0;
    var wrap = el('div', 'quiz-result');
    wrap.appendChild(el('div', 'big', pct + '%'));
    wrap.appendChild(el('div', 'lbl', quiz.score + ' / ' + quiz.pool.length + ' correct'));
    var again = el('button', 'btn', 'New Quiz'); again.addEventListener('click', function () { snd.select(); buildQuizSetup(); });
    wrap.appendChild(again);
    quizEl.innerHTML = ''; quizEl.appendChild(wrap);
    pct >= 70 ? snd.correct() : snd.wrong();
  }

  /* ---------- view switch ---------- */
  function setView(v) {
    state.view = v; snd.toggle();
    $('segRef').classList.toggle('on', v === 'ref'); $('segRef').setAttribute('aria-selected', String(v === 'ref'));
    $('segQuiz').classList.toggle('on', v === 'quiz'); $('segQuiz').setAttribute('aria-selected', String(v === 'quiz'));
    if (v === 'quiz') { detail.classList.remove('v'); rlist.classList.remove('v'); welcome.style.display = 'none'; noRes.style.display = 'none'; quizEl.classList.add('v'); buildQuizSetup(); }
    else { quizEl.classList.remove('v'); run(); }
  }

  /* ---------- theme / glass / sound / tweaks ---------- */
  var themeSeg = { dark: null, light: null };
  function applyTheme() { document.documentElement.setAttribute('data-theme', state.theme); store.set('theme', state.theme); }
  function setTheme(th) { state.theme = th; applyTheme(); if (themeSeg.dark) { themeSeg.dark.classList.toggle('on', th === 'dark'); themeSeg.light.classList.toggle('on', th === 'light'); } var q = $('themeQuick'); if (q) q.textContent = th === 'dark' ? '☾' : '☀'; }
  function applyGlass() { document.body.classList.toggle('glass', state.glass); document.body.style.setProperty('--glass-alpha', String(state.glassAlpha)); if (window.SPM_BG) window.SPM_BG.setGlass(state.glass); store.set('glass', state.glass ? '1' : '0'); store.set('glassAlpha', String(state.glassAlpha)); }
  function setSound(on) { state.sound = on; snd.setEnabled(on); store.set('sound', on ? '1' : '0'); var b = $('soundBtn'); if (b) { b.classList.toggle('on', on); b.textContent = on ? '♪ Sound' : '♪ Muted'; b.setAttribute('aria-pressed', String(on)); } if (on) snd.click(); }

  function mkSwitch(on, cb) {
    var lab = el('label', 'switch'); lab.setAttribute('tabindex', '0'); lab.setAttribute('role', 'switch'); lab.setAttribute('aria-checked', String(on));
    var inp = el('input'); inp.type = 'checkbox'; inp.checked = on; var tr = el('span', 'track'); var th = el('span', 'thumb');
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
    panel.appendChild(el('h3', null, 'Tweaks')); panel.appendChild(el('div', 'tw-sub', 'Theme · field · sound'));
    var gT = el('div', 'tw-group'); gT.appendChild(el('span', 'tw-label', 'Theme'));
    var tseg = el('div', 'tw-seg'); var bD = el('button', state.theme === 'dark' ? 'on' : '', 'Night'); bD.type = 'button'; var bL = el('button', state.theme === 'light' ? 'on' : '', 'Day'); bL.type = 'button';
    tseg.appendChild(bD); tseg.appendChild(bL); gT.appendChild(tseg); panel.appendChild(gT);
    themeSeg.dark = bD; themeSeg.light = bL; bD.addEventListener('click', function () { setTheme('dark'); snd.toggle(); }); bL.addEventListener('click', function () { setTheme('light'); snd.toggle(); });
    var gF = el('div', 'tw-group'); gF.appendChild(el('span', 'tw-label', 'Ambient field'));
    var r1 = el('div', 'tw-row'); r1.appendChild(document.createTextNode('Glass panels')); r1.appendChild(mkSwitch(state.glass, function (on) { state.glass = on; applyGlass(); })); gF.appendChild(r1);
    var r2 = el('div', 'tw-row'); r2.style.display = 'block'; r2.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(state.glassAlpha); rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { state.glassAlpha = parseFloat(rng.value); applyGlass(); }); r2.appendChild(rng); gF.appendChild(r2);
    var r3 = el('div', 'tw-row'); r3.appendChild(document.createTextNode('Tint field to category')); r3.appendChild(mkSwitch(state.tint, function (on) { state.tint = on; store.set('tint', on ? '1' : '0'); if (!on && window.SPM_BG) window.SPM_BG.setAccent(null); })); gF.appendChild(r3);
    panel.appendChild(gF);
    var gS = el('div', 'tw-group'); gS.appendChild(el('span', 'tw-label', 'Sound'));
    var r4 = el('div', 'tw-row'); r4.appendChild(document.createTextNode('Click sounds')); r4.appendChild(mkSwitch(state.sound, function (on) { setSound(on); })); gS.appendChild(r4);
    panel.appendChild(gS);
    document.body.appendChild(scrim); document.body.appendChild(panel);
    function open() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); snd.click(); }
    function shut() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', shut); scrim.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) shut(); });
    $('tweaksBtn').addEventListener('click', open);
  }

  /* ---------- events ---------- */
  var searchInput = $('searchInput'), clearBtn = $('clearSearch');
  searchInput.addEventListener('input', function () { state.q = searchInput.value.toLowerCase().trim(); clearBtn.style.display = searchInput.value ? 'block' : 'none'; if (state.view === 'ref') run(); });
  clearBtn.addEventListener('click', function () { searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; run(); searchInput.focus(); snd.click(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus(); }
    if (e.key === 'Escape' && document.activeElement === searchInput) { searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; run(); searchInput.blur(); }
  });
  $('segRef').addEventListener('click', function () { setView('ref'); });
  $('segQuiz').addEventListener('click', function () { setView('quiz'); });
  $('themeQuick').addEventListener('click', function () { setTheme(state.theme === 'dark' ? 'light' : 'dark'); snd.toggle(); });
  $('soundBtn').addEventListener('click', function () { setSound(!state.sound); });
  // filter chips
  sidebar.parentNode && document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.dataset.f; if (state.filters.has(f)) { state.filters.delete(f); c.classList.remove('on'); } else { state.filters.add(f); c.classList.add('on'); }
      snd.click(); run();
    });
  });

  /* ---------- boot ---------- */
  buildSidebar();
  buildTweaks();
  setTheme(state.theme);
  applyGlass();
  setSound(state.sound);
  // welcome stats
  $('wDrugs') && ($('wDrugs').textContent = DRUGS.length);
  $('wCats') && ($('wCats').textContent = new Set(DRUGS.map(function (d) { return d.cat; })).size);
  $('wQuiz') && ($('wQuiz').textContent = allQuestions().length);
  $('wScen') && ($('wScen').textContent = DRUGS.filter(function (d) { return (d.scenarios || []).length; }).length);
  run();
  if (state.tint && window.SPM_BG) window.SPM_BG.setAccent(hex01('#00e639'));
})();
