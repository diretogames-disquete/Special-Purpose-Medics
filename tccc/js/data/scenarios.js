/* ============================================================
   SCENARIOS — 6 trauma patients from the SOCM Trauma Study Guide
   Each scenario defines:
     • patient + mechanism
     • injuries on the body diagram
     • acute findings pre-flagged
     • initialVitals
     • untreatedTrajectory (per-minute drift if not intervened)
     • criticalActions  — the right answers, with MARCH category + ideal-by minute
     • contraindications — things that should NOT be done
     • effects(state, actionId) — how the patient responds to each action
   ============================================================ */

window.SCENARIOS = [
  /* ============== 1. MASSIVE HEMORRHAGE / GSW ============== */
  {
    id: "rodrigues",
    name: "Rodrigues",
    last4: "7004",
    age: 24, sex: "M",
    callsign: "BRAVO-1",
    mechanism: "Dismounted patrol came under sniper fire in an urban area. AK round from an elevated position struck a team member in the right anterior thigh — through-and-through, transecting the femoral artery; femur spared. Patient walked ~12 m before collapsing. A teammate applied an improvised tourniquet but it slipped off and was removed. By medic arrival, roughly 700 mL of blood was visible on the patient's uniform and the ground. Patient combative but still oriented — compensating shock, ~4 min post-injury.",
    diagnosis: "Class III hemorrhagic shock — femoral artery injury",
    moi: {
      event: "Sniper fire · dismounted patrol · urban area",
      forces: "High-velocity GSW (AK round) · through-and-through R anterior thigh · femoral artery transected · femur intact",
      range: "Elevated firing position",
      protection: "No extremity coverage",
      timeline: "~4 min from injury to medic contact · ~700 mL est. blood loss (Class III)",
      findings: "Pulsatile arterial bleed anterior R thigh · weak dorsalis pedis pulse · cap refill 4 s · cool, diaphoretic skin proximally · combative but oriented ×3 · improvised TQ applied then slipped — none in place on medic arrival"
    },
    initialVitals: { hr: 132, sys: 88, dia: 58, rr: 26, spo2: 96, pain: 8, avpu: "V", gcs: 14, temp: 36.4 },
    injuries: [
      { type: "entry", view: "front", x: 0.42, y: 0.62, label: "Entry R thigh · femoral" },
      { type: "exit",  view: "back",  x: 0.58, y: 0.62, label: "Exit posterior R thigh · avulsion" }
    ],
    acuteFindings: [],
    untreatedTrajectory: {
      // per-minute drift if hemorrhage uncontrolled
      hr: +2, sys: -3, dia: -2, rr: +0.4, spo2: -0.2, pain: 0,
      avpuCascade: ["V", "P", "U"],
      avpuMinutes: [4, 8]
    },
    criticalActions: [
      { id: "tq_right_leg",      category: "M", label: "Tourniquet R LEG (high & tight)", byMin: 1, weight: 30 },
      { id: "txa",               category: "M", label: "TXA 2g slow IV/IO push",          byMin: 6, weight: 12 },
      { id: "iv_io",             category: "C", label: "IV or IO access",                 byMin: 4, weight: 8 },
      { id: "blood_products",    category: "C", label: "Whole blood / LTOWB",             byMin: 8, weight: 14 },
      { id: "ceftriaxone",       category: "C", label: "Ceftriaxone 2g (NS)",             byMin: 15,weight: 6 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK / hypothermia prevention",    byMin: 10,weight: 8 },
      { id: "ketamine",          category: "A", label: "Ketamine analgesia",              byMin: 12,weight: 5 },
      { id: "pressure_dressing", category: "M", label: "Pressure dressing over packing",  byMin: 3, weight: 6 }
    ],
    contraindications: [
      { actionId: "fluids_lr_aggressive", message: "Aggressive crystalloid worsens dilutional coagulopathy — use whole blood; if none, permissive hypotension (SBP 80–90)." },
      { actionId: "fentanyl",   message: "Avoid fentanyl in shock — respiratory depression. Ketamine maintains hemodynamics." },
      { actionId: "nsaid",      message: "Meloxicam is contraindicated in hemorrhagic shock." }
    ],
    expectedSurvival: 88, // if textbook
    baseSurvival: 18      // if nothing done
  },

  /* ============== 2. TENSION PNEUMOTHORAX ============== */
  {
    id: "hassan",
    name: "Hassan",
    last4: "3217",
    age: 31, sex: "M",
    callsign: "CHARLIE-2",
    mechanism: "Unit took indirect fire from a mortar. An airburst drove a fragment into the soldier's R upper chest, just above the top edge of his plate carrier — fragment retained, no exit wound. Initially walking and talking. Around minute 4 he became tachypneic and anxious, then the wound began sucking air on inspiration. Trachea still midline but starting to shift L. Right-sided breath sounds diminished, hyperresonant to percussion, with early JVD and paradoxical chest wall motion. SpO₂ 88 % on room air. High risk of tension pneumothorax if the chest seal is applied incorrectly.",
    diagnosis: "Open + tension pneumothorax (R)",
    moi: {
      event: "Indirect fire · mortar airburst",
      forces: "Penetrating · single fragment · retained (no exit wound)",
      range: "Airburst overhead",
      protection: "Plate carrier on · frag entered just above top edge of carrier",
      timeline: "Walking/talking initially · ~4 min later progressed to tachypnea, anxiety, sucking chest wound",
      findings: "Sucking chest wound R upper chest · ↓ breath sounds R · hyperresonant to percussion R · early JVD · trachea midline, trending L · paradoxical chest wall motion · SpO₂ 88 % on room air"
    },
    initialVitals: { hr: 124, sys: 96, dia: 70, rr: 32, spo2: 88, pain: 7, avpu: "A", gcs: 15, temp: 36.7 },
    injuries: [
      { type: "frag", view: "front", x: 0.58, y: 0.30, label: "Frag entry R chest · 2nd ICS" }
    ],
    acuteFindings: ["sucking_chest"],
    untreatedTrajectory: {
      hr: +1.5, sys: -2, dia: -1.5, rr: +0.5, spo2: -1.0, pain: 0,
      avpuCascade: ["V", "P", "U"],
      avpuMinutes: [3, 7]
    },
    criticalActions: [
      { id: "chest_seal_r",      category: "R", label: "Vented chest seal R",              byMin: 1, weight: 22 },
      { id: "needle_decomp_r",   category: "R", label: "NCD R (14ga, 2nd ICS MCL)",        byMin: 3, weight: 28 },
      { id: "o2_administered",   category: "R", label: "Supplemental O₂",                  byMin: 4, weight: 6 },
      { id: "iv_io",             category: "C", label: "IV/IO access",                     byMin: 5, weight: 6 },
      { id: "txa",               category: "M", label: "TXA 2g",                           byMin: 8, weight: 8 },
      { id: "ceftriaxone",       category: "C", label: "Ceftriaxone 2g (NS)",              byMin: 12,weight: 6 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK / prevent hypothermia",       byMin: 10,weight: 6 },
      { id: "ketamine",          category: "A", label: "Ketamine analgesia",               byMin: 14,weight: 4 }
    ],
    contraindications: [
      { actionId: "fentanyl",  message: "Fentanyl will mask declining respiratory effort and accelerate hypoxia. Use ketamine." }
    ],
    expectedSurvival: 86,
    baseSurvival: 10
  },

  /* ============== 3. BURN + INHALATION ============== */
  {
    id: "becker",
    name: "Becker",
    last4: "9123",
    age: 28, sex: "M",
    callsign: "DELTA-3",
    mechanism: "VBIED struck the lead truck. The blast itself was survivable, but secondary fire from fuel and munitions ignited the interior. Driver was trapped in the cab ~4 min before his crew pulled him out. Nomex flight suit on, but face, chest, and both forearms were directly flame-exposed — sleeves rolled up and gloves lost. Burns cover roughly a third of the body, mixed partial- and full-thickness. On initial assessment: nasal hair singed, coughing up black sputum, voice hoarse. Still phonating, but stridor is imminent — airway edema window closing fast. L forearm has circumferential partial-thickness burns, anterior chest is full-thickness, and pain is out of proportion to the surface injury, suggesting deeper tissue damage. The clock is on for airway management.",
    diagnosis: "Major burn + inhalation injury (~33 % TBSA)",
    moi: {
      event: "VBIED · secondary fuel/munitions fire · cab entrapment",
      forces: "Thermal (direct flame) · inhalation injury (smoke, closed cabin)",
      range: "~4 min trapped in burning cab before extrication",
      protection: "Nomex flight suit · sleeves rolled up · gloves lost · face/chest/forearms exposed",
      timeline: "Stridor risk window closing fast · airway management is time-critical",
      findings: "Singed nasal hair · carbonaceous (black) sputum · hoarse voice, still phonating · circumferential partial-thickness L forearm · full-thickness anterior chest · ~⅓ TBSA mixed partial/full · pain disproportionate to surface (deep tissue injury)"
    },
    initialVitals: { hr: 118, sys: 102, dia: 68, rr: 28, spo2: 92, pain: 9, avpu: "A", gcs: 14, temp: 36.0 },
    injuries: [
      { type: "burn_partial", view: "front", x: 0.50, y: 0.18, label: "Face · partial-thickness" },
      { type: "burn_full",    view: "front", x: 0.50, y: 0.32, label: "Anterior chest · full-thickness" },
      { type: "burn_partial", view: "front", x: 0.30, y: 0.35, label: "R arm · partial-thickness" },
      { type: "burn_partial", view: "front", x: 0.70, y: 0.35, label: "L arm · partial-thickness" }
    ],
    acuteFindings: [],
    untreatedTrajectory: {
      hr: +1, sys: -1.5, dia: -1, rr: +0.6, spo2: -0.7, pain: 0,
      avpuCascade: ["V", "P", "U"],
      avpuMinutes: [6, 14] // airway closes from edema
    },
    criticalActions: [
      { id: "cric",              category: "A", label: "Early surgical cric (airway edema)", byMin: 8,  weight: 24 },
      { id: "o2_administered",   category: "R", label: "High-flow O₂",                     byMin: 1,  weight: 8 },
      { id: "iv_io",             category: "C", label: "IV/IO access",                     byMin: 3,  weight: 6 },
      { id: "fluids_lr_rule10",  category: "C", label: "LR per Rule of 10s (320 mL/hr)",   byMin: 6,  weight: 16 },
      { id: "ketamine",          category: "A", label: "Ketamine analgesia (primary)",     byMin: 5,  weight: 10 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK — burns lose heat fast",      byMin: 8,  weight: 10 },
      { id: "ceftriaxone",       category: "C", label: "Ceftriaxone if contaminated",      byMin: 14, weight: 4 },
      { id: "dry_dressing",      category: "M", label: "Dry sterile dressing over burns",  byMin: 4,  weight: 6 }
    ],
    contraindications: [
      { actionId: "fentanyl",         message: "Fentanyl + inhalation injury = airway disaster. Ketamine only." },
      { actionId: "nsaid",            message: "Meloxicam contraindicated in major burn (renal risk)." },
      { actionId: "fluids_ns_only",   message: "LR is preferred in burns. NS is acceptable only if LR unavailable." }
    ],
    expectedSurvival: 78,
    baseSurvival: 12
  },

  /* ============== 4. CRUSH SYNDROME ============== */
  {
    id: "lin",
    name: "Lin",
    last4: "2401",
    age: 26, sex: "F",
    callsign: "ECHO-4",
    mechanism: "Building collapsed during indirect fire, pinning the patient's R leg under a concrete section from groin to ankle for ~95 min. Patient stayed alert the whole time, sipping water handed in by the team. Just extricated 3 min ago — and that's when the real danger starts. Releasing the pressure sends potassium, myoglobin, and lactate rushing into circulation and can trigger cardiac arrest from hyperkalemia within the next 5–15 min. Before extrication, urine in the collection bag looked like dark tea, confirming muscle breakdown. R thigh is tense and purplish, weak pulse at the ankle, no obvious open fracture. Patient currently looks deceptively well — alert, talking, even smiling. That's the trap.",
    diagnosis: "Crush syndrome (post-extrication) — hyperkalemia / rhabdomyolysis",
    moi: {
      event: "Building collapse · prolonged entrapment during indirect fire",
      forces: "Compressive crush · sustained ischemia → reperfusion injury on release",
      range: "~95 min pinned · R lower extremity from groin to ankle",
      protection: "N/A · soft-tissue compression",
      timeline: "Extricated 3 min ago · hyperkalemic arrest window 5–15 min post-release",
      findings: "Alert, talking, even smiling — looks deceptively well · tea-colored urine in collection bag (myoglobin) · R thigh tense and purplish · weak pulse at ankle · no obvious open fracture · ECG if monitored: peaked T waves emerging"
    },
    initialVitals: { hr: 92, sys: 104, dia: 70, rr: 20, spo2: 97, pain: 6, avpu: "A", gcs: 15, temp: 35.8 },
    injuries: [
      { type: "crush", view: "front", x: 0.45, y: 0.75, label: "R lower extremity · crush" }
    ],
    acuteFindings: ["crush"],
    untreatedTrajectory: {
      // "smiling death" — looks ok until hyperK arrests
      hr: -0.3, sys: -1.5, dia: -1, rr: +0.2, spo2: -0.1, pain: 0,
      avpuCascade: ["V", "P", "U"],
      avpuMinutes: [6, 9],
      hyperkalemiaArrestAt: 11 // sudden VF if untreated
    },
    criticalActions: [
      { id: "iv_io",             category: "C", label: "IV/IO access (before extrication ideally)", byMin: 2, weight: 14 },
      { id: "fluids_ns_crush",   category: "C", label: "NS bolus (NOT LR — K+ load)",       byMin: 3,  weight: 22 },
      { id: "calcium",           category: "C", label: "Calcium gluconate 1g (cardioprotect)", byMin: 5, weight: 18 },
      { id: "sodium_bicarb",     category: "C", label: "NaHCO₃ 50 mEq (shifts K⁺)",         byMin: 7,  weight: 10 },
      { id: "albuterol_neb",     category: "R", label: "Albuterol neb 10–20mg (shifts K⁺)", byMin: 9,  weight: 6 },
      { id: "ketamine",          category: "A", label: "Ketamine analgesia",                byMin: 8,  weight: 6 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK",                              byMin: 10, weight: 6 },
      { id: "monitor_ekg",       category: "C", label: "Cardiac monitor (peaked T → VF)",   byMin: 4,  weight: 6 }
    ],
    contraindications: [
      { actionId: "fluids_lr_rule10",        message: "LR contains ~4 mEq/L K⁺ — DO NOT use in crush syndrome. Switch to NS." },
      { actionId: "fluids_lr_aggressive",    message: "LR contains K⁺ — contraindicated in hyperkalemic crush. Switch to NS." },
      { actionId: "fentanyl",                message: "Fentanyl will mask deterioration; ketamine preferred." }
    ],
    expectedSurvival: 74,
    baseSurvival: 8
  },

  /* ============== 5. TBI + BLAST ============== */
  {
    id: "tate",
    name: "Tate",
    last4: "8809",
    age: 22, sex: "M",
    callsign: "FOXTROT-5",
    mechanism: "Dismounted soldier took an IED blast ~3 m to his R. Overpressure hit the side of his head and the blast threw him into a dirt berm, cracking his helmet and shattering his eye-pro. Unconscious for ~30 s, then went through a combative phase, now obtunded. R ear is oozing dark blood — sign of a basilar skull fracture. Pupils uneven: R is large and sluggish, L is smaller and reactive. BP is high, HR is slow, respirations are irregular — Cushing's triad, textbook for rising intracranial pressure. ~6 min post-blast and the clock is ticking toward herniation.",
    diagnosis: "Severe blast TBI · ↑ ICP · early Cushing's triad",
    moi: {
      event: "Dismounted IED · ~3 m to patient's R",
      forces: "Primary blast overpressure (lateral head) + tertiary impact into berm · closed head",
      range: "~3 m standoff",
      protection: "Helmet cracked · eye-pro shattered",
      timeline: "~30 s LOC → combative phase → now obtunded · ~6 min post-blast · herniation window closing",
      findings: "Otorrhea R ear (dark blood, basilar skull fx) · R pupil large & sluggish, L pupil small & reactive · BP high, HR slow, respirations irregular — Cushing's triad"
    },
    initialVitals: { hr: 58, sys: 168, dia: 92, rr: 9, spo2: 91, pain: 0, avpu: "P", gcs: 7, temp: 36.2 },
    injuries: [
      { type: "lac", view: "front", x: 0.55, y: 0.08, label: "R scalp lac · helmet cracked" }
    ],
    acuteFindings: ["penetrating_head"],
    untreatedTrajectory: {
      // Cushing's triad worsening; no compensation possible
      hr: -0.4, sys: +1.2, dia: +0.5, rr: -0.3, spo2: -0.5, pain: 0,
      avpuCascade: ["U"],
      avpuMinutes: [2],
      herniationAt: 9 // if no HTS/airway, irreversible
    },
    criticalActions: [
      { id: "airway_cric",       category: "A", label: "Definitive airway (cric — GCS ≤8)", byMin: 3, weight: 22 },
      { id: "o2_administered",   category: "R", label: "O₂ to SpO₂ ≥92% (2026 target)",      byMin: 1, weight: 10 },
      { id: "head_elevation",    category: "C", label: "Head elevation 30° + midline",       byMin: 5, weight: 6 },
      { id: "hts_3pct",          category: "C", label: "HTS 3% 250 mL (suspected ICP)",      byMin: 6, weight: 18 },
      { id: "txa_tbi",           category: "M", label: "TXA 2g (standalone TBI ind. 2026)",  byMin: 4, weight: 12 },
      { id: "maintain_map",      category: "C", label: "Maintain MAP ≥80 / SBP ≥100",        byMin: 5, weight: 10 },
      { id: "iv_io",             category: "C", label: "IV/IO access",                       byMin: 2, weight: 6 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK",                               byMin: 8, weight: 6 }
    ],
    contraindications: [
      { actionId: "permissive_hypotension", message: "Permissive hypotension is CONTRAINDICATED in TBI. Maintain SBP ≥100. A single episode of SBP <90 doubles mortality." },
      { actionId: "prophylactic_hyperventilate", message: "Do NOT prophylactically hyperventilate. Only for active herniation signs, EtCO₂ 32–38." },
      { actionId: "fentanyl",  message: "Sedation choices matter — ketamine is safe in TBI; opioids worsen hypotension/respiratory drive." }
    ],
    expectedSurvival: 62,
    baseSurvival: 4
  },

  /* ============== 6. EVISCERATION + PELVIC ============== */
  {
    id: "morales",
    name: "Morales",
    last4: "6620",
    age: 29, sex: "M",
    callsign: "GOLF-6",
    mechanism: "Soldier stepped on an IED. Blast drove upward through his lower body. R leg nearly severed below the knee, though main vessels above the knee remained intact. Abdominal wall tore open and small bowel pushed out through a midline defect. Both hip bones felt unstable on palpation — pelvic ring fracture. IOTV with plates protected chest and back. On scene a teammate mistakenly placed a TQ on the L leg, which wasn't injured; the R leg still needs control. HR 142, SBP 78. Pale, diaphoretic, alert but confused. Massive transfusion candidate — bleeding from multiple sites at once: external (R leg), intraperitoneal (abdomen), and retroperitoneal (pelvis).",
    diagnosis: "Junctional / pelvic hemorrhage · evisceration · traumatic amputation",
    moi: {
      event: "Dismounted IED · stepped on device",
      forces: "Blast · upward vector through lower body",
      range: "Direct contact (under foot)",
      protection: "IOTV w/ plates protected chest & back · no pelvic protector",
      timeline: "Massive transfusion candidate · misplaced L-leg TQ on scene · R leg still needs control",
      findings: "R leg near-amputation below knee, vessels above knee intact · midline evisceration, small bowel exposed · pelvic instability on palpation (do not retest) · HR 142 · SBP 78 · pale, sweaty · alert but confused · bleeding external + intraperitoneal + retroperitoneal"
    },
    initialVitals: { hr: 142, sys: 78, dia: 50, rr: 30, spo2: 93, pain: 9, avpu: "V", gcs: 13, temp: 35.6 },
    injuries: [
      { type: "evisceration", view: "front", x: 0.50, y: 0.45, label: "Midline evisceration · bowel exposed" },
      { type: "amputation",   view: "front", x: 0.42, y: 0.82, label: "R BK near-amputation" }
    ],
    acuteFindings: ["evisceration", "amputation"],
    untreatedTrajectory: {
      hr: +2, sys: -3.5, dia: -2, rr: +0.5, spo2: -0.3, pain: 0,
      avpuCascade: ["P", "U"],
      avpuMinutes: [3, 7]
    },
    criticalActions: [
      { id: "tq_right_leg",      category: "M", label: "Tourniquet R LEG",                 byMin: 1,  weight: 22 },
      { id: "pelvic_binder",     category: "C", label: "Pelvic binder at greater trochanters", byMin: 4, weight: 18 },
      { id: "moist_cover_evisc", category: "M", label: "Moist sterile cover + occlusive (do NOT replace)", byMin: 5, weight: 14 },
      { id: "txa",               category: "M", label: "TXA 2g",                           byMin: 6,  weight: 10 },
      { id: "iv_io",             category: "C", label: "IV/IO access",                     byMin: 3,  weight: 6 },
      { id: "blood_products",    category: "C", label: "Whole blood / LTOWB",              byMin: 8,  weight: 12 },
      { id: "ceftriaxone",       category: "C", label: "Ceftriaxone 2g (NS) — peritoneal contamination", byMin: 10, weight: 8 },
      { id: "ketamine",          category: "A", label: "Ketamine analgesia",               byMin: 10, weight: 4 },
      { id: "hypothermia_kit",   category: "H", label: "HPMK",                             byMin: 12, weight: 6 }
    ],
    contraindications: [
      { actionId: "replace_eviscerated",  message: "Do NOT replace eviscerated bowel — risk of contamination, torsion, strangulation. Cover, protect, evacuate." },
      { actionId: "rock_pelvis",          message: "Do NOT 'rock' or 'open the book' to test pelvis — worsens hemorrhage." },
      { actionId: "fluids_lr_aggressive", message: "Aggressive crystalloid worsens coagulopathy. Whole blood preferred." },
      { actionId: "nsaid",                message: "NSAIDs contraindicated in hemorrhagic shock." }
    ],
    expectedSurvival: 64,
    baseSurvival: 5
  }
];

/* ============================================================
   ACTION CATALOG — what's available in TX/MEDS/DRIP/BLOOD/REF.
   Each action knows its MARCH category and a human label.
   Actions not listed in the current scenario's criticalActions are
   either neutral (no effect) or contraindicated (scenario-defined).
   ============================================================ */
window.ACTION_CATALOG = {
  /* ---------- TX (MARCH grouped) ---------- */
  M: [
    { id: "tq_left_leg",        label: "TQ L Leg" },
    { id: "tq_right_leg",       label: "TQ R Leg" },
    { id: "tq_left_arm",        label: "TQ L Arm" },
    { id: "tq_right_arm",       label: "TQ R Arm" },
    { id: "wound_packed",       label: "Wound Packed" },
    { id: "combat_gauze",       label: "Combat Gauze" },
    { id: "pressure_dressing",  label: "Pressure Dressing" },
    { id: "junctional_tq",      label: "Junctional TQ" },
    { id: "direct_pressure",    label: "Direct Pressure" },
    { id: "moist_cover_evisc",  label: "Moist Cover (Evisc)" },
    { id: "dry_dressing",       label: "Dry Dressing (Burn)" },
    { id: "elevate_extremity",  label: "Elevate Extremity" }
  ],
  A: [
    { id: "chin_lift",          label: "Chin-Lift / Jaw-Thrust" },
    { id: "recovery_position",  label: "Recovery Position" },
    { id: "suction",            label: "Suction Airway" },
    { id: "airway_cric",        label: "Surgical Cric" },
    { id: "cric",               label: "Surgical Cric" },
    { id: "npa_tacevac",        label: "NPA (TACEVAC)" },
    { id: "sga_igel",           label: "SGA / iGel (TACEVAC)" },
    { id: "intubation",         label: "Endotracheal Intubation" },
    { id: "mils_cspine",        label: "MILS (C-spine)" }
  ],
  R: [
    { id: "chest_seal_r",       label: "Chest Seal R" },
    { id: "chest_seal_l",       label: "Chest Seal L" },
    { id: "burp_seal",          label: "Burp Chest Seal" },
    { id: "needle_decomp_r",    label: "Needle Decomp R" },
    { id: "needle_decomp_l",    label: "Needle Decomp L" },
    { id: "finger_thoracostomy",label: "Finger Thoracostomy" },
    { id: "chest_tube",         label: "Chest Tube" },
    { id: "o2_administered",    label: "O₂ Administered" },
    { id: "bvm_ventilation",    label: "BVM Ventilation" },
    { id: "albuterol_neb",      label: "Albuterol Neb" }
  ],
  C: [
    { id: "iv_io",              label: "IV / IO" },
    { id: "pelvic_binder",      label: "Pelvic Binder" },
    { id: "splint_extremity",   label: "Splint Extremity" },
    { id: "head_elevation",     label: "Head Elev. 30°" },
    { id: "monitor_ekg",        label: "Cardiac Monitor" },
    { id: "maintain_map",       label: "Maintain MAP" },
    { id: "distal_pulse_check", label: "Distal Pulse Check" },
    { id: "cap_refill_check",   label: "Cap Refill Check" },
    { id: "foley_catheter",     label: "Foley Catheter" },
    { id: "tq_conversion",      label: "TQ Conversion (PFC)" }
  ],
  H: [
    { id: "hypothermia_kit",    label: "HPMK Applied" },
    { id: "c_spine",            label: "C-Spine Immobilized" },
    { id: "ready_heat",         label: "Ready-Heat Blanket" },
    { id: "foil_blanket",       label: "Foil Blanket" },
    { id: "warm_iv_fluids",     label: "Warm IV Fluids" },
    { id: "head_wrap",          label: "Head Wound Wrap" }
  ],
  /* ---------- MEDS ---------- */
  MEDS: [
    { id: "txa",          label: "TXA",                dose: "2g slow IV/IO push",    category: "M" },
    { id: "txa_tbi",      label: "TXA (TBI standalone)", dose: "2g slow IV/IO",        category: "M" },
    { id: "ceftriaxone",  label: "Ceftriaxone (IV)",   dose: "2g IV/IO over 3–5 min (NS only)", category: "C" },
    { id: "ceftriaxone_im", label: "Ceftriaxone (IM)", dose: "2g IM in 4.2 mL lidocaine/NS", category: "C" },
    { id: "cefadroxil",   label: "Cefadroxil PO",      dose: "1g PO (oral abx)",      category: "C" },
    { id: "cephalexin",   label: "Cephalexin PO",      dose: "500 mg PO (alt oral)",  category: "C" },
    { id: "metronidazole",label: "Metronidazole",      dose: "500 mg IV q8h (anaerobic)", category: "C" },
    { id: "ketamine",     label: "Ketamine",           dose: "50 IN / 100 IM / 25 IV/IO", category: "A" },
    { id: "esketamine_in",label: "Esketamine IN (2026)",dose: "14 or 28 mg IN x1",     category: "A" },
    { id: "suzetrigine",  label: "Suzetrigine (2026)", dose: "Per CWMP",              category: "A" },
    { id: "fentanyl",     label: "Fentanyl / OTFC",    dose: "Removed from 2026 initial mgmt", category: "A", risky: true },
    { id: "nsaid",        label: "Meloxicam",          dose: "15 mg PO daily (CWMP)", category: "A", risky: true },
    { id: "acetaminophen",label: "Acetaminophen",      dose: "1000–1300 mg PO q8h",   category: "A" },
    { id: "epinephrine_im", label: "Epinephrine 1:1000", dose: "0.3–0.5 mg IM thigh", category: "C" },
    { id: "epinephrine_iv", label: "Epinephrine 1:10k (refractory)", dose: "0.1–0.3 mg slow IV", category: "C", risky: true },
    { id: "calcium",      label: "Calcium Gluconate 10%", dose: "10 mL (1g) slow IV", category: "C" },
    { id: "calcium_chloride", label: "Calcium Chloride 10%", dose: "5–10 mL slow IV (central pref)", category: "C" },
    { id: "sodium_bicarb",label: "Sodium Bicarbonate", dose: "50 mEq (1 amp) IV",     category: "C" },
    { id: "insulin_d50",  label: "Insulin + D50W",     dose: "10u + 50 mL D50W IV (hyperK shift)", category: "C" },
    { id: "atropine",     label: "Atropine",           dose: "0.5–1 mg IV push",      category: "C" },
    { id: "norepinephrine",label: "Norepinephrine",    dose: "0.1–0.3 mcg/kg/min IV", category: "C" },
    { id: "phenylephrine",label: "Phenylephrine",      dose: "100–200 mcg IV bolus",  category: "C" },
    { id: "dopamine",     label: "Dopamine",           dose: "5–20 mcg/kg/min IV",    category: "C" },
    { id: "hts_3pct",     label: "Hypertonic Saline 3%", dose: "250 mL IV/IO",        category: "C" },
    { id: "hts_234",      label: "HTS 23.4%",          dose: "30 mL slow IV over 10 min", category: "C" },
    { id: "diphenhydramine", label: "Diphenhydramine", dose: "25–50 mg IV/IM (anaph adjunct)", category: "C" },
    { id: "famotidine",   label: "Famotidine",         dose: "20 mg IV/PO (anaph adjunct)", category: "C" },
    { id: "methylpred",   label: "Methylprednisolone", dose: "125 mg IV (delayed)",   category: "C" },
    { id: "dexamethasone",label: "Dexamethasone",      dose: "10 mg IV/IM (delayed)", category: "C" },
    { id: "silver_sulfa", label: "Silver Sulfadiazine 1%", dose: "Topical burn (PFC)", category: "M" },
    { id: "succinylcholine", label: "Succinylcholine RSI", dose: "1–1.5 mg/kg IV (≤48h SCI)", category: "A" },
    { id: "rocuronium",   label: "Rocuronium RSI",     dose: "1.2 mg/kg IV (>48h SCI)", category: "A" }
  ],
  /* ---------- DRIP ---------- */
  DRIP: [
    { id: "fluids_lr_aggressive", label: "LR — aggressive (1L bolus)", dose: "Aggressive crystalloid", category: "C", risky: true },
    { id: "fluids_lr_rule10",     label: "LR — Rule of 10s",           dose: "TBSA × 10 mL/hr",       category: "C" },
    { id: "fluids_ns_crush",      label: "NS — crush protocol",        dose: "1–1.5 L/hr pre-extric; 3–6 L/6 hrs after", category: "C" },
    { id: "fluids_ns_only",       label: "NS — line flush / abx",      dose: "10–20 mL flush",         category: "C" },
    { id: "fluids_ns_sepsis",     label: "NS / LR — sepsis bolus",     dose: "30 mL/kg over 3 hrs",    category: "C" },
    { id: "permissive_hypotension", label: "Permissive Hypotension (SBP 80–90)", dose: "Titrate fluids", category: "C" },
    { id: "norepi_infusion",      label: "Norepinephrine Infusion",    dose: "0.1–0.3 mcg/kg/min (titrate MAP)", category: "C" },
    { id: "epi_infusion",         label: "Epinephrine Infusion",       dose: "1–10 mcg/min (refractory anaph)", category: "C" }
  ],
  /* ---------- BLOOD ---------- */
  BLOOD: [
    { id: "blood_products", label: "Whole Blood / LTOWB",  dose: "First-line in hemorrhagic shock", category: "C" },
    { id: "blood_pressure_18ga", label: "Pressure-Infused WB · 18 GA", dose: "Pressure bag @ 300 mmHg · ~150 mL/min · slower correction", category: "C" },
    { id: "blood_pressure_16ga", label: "Pressure-Infused WB · 16 GA", dose: "Pressure bag @ 300 mmHg · ~300 mL/min · rapid correction", category: "C" },
    { id: "prbc",           label: "Packed RBCs",          dose: "If WB unavailable",     category: "C" },
    { id: "ffp",            label: "Plasma (FFP)",         dose: "1:1 with RBC",          category: "C" },
    { id: "platelets",      label: "Platelets",            dose: "1:1:1 ratio",           category: "C" },
    { id: "cryoprecipitate",label: "Cryoprecipitate",      dose: "Per damage-control protocol", category: "C" },
    { id: "fwb_warmer",     label: "Fluid Warmer Inline",  dose: "Prevent hypothermia during transfusion", category: "C" }
  ],
  /* ---------- DECISIONS / FIELD ACTIONS ---------- */
  DECISIONS: [
    { id: "reassess",             label: "Reassess Vitals & MARCH",     dose: "Every 5 min or after intervention", category: "C" },
    { id: "evac_9line",           label: "Call 9-line MEDEVAC",         dose: "Request urgent / priority extraction", category: "C" },
    { id: "evac_urgent",          label: "EVAC PRIORITY: URGENT",       dose: "Life/limb within 1 hr",  category: "C" },
    { id: "evac_priority",        label: "EVAC PRIORITY: PRIORITY",     dose: "Within 4 hrs",           category: "C" },
    { id: "evac_routine",         label: "EVAC PRIORITY: ROUTINE",      dose: "Within 24 hrs",          category: "C" },
    { id: "convert_pfc",          label: "Convert to PFC Mode",         dose: "Prolonged field care",   category: "C" },
    { id: "document_dd1380",      label: "Document on DD-1380",         dose: "Casualty card",          category: "C" }
  ]
};

/* shorthand list of contraindication action IDs the user shouldn't reach for */
window.SHARED_CONTRAS = {
  fentanyl: "OTFC/fentanyl was removed from initial TCCC management (2026). Ketamine is primary.",
  nsaid:    "Meloxicam is contraindicated in shock or respiratory distress.",
};
