/* global React */
const { useState, useMemo, useEffect } = React;

// =================================================================
// HERO + CONTEXT
// =================================================================
function Hero({ s }) {
  const priorityLabel = s.priority === 0 ? { txt: 'LIFE-THREAT', cls: 'crit' }
    : s.priority === 1 ? { txt: 'URGENT', cls: 'warn' }
    : { txt: 'STABLE', cls: 'ok' };
  return (
    <div className="hero">
      <div>
        <div className="ctl-num">Scenario · Ref</div>
        <div className="ctl-big">#{s.ctl}</div>
      </div>
      <div className="title-block">
        <div className="h-title">{s.title}</div>
        <div className="h-story">“{s.story}”</div>
        <div className="h-meta">
          <span className="tag cat">{s.cat}</span>
          <span className="tag">{s.focus}</span>
          <span className="tag loc">📍 {s.location}</span>
        </div>
      </div>
      <div className="h-status">
        <div><span className="lbl">Priority</span></div>
        <div><span className={'val ' + priorityLabel.cls}>{priorityLabel.txt}</span></div>
        <div style={{ marginTop: 6 }}><span className="lbl">SA</span> <span className="val">20</span></div>
      </div>
    </div>
  );
}

// =================================================================
// MECHANISM / NARRATIVE CARD
// =================================================================
function MechCard({ s }) {
  return (
    <div className="mech-card">
      <div className="mech-head">
        <div className="mech-lbl">Mechanism of Care · Patient Brief</div>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-faint)' }}>STORYTELLING</div>
      </div>
      <div className="mech-grid">
        <div className="mech-row">
          <div className="mech-k">Setting</div>
          <div className="mech-v">{s.envBefore}</div>
        </div>
        <div className="mech-row">
          <div className="mech-k">Encounter</div>
          <div className="mech-v">{s.envDuring}</div>
        </div>
        <div className="mech-row">
          <div className="mech-k">Presentation</div>
          <div className="mech-v">{s.presentation}</div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// CAST
// =================================================================
function CastStrip({ characters }) {
  return (
    <div className="cast-strip">
      {characters.map((c, i) => {
        const cls = window.classifyChar(c);
        return (
          <div key={i} className={'cast-card ' + cls}>
            <div className="avatar">{window.initials(c.who)}</div>
            <div>
              <div className="who">{c.who}</div>
              <div className="role">{c.role}</div>
              <span className={'badge ' + cls}>
                {cls === 'patient' ? 'PATIENT' :
                 cls === 'casualty' ? 'CASUALTIES' :
                 cls === 'consult' ? 'CONSULTANT' :
                 cls === 'student' ? 'STUDENTS' : 'PROVIDER'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =================================================================
// OPQRST
// =================================================================
const OPQRST_LABELS = {
  O: 'Onset', P: 'Provocation', Q: 'Quality', R: 'Radiation', S: 'Severity', T: 'Time'
};
function OPQRSTGrid({ opqrst }) {
  return (
    <div className="opqrst-grid">
      {['O','P','Q','R','S','T'].map(k => (
        <div key={k} className={'opqrst-cell cell-' + k}>
          <div className="letter">{k}</div>
          <div className="lbl">{OPQRST_LABELS[k]}</div>
          <div className="val">{opqrst[k] || '—'}</div>
        </div>
      ))}
    </div>
  );
}

// =================================================================
// VITALS
// =================================================================
function VitalsRow({ v }) {
  if (!v) return null;
  if (v.isTraining) {
    return (
      <div className="vitals-row">
        <div className="vital training">
          <div className="train-icon">i</div>
          <div className="train-text">Training Scenario</div>
          <div className="train-sub">{v.other && v.other !== 'N/A—training scenario' ? v.other : 'Vital signs not applicable — instructional content.'}</div>
        </div>
      </div>
    );
  }

  const cells = [];
  if (v.bp) {
    const r = window.rateBp(v.bp);
    cells.push({ k: 'BP', val: v.bp, unit: 'mmHg', rate: r });
  }
  if (v.map) cells.push({ k: 'MAP', val: v.map, unit: 'mmHg' });
  if (v.hr) cells.push({ k: 'HR', val: v.hr, unit: 'bpm', rate: window.rateHr(v.hr), isHr: true });
  if (v.rr) cells.push({ k: 'RR', val: v.rr, unit: '/min', rate: window.rateRr(v.rr) });
  if (v.spo2) cells.push({ k: 'SpO₂', val: v.spo2, unit: '%', rate: window.rateSpo2(v.spo2) });
  if (v.temp) cells.push({ k: 'Temp', val: v.temp, unit: '°C', rate: window.rateTemp(v.temp) });
  if (v.etco2) cells.push({ k: 'ETCO₂', val: v.etco2, unit: 'mmHg', rate: window.rateEtco2(v.etco2) });
  if (v.pain) cells.push({ k: 'Pain', val: v.pain, unit: '/10', rate: +v.pain >= 7 ? 'bad' : (+v.pain >= 4 ? 'warn' : 'good') });

  if (cells.length === 0) {
    return (
      <div className="vital-extra">
        <span className="lbl">Vitals</span>
        {v.other || 'Not recorded.'}
      </div>
    );
  }

  // HR-driven heartbeat cycle in seconds → CSS animation-duration on the pulse svg
  const hrBpm = +v.hr || 0;
  const beatSec = hrBpm > 0 ? (60 / hrBpm).toFixed(3) + 's' : '1s';
  return (
    <>
      <div className="vitals-row">
        {cells.map((c, i) => (
          <div key={i} className="vital">
            <div className="lbl">{c.k}</div>
            <div className="val">
              <span className={'num' + (c.rate ? ' ' + c.rate : '')}>{c.val}</span>
              <span className="unit">{c.unit}</span>
            </div>
            {c.isHr && (
              <span className={'hr-pulse ' + (c.rate || 'good')} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    style={{ animationDuration: beatSec }}
                    d="M12 21s-7-4.5-9.5-9C.6 8.6 2.3 4.5 6 4.5c2 0 3.5 1.2 4.4 2.7C11.4 5.7 12.9 4.5 15 4.5c3.7 0 5.4 4.1 3.5 7.5C19 16.5 12 21 12 21z"
                  />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
      {v.other && (
        <div className="vital-extra">
          <span className="lbl">Findings</span>
          {v.other}
        </div>
      )}
    </>
  );
}

// =================================================================
// CLINICAL ASSESSMENT
// =================================================================
function AssessmentList({ items }) {
  return (
    <div className="assess-list">
      {items.map((a, i) => (
        <div key={i} className={'assess-row ' + window.lvlClass(a.level)}>
          <div>
            <div className="nm">{a.name}</div>
            {a.detail && <div className="dt">{a.detail}</div>}
          </div>
          {a.level && <span className={'lvl ' + window.lvlClass(a.level)}>{a.level}</span>}
        </div>
      ))}
    </div>
  );
}

// =================================================================
// ECG MONITOR — large interactive PQRST strip with HR readout
// =================================================================
function rhythmFor(hr) {
  if (!hr) return { label: 'NSR', color: 'good' };
  const n = +hr;
  if (n < 50) return { label: 'Sinus brady', color: 'bad' };
  if (n > 120) return { label: 'Sinus tachy', color: 'bad' };
  if (n > 100) return { label: 'Tachycardia', color: 'warn' };
  if (n < 60) return { label: 'Bradycardia', color: 'warn' };
  return { label: 'Sinus rhythm', color: 'good' };
}
function EcgMonitor({ v }) {
  const LEAD_ORDER = window.ECG_LEAD_ORDER || ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
  const LEADS = window.ECG_LEADS || {};
  const [lead, setLead] = React.useState(() => {
    try { return localStorage.getItem('pfc.ecg.lead') || 'II'; } catch (e) { return 'II'; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('pfc.ecg.lead', lead); } catch (e) {}
  }, [lead]);

  if (!v || !v.hr) return null;
  const hr = +v.hr;
  const rhythm = rhythmFor(hr);
  const color = rhythm.color === 'bad' ? '#ef5350'
    : rhythm.color === 'warn' ? '#f4b04a'
    : '#6fd99a';
  const leadInfo = LEADS[lead];
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="marker" style={{ color }}>▮</span>
        <span>ECG · PQRST Strip</span>
        <span className="right ecg-lead-info">
          {leadInfo ? <><b>LEAD {lead}</b> · {leadInfo.view}</> : <>HOVER WAVES FOR DETAIL</>}
        </span>
      </div>
      <div className="panel-body ecg-panel-body">
        <div className="ecg-lead-rail" role="tablist" aria-label="ECG lead selector">
          {LEAD_ORDER.map(L => (
            <button
              key={L}
              role="tab"
              aria-selected={L === lead}
              className={'ecg-lead-chip' + (L === lead ? ' on' : '')}
              onClick={() => setLead(L)}
              title={LEADS[L] ? LEADS[L].view : L}
            >{L}</button>
          ))}
        </div>
        <div className="ecg-monitor">
          <div className="ecg-readout">
            <div className="rd-lbl">Heart rate</div>
            <div className={'rd-val ' + rhythm.color}>{hr}</div>
            <div className="rd-unit">bpm</div>
            <div className="rd-rhythm">{rhythm.label}</div>
          </div>
          <window.PqrstWave hr={hr} color={color} height={140} cycles={3} interactive={true} lead={lead} />
        </div>
      </div>
    </div>
  );
}
window.EcgMonitor = EcgMonitor;

// =================================================================
// MAIN SCENARIO PANEL
// =================================================================
function ScenarioMain({ s }) {
  return (
    <div className="main-col">
      <Hero s={s} />

      <div className="panel">
        <div className="panel-header">
          <span className="marker">▮</span>
          <span>Scenario Context</span>
          <span className="right">{s.characters.length} CHARACTER{s.characters.length === 1 ? '' : 'S'}</span>
        </div>
        <div className="panel-body">
          <MechCard s={s} />
          <div style={{ height: 12 }} />
          <div className="section-bar">Cast</div>
          <CastStrip characters={s.characters} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="marker">▮</span>
          <span>OPQRST Assessment</span>
          <span className="right">PAIN / SYMPTOM CHARACTERIZATION</span>
        </div>
        <div className="panel-body">
          <OPQRSTGrid opqrst={s.opqrst} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="marker">▮</span>
          <span>Vital Signs</span>
          <span className="right">SNAPSHOT · ON ENCOUNTER</span>
        </div>
        <div className="panel-body">
          <VitalsRow v={s.vitalsParsed} />
        </div>
      </div>

      <EcgMonitor v={s.vitalsParsed} />

      <div className="panel">
        <div className="panel-header">
          <span className="marker">▮</span>
          <span>Clinical Assessment</span>
          <span className="right">DIFFERENTIAL · WORKING DX</span>
        </div>
        <div className="panel-body">
          <AssessmentList items={s.assessment} />
        </div>
      </div>
    </div>
  );
}

window.ScenarioMain = ScenarioMain;
