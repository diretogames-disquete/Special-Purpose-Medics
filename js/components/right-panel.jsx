/* global React */
const { useState, useEffect, useMemo } = React;

// =================================================================
// RIGHT — TABS (Actions / Questions / Resolution)
// =================================================================
function ActionItem({ idx, txt, done, onToggle }) {
  // Try to split "HEAD: rest..."
  const m = txt.match(/^([A-Z][A-Z0-9 /\-\(\)]{2,}?):\s+(.+)$/);
  const head = m ? m[1] : null;
  const rest = m ? m[2] : txt;
  return (
    <button className={'action-item' + (done ? ' done' : '')} onClick={onToggle}>
      <span className="num">{String(idx + 1).padStart(2, '0')}</span>
      <span className="check">✓</span>
      <span className="txt">
        {head && <span className="head">{head} · </span>}
        {rest}
      </span>
    </button>
  );
}

// ---------- Interactive Treatment Decision Point ----------
function TreatmentDecision({ ctl }) {
  const data = (window.PCC_TREATMENTS || {})[ctl];
  const [picked, setPicked] = useState(() => new Set()); // indices revealed
  const [committed, setCommitted] = useState(null); // index the student "commits" to
  useEffect(() => { setPicked(new Set()); setCommitted(null); }, [ctl]);

  if (!data) return null;

  const reveal = (i) => {
    setPicked(s => {
      const n = new Set(s);
      n.add(i);
      return n;
    });
    setCommitted(c => (c === null ? i : c));
  };
  const reset = () => { setPicked(new Set()); setCommitted(null); };

  const correctIdx = data.options.findIndex(o => o.outcome === 'correct');
  const committedOpt = committed !== null ? data.options[committed] : null;
  const triedCorrect = picked.has(correctIdx);
  const exploredCount = picked.size;

  const statusBar = (() => {
    if (committed === null) return { cls: 'pending', txt: 'AWAITING DECISION' };
    if (committedOpt.outcome === 'correct') return { cls: 'good', txt: 'OPTIMAL DECISION' };
    if (committedOpt.outcome === 'harmful') return { cls: 'bad', txt: 'HARMFUL DECISION — PATIENT WORSENS' };
    return { cls: 'warn', txt: 'SUBOPTIMAL DECISION' };
  })();

  return (
    <div className="tx-block">
      <div className="section-bar">
        Treatment Decision Point
        <span className="right">INTERACTIVE · CLICK TO COMMIT</span>
      </div>
      <div className={'tx-status tx-' + statusBar.cls}>
        <span className="tx-pip" />
        <span className="tx-status-txt">{statusBar.txt}</span>
        <span className="tx-status-meta">
          {exploredCount > 0 ? `${exploredCount}/${data.options.length} EXPLORED` : 'YOUR CALL'}
          {triedCorrect && committed !== correctIdx ? ' · CORRECT REVEALED' : ''}
        </span>
      </div>
      <div className="tx-prompt">{data.prompt}</div>

      <div className="tx-options">
        {data.options.map((o, i) => {
          const isPicked = picked.has(i);
          const isCommitted = committed === i;
          const cls = [
            'tx-option',
            isPicked ? 'revealed' : '',
            isPicked ? 'oc-' + o.outcome : '',
            isCommitted ? 'committed' : '',
          ].join(' ');
          return (
            <button
              key={i}
              className={cls}
              onClick={() => reveal(i)}
              disabled={isPicked}
            >
              <div className="tx-opt-head">
                <span className="tx-letter">{String.fromCharCode(65 + i)}</span>
                <span className="tx-label">{o.label}</span>
                {isPicked && (
                  <span className={'tx-badge oc-' + o.outcome}>
                    {o.outcome === 'correct' ? '✓ CORRECT'
                      : o.outcome === 'harmful' ? '✗ HARMFUL'
                      : '! SUBOPTIMAL'}
                  </span>
                )}
                {isCommitted && <span className="tx-committed-flag">YOUR CALL</span>}
              </div>
              {isPicked && (
                <div className="tx-reveal">
                  <div className="tx-reveal-title">{o.title}</div>
                  <div className="tx-reveal-detail">{o.detail}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="tx-foot">
        <button className="tx-reset" onClick={reset} disabled={picked.size === 0}>
          ↻ Reset decision
        </button>
        <span className="tx-hint">
          {committed === null
            ? 'Your first click commits a decision. You can still explore the other options afterwards.'
            : committedOpt.outcome === 'correct'
              ? 'Optimal call. Continue to the critical-action checklist below.'
              : 'Decision committed. Explore the other options to compare, then review the checklist below.'}
        </span>
      </div>
    </div>
  );
}

function ActionsPane({ actions, ctl }) {
  // local state, scoped per scenario via key prop reset
  const [doneSet, setDoneSet] = useState(() => new Set());
  useEffect(() => { setDoneSet(new Set()); }, [ctl]);
  const toggle = (i) => {
    setDoneSet(s => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };
  const completion = actions.length ? Math.round(doneSet.size / actions.length * 100) : 0;
  return (
    <>
      <TreatmentDecision ctl={ctl} />
      <div className="section-bar">
        Critical Actions
        <span className="right">{doneSet.size}/{actions.length} · {completion}%</span>
      </div>
      <div className="action-list">
        {actions.map((a, i) => (
          <ActionItem
            key={i}
            idx={i}
            txt={a}
            done={doneSet.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </>
  );
}

function QuestionsPane({ questions, ctl }) {
  const [discussed, setDiscussed] = useState(() => new Set());
  useEffect(() => { setDiscussed(new Set()); }, [ctl]);
  const toggle = (i) => {
    setDiscussed(s => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };
  return (
    <>
      <div className="section-bar">
        Socratic Discussion
        <span className="right">{discussed.size}/{questions.length} REVIEWED</span>
      </div>
      <div className="q-list">
        {questions.map((q, i) => (
          <div key={i} className={'q-item' + (discussed.has(i) ? ' discussed' : '')}>
            <div className="qnum">{String(i + 1).padStart(2, '0')}</div>
            <div className="qtxt">{q}</div>
            <button className="toggle" onClick={() => toggle(i)}>
              {discussed.has(i) ? 'UNMARK' : 'MARK'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function ResolutionPane({ resolution }) {
  const { story, teach } = window.splitResolution(resolution || '');
  return (
    <>
      <div className="section-bar">Resolution &amp; Debrief</div>
      <div className="resolution">
        <div className="res-narrative">
          {story}
        </div>
        {teach && (
          <div className="res-teach">
            <div className="lbl">Key Teaching</div>
            <div className="qt">“{teach}”</div>
          </div>
        )}
      </div>
    </>
  );
}

function RightPanel({ s }) {
  const [tab, setTab] = useState('actions');
  useEffect(() => { setTab('actions'); }, [s.ctl]);

  return (
    <div className="panel">
      <div className="tabs">
        <button className={'tab' + (tab === 'actions' ? ' active' : '')} onClick={() => setTab('actions')}>
          Actions <span className="count">{s.actions.length}</span>
        </button>
        <button className={'tab' + (tab === 'questions' ? ' active' : '')} onClick={() => setTab('questions')}>
          Discussion <span className="count">{s.questions.length}</span>
        </button>
        <button className={'tab' + (tab === 'resolution' ? ' active' : '')} onClick={() => setTab('resolution')}>
          Debrief
        </button>
      </div>
      <div className="panel-body">
        {tab === 'actions' && <ActionsPane actions={s.actions} ctl={s.ctl} />}
        {tab === 'questions' && <QuestionsPane questions={s.questions} ctl={s.ctl} />}
        {tab === 'resolution' && <ResolutionPane resolution={s.resolution} />}
      </div>
    </div>
  );
}

window.RightPanel = RightPanel;
