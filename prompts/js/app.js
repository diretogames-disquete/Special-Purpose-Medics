/* =====================================================================
 * SOF Medic — Prompt Library · app logic (vanilla JS, no deps)
 *   - 4 tabs (All / Scenarios / Text-to-Image / Image-to-Video)
 *   - live search, copy-to-clipboard, expand/collapse cards
 *   - Tweaks: theme, glass + opacity, tint field to category,
 *     and SORT BY THE MARCH PAWS ALGORITHM (scenarios grouped by phase)
 *   - drives the WebGL field accent (window.SPM_BG)
 * ===================================================================== */
(function () {
  'use strict';

  var DATA = (window.PROMPTS_DATA || []).slice();
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ---------- MARCH PAWS algorithm phases (scenario sort) ---------- */
  var MARCH = [
    { key: 'hemorrhage',  letter: 'M', name: 'Massive Hemorrhage', sub: 'Stop the bleed — tourniquets, packing, TXA', color: '#ff5252' },
    { key: 'airway',      letter: 'A', name: 'Airway',             sub: 'Open & protect — positioning, NPA, surgical airway', color: '#ff9100' },
    { key: 'respiration', letter: 'R', name: 'Respiration',        sub: 'Chest seals, decompression, oxygenation', color: '#00e5ff' },
    { key: 'circulation', letter: 'C', name: 'Circulation',        sub: 'Shock, IV/IO access, blood product resuscitation', color: '#ff4081' },
    { key: 'hypothermia', letter: 'H', name: 'Hypothermia / Head', sub: 'Prevent heat loss, TBI & environmental injury', color: '#40c4ff' },
    { key: 'pain',        letter: 'P', name: 'Pain',               sub: 'Analgesia & procedural sedation', color: '#b388ff' },
    { key: 'antibiotics', letter: 'A', name: 'Antibiotics',        sub: 'Infection & sepsis in prolonged care', color: '#69f0ae' },
    { key: 'wounds',      letter: 'W', name: 'Wounds',             sub: 'Wound & burn care, soft-tissue management', color: '#ffd740' },
    { key: 'splinting',   letter: 'S', name: 'Splinting',          sub: 'Fractures, pelvic binders, crush & MSK', color: '#18ffff' }
  ];
  var PHASE = {}; MARCH.forEach(function (p) { PHASE[p.key] = p; });

  var TYPES = {
    sc:  { label: 'Training Scenarios', code: 'SCN', accent: [0.0, 0.749, 0.647] },
    t2i: { label: 'Text-to-Image',      code: 'T2I', accent: [0.702, 0.533, 1.0] },
    i2v: { label: 'Image-to-Video',     code: 'I2V', accent: [1.0, 0.322, 0.322] },
    all: { label: 'All Prompts',        code: 'ALL', accent: [0.0, 0.898, 1.0] }
  };

  /* ---------- persisted state ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.prompts.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.prompts.' + k, v); } catch (e) {} }
  };
  var state = {
    tab: 'all',
    q: '',
    sort: store.get('sort', 'default'),       // 'default' | 'march'
    theme: store.get('theme', 'dark'),         // 'dark' | 'light'
    glass: store.get('glass', '0') === '1',
    glassAlpha: parseFloat(store.get('glassAlpha', '0.6')),
    tint: store.get('tint', '1') === '1'       // tint field to active category
  };

  /* ---------- header / tabs ---------- */
  var tabDefs = [
    { id: 'all', label: 'All Prompts', cls: 'active-all' },
    { id: 'sc',  label: 'Scenarios & Training', cls: 'active-sc' },
    { id: 't2i', label: 'Text-to-Image', cls: 'active-t2i' },
    { id: 'i2v', label: 'Image-to-Video', cls: 'active-i2v' }
  ];
  var tabBar = $('tabBar');
  tabDefs.forEach(function (t) {
    var btn = el('button', 'tab' + (t.id === 'all' ? ' ' + t.cls : ''));
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(t.id === 'all'));
    btn.appendChild(document.createTextNode(t.label));
    var cnt = el('span', 'cnt', String(t.id === 'all' ? DATA.length : DATA.filter(function (d) { return d.type === t.id; }).length));
    btn.appendChild(cnt);
    btn.dataset.id = t.id; btn.dataset.cls = t.cls;
    btn.addEventListener('click', function () { setTab(t.id); });
    tabBar.appendChild(btn);
  });
  function setTab(id) {
    state.tab = id;
    tabBar.querySelectorAll('.tab').forEach(function (b) {
      var on = b.dataset.id === id;
      b.className = 'tab' + (on ? ' ' + b.dataset.cls : '');
      b.setAttribute('aria-selected', String(on));
    });
    applyAccent();
    filter();
  }

  /* ---------- build card nodes once ---------- */
  var main = $('main');
  var noRes = $('noResults');
  var cardsByN = {};

  function svgCopy() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', '9'); r.setAttribute('y', '9'); r.setAttribute('width', '13'); r.setAttribute('height', '13'); r.setAttribute('rx', '2');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1');
    svg.appendChild(r); svg.appendChild(p);
    return svg;
  }

  DATA.forEach(function (d) {
    var card = el('div', 'card type-' + d.type + ' glow-' + d.type);
    card.dataset.type = d.type;
    card.dataset.n = d.n;
    card.dataset.search = (d.title + ' ' + d.cat + ' ' + d.model + ' ' + d.technique + ' ' + (d.march || '') + ' ' + d.text).toLowerCase();
    if (d.march && PHASE[d.march]) card.style.setProperty('--ph', PHASE[d.march].color);

    // head
    var head = el('div', 'card-head');
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.setAttribute('aria-expanded', 'false');
    var num = el('span', 'card-num', String(d.n).padStart(3, '0'));
    var title = el('span', 'card-title', d.title);
    var tags = el('div', 'card-meta-tags');
    if (d.march && PHASE[d.march]) {
      var pm = PHASE[d.march];
      var mtag = el('span', 'tag tag-march', pm.letter + ' · ' + pm.name);
      mtag.title = 'MARCH PAWS phase: ' + pm.name;
      tags.appendChild(mtag);
    }
    tags.appendChild(el('span', 'tag tag-cat', d.cat));
    var chev = el('span', 'card-chev', '▸');
    head.appendChild(num); head.appendChild(title); head.appendChild(tags); head.appendChild(chev);

    function toggle() {
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    }
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    // body
    var body = el('div', 'card-body');
    var strip = el('div', 'extract-strip');
    var labelType = d.type === 'sc' ? 'LLM' : (d.type === 't2i' ? 'Image model' : 'Video model');
    var cm = el('span', 'chip chip-model'); cm.innerHTML = ''; cm.appendChild(document.createTextNode(labelType + ': ')); var cmb = el('b', null, d.model); cm.appendChild(cmb);
    var ct = el('span', 'chip chip-tech'); ct.appendChild(document.createTextNode('Method: ')); var ctb = el('b', null, d.technique); ct.appendChild(ctb);
    strip.appendChild(cm); strip.appendChild(ct);
    body.appendChild(strip);

    var pt = el('div', 'prompt-text'); pt.textContent = d.text;
    body.appendChild(pt);

    var copyRow = el('div', 'copy-row');
    var copyBtn = el('button', 'copy-btn'); copyBtn.type = 'button';
    copyBtn.appendChild(svgCopy());
    copyBtn.appendChild(document.createTextNode('Copy Prompt'));
    copyBtn.addEventListener('click', function () {
      var done = function () {
        copyBtn.classList.add('copied'); copyBtn.lastChild.textContent = 'Copied!'; showToast();
        setTimeout(function () { copyBtn.classList.remove('copied'); copyBtn.lastChild.textContent = 'Copy Prompt'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(d.text).then(done, function () { fallbackCopy(d.text); done(); });
      } else { fallbackCopy(d.text); done(); }
    });
    var label = el('span', 'copy-label',
      d.type === 'sc' ? 'Paste into ChatGPT, Claude, or Gemini' :
      d.type === 't2i' ? 'Paste into Midjourney, DALL·E, Flux, or SD' :
      'Generate a still first, then paste into Runway, Kling, Sora, or Pika');
    copyRow.appendChild(copyBtn); copyRow.appendChild(label);
    body.appendChild(copyRow);

    card.appendChild(head); card.appendChild(body);
    cardsByN[d.n] = card;
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- layout: order cards + section headers by sort mode ---------- */
  var headers = []; // {node, group:'phase'|'type', key, cards:[nodes]}

  function makeHeader(letter, letterSmall, name, sub, color) {
    var h = el('div', 'phase-head');
    if (color) h.style.setProperty('--ph', color);
    var lt = el('span', 'phase-letter' + (letterSmall ? ' sm' : ''), letter);
    var txt = el('div', 'phase-txt');
    txt.appendChild(el('h2', null, name));
    if (sub) txt.appendChild(el('p', null, sub));
    var cnt = el('span', 'ph-cnt', '0');
    h.appendChild(lt); h.appendChild(txt); h.appendChild(cnt);
    return { node: h, cntNode: cnt };
  }

  function layout() {
    // detach everything reusable
    headers = [];
    while (main.firstChild) main.removeChild(main.firstChild);

    function section(group, key, letter, small, name, sub, color, cards) {
      var hh = makeHeader(letter, small, name, sub, color);
      main.appendChild(hh.node);
      cards.forEach(function (c) { main.appendChild(c); });
      headers.push({ node: hh.node, cntNode: hh.cntNode, group: group, key: key, cards: cards });
    }

    var sc  = DATA.filter(function (d) { return d.type === 'sc'; }).map(function (d) { return cardsByN[d.n]; });
    var t2i = DATA.filter(function (d) { return d.type === 't2i'; }).map(function (d) { return cardsByN[d.n]; });
    var i2v = DATA.filter(function (d) { return d.type === 'i2v'; }).map(function (d) { return cardsByN[d.n]; });

    if (state.sort === 'march') {
      MARCH.forEach(function (p) {
        var cards = DATA.filter(function (d) { return d.type === 'sc' && d.march === p.key; }).map(function (d) { return cardsByN[d.n]; });
        section('phase', p.key, p.letter, false, p.name, p.sub, p.color, cards);
      });
    } else {
      section('type', 'sc', TYPES.sc.code, true, TYPES.sc.label, '100 well-engineered training prompts, MARCH PAWS-tagged', PHASE.hemorrhage.color, sc);
    }
    section('type', 't2i', TYPES.t2i.code, true, TYPES.t2i.label, '50 still-image generation prompts', PHASE.pain.color, t2i);
    section('type', 'i2v', TYPES.i2v.code, true, TYPES.i2v.label, '50 image-to-video animation prompts', TYPES.i2v.accent && '#ff5252', i2v);

    main.appendChild(noRes);
  }

  /* ---------- filter: visibility by tab + search; update counts ---------- */
  function filter() {
    var q = state.q;
    var total = 0;
    DATA.forEach(function (d) {
      var card = cardsByN[d.n];
      var typeMatch = state.tab === 'all' || d.type === state.tab;
      var textMatch = !q || card.dataset.search.indexOf(q) !== -1;
      var show = typeMatch && textMatch;
      card.classList.toggle('hidden', !show);
      if (show) total++;
    });
    // headers: show only if they have a visible card; update per-section counts
    headers.forEach(function (h) {
      var vis = 0;
      h.cards.forEach(function (c) { if (!c.classList.contains('hidden')) vis++; });
      h.cntNode.textContent = String(vis);
      h.node.style.display = vis ? '' : 'none';
    });
    $('counter').textContent = total + ' / ' + DATA.length + ' PROMPTS';
    noRes.style.display = total === 0 ? 'block' : 'none';
  }

  /* ---------- theme / glass / tint ---------- */
  var themeSeg = { dark: null, light: null };
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    store.set('theme', state.theme);
  }
  function setTheme(th) {
    state.theme = th; applyTheme();
    if (themeSeg.dark) { themeSeg.dark.classList.toggle('on', th === 'dark'); themeSeg.light.classList.toggle('on', th === 'light'); }
    var q = $('themeQuick'); if (q) q.textContent = th === 'dark' ? '☾ Night' : '☀ Day';
  }
  function applyGlass() {
    document.body.classList.toggle('glass', state.glass);
    document.body.style.setProperty('--glass-alpha', String(state.glassAlpha));
    if (window.SPM_BG) window.SPM_BG.setGlass(state.glass);
    store.set('glass', state.glass ? '1' : '0');
    store.set('glassAlpha', String(state.glassAlpha));
  }
  function applyAccent() {
    if (!window.SPM_BG) return;
    if (!state.tint) { window.SPM_BG.setAccent(null); return; }
    var t = TYPES[state.tab] || TYPES.all;
    window.SPM_BG.setAccent(t.accent);
  }

  /* ---------- tweaks panel ---------- */
  function buildTweaks() {
    var scrim = el('div', 'tweaks-scrim'); scrim.id = 'tweaksScrim';
    var panel = el('aside', 'tweaks'); panel.id = 'tweaksPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Display tweaks');
    panel.setAttribute('aria-hidden', 'true');

    var close = el('button', 'tw-close', '×'); close.type = 'button'; close.title = 'Close'; close.setAttribute('aria-label', 'Close tweaks');
    panel.appendChild(close);
    panel.appendChild(el('h3', null, 'Tweaks'));
    panel.appendChild(el('div', 'tw-sub', 'Display · sorting · field'));

    // SORT group (MARCH PAWS)
    var gSort = el('div', 'tw-group');
    gSort.appendChild(el('span', 'tw-label', 'Sort order'));
    var seg = el('div', 'tw-seg');
    var bDef = el('button', state.sort === 'default' ? 'on' : '', 'Default'); bDef.type = 'button';
    var bMar = el('button', state.sort === 'march' ? 'on' : '', 'MARCH PAWS'); bMar.type = 'button';
    seg.appendChild(bDef); seg.appendChild(bMar);
    gSort.appendChild(seg);
    var sortHint = el('div', 'tw-hint', 'MARCH PAWS groups the 100 scenarios into the trauma algorithm: Massive hemorrhage → Airway → Respiration → Circulation → Hypothermia/Head → Pain → Antibiotics → Wounds → Splinting.');
    gSort.appendChild(sortHint);
    var legend = el('div', 'tw-legend');
    MARCH.forEach(function (p) {
      var lg = el('div', 'lg');
      var sw = el('b'); sw.style.background = p.color;
      lg.appendChild(sw); lg.appendChild(document.createTextNode(p.letter + ' — ' + p.name));
      legend.appendChild(lg);
    });
    gSort.appendChild(legend);
    panel.appendChild(gSort);
    function setSort(mode) {
      state.sort = mode; store.set('sort', mode);
      bDef.classList.toggle('on', mode === 'default');
      bMar.classList.toggle('on', mode === 'march');
      layout(); filter();
    }
    bDef.addEventListener('click', function () { setSort('default'); });
    bMar.addEventListener('click', function () { setSort('march'); });

    // THEME group
    var gTheme = el('div', 'tw-group');
    gTheme.appendChild(el('span', 'tw-label', 'Theme'));
    var tseg = el('div', 'tw-seg');
    var bDark = el('button', state.theme === 'dark' ? 'on' : '', 'Night'); bDark.type = 'button';
    var bLight = el('button', state.theme === 'light' ? 'on' : '', 'Day'); bLight.type = 'button';
    tseg.appendChild(bDark); tseg.appendChild(bLight);
    gTheme.appendChild(tseg);
    panel.appendChild(gTheme);
    themeSeg.dark = bDark; themeSeg.light = bLight;
    bDark.addEventListener('click', function () { setTheme('dark'); });
    bLight.addEventListener('click', function () { setTheme('light'); });

    // FIELD group (glass + opacity + tint)
    var gField = el('div', 'tw-group');
    gField.appendChild(el('span', 'tw-label', 'Ambient field'));
    // glass toggle
    var rowGlass = el('div', 'tw-row');
    rowGlass.appendChild(document.createTextNode('Glass panels'));
    var sw1 = mkSwitch(state.glass, function (on) { state.glass = on; applyGlass(); });
    rowGlass.appendChild(sw1);
    gField.appendChild(rowGlass);
    // opacity
    var rowOp = el('div', 'tw-row'); rowOp.style.display = 'block';
    rowOp.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(state.glassAlpha);
    rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { state.glassAlpha = parseFloat(rng.value); applyGlass(); });
    rowOp.appendChild(rng);
    gField.appendChild(rowOp);
    // tint
    var rowTint = el('div', 'tw-row');
    rowTint.appendChild(document.createTextNode('Tint field to category'));
    var sw2 = mkSwitch(state.tint, function (on) { state.tint = on; store.set('tint', on ? '1' : '0'); applyAccent(); });
    rowTint.appendChild(sw2);
    gField.appendChild(rowTint);
    panel.appendChild(gField);

    // EXPAND group
    var gEx = el('div', 'tw-group');
    gEx.appendChild(el('span', 'tw-label', 'Cards'));
    var rowEx = el('div', 'tw-row');
    var bExpand = el('button', 'tool-btn', 'Expand visible'); bExpand.type = 'button';
    var bCollapse = el('button', 'tool-btn', 'Collapse all'); bCollapse.type = 'button';
    rowEx.appendChild(bExpand); rowEx.appendChild(bCollapse);
    gEx.appendChild(rowEx);
    panel.appendChild(gEx);
    bExpand.addEventListener('click', function () {
      DATA.forEach(function (d) { var c = cardsByN[d.n]; if (!c.classList.contains('hidden')) { c.classList.add('open'); c.querySelector('.card-head').setAttribute('aria-expanded', 'true'); } });
    });
    bCollapse.addEventListener('click', function () {
      DATA.forEach(function (d) { var c = cardsByN[d.n]; c.classList.remove('open'); c.querySelector('.card-head').setAttribute('aria-expanded', 'false'); });
    });

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    function openPanel() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); }
    function closePanel() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
    $('tweaksBtn').addEventListener('click', openPanel);
  }
  function mkSwitch(on, cb) {
    var lab = el('label', 'switch'); lab.setAttribute('tabindex', '0'); lab.setAttribute('role', 'switch'); lab.setAttribute('aria-checked', String(on));
    var inp = el('input'); inp.type = 'checkbox'; inp.checked = on;
    var track = el('span', 'track'); var thumb = el('span', 'thumb');
    lab.appendChild(inp); lab.appendChild(track); lab.appendChild(thumb);
    function fire() { lab.setAttribute('aria-checked', String(inp.checked)); cb(inp.checked); }
    inp.addEventListener('change', fire);
    lab.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.checked = !inp.checked; fire(); } });
    return lab;
  }

  /* ---------- quick theme button in header ---------- */
  $('themeQuick').addEventListener('click', function () {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  /* ---------- search ---------- */
  var searchInput = $('searchInput');
  var clearBtn = $('clearSearch');
  searchInput.addEventListener('input', function () {
    state.q = searchInput.value.toLowerCase().trim();
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    filter();
  });
  clearBtn.addEventListener('click', function () {
    searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; filter(); searchInput.focus();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
    if (e.key === 'Escape' && document.activeElement === searchInput) { searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; filter(); searchInput.blur(); }
  });

  /* ---------- toast ---------- */
  var toastTimer = null;
  function showToast() {
    var t = $('toast'); t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1700);
  }

  /* ---------- boot ---------- */
  buildTweaks();
  setTheme(state.theme);
  applyGlass();
  layout();
  filter();
  applyAccent();
})();
