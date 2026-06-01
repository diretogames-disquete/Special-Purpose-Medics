/* global window */
/*
 * Per-scenario interactive decision points for the Actions tab.
 * Each entry is keyed by ctl and contains:
 *   prompt   - the situation the student is being asked to act on
 *   options  - array of treatment choices. Each has:
 *     label    - the action the student would take
 *     outcome  - 'correct' | 'suboptimal' | 'harmful'
 *     title    - short verdict shown when chosen
 *     detail   - what happens / why this is right or wrong
 */
window.PCC_TREATMENTS = {
  "2002": {
    prompt: "Wright is 36 hours post-penetrating flank trauma with new abdominal distension. Vitals are still stable. What's your next move?",
    options: [
      {
        label: "Perform a bedside eFAST exam — all four windows plus bilateral lung",
        outcome: "correct",
        title: "Right call — image before you act.",
        detail: "You find a small anechoic stripe in the LUQ. Clinically correlate, start serial exams every 4 hours, and expedite evacuation. The teleconsult agrees. Wright reaches surgery alive with a clear picture of the bleed."
      },
      {
        label: "Open his belly now — exploratory laparotomy in the field",
        outcome: "harmful",
        title: "Too aggressive, no indication.",
        detail: "You commit to damage-control surgery on a hemodynamically stable patient without imaging or a confirmed bleed. You introduce contamination, burn blood products you can't replace, and convert a survivable problem into a lethal one."
      },
      {
        label: "Push another 2 L of crystalloid and reassess in 6 hours",
        outcome: "suboptimal",
        title: "You're treating a symptom, not making a diagnosis.",
        detail: "Distension without a diagnosis. You over-resuscitate, push intra-abdominal pressure higher, and lose six hours you can't get back if this is a slow intraperitoneal bleed."
      },
      {
        label: "Hold off — vitals are stable, document and continue routine PCC",
        outcome: "harmful",
        title: "Anchoring on stable vitals.",
        detail: "Penetrating flank trauma plus new distension at 36 hours is delayed hemorrhage until proven otherwise. By the time vitals declare themselves, you're behind. Wright deteriorates overnight."
      }
    ]
  },

  "2003": {
    prompt: "O'Brien is 48 hours post-blast, hemorrhagic shock resuscitated, now hemodynamically stable with adequate UOP. He's 80 kg. How do you run his fluids?",
    options: [
      {
        label: "LR at calculated maintenance (4-2-1 → 120 mL/hr), titrate to UOP 0.5–1 mL/kg/hr",
        outcome: "correct",
        title: "Textbook maintenance.",
        detail: "You run LR at 120 mL/hr, monitor hourly UOP, and adjust. He stays in balance for the remaining 24 hours of PCC and evacuates dry-warm-stable."
      },
      {
        label: "Keep the resuscitation rate going — 1 L/hr to 'stay ahead'",
        outcome: "harmful",
        title: "Over-resuscitation kills too.",
        detail: "You push him into pulmonary edema, raise intra-abdominal pressure, and dilute his clotting factors. Resuscitation goals end when the patient is resuscitated."
      },
      {
        label: "Switch to NS at the same maintenance rate",
        outcome: "suboptimal",
        title: "Works short-term, harms long-term.",
        detail: "NS over many hours drives hyperchloremic metabolic acidosis. For prolonged maintenance, LR is preferred — closer to plasma, less chloride load."
      },
      {
        label: "Stop the IV — push oral hydration only",
        outcome: "harmful",
        title: "Premature withdrawal.",
        detail: "He's 48 hours post-shock with ongoing insensible and wound losses. Cutting IV before enteral tolerance is established invites a second hypovolemic event you'll have to fight from behind."
      }
    ]
  },

  "2004": {
    prompt: "Morrison is 72 hours into PCC after bilateral lower-extremity amputations — stable, but at risk for every complication of immobility. What care strategy do you commit to?",
    options: [
      {
        label: "Systematic head-to-toe q2h: turns, oral care, DVT prophylaxis, pulmonary toilet, Foley care, wound checks",
        outcome: "correct",
        title: "PCC nursing care is what saves them now.",
        detail: "You build a schedule and stick to it. No pressure ulcers, no DVT, no aspiration, no CAUTI. He evacuates day 5 in better shape than he arrived."
      },
      {
        label: "Let him rest — minimal handling, no repositioning until evac",
        outcome: "harmful",
        title: "'Rest is best' is killing him slowly.",
        detail: "Within 24 hours: stage-2 sacral pressure injury, atelectasis on the dependent side, calf DVT. PCC is the long game — immobility complications kill more than the original injury at this point."
      },
      {
        label: "Focus entirely on wound and dressing care — that's what bilateral amputations need most",
        outcome: "suboptimal",
        title: "You'll save the stumps and lose the patient.",
        detail: "Wounds matter, but pulmonary toilet, DVT prophylaxis, GI, GU, and skin are all on the same checklist. Tunnel vision on one system means the others fail quietly."
      },
      {
        label: "Push aggressive early mobilization — sit him up, mobilize as much as tolerated",
        outcome: "suboptimal",
        title: "Right idea, wrong timing.",
        detail: "He's 72 hours from bilateral amputation with active pain and resuscitation just settled. Early mobility belongs in inpatient rehab, not field PCC. Repositioning q2h is what you have."
      }
    ]
  },

  "2005": {
    prompt: "Brooks has pelvic trauma 24 hours ago, can't void, has a palpably distended bladder, and there's no blood at the meatus. What do you do?",
    options: [
      {
        label: "Screen for urethral injury (meatus, perineum, prostate position) — if clear, sterile 16–18 Fr Foley",
        outcome: "correct",
        title: "Screen first, then catheterize.",
        detail: "No signs of urethral injury. Sterile technique, urine returns at 18 cm, balloon inflated, secured. Immediate 800 mL output decompresses the bladder. Output monitoring is now possible."
      },
      {
        label: "Blind Foley insertion — bladder is distended, get it in",
        outcome: "harmful",
        title: "You skipped the screen.",
        detail: "Even if there's no obvious blood, you didn't look. In a true urethral injury, blind catheterization converts a partial tear into a complete disruption that the surgeon will have to reconstruct."
      },
      {
        label: "Place a suprapubic catheter percutaneously to bypass the urethra entirely",
        outcome: "suboptimal",
        title: "Overkill when the urethra is intact.",
        detail: "Suprapubic catheterization is for confirmed or suspected urethral disruption, or failed Foley. Doing it first in a screen-negative patient adds procedural risk for no benefit."
      },
      {
        label: "Encourage spontaneous void with positioning and running water — no instrumentation",
        outcome: "harmful",
        title: "Bladder injury territory.",
        detail: "He's been retaining for 12 hours with a palpably distended bladder. Continued retention risks bladder rupture, hydronephrosis, and acute kidney injury. He needs to be drained."
      }
    ]
  },

  "2006": {
    prompt: "O'Brien is intubated for severe TBI, 48 hours into PCC. Current ETCO2 reads 48 mmHg. What do you do with the ventilator?",
    options: [
      {
        label: "Increase respiratory rate from 12 to 16, target ETCO2 35–40 mmHg",
        outcome: "correct",
        title: "Normocapnia for TBI.",
        detail: "ETCO2 rechecks at 38 within 10 minutes. Cerebral vasoconstriction relieves the high-CO2 vasodilation that was driving ICP up. You hold normocapnia for the rest of the watch."
      },
      {
        label: "Hyperventilate prophylactically to ETCO2 25 mmHg — protect the brain",
        outcome: "harmful",
        title: "You just induced cerebral ischemia.",
        detail: "Prophylactic hyperventilation constricts cerebral vessels so hard that perfusion drops. ETCO2 25–30 is reserved for brief use during acute herniation, paired with hyperosmolar therapy. Otherwise: normocapnia."
      },
      {
        label: "Ignore ETCO2 — titrate the vent to SpO2 alone",
        outcome: "suboptimal",
        title: "You're flying blind on ventilation.",
        detail: "SpO2 covers oxygenation, not ventilation. A patient can hold a perfect SpO2 while CO2 climbs and ICP rises in parallel. ETCO2 is non-negotiable for an intubated TBI."
      },
      {
        label: "Leave settings alone — his SpO2 and vitals are fine",
        outcome: "harmful",
        title: "Stable vitals don't equal a stable brain.",
        detail: "ETCO2 48 drives cerebral vasodilation and raises ICP in a brain that can't tolerate it. The pupil change two hours from now is the price of inaction."
      }
    ]
  },

  "2007": {
    prompt: "Williams has facial trauma, BVM is failing, you can't visualize the cords through blood, and SpO2 is 82 and falling. Cannot intubate, cannot oxygenate. What do you do?",
    options: [
      {
        label: "Surgical cricothyrotomy — landmark the membrane, incise, dilate, insert 6.0 cuffed tube",
        outcome: "correct",
        title: "The right call. Fast hands save lives.",
        detail: "You stabilize the larynx, cut horizontally through skin and membrane, dilate with a finger and bougie, and pass the tube. ETCO2 waveform returns. SpO2 climbs to 94. Williams survives."
      },
      {
        label: "Try fiberoptic intubation through the nose",
        outcome: "harmful",
        title: "There's no time and no kit for this.",
        detail: "Fiberoptic intubation requires equipment you don't have, a cooperative airway you don't have, and time you don't have. He arrests while you set up."
      },
      {
        label: "Keep bagging and call for help on the radio",
        outcome: "harmful",
        title: "Waiting is dying.",
        detail: "CICO is a 'do it now' problem, not a 'wait for backup' problem. Every minute below SpO2 90 in this patient writes another paragraph of his autopsy."
      },
      {
        label: "Decompress the chest with a 14 ga needle — must be tension pneumothorax",
        outcome: "harmful",
        title: "Wrong system.",
        detail: "The problem is upper-airway obstruction, not pleural pressure. Breath sounds and SpO2 deterioration here trace to blood in the airway, not air in the chest. You wasted seconds you don't have."
      }
    ]
  },

  "2008": {
    prompt: "Mitchell is intubated, day 3 of PCC, fighting the vent. RASS +1, BP 148/92, HR 112. What's your sedation plan?",
    options: [
      {
        label: "Ketamine 0.5 mg/kg bolus + 50 mg/hr infusion, add midazolam PRN, target RASS −1 to 0",
        outcome: "correct",
        title: "Multimodal sedation at the right depth.",
        detail: "Synergy between ketamine and benzo lets you use less of each. Within 20 minutes: RASS −1, vent synchrony restored, BP normalized. You can still wake him for daily neuro checks."
      },
      {
        label: "Run propofol infusion through evacuation — clean, predictable",
        outcome: "harmful",
        title: "Propofol infusion syndrome territory.",
        detail: "Propofol >48 hours, especially at higher doses, risks propofol infusion syndrome: rhabdo, metabolic acidosis, cardiac collapse. In PCC where you can't monitor labs, the math gets worse."
      },
      {
        label: "Midazolam 5 mg IV PRN whenever he gets agitated — minimal sedation",
        outcome: "suboptimal",
        title: "Peaks and valleys.",
        detail: "PRN-only dosing means he's agitated until you notice, then over-sedated for an hour, then agitated again. A baseline infusion + PRN breakthrough is what holds him steady."
      },
      {
        label: "Deeply sedate to RASS −4 to make management easier",
        outcome: "harmful",
        title: "You just lost your neuro exam.",
        detail: "Deep sedation prolongs ventilation, increases delirium, and erases the ability to do a meaningful neurological exam. Target light sedation with daily awakening trials when safe."
      }
    ]
  },

  "2009": {
    prompt: "Wright is day 4 of PCC, stable, UOP 50 mL/hr, no edema, GI function returning. How do you manage fluids today?",
    options: [
      {
        label: "Continue LR at 120 mL/hr maintenance, begin transitioning to enteral hydration as tolerated",
        outcome: "correct",
        title: "Plan the exit from IV.",
        detail: "You bridge gradually. UOP holds, no overload, gut is working. By day 5, he's mostly enteral with IV as backup. Cleaner evacuation, less line risk."
      },
      {
        label: "Bump the rate to 200 mL/hr — better to stay ahead of losses",
        outcome: "harmful",
        title: "Over-resuscitation on day 4.",
        detail: "Stable patient with adequate UOP doesn't need more — he needs the same. Crank the rate and you'll find pulmonary edema, third-spacing, and dilutional coagulopathy waiting."
      },
      {
        label: "Switch to D5W maintenance",
        outcome: "suboptimal",
        title: "Hyponatremia trap.",
        detail: "Hypotonic fluids as maintenance over days drive free-water shifts and hyponatremia. LR remains the workhorse for prolonged maintenance in trauma PCC."
      },
      {
        label: "Stop IV fluids abruptly — he's tolerating sips",
        outcome: "harmful",
        title: "Don't pull the rug.",
        detail: "Sips aren't a maintenance plan. Cut IV before enteral intake is established and you'll watch UOP fall, HR rise, and a stable patient become a problem before evacuation."
      }
    ]
  },

  "2010": {
    prompt: "Morrison is day 3 post-abdominal trauma. Temp 39.2, HR 118, BP 96/58, RR 24, wound erythema. qSOFA 2. What do you do in the next hour?",
    options: [
      {
        label: "Start Hour-1 bundle: 30 mL/kg LR, broad-spectrum antibiotic IV, source-control the wound",
        outcome: "correct",
        title: "Aggressive recognition saves him.",
        detail: "Two liters in, meropenem given, wound opened and drained of purulent material. BP improves to 108/68. Teleconsult confirms. He reaches Role 3 at hour 18 and survives."
      },
      {
        label: "Hold antibiotics until cultures are drawn and sent",
        outcome: "harmful",
        title: "Time-to-antibiotic is the variable that matters.",
        detail: "Every hour of antibiotic delay in septic shock raises mortality measurably. In a field environment with no lab return, holding for cultures you can't even process is indefensible."
      },
      {
        label: "Treat the fever — Tylenol, cooling, reassess in 4 hours",
        outcome: "harmful",
        title: "You missed sepsis.",
        detail: "Fever is the thermometer, not the disease. qSOFA 2 in a post-op patient with wound changes is sepsis until proven otherwise. Hours of observation here are catastrophic."
      },
      {
        label: "Run fluids only — give 2 L, observe for blood pressure response",
        outcome: "suboptimal",
        title: "Half the bundle.",
        detail: "Fluids matter, but without antibiotics and source control you're treating the hemodynamics while the infection keeps cooking. He'll respond to the bolus and then crash again."
      }
    ]
  },

  "2011": {
    prompt: "O'Brien is day 2 of PCC with complex multi-trauma. You need specialist input. How do you handle the teleconsult?",
    options: [
      {
        label: "Pre-build an SBAR, list your resources, contact ADVISOR, document recommendations and follow up",
        outcome: "correct",
        title: "Right way to use the lifeline.",
        detail: "You present systematically. The remote intensivist gives concrete vent and abx adjustments tailored to your kit. You document, implement, and schedule a 12-hour follow-up. Outcomes improve."
      },
      {
        label: "Manage him solo — you're trained, no need to call",
        outcome: "suboptimal",
        title: "Pride costs lives in PCC.",
        detail: "You're trained to do what you can do. The teleconsultant is trained to do more. A complex multi-trauma at 48 hours is exactly when a second opinion changes management — not a sign of weakness."
      },
      {
        label: "Call ADVISOR immediately, present off the cuff, take notes after",
        outcome: "suboptimal",
        title: "Wastes their time and yours.",
        detail: "Unprepared calls produce vague recommendations. Build the SBAR — situation, background, assessment, request — before you dial. Five minutes of prep returns hours of better care."
      },
      {
        label: "Take the consultant's plan verbatim and try to execute every line",
        outcome: "harmful",
        title: "They can't see your kit.",
        detail: "The consultant doesn't know your exact resources, blood inventory, or evac timeline. Translate recommendations to what you can actually do — and call back if you can't."
      }
    ]
  },

  "2012": {
    prompt: "Wright has bilateral LE injuries, day 3 PCC, background pain 5/10 and breakthrough 9/10 during dressing changes. How do you manage pain?",
    options: [
      {
        label: "Multimodal: scheduled morphine + PRN breakthrough + ketamine before dressings + acetaminophen adjunct",
        outcome: "correct",
        title: "All three pain types covered.",
        detail: "Background pain drops to 3/10. Dressing changes become tolerable. He participates in care, sleeps, and his vitals normalize as pain stops driving them. This is what 'multimodal' means."
      },
      {
        label: "Run a continuous high-dose morphine drip — one agent, simple",
        outcome: "harmful",
        title: "Single-mechanism, single-receptor failure.",
        detail: "High-dose opioid monotherapy gives you respiratory depression, ileus, and tolerance. Multimodal exists because different pain mechanisms need different agents at lower doses each."
      },
      {
        label: "PRN morphine only — give it when he asks",
        outcome: "suboptimal",
        title: "He'll be chasing pain all day.",
        detail: "PRN-only dosing in continuous pain creates peaks and valleys. By the time he asks, he's already in crisis. Schedule background, layer PRN for breakthrough."
      },
      {
        label: "Withhold opioids — minimize addiction risk on the back end",
        outcome: "harmful",
        title: "Wrong battlefield.",
        detail: "Undertreated acute trauma pain drives sympathetic overload, immobility, atelectasis, and worse outcomes. Addiction risk is a Role 3+ recovery conversation, not a PCC decision."
      }
    ]
  },

  "2014": {
    prompt: "Morrison has penetrating abdominal trauma, distended/rigid belly, FAST positive, BP 82/58, HR 132. Surgical evac is 12 hours away. You're ARSC-trained. What do you do?",
    options: [
      {
        label: "Damage-control laparotomy: midline, four-quadrant pack, control hemorrhage and contamination, temporary closure",
        outcome: "correct",
        title: "ARSC bridges the gap.",
        detail: "You pack, ligate a mesenteric bleed, resect injured bowel and staple ends, temporary closure with plastic. BP climbs to 96/62. He reaches Role 3 alive for definitive repair."
      },
      {
        label: "Continue blood-product resuscitation only — no surgery without a real OR",
        outcome: "harmful",
        title: "He exsanguinates before evac.",
        detail: "Resuscitation without source control is filling a bucket with a hole in it. Penetrating abdominal trauma with FAST+ and ongoing instability needs hemorrhage control, not another unit."
      },
      {
        label: "Push massive transfusion, no surgical intervention",
        outcome: "harmful",
        title: "Same trap, different costume.",
        detail: "MTP without source control burns through blood you can't replace and produces dilutional coagulopathy. The point of MTP is to support the patient through hemorrhage control — not to substitute for it."
      },
      {
        label: "REBOA only, then wait for evacuation",
        outcome: "suboptimal",
        title: "Right intent, wrong endpoint.",
        detail: "REBOA buys time — 30 to 60 minutes for zone-1 inflation before ischemic injury becomes problematic. It is not a 12-hour solution. ARSC laparotomy is what closes the bleed source."
      }
    ]
  },

  "2015": {
    prompt: "O'Brien has a chest tube for hemopneumothorax, day 2 of PCC. Output is 40 mL over the last 4 hours, serosanguinous, small air leak with cough only, tidaling present. What do you do?",
    options: [
      {
        label: "Document the trend, keep the system below chest level, reassess output/air leak/tidaling hourly",
        outcome: "correct",
        title: "Disciplined chest tube watch.",
        detail: "Output trends down, the air leak resolves by day 3, the lung re-expands. Removal at Role 3 after CXR confirms. The boring answer is the right one — chest tubes just need babysitting."
      },
      {
        label: "Clamp the tube briefly to 'test' if he still needs it",
        outcome: "harmful",
        title: "Tension pneumothorax in 10 minutes.",
        detail: "He still has an air leak. Clamping with an unresolved leak traps air in the pleural space and converts a managed pneumothorax into a tension. Never clamp a leaking tube outside of a controlled removal trial."
      },
      {
        label: "Strip / milk the tubing aggressively to clear clots",
        outcome: "suboptimal",
        title: "Discouraged in modern practice.",
        detail: "Vigorous stripping generates high negative intrathoracic pressure, can damage the lung, and rarely actually clears clots. Maintain patency by ensuring the system is upright and dependent. Don't strip."
      },
      {
        label: "Pull the tube — drainage is slowing, he's stable",
        outcome: "harmful",
        title: "Premature removal.",
        detail: "Removal criteria: no air leak ≥24–48 hours, output <150–200 mL/24 h, lung expanded on imaging. He still has an air leak. Pull this tube and the pneumothorax reaccumulates."
      }
    ]
  },

  "2016": {
    prompt: "Morrison is intubated, day 2 of PCC. 80 kg, no lung injury, SpO2 96% on FiO2 0.4, ETCO2 38, no dyssynchrony. What ventilator settings hold him here?",
    options: [
      {
        label: "AC/VC, rate 14–16, TV 6–8 mL/kg IBW (≈500 mL), PEEP 5, FiO2 titrated to SpO2 >92%, plateau <30",
        outcome: "correct",
        title: "Lung-protective baseline.",
        detail: "Settings hold him stable. Plateau pressures 22. When ETCO2 drifts to 46, you bump rate to 18 — normalized. Systematic, boring, lung-protective ventilation is what survives 48-hour transports."
      },
      {
        label: "TV 10 mL/kg, rate 20 — give him plenty of volume",
        outcome: "harmful",
        title: "Ventilator-induced lung injury.",
        detail: "Tidal volumes above 8 mL/kg IBW drive volutrauma even in 'normal' lungs over days. The ARDSNet 6 mL/kg standard exists because high TV ventilation produces ARDS where there was none."
      },
      {
        label: "Run FiO2 1.0 throughout — give him all the oxygen we have",
        outcome: "suboptimal",
        title: "Masks problems and adds new ones.",
        detail: "Sustained FiO2 1.0 produces absorption atelectasis and oxygen toxicity. It also hides oxygenation deterioration — by the time SpO2 falls on 100%, you're far behind. Titrate down."
      },
      {
        label: "Set PEEP to 15 prophylactically — recruit early",
        outcome: "harmful",
        title: "Hemodynamic compromise without a reason.",
        detail: "High PEEP without an oxygenation problem reduces preload and cardiac output. Climb PEEP for hypoxia, not as standing prophylaxis. He'll trade SpO2 for blood pressure he can't afford."
      }
    ]
  },

  "2017": {
    prompt: "Newborn delivered. Not breathing, HR 80. You've warmed, dried, stimulated, and cleared the airway. 30 seconds in. What do you do?",
    options: [
      {
        label: "Start positive-pressure ventilation with BVM at 40–60 breaths/min, look for chest rise and HR response",
        outcome: "correct",
        title: "Ventilation is the answer.",
        detail: "Effective PPV gets HR to 110 within 30 seconds. At 2 minutes: HR 140, spontaneous breathing, pink. Most neonates need exactly this and nothing more. Air in → baby pinks up."
      },
      {
        label: "Begin chest compressions immediately at 3:1 ratio",
        outcome: "harmful",
        title: "You skipped ventilation.",
        detail: "Compressions are for HR <60 despite 30 seconds of effective PPV. Starting compressions on a neonate who hasn't been ventilated yet displaces what little circulation he has without fixing the upstream problem (no air)."
      },
      {
        label: "Give epinephrine 0.01 mg/kg IV",
        outcome: "harmful",
        title: "Way too early.",
        detail: "Epinephrine in NRP comes after PPV plus compressions have failed. Reaching for drugs before air is the most common neonatal resuscitation error and produces no benefit."
      },
      {
        label: "Intubate before doing anything else — get a definitive airway",
        outcome: "suboptimal",
        title: "BVM first.",
        detail: "Neonatal NRP starts with effective BVM ventilation. Intubation is escalation if BVM fails or prolonged ventilation is needed. Stopping to intubate a baby who needs PPV right now wastes the most precious minute."
      }
    ]
  },

  "2018": {
    prompt: "28-week pregnant trauma casualty. BP 104/62, HR 102, fundus palpable. What's your management priority?",
    options: [
      {
        label: "Resuscitate the mother aggressively, left lateral tilt 15–30°, full trauma assessment and treatment",
        outcome: "correct",
        title: "The best fetal care is excellent maternal care.",
        detail: "Left tilt relieves aortocaval compression, fluids go in, you treat her like the trauma patient she is. Maternal stability is what perfuses the fetus. Both survive."
      },
      {
        label: "Withhold fluids and pressors 'for the baby'",
        outcome: "harmful",
        title: "You'll lose both.",
        detail: "Maternal hypoperfusion is fetal hypoperfusion. Resuscitate the mother — that is the intervention for the fetus. Withholding fluids on the theory that less is gentler kills both patients."
      },
      {
        label: "Keep her supine with strict spinal precautions",
        outcome: "harmful",
        title: "Aortocaval compression at 28 weeks.",
        detail: "After 20 weeks the gravid uterus compresses the IVC and aorta in supine position, dropping preload by up to 30%. Use manual uterine displacement or 15–30° left tilt while maintaining spinal precautions."
      },
      {
        label: "Emergency C-section immediately, before stabilizing the mother",
        outcome: "harmful",
        title: "Wrong indication.",
        detail: "Perimortem C-section is for maternal cardiac arrest with viable fetus, performed within 5 minutes of arrest. In a hemodynamically present mother, the operation is resuscitation — not laparotomy."
      }
    ]
  },

  "2019": {
    prompt: "6-year-old, ~20 kg, HR 138, cap refill 3 s, BP 92/58. What's your approach?",
    options: [
      {
        label: "Recognize tachycardia as early shock, 20 mL/kg LR bolus, weight-based dosing throughout (Broselow if available)",
        outcome: "correct",
        title: "Kids aren't small adults.",
        detail: "You bolus 400 mL LR, reassess, and trend. HR comes down, perfusion improves. Broselow tape sets every drug dose for the rest of the case. The shock is caught early because tachycardia mattered to you."
      },
      {
        label: "Give an adult-sized 1 L bolus — fast resuscitation",
        outcome: "harmful",
        title: "Fluid overload in a 20 kg child.",
        detail: "1 L in a 20 kg patient is 50 mL/kg in one bolus — pulmonary edema territory. Pediatric fluid is 20 mL/kg titrated. Volume isn't a virtue when the child is small."
      },
      {
        label: "Wait for hypotension to confirm shock before treating",
        outcome: "harmful",
        title: "Hypotension is the last thing to fail.",
        detail: "Children compensate hard until they crash. Tachycardia and cap refill are the early warnings. By the time BP drops, you have minutes to a cardiac arrest, not hours."
      },
      {
        label: "Use adult drug doses, eyeball the reduction",
        outcome: "harmful",
        title: "Math errors kill pediatric patients.",
        detail: "Eyeballing a dose reduction is the most common pediatric medication error. Use weight-based dosing with a reference (Broselow tape, app, card). Every drug, every time."
      }
    ]
  },

  "2020": {
    prompt: "Elderly trauma patient on a beta blocker, baseline BP 150/90. Current vitals BP 108/64, HR 74. Looks 'okay.' What do you do?",
    options: [
      {
        label: "Get the medication list, treat the relative drop as occult shock, watch for AMS, careful fluid challenge",
        outcome: "correct",
        title: "Apparent normal isn't normal for him.",
        detail: "BP 108 is hypotensive relative to his 150 baseline. Beta-blocker masks the tachycardic response. You treat the trend, look for the source, and give measured fluids — not nothing, not 2 L."
      },
      {
        label: "Trust the vital signs — BP 108/64, HR 74 is fine",
        outcome: "harmful",
        title: "Anchoring on absolute numbers.",
        detail: "In a beta-blocked, baseline-hypertensive elderly patient, those numbers are shock. He won't tachycardia his way out of it because his AV node won't let him. By the time he declares, organ damage is done."
      },
      {
        label: "Push 2 L crystalloid bolus to be safe",
        outcome: "suboptimal",
        title: "Less reserve, less tolerance.",
        detail: "Older hearts handle volume worse. A 2 L bolus risks acute CHF and pulmonary edema, especially with reduced compliance. Give 250–500 mL, reassess, repeat — small, controlled boluses."
      },
      {
        label: "Withhold opioid analgesia — too risky in elderly",
        outcome: "harmful",
        title: "Undertreatment causes delirium.",
        detail: "Untreated pain in the elderly drives delirium, immobility, and worse outcomes. Use lower starting doses and titrate, but don't withhold. 'Start low and go slow' isn't 'give nothing.'"
      }
    ]
  },

  "2021": {
    prompt: "Wright is day 4 of PCC, MEDEVAC is inbound. He's stable on 2 L NC, has multiple lines and a wound vac. How do you prepare him for evacuation?",
    options: [
      {
        label: "SBAR handoff, full documentation packet, secure lines/drains, thermal protection, confirm O2 and meds for transit",
        outcome: "correct",
        title: "Continuity of care preserved.",
        detail: "You build the SBAR, secure every line, layer the thermal blanket, package the wound vac, confirm O2 duration with the DUSTOFF medic, and hand over a single source-of-truth flowsheet. He arrives at Role 3 with no information lost."
      },
      {
        label: "Verbal handoff only — write it up after he's gone",
        outcome: "harmful",
        title: "The most common handoff failure.",
        detail: "Without the document, the receiving team starts from scratch — repeating workups, missing antibiotic timing, forgetting blood-product totals. Your four days of work disappear in the gap."
      },
      {
        label: "Heavily sedate before flight to make transport 'easier' on him and the crew",
        outcome: "harmful",
        title: "Masks deterioration.",
        detail: "Over-sedation hides hypoxia, hypotension, and bleeding during transit. Sedate to baseline RASS, communicate his sedation plan to the receiving crew, don't snow him to make the flight quiet."
      },
      {
        label: "Disconnect chest tube and wound vac to simplify transport",
        outcome: "harmful",
        title: "You just created emergencies.",
        detail: "Disconnecting a drainage system creates tension/pneumothorax and contamination risks. Drains, tubes, and lines transit with the patient on appropriate transport systems, secured."
      }
    ]
  },

  "2022": {
    prompt: "Eight severely injured casualties. Resources for maybe four. Evacuation is 24 hours away. What do you do?",
    options: [
      {
        label: "Apply triage categories — IMMEDIATE / DELAYED / MINIMAL / EXPECTANT — and direct resources accordingly",
        outcome: "correct",
        title: "Greatest good, greatest number.",
        detail: "Two non-survivable casualties go to EXPECTANT with comfort care. Six get treatment matched to severity. All six survive to evacuation. The two expectant patients die with dignity, not abandoned. You document every decision."
      },
      {
        label: "Treat the sickest patient first, one at a time, until resources run out",
        outcome: "harmful",
        title: "Mass-casualty triage isn't 'sickest-first.'",
        detail: "Pouring all resources into one EXPECTANT-category patient depletes blood and supplies that could save four salvageable patients. Triage protects the survivable, not the most severely injured."
      },
      {
        label: "First come, first served — everyone in arrival order",
        outcome: "harmful",
        title: "Severity-blind triage.",
        detail: "Time of arrival has no relation to survivability. The walking wounded who arrived first don't need what the second-arriving IMMEDIATE patient needs right now. Categorize first."
      },
      {
        label: "Refuse to make EXPECTANT calls — provide full care to everyone",
        outcome: "harmful",
        title: "Decision paralysis costs more lives.",
        detail: "When demand exceeds capability, refusing to triage means everyone gets diluted care and more total casualties die. EXPECTANT is an honest acknowledgment plus comfort care — not abandonment."
      }
    ]
  },

  "2023": {
    prompt: "O'Brien has catastrophic, non-survivable injuries. Senior medical decision: transition to comfort care. What does that look like?",
    options: [
      {
        label: "Titrate opioids to comfort, position him, keep him clean, allow teammates at bedside, no heroic measures",
        outcome: "correct",
        title: "A dignified death is good medicine.",
        detail: "Morphine titrated to pain and respiratory comfort. Clean, covered, accompanied. Teammates say goodbye. He passes peacefully. You debrief the team and arrange post-event support."
      },
      {
        label: "Continue full resuscitation — keep coding him until evac arrives",
        outcome: "harmful",
        title: "Prolonging suffering, not saving life.",
        detail: "Continuing CPR and resuscitative interventions on a confirmed non-survivable injury produces pain, indignity, and trauma for the team. The decision is already made — execute it."
      },
      {
        label: "Withdraw everything including pain medication and oxygen",
        outcome: "harmful",
        title: "Comfort care is not no care.",
        detail: "End-of-life care continues — and often increases — symptom management. Opioids for dyspnea and pain, positioning, oxygen for comfort, presence. Withdrawing pain medication is abandonment."
      },
      {
        label: "Deeply sedate to unresponsiveness immediately so he doesn't suffer",
        outcome: "suboptimal",
        title: "He may want to say goodbye.",
        detail: "Titrate to comfort, not to obliteration. Many patients who can still communicate want a moment with the team. Deep sedation as the default robs them of that. Use the minimum needed for comfort."
      }
    ]
  },

  "2024": {
    prompt: "You're managing a stable PCC patient through hour 14. What documentation do you keep?",
    options: [
      {
        label: "PCC flowsheet: hourly vitals, I/O, interventions with time/dose/response, assessment notes, medication log",
        outcome: "correct",
        title: "The flowsheet is the patient's story.",
        detail: "Real-time entries. The next provider can pick up the patient mid-stride. At evacuation, the document goes with him. Nothing falls through the gap because the gap doesn't exist."
      },
      {
        label: "Document everything from memory at the end of the watch",
        outcome: "harmful",
        title: "Memory is the worst medical record.",
        detail: "End-of-shift reconstruction misses timing, doses, and trends. Antibiotic re-dosing windows get blown. Vital sign trajectories disappear. If you didn't write it then, you didn't write it."
      },
      {
        label: "Verbal handoff to the next provider — no flowsheet needed",
        outcome: "harmful",
        title: "Verbal alone always fails.",
        detail: "Verbal handoffs miss numbers, doses, and timing every single time. The flowsheet is the durable record that survives shift changes, evacuation, and the receiving facility. Write it down."
      },
      {
        label: "Document only abnormal events — vitals when they change, not on schedule",
        outcome: "suboptimal",
        title: "Trends are the point.",
        detail: "A normal vital sign at hour 6 is data — it's what tells you the trend changed at hour 10. Scheduled documentation lets you see slow deterioration. Abnormal-only logs hide it."
      }
    ]
  },

  "2025": {
    prompt: "Capstone PCC — hour 36 of a 72-hour scenario. Intubated, sedated, awaiting evac, multiple concurrent demands. How do you run the next 12 hours?",
    options: [
      {
        label: "Systematic checklists + scheduled reassessment + anticipate + communicate + document + rotate rest with the team",
        outcome: "correct",
        title: "PCC is a system, not a sprint.",
        detail: "You run the watch on a schedule. Vitals q1h, turns q2h, medications on time, sedation vacation when safe, teleconsult before evac, flowsheet current. The team rotates so no one is broken at handoff. He evacuates clean."
      },
      {
        label: "Tunnel-vision on the ventilator — it's the most critical system",
        outcome: "harmful",
        title: "PCC kills via what you forgot.",
        detail: "Focusing on one system means the others fail: pressure ulcers, DVT, missed antibiotic re-doses, undocumented trends. Capstone-level care is breadth + discipline, not depth on a single problem."
      },
      {
        label: "Solo it — don't rotate, you'll lose continuity",
        outcome: "harmful",
        title: "Broken providers make broken decisions.",
        detail: "Sleep deprivation produces medication errors and judgment failures. PCC over 48+ hours requires rotation with structured handoffs. Continuity comes from the flowsheet, not from one person staying awake."
      },
      {
        label: "Skip teleconsult and documentation to 'save time' — focus on bedside care",
        outcome: "harmful",
        title: "You just made evac fail.",
        detail: "The handoff and the consult are not overhead — they are the care. Skipping them gives the receiving team a stranger to manage and gives you no specialist backup when something exceeds your scope."
      }
    ]
  }
};
