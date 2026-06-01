/* ============================================================
   TREATMENTS PANEL — TX / MEDS / DRIP / BLOOD / REF tabs
   ============================================================ */

function TxButton({ id, label, taken, contraInScenario, hinted, target, onClick }) {
  const isDone = taken.has(id);
  const isContra = contraInScenario && contraInScenario.includes(id);
  let className = "tx-btn";
  if (isDone) className += " done";
  if (isContra && isDone) className += " contraindicated";
  if (hinted && !isDone) className += " hinted";
  if (target && !isDone) className += " target";
  return (
    <button className={className} onClick={() => onClick(id, label)}>
      {label}
    </button>
  );
}

function TxTab({ scenario, taken, hint, perform, targets }) {
  const contraIds = scenario.contraindications.map(c => c.actionId);
  const groups = [
    { key: "M", title: "Massive Hemorrhage",
      ids: ["tq_left_leg","tq_right_leg","tq_left_arm","tq_right_arm","wound_packed","combat_gauze","pressure_dressing","junctional_tq","direct_pressure","moist_cover_evisc","dry_dressing","elevate_extremity"] },
    { key: "A", title: "Airway",
      ids: ["chin_lift","recovery_position","suction","airway_cric","npa_tacevac","sga_igel","intubation","mils_cspine"] },
    { key: "R", title: "Respiration",
      ids: ["chest_seal_r","chest_seal_l","burp_seal","needle_decomp_r","needle_decomp_l","finger_thoracostomy","chest_tube","o2_administered","bvm_ventilation","albuterol_neb"] },
    { key: "C", title: "Circulation",
      ids: ["iv_io","pelvic_binder","splint_extremity","head_elevation","monitor_ekg","maintain_map","distal_pulse_check","cap_refill_check","foley_catheter","tq_conversion"] },
    { key: "H", title: "Head / Hypothermia",
      ids: ["hypothermia_kit","c_spine","ready_heat","foil_blanket","warm_iv_fluids","head_wrap"] }
  ];

  return (
    <>
      {groups.map(g => (
        <div className="tx-group" key={g.key}>
          <div className={`tx-group-head ${g.key}`}>{g.title}</div>
          <div className={`tx-grid ${g.ids.length > 4 ? "three" : ""}`}>
            {g.ids.map(id => {
              const item = window.ACTION_CATALOG[g.key].find(a => a.id === id);
              if (!item) return null;
              return (
                <TxButton key={id} id={id} label={item.label}
                          taken={taken}
                          contraInScenario={contraIds}
                          hinted={hint === id}
                          target={targets && targets.has(id)}
                          onClick={perform} />
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function MedsTab({ scenario, taken, hint, perform, targets }) {
  const contraIds = scenario.contraindications.map(c => c.actionId);
  const meds = window.ACTION_CATALOG.MEDS;

  return (
    <div className="meds-list">
      {meds.map(m => {
        const isDone = taken.has(m.id);
        const isContra = contraIds.includes(m.id);
        const isShared = m.risky;
        let cls = "med-row";
        if (isDone) cls += " done";
        if ((isContra || isShared) && !isDone) cls += " contraindicated";
        if (isDone && isContra) cls += " contraindicated done";
        const isTarget = targets && targets.has(m.id) && !isDone;
        return (
          <div key={m.id} className={cls + (isTarget ? " target" : "")}>
            <div>
              <div className="med-name">{m.label}</div>
              <div className="med-dose">{m.dose}</div>
            </div>
            <button className={`med-btn ${hint === m.id && !isDone ? "hinted" : ""}${isTarget ? " target" : ""}`}
                    onClick={() => perform(m.id, m.label, "MED")}>
              {isDone ? "GIVEN" : "GIVE"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DripTab({ scenario, taken, hint, perform, targets }) {
  const contraIds = scenario.contraindications.map(c => c.actionId);
  const drips = window.ACTION_CATALOG.DRIP;
  return (
    <div className="meds-list">
      {drips.map(m => {
        const isDone = taken.has(m.id);
        const isContra = contraIds.includes(m.id);
        let cls = "med-row";
        if (isDone) cls += " done";
        if (isContra && isDone) cls += " contraindicated done";
        return (
          <div key={m.id} className={cls}>
            <div>
              <div className="med-name">{m.label}</div>
              <div className="med-dose">{m.dose}</div>
            </div>
            <button className={`med-btn ${hint === m.id && !isDone ? "hinted" : ""}`}
                    onClick={() => perform(m.id, m.label, "C")}>
              {isDone ? "RUNNING" : "START"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BloodTab({ scenario, taken, hint, perform, targets }) {
  const blood = window.ACTION_CATALOG.BLOOD;
  return (
    <div className="meds-list">
      {blood.map(m => {
        const isDone = taken.has(m.id);
        let cls = "med-row";
        if (isDone) cls += " done";
        return (
          <div key={m.id} className={cls}>
            <div>
              <div className="med-name">{m.label}</div>
              <div className="med-dose">{m.dose}</div>
            </div>
            <button className={`med-btn ${hint === m.id && !isDone ? "hinted" : ""}`}
                    onClick={() => perform(m.id, m.label, "C")}>
              {isDone ? "HUNG" : "HANG"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DecisionsTab({ scenario, taken, hint, perform, targets, evacPriority, setEvacPriority }) {
  const items = window.ACTION_CATALOG.DECISIONS;
  const generic = items.filter(i => !i.id.startsWith("evac_"));
  const evacs = items.filter(i => i.id.startsWith("evac_"));
  return (
    <div>
      <div className="tx-group">
        <div className="tx-group-head C">Field Decisions</div>
        <div className="meds-list">
          {generic.map(m => {
            const isDone = taken.has(m.id);
            const isTarget = targets && targets.has(m.id) && !isDone;
            return (
              <div key={m.id} className={`med-row ${isDone ? "done" : ""} ${isTarget ? "target" : ""}`}>
                <div>
                  <div className="med-name">{m.label}</div>
                  <div className="med-dose">{m.dose}</div>
                </div>
                <button className={`med-btn ${hint === m.id && !isDone ? "hinted" : ""}`}
                        onClick={() => perform(m.id, m.label, "C")}>
                  {isDone ? "✓ DONE" : "DO"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tx-group">
        <div className="tx-group-head C">EVAC Priority</div>
        <div className="evac-grid">
          {[
            { id: "evac_urgent",   label: "URGENT",   sub: "≤1 hr", cls: "urgent" },
            { id: "evac_priority", label: "PRIORITY", sub: "≤4 hrs", cls: "priority" },
            { id: "evac_routine",  label: "ROUTINE",  sub: "≤24 hrs", cls: "routine" }
          ].map(e => (
            <button key={e.id}
              className={`evac-btn ${e.cls} ${evacPriority === e.id ? "active" : ""}`}
              onClick={() => { setEvacPriority(e.id); perform(e.id, e.label, "C"); }}>
              <span className="evac-name">{e.label}</span>
              <span className="evac-sub">{e.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RefTab({ scenario }) {
  return (
    <div>
      <div className="ref-card">
        <div className="ref-title">Working Diagnosis</div>
        <div className="ref-body">{scenario.diagnosis}</div>
      </div>
      <div className="ref-card">
        <div className="ref-title">MARCH Reminder</div>
        <div className="ref-body">
          <b>M</b> Massive Hemorrhage · <b>A</b> Airway · <b>R</b> Respiration · <b>C</b> Circulation · <b>H</b> Head/Hypothermia.
          Stop the bleed first. Then secure the airway. Then breathing. Then volume. Then warmth.
        </div>
      </div>
      <div className="ref-card">
        <div className="ref-title">2026 Test-Day Traps</div>
        <div className="ref-body">
          • TXA dose: single <b>2g slow push</b>; window <b>≤3 hrs</b>.<br/>
          • TBI: SpO₂ <b>≥92%</b>, SBP <b>≥100</b>. No permissive hypotension.<br/>
          • Ceftriaxone: <b>NS only</b>, flush 10–20 mL before/after. Precipitates with LR/Ca²⁺.<br/>
          • Crush: <b>NS not LR</b> (LR contains K⁺).<br/>
          • Airway TFC: recovery position <i>or</i> cric. NPA/SGA removed.<br/>
          • Fentanyl/OTFC removed from initial mgmt; ketamine primary.
        </div>
      </div>
      <div className="ref-card">
        <div className="ref-title">Scenario Hint</div>
        <div className="ref-body">{scenario.diagnosis} — work the MARCH sequence in order. The first intervention that matters is in the top-ranked critical action.</div>
      </div>
    </div>
  );
}

function TreatmentsPanel({ scenario, taken, perform, nextHint, hintMode, showAnswers, evacPriority, setEvacPriority }) {
  const [tab, setTab] = useState("TX");

  // Hint highlight only on hintMode and only for the next critical action
  const activeHint = hintMode ? nextHint : null;

  // If showAnswers, color all critical actions
  const allTargets = showAnswers ? new Set(scenario.criticalActions.map(a => a.id)) : null;

  return (
    <div className="panel">
      <div className="tx-tabs">
        {["TX","MEDS","DRIP","BLOOD","DECIDE","REF"].map(t => (
          <button key={t}
                  className={`tx-tab ${tab === t ? "active" : ""}`}
                  onClick={() => { setTab(t); if (window.Sound) window.Sound.play('pageClick'); }}>
            {t}
          </button>
        ))}
      </div>
      <div className="panel-body">
        {tab === "TX"     && <TxTab     scenario={scenario} taken={taken} hint={activeHint} perform={perform} targets={allTargets} />}
        {tab === "MEDS"   && <MedsTab   scenario={scenario} taken={taken} hint={activeHint} perform={perform} targets={allTargets} />}
        {tab === "DRIP"   && <DripTab   scenario={scenario} taken={taken} hint={activeHint} perform={perform} targets={allTargets} />}
        {tab === "BLOOD"  && <BloodTab  scenario={scenario} taken={taken} hint={activeHint} perform={perform} targets={allTargets} />}
        {tab === "DECIDE" && <DecisionsTab scenario={scenario} taken={taken} hint={activeHint} perform={perform} targets={allTargets} evacPriority={evacPriority} setEvacPriority={setEvacPriority} />}
        {tab === "REF"    && <RefTab    scenario={scenario} />}
      </div>
    </div>
  );
}

window.TreatmentsPanel = TreatmentsPanel;
