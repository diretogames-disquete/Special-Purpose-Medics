/* global React, ReactDOM */
const { useState, useMemo, useEffect, useCallback, useRef } = React;

const DATA = window.PCC_SCENARIOS || [];

// -------- helpers ----------
const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const lvlClass = lvl => 'l-' + (lvl || '').toLowerCase().replace(/[^a-z]+/g, '-');

function classifyChar(c) {
  const role = (c.role || '').toLowerCase();
  const who = (c.who || '').toLowerCase();
  if (who.includes('patient') || role.includes('patient')) return 'patient';
  if (who.includes('casualties') || who.includes('casualty')) return 'casualty';
  if (role.includes('teleconsult') || role.includes('advisor') || role.includes('remote critical care')) return 'consult';
  if (role.includes('student') || who.includes('student')) return 'student';
  if (role.includes('instructor')) return 'medic';
  if (role.includes('crew') || role.includes('dustoff')) return 'consult';
  return 'medic';
}

function initials(name) {
  // SSG Carlos Martinez -> CM ; SOCM Students -> ST
  const parts = (name || '').replace(/\(.*?\)/g, '').trim().split(/\s+/);
  // skip rank-like first token if all caps
  const rest = parts.length > 1 && parts[0].length <= 4 && /^[A-Z]+$/.test(parts[0]) ? parts.slice(1) : parts;
  const a = (rest[0] || '?')[0] || '?';
  const b = (rest[1] || '')[0] || '';
  return (a + b).toUpperCase();
}

// vitals range classification (rough clinical ranges)
function rateBp(s) { if (!s) return null; const [sys, dia] = s.split('/').map(Number);
  if (sys < 90 || dia < 50) return 'bad';
  if (sys < 100 || sys > 160 || dia < 60 || dia > 100) return 'warn';
  return 'good';
}
function rateHr(n) { n=+n; if(!n) return null; if (n < 50 || n > 120) return 'bad'; if (n < 60 || n > 100) return 'warn'; return 'good'; }
function rateRr(n) { n=+n; if(!n) return null; if (n < 10 || n > 28) return 'bad'; if (n < 12 || n > 20) return 'warn'; return 'good'; }
function rateSpo2(n) { n=+n; if(!n) return null; if (n < 90) return 'bad'; if (n < 94) return 'warn'; return 'good'; }
function rateTemp(n) { n=+n; if(!n) return null; if (n >= 39 || n < 35) return 'bad'; if (n >= 38) return 'warn'; return 'good'; }
function rateEtco2(n) { n=+n; if(!n) return null; if (n < 30 || n > 45) return 'bad'; if (n < 35 || n > 40) return 'warn'; return 'good'; }

// pull "Key teaching: '...'" from resolution
function splitResolution(text) {
  if (!text) return { story: '', teach: '' };
  const idx = text.lastIndexOf('Key teaching');
  if (idx === -1) return { story: text.trim(), teach: '' };
  const story = text.slice(0, idx).trim();
  let teach = text.slice(idx).replace(/^Key teaching:\s*/, '').trim();
  // strip surrounding quotes
  teach = teach.replace(/^['"‘“]|['"’”]$/g, '');
  return { story, teach };
}

// =================================================================
// ECG / waveform decoration
// =================================================================
function EcgLine({ color = '#6fd99a', period = 32, w = 100 }) {
  // single QRS-like pulse repeated
  const segs = Math.max(2, Math.floor(w / period));
  let path = `M0,9 `;
  for (let i = 0; i < segs; i++) {
    const x = i * period;
    path += `L${x + 8},9 L${x + 10},5 L${x + 12},14 L${x + 14},2 L${x + 16},9 L${x + period},9 `;
  }
  return (
    <svg className="ecg" viewBox={`0 0 ${segs * period} 18`} preserveAspectRatio="none">
      <path d={path} stroke={color} />
    </svg>
  );
}

// =================================================================
// LEFT — INDEX
// =================================================================
function ScenarioIndex({ data, activeCtl, onPick }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(d =>
      d.ctl.includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.story || '').toLowerCase().includes(q) ||
      (d.cat || '').toLowerCase().includes(q) ||
      (d.focus || '').toLowerCase().includes(q)
    );
  }, [data, query]);

  // group by category
  const groups = useMemo(() => {
    const order = [
      'AIRWAY', 'RESUSCITATION', 'INFECTION', 'SURGICAL', 'MONITORING',
      'PROCEDURE', 'ASSESSMENT', 'NURSING CARE', 'SPECIAL POP',
      'COORDINATION', 'TRIAGE', 'END OF LIFE', 'DOCUMENTATION', 'CAPSTONE'
    ];
    const map = new Map();
    for (const o of order) map.set(o, []);
    for (const d of filtered) {
      if (!map.has(d.cat)) map.set(d.cat, []);
      map.get(d.cat).push(d);
    }
    return [...map.entries()].filter(([_, arr]) => arr.length);
  }, [filtered]);

  // summary counts
  const counts = useMemo(() => {
    const total = data.length;
    const p0 = data.filter(d => d.priority === 0).length;
    const p1 = data.filter(d => d.priority === 1).length;
    return { total, p0, p1 };
  }, [data]);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="marker">●</span>
        <span>Scenario Index</span>
        <span className="right">SA20 · PCC</span>
      </div>
      <div className="panel-body">
        <div className="idx-summary">
          <div className="idx-stat"><div className="v">{counts.total}</div><div className="l">Scenarios</div></div>
          <div className="idx-stat crit"><div className="v">{counts.p0}</div><div className="l">Life-Threat</div></div>
          <div className="idx-stat warn"><div className="v">{counts.p1}</div><div className="l">Urgent</div></div>
        </div>
        <div className="idx-filter">
          <span className="icon">⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="FILTER · # / KEYWORD"
          />
        </div>
        {groups.map(([cat, items]) => (
          <React.Fragment key={cat}>
            <div className="idx-section-head">{cat}<span>· {items.length}</span></div>
            {items.map(d => (
              <button
                key={d.ctl}
                className={'idx-item' + (d.ctl === activeCtl ? ' active' : '')}
                onClick={() => onPick(d.ctl)}
              >
                <span className={'pri p' + (d.priority ?? 2)}></span>
                <span className="ctl">#{d.ctl}</span>
                <span className="title">{d.title}</span>
                <span className="arrow">{d.ctl === activeCtl ? '◆' : '›'}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 10, letterSpacing: '0.2em' }}>
            NO MATCHES
          </div>
        )}
      </div>
    </div>
  );
}

window.ScenarioIndex = ScenarioIndex;
window.EcgLine = EcgLine;
window.classifyChar = classifyChar;
window.initials = initials;
window.lvlClass = lvlClass;
window.splitResolution = splitResolution;
window.rateBp = rateBp;
window.rateHr = rateHr;
window.rateRr = rateRr;
window.rateSpo2 = rateSpo2;
window.rateTemp = rateTemp;
window.rateEtco2 = rateEtco2;
