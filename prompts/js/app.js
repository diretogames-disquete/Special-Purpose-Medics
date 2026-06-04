/* =====================================================================
 * SOF Medic — Prompt Library · app logic (vanilla JS, no deps)
 *   Two card families:
 *     - Scenarios (type "sc"): an LLM training prompt PLUS an aligned
 *       media set (Text→Image / Image→Video / Text→Video) that visualises
 *       the scenario, switchable in-card.
 *     - Imagery sets (type "img"): one visual subject as an aligned triplet
 *       (the image, the clip that animates that image, and a text→video of
 *       the same scene), switchable in-card.
 *   Tabs (All / Scenarios / Imagery), live search, MARCH PAWS sort,
 *   tweaks (theme / glass / opacity / tint), and the WebGL field accent.
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

  // Media-type metadata for the in-card Text→Image / Image→Video / Text→Video toggle.
  var MEDIA = {
    t2i: { label: 'Text → Image', color: '#b388ff', hint: 'Generate the still — paste into Nano Banana, Midjourney, Flux or SDXL' },
    i2v: { label: 'Image → Video', color: '#ff5252', hint: 'Animate that still — paste into Kling, Runway, Luma or Pika' },
    t2v: { label: 'Text → Video', color: '#ff9100', hint: 'Generate the clip from text — paste into Veo, Sora or Kling' }
  };
  var MEDIA_ORDER = ['t2i', 'i2v', 't2v'];

  var TYPES = {
    sc:  { label: 'Training Scenarios', code: 'SCN', accent: [0.0, 0.749, 0.647] },
    img: { label: 'Imagery Sets',       code: 'IMG', accent: [0.702, 0.533, 1.0] },
    all: { label: 'All',                code: 'ALL', accent: [0.0, 0.898, 1.0] }
  };

  /* ---------- persisted state ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('spm.prompts.' + k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('spm.prompts.' + k, v); } catch (e) {} }
  };
  var state = {
    tab: 'all', q: '',
    sort: store.get('sort', 'default'),
    theme: store.get('theme', 'dark'),
    glass: store.get('glass', '0') === '1',
    glassAlpha: parseFloat(store.get('glassAlpha', '0.6')),
    tint: store.get('tint', '1') === '1'
  };

  /* ---------- copy helpers + toast ---------- */
  var toastTimer = null;
  function showToast() {
    var t = $('toast'); t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1700);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast, function () { fallbackCopy(text); showToast(); });
    } else { fallbackCopy(text); showToast(); }
  }
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
  function chip(cls, key, val) { var c = el('span', 'chip ' + cls); c.appendChild(document.createTextNode(key + ': ')); var b = el('b', null, val); c.appendChild(b); return c; }

  // A copy button + label row bound to a getter for the current text.
  function copyRow(getText, labelText) {
    var row = el('div', 'copy-row');
    var btn = el('button', 'copy-btn'); btn.type = 'button';
    btn.appendChild(svgCopy()); btn.appendChild(document.createTextNode('Copy Prompt'));
    btn.addEventListener('click', function () {
      copyText(getText());
      btn.classList.add('copied'); btn.lastChild.textContent = 'Copied!';
      setTimeout(function () { btn.classList.remove('copied'); btn.lastChild.textContent = 'Copy Prompt'; }, 1700);
    });
    var label = el('span', 'copy-label'); label.textContent = labelText || '';
    row.appendChild(btn); row.appendChild(label);
    return { row: row, label: label };
  }

  // Build the aligned-media panel: segmented toggle + chips + prompt + copy.
  function mediaPanel(media) {
    var keys = MEDIA_ORDER.filter(function (k) { return media && media[k] && media[k].text; });
    var wrap = el('div', 'media-block');
    if (!keys.length) return wrap;

    var seg = el('div', 'media-seg'); seg.setAttribute('role', 'tablist'); seg.setAttribute('aria-label', 'Media format');
    var modelChip = chip('chip-model', 'Model', '');
    var techChip = chip('chip-tech', 'Method', '');
    var strip = el('div', 'extract-strip'); strip.appendChild(modelChip); strip.appendChild(techChip);
    var pt = el('div', 'prompt-text');
    var cur = keys[0];
    var cr = copyRow(function () { return media[cur].text; }, MEDIA[cur].hint);

    function select(k) {
      cur = k;
      seg.querySelectorAll('button').forEach(function (b) {
        var on = b.dataset.k === k;
        b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on));
      });
      modelChip.lastChild.textContent = media[k].model || '';
      techChip.lastChild.textContent = media[k].technique || '';
      pt.textContent = media[k].text;
      cr.label.textContent = MEDIA[k].hint;
    }
    keys.forEach(function (k) {
      var b = el('button', null, MEDIA[k].label); b.type = 'button'; b.dataset.k = k;
      b.setAttribute('role', 'tab'); b.style.setProperty('--mc', MEDIA[k].color);
      b.addEventListener('click', function () { select(k); });
      seg.appendChild(b);
    });
    wrap.appendChild(seg); wrap.appendChild(strip); wrap.appendChild(pt); wrap.appendChild(cr.row);
    select(cur);
    return wrap;
  }

  /* ---------- build card nodes once ---------- */
  var main = $('main');
  var noRes = $('noResults');
  var cardsByN = {};

  function searchText(d) {
    var parts = [d.title, d.cat, d.model || '', d.technique || '', d.march || '', d.text || ''];
    ['t2i', 'i2v', 't2v'].forEach(function (k) {
      var m = d[k] || (d.media && d.media[k]);
      if (m) parts.push((m.model || '') + ' ' + (m.technique || '') + ' ' + (m.text || ''));
    });
    return parts.join(' ').toLowerCase();
  }

  DATA.forEach(function (d) {
    var card = el('div', 'card type-' + d.type);
    card.dataset.type = d.type; card.dataset.n = d.n;
    card.dataset.search = searchText(d);
    if (d.march && PHASE[d.march]) card.style.setProperty('--ph', PHASE[d.march].color);

    var head = el('div', 'card-head');
    head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0'); head.setAttribute('aria-expanded', 'false');
    var num = el('span', 'card-num', String(d.n).padStart(3, '0'));
    var title = el('span', 'card-title', d.title);
    var tags = el('div', 'card-meta-tags');
    if (d.march && PHASE[d.march]) {
      var pm = PHASE[d.march];
      var mtag = el('span', 'tag tag-march', pm.letter + ' · ' + pm.name);
      mtag.title = 'MARCH PAWS phase: ' + pm.name; tags.appendChild(mtag);
    }
    if (d.type === 'img') { var stg = el('span', 'tag tag-set', 'T2I·I2V·T2V'); stg.title = 'Aligned image / video set'; tags.appendChild(stg); }
    tags.appendChild(el('span', 'tag tag-cat', d.cat));
    var chev = el('span', 'card-chev', '▸');
    head.appendChild(num); head.appendChild(title); head.appendChild(tags); head.appendChild(chev);
    function toggle() { var open = card.classList.toggle('open'); head.setAttribute('aria-expanded', String(open)); }
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

    var body = el('div', 'card-body');
    if (d.type === 'sc') {
      var strip = el('div', 'extract-strip');
      strip.appendChild(chip('chip-model', 'LLM', d.model));
      strip.appendChild(chip('chip-tech', 'Method', d.technique));
      body.appendChild(strip);
      var pt = el('div', 'prompt-text'); pt.textContent = d.text; body.appendChild(pt);
      body.appendChild(copyRow(function () { return d.text; }, 'Paste into ChatGPT, Claude, or Gemini').row);
      if (d.media) {
        var div = el('div', 'viz-divider'); div.appendChild(el('span', null, 'Visualise this scenario')); body.appendChild(div);
        body.appendChild(mediaPanel(d.media));
      }
    } else if (d.type === 'img') {
      body.appendChild(mediaPanel({ t2i: d.t2i, i2v: d.i2v, t2v: d.t2v }));
    }
    card.appendChild(head); card.appendChild(body);
    cardsByN[d.n] = card;
  });

  /* ---------- header / tabs ---------- */
  var tabDefs = [
    { id: 'all', label: 'All', cls: 'active-all' },
    { id: 'sc',  label: 'Scenarios & Training', cls: 'active-sc' },
    { id: 'img', label: 'Imagery Sets', cls: 'active-img' }
  ];
  var tabBar = $('tabBar');
  tabDefs.forEach(function (t) {
    var btn = el('button', 'tab' + (t.id === 'all' ? ' ' + t.cls : ''));
    btn.type = 'button'; btn.setAttribute('role', 'tab'); btn.setAttribute('aria-selected', String(t.id === 'all'));
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
    applyAccent(); filter();
  }

  /* ---------- layout: order cards + section headers ---------- */
  var headers = [];
  function makeHeader(letter, small, name, sub, color) {
    var h = el('div', 'phase-head');
    if (color) h.style.setProperty('--ph', color);
    var lt = el('span', 'phase-letter' + (small ? ' sm' : ''), letter);
    var txt = el('div', 'phase-txt'); txt.appendChild(el('h2', null, name)); if (sub) txt.appendChild(el('p', null, sub));
    var cnt = el('span', 'ph-cnt', '0');
    h.appendChild(lt); h.appendChild(txt); h.appendChild(cnt);
    return { node: h, cntNode: cnt };
  }
  function layout() {
    headers = [];
    while (main.firstChild) main.removeChild(main.firstChild);
    function section(letter, small, name, sub, color, cards) {
      var hh = makeHeader(letter, small, name, sub, color);
      main.appendChild(hh.node);
      cards.forEach(function (c) { main.appendChild(c); });
      headers.push({ node: hh.node, cntNode: hh.cntNode, cards: cards });
    }
    var byN = function (arr) { return arr.map(function (d) { return cardsByN[d.n]; }); };
    var sc = DATA.filter(function (d) { return d.type === 'sc'; });
    var img = DATA.filter(function (d) { return d.type === 'img'; });

    if (state.sort === 'march') {
      MARCH.forEach(function (p) {
        section(p.letter, false, p.name, p.sub, p.color, byN(sc.filter(function (d) { return d.march === p.key; })));
      });
    } else {
      section(TYPES.sc.code, true, TYPES.sc.label, '100 MARCH PAWS-tagged training prompts, each with an aligned image / video set', PHASE.hemorrhage.color, byN(sc));
    }
    section(TYPES.img.code, true, TYPES.img.label, '50 aligned sets — generate the image, animate it, or go straight to text-to-video', MEDIA.t2i.color, byN(img));
    main.appendChild(noRes);
  }

  /* ---------- filter ---------- */
  function filter() {
    var q = state.q, total = 0;
    DATA.forEach(function (d) {
      var card = cardsByN[d.n];
      var typeMatch = state.tab === 'all' || d.type === state.tab;
      var textMatch = !q || card.dataset.search.indexOf(q) !== -1;
      var show = typeMatch && textMatch;
      card.classList.toggle('hidden', !show);
      if (show) total++;
    });
    headers.forEach(function (h) {
      var vis = 0; h.cards.forEach(function (c) { if (!c.classList.contains('hidden')) vis++; });
      h.cntNode.textContent = String(vis); h.node.style.display = vis ? '' : 'none';
    });
    $('counter').textContent = total + ' / ' + DATA.length + ' ENTRIES';
    noRes.style.display = total === 0 ? 'block' : 'none';
  }

  /* ---------- theme / glass / tint ---------- */
  var themeSeg = { dark: null, light: null };
  function applyTheme() { document.documentElement.setAttribute('data-theme', state.theme); store.set('theme', state.theme); }
  function setTheme(th) {
    state.theme = th; applyTheme();
    if (themeSeg.dark) { themeSeg.dark.classList.toggle('on', th === 'dark'); themeSeg.light.classList.toggle('on', th === 'light'); }
    var q = $('themeQuick'); if (q) q.textContent = th === 'dark' ? '☾ Night' : '☀ Day';
  }
  function applyGlass() {
    document.body.classList.toggle('glass', state.glass);
    document.body.style.setProperty('--glass-alpha', String(state.glassAlpha));
    if (window.SPM_BG) window.SPM_BG.setGlass(state.glass);
    store.set('glass', state.glass ? '1' : '0'); store.set('glassAlpha', String(state.glassAlpha));
  }
  function applyAccent() {
    if (!window.SPM_BG) return;
    if (!state.tint) { window.SPM_BG.setAccent(null); return; }
    window.SPM_BG.setAccent((TYPES[state.tab] || TYPES.all).accent);
  }

  /* ---------- tweaks panel ---------- */
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
  function buildTweaks() {
    var scrim = el('div', 'tweaks-scrim');
    var panel = el('aside', 'tweaks'); panel.id = 'tweaksPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Display tweaks'); panel.setAttribute('aria-hidden', 'true');
    var close = el('button', 'tw-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close tweaks');
    panel.appendChild(close);
    panel.appendChild(el('h3', null, 'Tweaks'));
    panel.appendChild(el('div', 'tw-sub', 'Display · sorting · field'));

    // Sort
    var gSort = el('div', 'tw-group'); gSort.appendChild(el('span', 'tw-label', 'Sort order'));
    var seg = el('div', 'tw-seg');
    var bDef = el('button', state.sort === 'default' ? 'on' : '', 'Default'); bDef.type = 'button';
    var bMar = el('button', state.sort === 'march' ? 'on' : '', 'MARCH PAWS'); bMar.type = 'button';
    seg.appendChild(bDef); seg.appendChild(bMar); gSort.appendChild(seg);
    gSort.appendChild(el('div', 'tw-hint', 'MARCH PAWS groups the 100 scenarios into the trauma algorithm: Massive hemorrhage → Airway → Respiration → Circulation → Hypothermia/Head → Pain → Antibiotics → Wounds → Splinting.'));
    var legend = el('div', 'tw-legend');
    MARCH.forEach(function (p) { var lg = el('div', 'lg'); var sw = el('b'); sw.style.background = p.color; lg.appendChild(sw); lg.appendChild(document.createTextNode(p.letter + ' — ' + p.name)); legend.appendChild(lg); });
    gSort.appendChild(legend); panel.appendChild(gSort);
    function setSort(mode) { state.sort = mode; store.set('sort', mode); bDef.classList.toggle('on', mode === 'default'); bMar.classList.toggle('on', mode === 'march'); layout(); filter(); }
    bDef.addEventListener('click', function () { setSort('default'); });
    bMar.addEventListener('click', function () { setSort('march'); });

    // Theme
    var gTheme = el('div', 'tw-group'); gTheme.appendChild(el('span', 'tw-label', 'Theme'));
    var tseg = el('div', 'tw-seg');
    var bDark = el('button', state.theme === 'dark' ? 'on' : '', 'Night'); bDark.type = 'button';
    var bLight = el('button', state.theme === 'light' ? 'on' : '', 'Day'); bLight.type = 'button';
    tseg.appendChild(bDark); tseg.appendChild(bLight); gTheme.appendChild(tseg); panel.appendChild(gTheme);
    themeSeg.dark = bDark; themeSeg.light = bLight;
    bDark.addEventListener('click', function () { setTheme('dark'); });
    bLight.addEventListener('click', function () { setTheme('light'); });

    // Field
    var gField = el('div', 'tw-group'); gField.appendChild(el('span', 'tw-label', 'Ambient field'));
    var rowGlass = el('div', 'tw-row'); rowGlass.appendChild(document.createTextNode('Glass panels'));
    rowGlass.appendChild(mkSwitch(state.glass, function (on) { state.glass = on; applyGlass(); })); gField.appendChild(rowGlass);
    var rowOp = el('div', 'tw-row'); rowOp.style.display = 'block'; rowOp.appendChild(document.createTextNode('Panel opacity'));
    var rng = el('input', 'tw-range'); rng.type = 'range'; rng.min = '0.3'; rng.max = '0.92'; rng.step = '0.01'; rng.value = String(state.glassAlpha); rng.setAttribute('aria-label', 'Panel opacity');
    rng.addEventListener('input', function () { state.glassAlpha = parseFloat(rng.value); applyGlass(); }); rowOp.appendChild(rng); gField.appendChild(rowOp);
    var rowTint = el('div', 'tw-row'); rowTint.appendChild(document.createTextNode('Tint field to category'));
    rowTint.appendChild(mkSwitch(state.tint, function (on) { state.tint = on; store.set('tint', on ? '1' : '0'); applyAccent(); })); gField.appendChild(rowTint);
    panel.appendChild(gField);

    // Cards
    var gEx = el('div', 'tw-group'); gEx.appendChild(el('span', 'tw-label', 'Cards'));
    var rowEx = el('div', 'tw-row');
    var bExpand = el('button', 'tool-btn', 'Expand visible'); bExpand.type = 'button';
    var bCollapse = el('button', 'tool-btn', 'Collapse all'); bCollapse.type = 'button';
    rowEx.appendChild(bExpand); rowEx.appendChild(bCollapse); gEx.appendChild(rowEx); panel.appendChild(gEx);
    bExpand.addEventListener('click', function () { DATA.forEach(function (d) { var c = cardsByN[d.n]; if (!c.classList.contains('hidden')) { c.classList.add('open'); c.querySelector('.card-head').setAttribute('aria-expanded', 'true'); } }); });
    bCollapse.addEventListener('click', function () { DATA.forEach(function (d) { var c = cardsByN[d.n]; c.classList.remove('open'); c.querySelector('.card-head').setAttribute('aria-expanded', 'false'); }); });

    document.body.appendChild(scrim); document.body.appendChild(panel);
    function openPanel() { scrim.classList.add('open'); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); close.focus(); }
    function closePanel() { scrim.classList.remove('open'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); }
    close.addEventListener('click', closePanel); scrim.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
    $('tweaksBtn').addEventListener('click', openPanel);
  }

  /* ---------- header quick theme + search ---------- */
  $('themeQuick').addEventListener('click', function () { setTheme(state.theme === 'dark' ? 'light' : 'dark'); });
  var searchInput = $('searchInput'); var clearBtn = $('clearSearch');
  searchInput.addEventListener('input', function () { state.q = searchInput.value.toLowerCase().trim(); clearBtn.style.display = searchInput.value ? 'block' : 'none'; filter(); });
  clearBtn.addEventListener('click', function () { searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; filter(); searchInput.focus(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
    if (e.key === 'Escape' && document.activeElement === searchInput) { searchInput.value = ''; state.q = ''; clearBtn.style.display = 'none'; filter(); searchInput.blur(); }
  });

  /* ---------- boot ---------- */
  buildTweaks();
  setTheme(state.theme);
  applyGlass();
  layout();
  filter();
  applyAccent();
})();
