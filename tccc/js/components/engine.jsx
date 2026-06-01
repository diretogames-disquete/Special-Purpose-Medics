/* ============================================================
   ENGINE — scenario state, vitals progression, scoring
   ============================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------- clinical helpers ---------- */
function classifyHR(hr) {
  if (hr < 50)  return "bad";
  if (hr < 60)  return "warn";
  if (hr <= 100) return "good";
  if (hr <= 120) return "warn";
  return "bad";
}
function classifyBP(sys) {
  if (sys < 80)  return "bad";
  if (sys < 100) return "warn";
  if (sys <= 140) return "good";
  if (sys <= 160) return "warn";
  return "bad";
}
function classifyRR(rr) {
  if (rr < 10) return "bad";
  if (rr < 12) return "warn";
  if (rr <= 20) return "good";
  if (rr <= 28) return "warn";
  return "bad";
}
function classifySpO2(spo2) {
  if (spo2 < 90) return "bad";
  if (spo2 < 94) return "warn";
  return "good";
}
function classifyMAP(map) {
  if (map < 60) return "bad";
  if (map < 70) return "warn";
  return "good";
}
function computeMAP(sys, dia) {
  return Math.round(dia + (sys - dia) / 3);
}
function formatClock(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

window.classifyHR = classifyHR;
window.classifyBP = classifyBP;
window.classifyRR = classifyRR;
window.classifySpO2 = classifySpO2;
window.classifyMAP = classifyMAP;
window.computeMAP = computeMAP;
window.formatClock = formatClock;

/* ============================================================
   useScenarioEngine — orchestrates the simulation
   Returns:
     state: {
       scenario, vitals, takenActions (Set), log, survival,
       elapsedSec, paused, finished, hints, criticalDone, criticalMissed
     }
     dispatch: {
       performAction(id), reset(scenarioId), pause(), resume(), end(),
       setHint(bool), nextScenario()
     }
   ============================================================ */
function useScenarioEngine({ scenarioIdx, setScenarioIdx, timeSpeed = 1, difficulty = "mix", showAnswers = false }) {
  const scenario = window.SCENARIOS[scenarioIdx];

  // Reset state when scenario changes
  const [vitals, setVitals] = useState(() => ({ ...scenario.initialVitals }));
  const [taken, setTaken] = useState(() => new Set());
  const [contraTaken, setContraTaken] = useState(() => new Set());
  const [log, setLog] = useState(() => []);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [missionElapsedSec, setMissionElapsedSec] = useState(0);
  const [missionRunning, setMissionRunning] = useState(false);
  const [paused, setPaused] = useState(true); // start paused — user clicks Start
  const [finished, setFinished] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [toast, setToast] = useState(null);
  const [arrested, setArrested] = useState(false);
  const [tqStates, setTqStates] = useState({}); // { 'tq_left_leg': { type, site, appliedAt, converted? } }
  const [evacPriority, setEvacPriority] = useState(null); // 'evac_urgent' | 'evac_priority' | 'evac_routine'
  const [reassessCount, setReassessCount] = useState(0);
  const [avpuUserOverride, setAvpuUserOverride] = useState(null);
  const startedRef = useRef(false);

  // Per-patient state snapshots so survival / progress persists across patient switches
  const patientStatesRef = useRef({});
  const prevScenarioIdRef = useRef(scenario.id);

  // Snapshot the current patient's state, restore the new one (or initialize fresh)
  useEffect(() => {
    const prevId = prevScenarioIdRef.current;
    const newId = scenario.id;
    if (prevId === newId) return;

    // 1) Snapshot what the previous patient was at
    patientStatesRef.current[prevId] = {
      vitals, taken, contraTaken, log, elapsedSec,
      finished, outcome, arrested, tqStates, evacPriority,
      reassessCount, avpuUserOverride, started: startedRef.current
    };

    // 2) Load the new patient's snapshot, or initialize them from scenario defaults
    const snap = patientStatesRef.current[newId];
    if (snap) {
      setVitals(snap.vitals);
      setTaken(new Set(snap.taken));
      setContraTaken(new Set(snap.contraTaken));
      setLog(snap.log);
      setElapsedSec(snap.elapsedSec);
      setFinished(snap.finished);
      setOutcome(snap.outcome);
      setArrested(snap.arrested);
      setTqStates(snap.tqStates);
      setEvacPriority(snap.evacPriority);
      setReassessCount(snap.reassessCount);
      setAvpuUserOverride(snap.avpuUserOverride);
      startedRef.current = snap.started;
    } else {
      setVitals({ ...scenario.initialVitals });
      setTaken(new Set());
      setContraTaken(new Set());
      setLog([{ t: 0, tag: "SYS", msg: `Casualty acquired — ${scenario.name} / ${scenario.last4}`, kind: "sys" }]);
      setElapsedSec(0);
      setFinished(false);
      setOutcome(null);
      setArrested(false);
      setTqStates({});
      setEvacPriority(null);
      setReassessCount(0);
      setAvpuUserOverride(null);
      startedRef.current = missionRunning; // mission already going? this patient counts as started
    }
    // Mission clock: keep running if it was running before the switch.
    setPaused(!missionRunning);
    setToast(null);

    prevScenarioIdRef.current = newId;
  }, [scenario.id]);

  /* Tick loop: per-scenario elapsed only ticks when this scenario is running */
  useEffect(() => {
    if (paused || finished) return;
    const interval = setInterval(() => {
      setElapsedSec((t) => t + 1);
    }, 1000 / timeSpeed);
    return () => clearInterval(interval);
  }, [paused, finished, timeSpeed]);

  /* Mission clock: persists across patient switches; only stops on full mission reset */
  useEffect(() => {
    if (!missionRunning) return;
    const interval = setInterval(() => {
      setMissionElapsedSec((t) => t + 1);
    }, 1000 / timeSpeed);
    return () => clearInterval(interval);
  }, [missionRunning, timeSpeed]);

  /* Each "minute" (every 60 ticks), drift vitals */
  const lastMinTickRef = useRef(0);
  useEffect(() => {
    if (finished) return;
    const minute = Math.floor(elapsedSec / 60);
    if (minute === lastMinTickRef.current) return;
    lastMinTickRef.current = minute;

    setVitals((v) => driftVitals(v, scenario, taken, minute));
    // Check for time-based bad events
    checkTimeEvents(minute);
    // Recompute AVPU cascade
    setVitals((v) => updateAVPU(v, scenario, taken, minute));

  }, [elapsedSec, taken, scenario, finished]);

  function checkTimeEvents(minute) {
    const traj = scenario.untreatedTrajectory;
    // hyperkalemia arrest in crush
    if (traj.hyperkalemiaArrestAt && minute >= traj.hyperkalemiaArrestAt) {
      const protectedByCalcium = taken.has("calcium");
      const fluidsCorrect = taken.has("fluids_ns_crush");
      if (!protectedByCalcium && !arrested) {
        setArrested(true);
        setLog((l) => [...l, { t: minute*60, tag: "WARN", msg: "Sudden VF arrest from hyperkalemia (potassium dump on extrication)", kind: "warn" }]);
        setVitals((v) => ({ ...v, hr: 0, sys: 0, dia: 0, spo2: 0, rr: 0, avpu: "U", gcs: 3 }));
        finalize("dead");
      }
    }
    // TBI herniation
    if (traj.herniationAt && minute >= traj.herniationAt) {
      const protected_ = taken.has("hts_3pct") && taken.has("airway_cric");
      if (!protected_ && !arrested) {
        setArrested(true);
        setLog((l) => [...l, { t: minute*60, tag: "WARN", msg: "Uncal herniation — fixed dilated pupil, Cushing's response collapsing", kind: "warn" }]);
        setVitals((v) => ({ ...v, hr: 0, sys: 0, dia: 0, spo2: 0, rr: 0, avpu: "U", gcs: 3 }));
        finalize("dead");
      }
    }
  }

  /* ---------- GENERAL DEATH WATCHDOG ----------
     Independent of scenario-specific events. A patient dies when:
       (a) Hemodynamic collapse — sys & spo2 both critically low for any
           length of time (perfusion failure → asystole).
       (b) Iatrogenic harm — three or more contraindicated actions taken,
           regardless of vitals (the operator is actively killing them).
       (c) Total neglect — controlFraction stays effectively zero for long
           enough that the untreated trajectory has bottomed out the patient.
     When triggered we zero out HR/BP/SpO2/RR, drop AVPU to U, and the asystole
     tone (driven from app.jsx by the `arrested` flag) starts.
  */
  useEffect(() => {
    if (finished || arrested) return;
    const ctrl = controlFraction(scenario, taken);
    let cause = null;

    if (vitals.sys <= 45 && vitals.spo2 <= 60) {
      cause = "Perfusion failure — pulseless · asystole";
    } else if (contraTaken.size >= 3) {
      cause = "Iatrogenic arrest — cumulative contraindicated interventions";
    } else if (ctrl < 0.05 && elapsedSec >= 360) {
      cause = "Untreated injury — exsanguination · asystole";
    }

    if (cause) {
      setArrested(true);
      setLog((l) => [...l, { t: elapsedSec, tag: "WARN", msg: cause, kind: "warn" }]);
      setVitals((v) => ({ ...v, hr: 0, sys: 0, dia: 0, spo2: 0, rr: 0, avpu: "U", gcs: 3 }));
      finalize("dead");
    }
  }, [vitals.sys, vitals.spo2, contraTaken, elapsedSec, finished, arrested, scenario, taken]);

  /* Driving vitals math */
  function driftVitals(v, scn, takenSet, minute) {
    const traj = scn.untreatedTrajectory;
    // Determine "control %" — how much of critical hemodynamic action has been done
    const ctrl = controlFraction(scn, takenSet);
    // dampener: 1 = full untreated, 0 = fully controlled
    const damp = Math.max(0, 1 - ctrl);
    return {
      ...v,
      hr:    clamp(v.hr   + (traj.hr   || 0) * damp + (ctrl > 0.5 ? Math.sign(80  - v.hr  ) * 0.6 : 0), 0, 220),
      sys:   clamp(v.sys  + (traj.sys  || 0) * damp + (ctrl > 0.5 ? Math.sign(120 - v.sys ) * 1.5 : 0), 0, 240),
      dia:   clamp(v.dia  + (traj.dia  || 0) * damp + (ctrl > 0.5 ? Math.sign(75  - v.dia ) * 1.0 : 0), 0, 160),
      rr:    clamp(v.rr   + (traj.rr   || 0) * damp + (ctrl > 0.5 ? Math.sign(16  - v.rr  ) * 0.3 : 0), 0, 50),
      spo2:  clamp(v.spo2 + (traj.spo2 || 0) * damp + (ctrl > 0.5 ? Math.sign(98  - v.spo2) * 0.5 : 0), 0, 100),
      pain:  v.pain
    };
  }

  function updateAVPU(v, scn, takenSet, minute) {
    if (arrested) return { ...v, avpu: "U", gcs: 3 };
    // User manual override always wins until next degradation event
    if (avpuUserOverride && (v.sys >= 70 && v.spo2 >= 80)) {
      return { ...v, avpu: avpuUserOverride, gcs: deriveGCS(avpuUserOverride, scn, v) };
    }

    const order = ["A", "V", "P", "U"];
    const ctrl = controlFraction(scn, takenSet);
    const traj = scn.untreatedTrajectory;

    // Base index — from cascade if untreated
    let cascadeIdx = 0;
    if (traj.avpuCascade && traj.avpuMinutes && ctrl < 0.5) {
      for (let i = 0; i < traj.avpuMinutes.length; i++) {
        if (minute >= traj.avpuMinutes[i]) {
          cascadeIdx = order.indexOf(traj.avpuCascade[i]);
        }
      }
    }

    // Physiological floor — bad vitals force a lower AVPU even if cascade says better
    let physIdx = 0;
    if (v.sys < 70 || v.spo2 < 80) physIdx = 3;       // unresponsive
    else if (v.sys < 80 || v.spo2 < 85) physIdx = 2;  // pain-only
    else if (v.sys < 90 || v.spo2 < 90) physIdx = 1;  // verbal

    // If treatment is dominant, allow recovery toward Alert
    let recoveryFloor = 4;
    if (ctrl >= 0.75 && v.sys >= 100 && v.spo2 >= 94) recoveryFloor = 0;       // Alert
    else if (ctrl >= 0.5 && v.sys >= 90 && v.spo2 >= 92) recoveryFloor = 1;    // Verbal
    else if (ctrl >= 0.3) recoveryFloor = 2;                                   // Pain

    let idx = Math.max(cascadeIdx, physIdx);
    idx = Math.min(idx, recoveryFloor);
    idx = Math.max(0, Math.min(3, idx));
    const letter = order[idx];
    return { ...v, avpu: letter, gcs: deriveGCS(letter, scn, v) };
  }

  /* GCS derived from AVPU bucket + baseline.
     Each AVPU letter maps to a GCS range; we anchor on the scenario's
     baseline GCS so a patient who started at 14 (confused-alert) doesn't
     jump up to 15 just because they're still labeled "A".
       A → 13–15  (anchor to baseline, clamp to band)
       V → 9–13   (drop toward 10–11 when freshly verbal)
       P → 4–8    (≈ 6 typical: localizes to pain, no eye-open to voice)
       U → 3      (no response)                                         */
  function deriveGCS(letter, scn, v) {
    const base = (scn.initialVitals && scn.initialVitals.gcs) || 15;
    if (letter === "U") return 3;
    if (letter === "P") {
      // Tate-style severe TBI baselines stay near their baseline; otherwise default ~6.
      return Math.max(4, Math.min(8, base <= 8 ? base : 6));
    }
    if (letter === "V") {
      // Confused / drowsy. Anchor below 13.
      return Math.max(9, Math.min(13, base >= 13 ? 11 : base));
    }
    // A — alert. Stay within 13–15, anchored to baseline.
    return Math.max(13, Math.min(15, base));
  }

  function controlFraction(scn, takenSet) {
    const total = scn.criticalActions.reduce((s, a) => s + a.weight, 0);
    const done = scn.criticalActions.reduce(
      (s, a) => s + (takenSet.has(a.id) ? a.weight : 0), 0);
    return done / total;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- ACTION EXECUTION ---------- */
  const performAction = useCallback((actionId, label, mediaCategory) => {
    if (finished) return;
    if (!startedRef.current) {
      // first action auto-starts the clock
      setPaused(false);
      setMissionRunning(true);
      startedRef.current = true;
    }

    // Already done?
    if (taken.has(actionId)) {
      flash(`${labelOf(actionId, label)} already performed.`, "info");
      return;
    }

    // Check critical action
    const crit = scenario.criticalActions.find(a => a.id === actionId);
    const contra = scenario.contraindications.find(c => c.actionId === actionId);

    // Determine MARCH tag for log
    const tag = crit?.category || mediaCategory || tagFromCatalog(actionId) || "MED";

    if (contra) {
      // Contraindication taken!
      setContraTaken((s) => new Set(s).add(actionId));
      setTaken((s) => new Set(s).add(actionId));
      setLog((l) => [...l, {
        t: elapsedSec, tag: "WARN",
        msg: `${labelOf(actionId, label)} — ${contra.message}`,
        kind: "warn"
      }]);
      flash(contra.message, "warn");
      // play contraindication sound
      if (window.Sound) window.Sound.play('contraindication');
      // penalize vitals slightly
      setVitals((v) => ({
        ...v,
        sys: Math.max(0, v.sys - 6),
        spo2: Math.max(0, v.spo2 - 2),
        hr: Math.min(220, v.hr + 4)
      }));
      return;
    }

    setTaken((s) => new Set(s).add(actionId));
    setLog((l) => [...l, {
      t: elapsedSec, tag,
      msg: labelOf(actionId, label),
      kind: crit ? "good" : "neutral"
    }]);

    // apply effect
    applyEffect(actionId, scenario);

    // Sound feedback
    if (window.Sound) {
      const id = actionId;
      if (id.startsWith("tq_") || id === "junctional_tq") window.Sound.play('tourniquet');
      else if (id === "txa" || id === "txa_tbi" || id === "ketamine" || id === "ceftriaxone" || id === "calcium" || id === "blood_products" || id === "blood_pressure_18ga" || id === "blood_pressure_16ga" || id === "epinephrine_im" || id === "sodium_bicarb" || id === "hts_3pct" || id === "hts_234" || id === "norepinephrine" || id === "atropine") window.Sound.play('injection');
      else if (id.startsWith("evac_")) window.Sound.play('radioChirp');
      else if (id === "needle_decomp_r" || id === "needle_decomp_l" || id === "airway_cric" || id === "cric" || id === "finger_thoracostomy" || id === "chest_tube") window.Sound.play('injection');
      else if (crit) window.Sound.play('confirm');
      else window.Sound.play('pageClick');
    }

    if (crit) {
      const onTime = elapsedSec <= crit.byMin * 60;
      if (onTime) flash(`✓ ${crit.label}`, "good");
    }
  }, [taken, scenario, elapsedSec, finished]);

  /* ---------- TQ-SPECIFIC ---------- */
  const onTqApply = useCallback((tqKey, type, site) => {
    // Update TQ state
    setTqStates((s) => ({
      ...s,
      [tqKey]: {
        type, site,
        appliedAt: s[tqKey]?.appliedAt ?? elapsedSec
      }
    }));
    // Trigger action if not yet taken (gives survival credit)
    if (!taken.has(tqKey)) {
      performAction(tqKey);
    } else {
      // Just log the update
      setLog((l) => [...l, {
        t: elapsedSec, tag: "M",
        msg: `${tqKey.replace("tq_","TQ ").replace("_"," ").toUpperCase()} updated — ${type} @ ${site}`,
        kind: "good"
      }]);
      if (window.Sound) window.Sound.play('pageClick');
    }
  }, [taken, elapsedSec, performAction]);

  const onTqConvert = useCallback((tqKey) => {
    setTqStates((s) => ({
      ...s,
      [tqKey]: { ...s[tqKey], converted: true, convertedAt: elapsedSec }
    }));
    if (!taken.has("tq_conversion")) {
      performAction("tq_conversion");
    }
  }, [taken, elapsedSec, performAction]);

  /* ---------- REASSESS ---------- */
  const onReassess = useCallback(() => {
    setReassessCount(c => c + 1);
    performAction("reassess");
  }, [performAction]);

  function tagFromCatalog(id) {
    const cat = window.ACTION_CATALOG;
    for (const k of ["M", "A", "R", "C", "H"]) {
      if (cat[k].some(a => a.id === id)) return k;
    }
    if (cat.MEDS.some(a => a.id === id)) return "MED";
    if (cat.DRIP.some(a => a.id === id)) return "C";
    if (cat.BLOOD.some(a => a.id === id)) return "C";
    if (cat.DECISIONS && cat.DECISIONS.some(a => a.id === id)) return "SYS";
    return "MED";
  }
  function labelOf(id, fallback) {
    const cat = window.ACTION_CATALOG;
    for (const k of ["M", "A", "R", "C", "H", "MEDS", "DRIP", "BLOOD", "DECISIONS"]) {
      const f = cat[k] && cat[k].find(a => a.id === id);
      if (f) return f.label;
    }
    return fallback || id;
  }

  function applyEffect(actionId, scn) {
    // Most action effects emerge organically from controlFraction. But some
    // are immediate and concrete — apply those here.
    setVitals((v) => {
      let nv = { ...v };
      switch (actionId) {
        case "tq_left_leg":
        case "tq_right_leg":
        case "tq_left_arm":
        case "tq_right_arm":
        case "junctional_tq":
        case "wound_packed":
        case "combat_gauze":
        case "pressure_dressing":
        case "direct_pressure":
          // immediate hemorrhage attenuation
          nv.sys = Math.min(180, nv.sys + 12);
          nv.dia = Math.min(110, nv.dia + 6);
          nv.hr  = Math.max(50, nv.hr - 8);
          break;
        case "needle_decomp_r":
        case "needle_decomp_l":
        case "finger_thoracostomy":
        case "chest_tube":
          nv.spo2 = Math.min(100, nv.spo2 + 6);
          nv.rr   = Math.max(8, nv.rr - 4);
          nv.hr   = Math.max(60, nv.hr - 10);
          nv.sys  = Math.min(180, nv.sys + 14);
          break;
        case "chest_seal_r":
        case "chest_seal_l":
        case "burp_seal":
          nv.spo2 = Math.min(100, nv.spo2 + 2);
          break;
        case "o2_administered":
        case "bvm_ventilation":
          nv.spo2 = Math.min(100, nv.spo2 + 4);
          break;
        case "airway_cric":
        case "cric":
        case "intubation":
        case "sga_igel":
          nv.spo2 = Math.min(100, nv.spo2 + 5);
          nv.rr = nv.rr < 10 ? 14 : nv.rr;
          break;
        case "blood_products":
        case "prbc":
        case "ffp":
          nv.sys = Math.min(180, nv.sys + 16);
          nv.dia = Math.min(110, nv.dia + 8);
          nv.hr  = Math.max(60, nv.hr - 10);
          break;
        case "blood_pressure_18ga":
          // Pressure bag through 18 GA — flow ~150 mL/min. Slower correction,
          // but the patient still climbs out of shock over a couple of minutes.
          nv.sys  = Math.min(180, nv.sys  + 12);
          nv.dia  = Math.min(110, nv.dia  + 6);
          nv.hr   = Math.max(60,  nv.hr   - 8);
          nv.spo2 = Math.min(100, nv.spo2 + 1);
          break;
        case "blood_pressure_16ga":
          // Pressure bag through 16 GA — ~2× the flow of 18 GA (Poiseuille,
          // r⁴). Faster, more dramatic resuscitation but ⇧ risk if patient is
          // not also being warmed and calcium-corrected.
          nv.sys  = Math.min(180, nv.sys  + 26);
          nv.dia  = Math.min(115, nv.dia  + 14);
          nv.hr   = Math.max(58,  nv.hr   - 18);
          nv.spo2 = Math.min(100, nv.spo2 + 3);
          break;
        case "fluids_ns_crush":
        case "fluids_ns_sepsis":
          nv.sys = Math.min(180, nv.sys + 6);
          break;
        case "hts_3pct":
        case "hts_234":
          nv.sys = Math.min(180, nv.sys + 4);
          break;
        case "calcium":
        case "calcium_chloride":
          // cardioprotective — vitals don't shift, but action is logged
          break;
        case "ketamine":
        case "esketamine_in":
          nv.pain = Math.max(0, nv.pain - 5);
          break;
        case "suzetrigine":
        case "acetaminophen":
          nv.pain = Math.max(0, nv.pain - 1);
          break;
        case "atropine":
          if (nv.hr < 60) nv.hr = Math.min(110, nv.hr + 25);
          break;
        case "epinephrine_im":
        case "epinephrine_iv":
        case "epi_infusion":
          nv.sys = Math.min(180, nv.sys + 12);
          nv.hr = Math.min(160, nv.hr + 14);
          break;
        case "norepinephrine":
        case "norepi_infusion":
        case "phenylephrine":
        case "dopamine":
          nv.sys = Math.min(170, nv.sys + 10);
          nv.dia = Math.min(105, nv.dia + 6);
          break;
        case "reassess":
          // small reassurance — no vital change, but log
          break;
        case "elevate_extremity":
          nv.sys = Math.min(180, nv.sys + 2);
          break;
      }
      return nv;
    });
  }

  function flash(msg, kind = "info") {
    setToast({ msg, kind });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 4200);
  }

  /* ---------- DERIVED ---------- */
  const survival = useMemo(() => {
    const ctrl = controlFraction(scenario, taken);
    const base = scenario.baseSurvival;
    const expected = scenario.expectedSurvival;
    let pct = base + (expected - base) * ctrl;
    // contraindication penalty
    contraTaken.forEach(() => { pct -= 8; });
    // reassessment bonus (max +6)
    pct += Math.min(6, reassessCount * 2);
    // EVAC priority — correct calls add small bonus
    if (evacPriority) pct += 2;
    // time penalty if hemorrhage uncontrolled
    if (ctrl < 0.4 && elapsedSec > 240) pct -= Math.min(30, (elapsedSec - 240) * 0.05);
    if (arrested) pct = 0;
    return Math.max(0, Math.min(99, Math.round(pct)));
  }, [scenario, taken, contraTaken, elapsedSec, arrested, reassessCount, evacPriority]);

  const criticalDone   = scenario.criticalActions.filter(a => taken.has(a.id));
  const criticalMissed = scenario.criticalActions.filter(a => !taken.has(a.id));

  /* ---- AVPU user override ---- */
  const setAVPU = useCallback((letter) => {
    if (!["A", "V", "P", "U"].includes(letter)) return;
    setAvpuUserOverride(letter);
    setVitals((v) => ({ ...v, avpu: letter, gcs: deriveGCS(letter, scenario, v) }));
    setLog((l) => [...l, { t: elapsedSec, tag: "ASSESS", msg: `AVPU manually set → ${letter}`, kind: "neutral" }]);
  }, [elapsedSec, scenario]);

  /* ---------- CONTROL ---------- */
  const start  = () => {
    setPaused(false);
    setMissionRunning(true);
    startedRef.current = true;
  };
  const pause  = () => {
    setPaused(true);
    setMissionRunning(false);
  };
  const reset  = () => {
    setVitals({ ...scenario.initialVitals });
    setTaken(new Set());
    setContraTaken(new Set());
    setLog([{ t: 0, tag: "SYS", msg: `Scenario reset — ${scenario.name} / ${scenario.last4}`, kind: "sys" }]);
    setElapsedSec(0);
    setPaused(true);
    setFinished(false);
    setOutcome(null);
    setArrested(false);
    setAvpuUserOverride(null);
    setTqStates({});
    setEvacPriority(null);
    setReassessCount(0);
    startedRef.current = false;
    // Wipe this patient's snapshot so the fresh state survives if user switches and returns.
    delete patientStatesRef.current[scenario.id];
    // Mission clock keeps its accumulated time; restart on next "start".
  };
  const resetMission = () => {
    patientStatesRef.current = {};
    setMissionElapsedSec(0);
    setMissionRunning(false);
    reset();
  };
  const finalize = (mode) => {
    setFinished(true);
    setPaused(true);
    setOutcome(mode || (survival >= 70 ? "alive" : survival >= 35 ? "guarded" : "dead"));
  };
  const evac = () => finalize();
  const next = () => setScenarioIdx((scenarioIdx + 1) % window.SCENARIOS.length);
  const prev = () => setScenarioIdx((scenarioIdx - 1 + window.SCENARIOS.length) % window.SCENARIOS.length);
  const pick = (i) => setScenarioIdx(i);

  /* ---------- HINT (next critical action) ---------- */
  const nextHint = useMemo(() => {
    const remaining = scenario.criticalActions
      .filter(a => !taken.has(a.id))
      .sort((a, b) => a.byMin - b.byMin);
    return remaining[0]?.id;
  }, [scenario, taken]);

  return {
    state: {
      scenario, vitals, taken, contraTaken, log, elapsedSec, paused, finished,
      outcome, survival, criticalDone, criticalMissed, toast, arrested, nextHint,
      tqStates, evacPriority, reassessCount,
      missionElapsedSec, missionRunning
    },
    dispatch: {
      performAction, start, pause, reset, resetMission, evac, next, prev, pick, setToast,
      onTqApply, onTqConvert, onReassess, setAVPU,
      setEvacPriority: (id) => { setEvacPriority(id); performAction(id); }
    }
  };
}

window.useScenarioEngine = useScenarioEngine;
