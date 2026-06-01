window.PCC_SCENARIOS = [
  {
    "ctl": "2002",
    "title": "Perform eFAST Exam",
    "story": "The Searching Sound",
    "location": "Putumayo Department, Colombia — 36 Hours Post-Ambush",
    "characters": [
      {
        "who": "SSG Carlos Martinez (18D Medical Sergeant)",
        "role": "eFAST certified, has performed dozens of exams."
      },
      {
        "who": "SFC Thomas Wright (18B / Patient)",
        "role": "Bilateral penetrating flank trauma, 36 hours in PCC, new abdominal distension."
      }
    ],
    "envBefore": "Wright sustained bilateral flank wounds 36 hours ago. Initial hemorrhage controlled. Now developing abdominal distension despite stable vitals.",
    "envDuring": "Martinez performs eFAST exam to evaluate for intraperitoneal fluid, hemothorax, or other complications driving the distension.",
    "presentation": "Patient 36 hours post-penetrating flank trauma with new abdominal distension, eFAST being performed for evaluation.",
    "opqrst": {
      "O": "Original injury 36 hours ago, distension developing over past 6 hours",
      "P": "Progressive distension despite resuscitation",
      "Q": "Mild diffuse tenderness, no rigidity",
      "R": "Generalized abdominal",
      "S": "Discomfort 4/10",
      "T": "Progressive over 6 hours"
    },
    "vitals": "BP 108/72, HR 96, RR 18, SpO2 97%, abdomen distended, bowel sounds hypoactive",
    "assessment": [
      {
        "name": "Delayed Intraperitoneal Hemorrhage",
        "level": "HIGH",
        "detail": "Flank trauma, delayed presentation—must rule out"
      },
      {
        "name": "Ileus",
        "level": "HIGH",
        "detail": "Common post-trauma, hypoactive bowel sounds"
      },
      {
        "name": "Hollow Viscus Injury",
        "level": "MODERATE",
        "detail": "Penetrating trauma—possible delayed perforation"
      }
    ],
    "questions": [
      "What are the views obtained in eFAST?",
      "What does free fluid in Morrison's pouch indicate?",
      "How do you differentiate blood from ascites on ultrasound?",
      "What are the limitations of eFAST?",
      "How does eFAST change management in PCC?",
      "When should eFAST be repeated?"
    ],
    "actions": [
      "EFAST VIEWS: RUQ (Morrison's pouch), LUQ (splenorenal), pelvis (bladder), subxiphoid (pericardium), bilateral lung (pneumothorax)",
      "TECHNIQUE: Probe marker to patient's right or head, adequate gel, systematic approach",
      "POSITIVE FINDINGS: Anechoic (black) stripe = free fluid",
      "IF POSITIVE: Prepare for surgical evacuation, continue resuscitation",
      "IF NEGATIVE BUT CONCERNING: Repeat in 4-6 hours, clinical exam trumps negative eFAST",
      "DOCUMENT: Record findings, images if possible for teleconsult"
    ],
    "resolution": "Martinez performs eFAST: RUQ negative, LUQ shows small anechoic stripe (positive), pelvis negative, pericardium negative, no pneumothorax. Small amount of free fluid in LUQ. Clinical correlation: likely slow bleed or reactive fluid. Teleconsult initiated—surgeon recommends serial exams, continue resuscitation, expedite evacuation. Repeat eFAST 4 hours later shows no increase. Wright evacuated successfully, surgery reveals small retroperitoneal hematoma (non-operative). Key teaching: 'eFAST doesn't tell you what the fluid is—blood, urine, bowel contents all look black. It tells you something is there that shouldn't be. Serial exams show if it's getting worse.'",
    "cat": "ASSESSMENT",
    "focus": "eFAST exam · serial monitoring",
    "sys": "imaging",
    "priority": 2,
    "vitalsParsed": {
      "bp": "108/72",
      "hr": "96",
      "rr": "18",
      "spo2": "97",
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 108/72, HR 96, RR 18, SpO2 97%, abdomen distended, bowel sounds hypoactive",
      "isTraining": false
    }
  },
  {
    "ctl": "2003",
    "title": "Treat Hypovolemic Shock / Maintenance Fluids",
    "story": "The Calculated Drip",
    "location": "Loreto Region, Peru — 48 Hours in PCC",
    "characters": [
      {
        "who": "SFC David Kim (18D Medical Sergeant)",
        "role": "Critical care experience, knows resuscitation principles."
      },
      {
        "who": "SSG Kevin O'Brien (18B / Patient)",
        "role": "Hemorrhagic shock post-blast, now in PCC, transitioning from resuscitation to maintenance."
      }
    ],
    "envBefore": "O'Brien is 48 hours post-blast injury with hemorrhagic shock. Initial resuscitation complete. Now transitioning to maintenance fluids while awaiting evacuation.",
    "envDuring": "Kim calculates and initiates appropriate maintenance fluid therapy for prolonged casualty care.",
    "presentation": "Patient 48 hours post-hemorrhagic shock, hemodynamically stable, transitioning to maintenance fluid therapy.",
    "opqrst": {
      "O": "Original injury 48 hours ago",
      "P": "Stable after initial resuscitation",
      "Q": "Maintaining vitals with current fluid rate",
      "R": "Systemic—fluid balance",
      "S": "Stable but requires ongoing management",
      "T": "Transitioning from resuscitation to maintenance"
    },
    "vitals": "BP 118/76, HR 82, RR 16, UOP 0.5 mL/kg/hr (adequate), skin turgor normal",
    "assessment": [
      {
        "name": "Post-Resuscitation Maintenance Phase",
        "level": "CURRENT STATUS",
        "detail": "Stable vitals, adequate UOP, need for calculated maintenance"
      }
    ],
    "questions": [
      "How do you calculate maintenance fluid requirements?",
      "What is the 4-2-1 rule?",
      "What parameters indicate adequate resuscitation?",
      "What are the risks of over-resuscitation?",
      "How do ongoing losses affect fluid calculations?",
      "What fluid type is appropriate for maintenance?"
    ],
    "actions": [
      "ASSESS VOLUME STATUS: UOP (goal 0.5-1 mL/kg/hr), skin turgor, vitals, mental status",
      "4-2-1 RULE: 4 mL/kg/hr for first 10 kg + 2 mL/kg/hr for next 10 kg + 1 mL/kg/hr for each kg thereafter",
      "80 KG PATIENT: (4×10) + (2×10) + (1×60) = 40+20+60 = 120 mL/hr maintenance",
      "CRYSTALLOID CHOICE: LR preferred over NS (less hyperchloremic acidosis)",
      "ADJUST FOR LOSSES: Add estimated ongoing losses (wound drainage, NG output, fever)",
      "AVOID OVER-RESUSCITATION: Can cause pulmonary edema, compartment syndrome, coagulopathy"
    ],
    "resolution": "Kim calculates maintenance for 80 kg patient: 120 mL/hr LR. Monitors UOP (target 0.5-1 mL/kg/hr = 40-80 mL/hr). Adjusts based on output—if UOP drops, bolus then increase rate; if high UOP, can decrease slightly. Documents intake/output every hour. O'Brien maintains stable volume status through 72-hour PCC period. Key teaching: 'Resuscitation and maintenance are different goals. Once stable, calculate what they need, not what you have. Over-resuscitation kills too.'",
    "cat": "RESUSCITATION",
    "focus": "4-2-1 rule · maintenance fluids",
    "sys": "circulation",
    "priority": 1,
    "vitalsParsed": {
      "bp": "118/76",
      "hr": "82",
      "rr": "16",
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 118/76, HR 82, RR 16, UOP 0.5 mL/kg/hr (adequate), skin turgor normal",
      "isTraining": false
    }
  },
  {
    "ctl": "2004",
    "title": "Perform PCC Nursing Care",
    "story": "The Daily Rounds",
    "location": "Caquetá Department, Colombia — 72 Hours in PCC",
    "characters": [
      {
        "who": "SSG Rafael Mendez (18D Medical Sergeant)",
        "role": "ICU experience, systematic critical care approach."
      },
      {
        "who": "SFC Jake Morrison (18E / Patient)",
        "role": "Bilateral amputee, 72 hours in PCC, requires comprehensive ongoing care."
      }
    ],
    "envBefore": "Morrison is 72 hours into PCC with bilateral lower extremity amputations. Requires systematic daily care to prevent complications.",
    "envDuring": "Mendez conducts comprehensive PCC rounds—head-to-toe nursing care assessment and interventions.",
    "presentation": "Bilateral amputee, day 3 of PCC, requiring comprehensive nursing care.",
    "opqrst": {
      "O": "Injury 72 hours ago",
      "P": "Stable but prolonged immobility creates risks",
      "Q": "Requires comprehensive preventive care",
      "R": "Head-to-toe—every system at risk",
      "S": "Stable but vulnerable",
      "T": "Day 3 of projected 5-day PCC"
    },
    "vitals": "Stable, primary concern is preventing complications of immobility and critical illness",
    "assessment": [
      {
        "name": "PCC Nursing Care Requirements",
        "level": "CURRENT STATUS",
        "detail": "Multi-day critical care, immobility, multiple risk factors"
      }
    ],
    "questions": [
      "What are the components of comprehensive PCC nursing care?",
      "How often should each intervention be performed?",
      "What are the complications of immobility?",
      "How do you prevent pressure ulcers in PCC?",
      "What pulmonary toilet measures are needed?",
      "How do you maintain dignity during prolonged care?"
    ],
    "actions": [
      "NEUROLOGICAL: Assess mental status, pain level, pupil checks if TBI",
      "RESPIRATORY: Pulmonary toilet, turn/cough/deep breathe q1-2h, head of bed elevated",
      "CARDIOVASCULAR: DVT prophylaxis (compression, chemical if appropriate), monitor for compartment syndrome",
      "GI: Nutrition (enteral preferred), stress ulcer prophylaxis, bowel regimen",
      "GU: Foley care, monitor output, prevent CAUTI",
      "SKIN: Reposition q2h, pressure point padding, wound care",
      "LINES/DRAINS: Site care, patency, securement"
    ],
    "resolution": "Mendez establishes nursing care schedule: hourly neuro checks and VS, q2h turns and repositioning, q4h oral care and Foley care, daily wound care and dressing changes. DVT prophylaxis with compression and aspirin (no heparin available). Bowel regimen started. Oral famotidine for stress ulcer prevention. Morrison develops no complications over remaining PCC time, evacuated day 5 in stable condition. Key teaching: 'PCC isn't just keeping them alive—it's preventing the complications that kill them slowly. Systematic nursing care is the difference between surviving and thriving.'",
    "cat": "NURSING CARE",
    "focus": "Head-to-toe nursing care",
    "sys": "systems",
    "priority": 2,
    "vitalsParsed": {
      "bp": null,
      "hr": null,
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Stable, primary concern is preventing complications of immobility and critical illness",
      "isTraining": false
    }
  },
  {
    "ctl": "2005",
    "title": "Place Urinary Catheter",
    "story": "The Measured Flow",
    "location": "Tumaco, Colombia — PCC Environment",
    "characters": [
      {
        "who": "SFC Marcus Thompson (18D Medical Sergeant)",
        "role": "Experienced with urinary catheterization in field conditions."
      },
      {
        "who": "SSG Tyler Brooks (18E / Patient)",
        "role": "Pelvic trauma patient requiring urinary output monitoring, unable to void spontaneously."
      }
    ],
    "envBefore": "Brooks sustained pelvic trauma 24 hours ago. Unable to void spontaneously, requires Foley catheterization for monitoring and bladder decompression.",
    "envDuring": "Thompson performs sterile urinary catheterization in PCC environment.",
    "presentation": "Pelvic trauma patient, 24 hours post-injury, unable to void, requiring Foley catheterization.",
    "opqrst": {
      "O": "Injury 24 hours ago, unable to void for 12 hours",
      "P": "Pelvic pain with attempted voiding, distended bladder",
      "Q": "Suprapubic discomfort, urinary urgency without output",
      "R": "Suprapubic, pelvic",
      "S": "Discomfort 6/10 from bladder distension",
      "T": "12 hours since last void"
    },
    "vitals": "BP 126/82, distended bladder palpable, no blood at meatus",
    "assessment": [
      {
        "name": "Urinary Retention Post-Pelvic Trauma",
        "level": "VERY HIGH",
        "detail": "Pelvic injury, inability to void, distended bladder"
      },
      {
        "name": "Urethral Injury",
        "level": "LOW (cleared)",
        "detail": "Must rule out before catheterization—no blood at meatus, no perineal hematoma"
      }
    ],
    "questions": [
      "When is urethral injury suspected and how does it change approach?",
      "What are the contraindications to blind urethral catheterization?",
      "Describe the sterile technique for Foley insertion.",
      "What is the appropriate catheter size for adults?",
      "How do you confirm proper placement?",
      "What are the ongoing care requirements for Foley catheters?"
    ],
    "actions": [
      "ASSESS FOR URETHRAL INJURY: Blood at meatus, perineal hematoma, high-riding prostate = NO blind catheterization",
      "IF CLEAR: Proceed with sterile technique",
      "TECHNIQUE: Sterile field, prep with betadine, lubricate catheter, insert until urine returns, inflate balloon, secure",
      "CATHETER SIZE: 16-18 Fr typical adult male",
      "CONFIRM PLACEMENT: Urine return, balloon inflation without resistance",
      "ONGOING CARE: Closed drainage system, keep bag below bladder, daily meatal care, monitor output"
    ],
    "resolution": "Thompson confirms no signs of urethral injury. Sterile technique Foley insertion—urine return at 18cm insertion depth, balloon inflated (10mL), secured to thigh. Immediate output 800mL—significant retention. Ongoing monitoring shows 40-60 mL/hr (adequate). Foley care incorporated into daily nursing rounds. No CAUTI during PCC period. Key teaching: 'Never blindly catheterize a trauma patient with blood at the meatus. But once cleared, a Foley is essential for monitoring output and decompressing the bladder.'",
    "cat": "PROCEDURE",
    "focus": "Foley catheterization · urethral screen",
    "sys": "genitourinary",
    "priority": 2,
    "vitalsParsed": {
      "bp": "126/82",
      "hr": null,
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 126/82, distended bladder palpable, no blood at meatus",
      "isTraining": false
    }
  },
  {
    "ctl": "2006",
    "title": "Employ ETCO2 Monitoring",
    "story": "The Carbon Dioxide Truth",
    "location": "Loreto Region, Peru — PCC with Ventilated Patient",
    "characters": [
      {
        "who": "SSG David Kim (18D Medical Sergeant)",
        "role": "Ventilator management experience, understands capnography."
      },
      {
        "who": "SFC Kevin O'Brien (18B / Patient)",
        "role": "Intubated TBI patient, 48 hours in PCC, requires ETCO2-guided ventilation."
      }
    ],
    "envBefore": "O'Brien is intubated for severe TBI, 48 hours in PCC. Requires ETCO2 monitoring to guide ventilation—critical for TBI management.",
    "envDuring": "Kim uses end-tidal CO2 monitoring to adjust ventilator settings and guide clinical decision-making.",
    "presentation": "Intubated TBI patient requiring ETCO2-guided ventilation management.",
    "opqrst": {
      "O": "Intubated 48 hours ago for TBI",
      "P": "Requires precise ventilation to optimize cerebral perfusion",
      "Q": "Currently mechanically ventilated",
      "R": "Cerebral—CO2 affects ICP",
      "S": "Critical—ventilation directly affects brain",
      "T": "Ongoing ventilator management"
    },
    "vitals": "BP 128/82, HR 78, on ventilator, current ETCO2 reading needed for management",
    "assessment": [
      {
        "name": "TBI Requiring ETCO2-Guided Ventilation",
        "level": "CURRENT STATUS",
        "detail": "Severe TBI, intubated, requires normocapnia for optimal cerebral perfusion"
      }
    ],
    "questions": [
      "What is the relationship between CO2 and cerebral blood flow?",
      "What is the target ETCO2 range for TBI patients?",
      "How does ETCO2 relate to PaCO2?",
      "What causes ETCO2 to increase or decrease?",
      "When is intentional hyperventilation indicated?",
      "What are other uses of ETCO2 monitoring?"
    ],
    "actions": [
      "TARGET ETCO2: 35-40 mmHg (normocapnia) for most TBI patients",
      "ETCO2-PaCO2 GRADIENT: ETCO2 typically 2-5 mmHg lower than arterial; varies with V/Q mismatch",
      "IF ETCO2 HIGH (>45): Increase respiratory rate or tidal volume—CO2 is vasodilator, raises ICP",
      "IF ETCO2 LOW (<30): Decrease rate/volume—excessive hyperventilation causes cerebral ischemia",
      "HERNIATION EXCEPTION: Brief hyperventilation to ETCO2 25-30 may be used for acute herniation signs",
      "CONTINUOUS MONITORING: Document trends, adjust ventilator to maintain target"
    ],
    "resolution": "Kim monitors O'Brien's ETCO2. Initial reading 48 mmHg—too high for TBI. Increases respiratory rate from 12 to 16. Recheck: ETCO2 now 38 mmHg—in target range. Continues monitoring hourly. When O'Brien shows pupil changes suggesting rising ICP, Kim briefly hyperventilates to ETCO2 28 while giving hypertonic saline, then returns to normocapnia. O'Brien stabilizes, evacuated successfully. Key teaching: 'ETCO2 is a window into brain physiology. Too much CO2 dilates cerebral vessels and raises ICP. Too little causes ischemia. The target is normocapnia—35-40.'",
    "cat": "MONITORING",
    "focus": "ETCO2 · TBI ventilation",
    "sys": "respiratory",
    "priority": 1,
    "vitalsParsed": {
      "bp": "128/82",
      "hr": "78",
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 128/82, HR 78, on ventilator, current ETCO2 reading needed for management",
      "isTraining": false
    }
  },
  {
    "ctl": "2007",
    "title": "Perform Advanced Airway (Cricothyrotomy)",
    "story": "The Definitive Tube",
    "location": "Chapare Region, Bolivia — PCC Environment",
    "characters": [
      {
        "who": "SFC Michael Okonkwo (18D Medical Sergeant)",
        "role": "Advanced airway management certified, RSI experienced."
      },
      {
        "who": "SGT Paul Williams (18C / Patient)",
        "role": "Severe facial trauma with progressive airway compromise, requires surgical airway."
      }
    ],
    "envBefore": "Williams sustained severe facial trauma. BVM ventilation increasingly difficult. Laryngoscopy impossible due to blood and disrupted anatomy. Surgical airway required.",
    "envDuring": "Okonkwo performs emergent cricothyrotomy in PCC environment.",
    "presentation": "Severe facial trauma, failed ventilation attempts, laryngoscopy impossible, requires surgical airway.",
    "opqrst": {
      "O": "Facial trauma 30 minutes ago",
      "P": "Progressive airway obstruction despite positioning and suction",
      "Q": "Gurgling, stridor, decreasing SpO2",
      "R": "Upper airway",
      "S": "Critical—imminent airway loss",
      "T": "Progressive deterioration over 30 minutes"
    },
    "vitals": "SpO2 82% and falling, HR 130, cyanosis developing",
    "assessment": [
      {
        "name": "Cannot Intubate, Cannot Oxygenate (CICO) Emergency",
        "level": "CONFIRMED",
        "detail": "Failed BVM, laryngoscopy impossible, SpO2 falling—surgical airway indicated"
      }
    ],
    "questions": [
      "What are the indications for surgical cricothyrotomy?",
      "Describe the anatomical landmarks for cricothyrotomy.",
      "What is the technique for surgical cricothyrotomy?",
      "What tube/device is inserted?",
      "What are the immediate post-procedure assessments?",
      "What are the complications of cricothyrotomy?"
    ],
    "actions": [
      "RECOGNIZE CICO: Cannot intubate, cannot oxygenate = surgical airway NOW",
      "LANDMARK: Cricothyroid membrane—between thyroid cartilage (Adam's apple) and cricoid cartilage",
      "TECHNIQUE: Stabilize larynx, horizontal incision through skin and membrane, dilate, insert cuffed tube",
      "TUBE OPTIONS: 6.0 cuffed ETT or Shiley tracheostomy tube (cric-specific)",
      "CONFIRM PLACEMENT: ETCO2 (gold standard), chest rise, breath sounds, SpO2 improvement",
      "SECURE: Secure tube, reassess frequently"
    ],
    "resolution": "Okonkwo identifies cricothyroid membrane. Stabilizes larynx with non-dominant hand. Horizontal incision through skin and membrane. Dilates with gloved finger then bougie. Inserts 6.0 cuffed ETT. Inflates cuff, ventilates. ETCO2 waveform present, SpO2 improving to 94%. Secures tube. Williams stabilized and evacuated via MEDEVAC. Surgical team converts to formal tracheostomy. Williams survives. Key teaching: 'When you can't intubate and you can't oxygenate, the answer is a knife. Find the membrane, make a hole, put in a tube. It's scary but it works.'",
    "cat": "AIRWAY",
    "focus": "Cricothyrotomy · CICO",
    "sys": "airway",
    "priority": 0,
    "vitalsParsed": {
      "bp": null,
      "hr": "130",
      "rr": null,
      "spo2": "82",
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "SpO2 82% and falling, HR 130, cyanosis developing",
      "isTraining": false
    }
  },
  {
    "ctl": "2008",
    "title": "Perform Sedation During PCC",
    "story": "The Quiet Mind",
    "location": "Caquetá Department, Colombia — 72 Hours in PCC",
    "characters": [
      {
        "who": "SSG Rafael Mendez (18D Medical Sergeant)",
        "role": "Experienced with sedation management in austere settings."
      },
      {
        "who": "SFC Derek Mitchell (18E / Patient)",
        "role": "Intubated multi-trauma patient, 72 hours in PCC, requires ongoing sedation."
      }
    ],
    "envBefore": "Mitchell is intubated, day 3 of PCC. Requires sedation for ventilator synchrony and patient comfort. Must balance sedation with ability to perform neuro assessments.",
    "envDuring": "Mendez manages sedation protocol for prolonged intubated patient.",
    "presentation": "Intubated multi-trauma patient, day 3 PCC, requiring sedation management.",
    "opqrst": {
      "O": "Intubated 72 hours ago",
      "P": "Agitation affecting ventilator synchrony",
      "Q": "Fighting ventilator, elevated HR/BP with agitation",
      "R": "Systemic—affecting all parameters",
      "S": "Current sedation inadequate",
      "T": "Ongoing need through PCC duration"
    },
    "vitals": "BP 148/92 with agitation, HR 112, on ventilator, RASS score +1 (restless)",
    "assessment": [
      {
        "name": "Inadequate Sedation for Mechanical Ventilation",
        "level": "CURRENT STATUS",
        "detail": "Patient-ventilator dyssynchrony, agitation, hemodynamic changes"
      }
    ],
    "questions": [
      "What sedation agents are available in PCC?",
      "What is the RASS scale and target for intubated patients?",
      "How do you balance sedation with neuro assessment capability?",
      "What are the risks of over-sedation vs under-sedation?",
      "How do you manage sedation with limited monitoring?",
      "What are the considerations for sedation weaning?"
    ],
    "actions": [
      "ASSESS SEDATION LEVEL: RASS scale (-5 unarousable to +4 combative), target -2 to 0 for most patients",
      "KETAMINE: Dissociative sedation, maintains airway reflexes, bronchodilation—1-2 mg/kg bolus, 0.5-2 mg/kg/hr infusion",
      "MIDAZOLAM: Anxiolytic/amnestic—0.05-0.1 mg/kg bolus, 0.02-0.1 mg/kg/hr infusion",
      "COMBINATION: Often ketamine + midazolam provides synergistic effect at lower doses",
      "DAILY AWAKENING: When safe, lighten sedation to assess neurological status",
      "AVOID PROPOFOL INFUSION >48 HOURS: Risk of propofol infusion syndrome"
    ],
    "resolution": "Mendez assesses Mitchell—RASS +1, target is -1 to 0. Administers ketamine 50 mg (0.5 mg/kg) bolus, starts infusion at 50 mg/hr. Adds midazolam 2 mg PRN. Within 20 minutes: RASS -1, ventilator synchrony improved, vitals normalized. Daily sedation vacation attempted when conditions allow. Mitchell maintains appropriate sedation through evacuation. Key teaching: 'Sedation is a balance—enough to tolerate the tube and prevent harm, not so much that you can't wake them to check their brain. Daily awakening is the standard when TBI allows.'",
    "cat": "PROCEDURE",
    "focus": "Sedation · RASS · ketamine/midaz",
    "sys": "neuro",
    "priority": 2,
    "vitalsParsed": {
      "bp": "148/92",
      "hr": "112",
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 148/92 with agitation, HR 112, on ventilator, RASS score +1 (restless)",
      "isTraining": false
    }
  },
  {
    "ctl": "2009",
    "title": "Provide Maintenance Fluids (Day 4)",
    "story": "The Calculated Drip (Day 4)",
    "location": "Putumayo Department, Colombia — PCC Day 4",
    "characters": [
      {
        "who": "SFC Carlos Martinez (18D Medical Sergeant)",
        "role": "Fluid management expertise, understands PCC fluid requirements."
      },
      {
        "who": "SSG Thomas Wright (18B / Patient)",
        "role": "Multi-system trauma, day 4 PCC, requires ongoing maintenance fluids."
      }
    ],
    "envBefore": "Wright is day 4 of PCC, stable after initial resuscitation. Requires calculated maintenance fluid therapy with attention to ongoing losses and renal function.",
    "envDuring": "Martinez calculates and adjusts maintenance fluid therapy for prolonged care.",
    "presentation": "Day 4 post-multi-system trauma, requiring maintenance fluid management.",
    "opqrst": {
      "O": "Injury 4 days ago",
      "P": "Stable, transitioning to maintenance phase",
      "Q": "Requires precise fluid management",
      "R": "Systemic fluid balance",
      "S": "Stable",
      "T": "Day 4, likely 2 more days to evacuation"
    },
    "vitals": "BP 116/74, HR 78, UOP 50 mL/hr (0.6 mL/kg/hr—adequate), no edema",
    "assessment": [
      {
        "name": "Maintenance Fluid Requirement in PCC",
        "level": "CURRENT STATUS",
        "detail": "Post-resuscitation, stable vitals, adequate UOP"
      }
    ],
    "questions": [
      "How do maintenance fluid needs change over the course of PCC?",
      "What are the indicators of adequate vs inadequate fluid status?",
      "How do you account for insensible losses?",
      "What is the role of enteral hydration in PCC?",
      "How does fever affect fluid requirements?",
      "What electrolyte considerations exist with prolonged IV fluids?"
    ],
    "actions": [
      "MAINTENANCE CALCULATION: 4-2-1 rule as baseline (approximately 1.5 mL/kg/hr for adults)",
      "ADJUST FOR LOSSES: Fever adds 10-15% per degree >38°C, wound drainage, NG output",
      "MONITOR UOP: Target 0.5-1 mL/kg/hr; adjust fluids to achieve",
      "TRANSITION TO ENTERAL: When GI function returns, prefer oral/enteral hydration",
      "ELECTROLYTES: Prolonged LR generally safe; prolonged NS causes hyperchloremic acidosis",
      "AVOID OVERLOAD: Daily weights if possible, lung exam, peripheral edema check"
    ],
    "resolution": "Martinez continues LR at calculated maintenance rate (120 mL/hr for 80 kg). Wright's GI function returns day 4—transitions to oral fluids with IV backup. UOP remains adequate. No signs of overload. Successfully manages fluids through day 6 evacuation. Key teaching: 'Maintenance fluids keep them even—not too dry, not too wet. Monitor output, check for overload signs, and transition to enteral when possible.'",
    "cat": "RESUSCITATION",
    "focus": "Day-4 fluids · enteral transition",
    "sys": "circulation",
    "priority": 2,
    "vitalsParsed": {
      "bp": "116/74",
      "hr": "78",
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 116/74, HR 78, UOP 50 mL/hr (0.6 mL/kg/hr—adequate), no edema",
      "isTraining": false
    }
  },
  {
    "ctl": "2010",
    "title": "Treat Sepsis and Septic Shock",
    "story": "The Fever Fight",
    "location": "Loreto Region, Peru — PCC Day 3",
    "characters": [
      {
        "who": "SSG David Kim (18D Medical Sergeant)",
        "role": "Recognizes sepsis early, aggressive treatment philosophy."
      },
      {
        "who": "SFC Jake Morrison (18E / Patient)",
        "role": "Penetrating abdominal trauma, day 3 PCC, developing fever and tachycardia."
      }
    ],
    "envBefore": "Morrison is day 3 post-penetrating abdominal trauma. Develops fever 39.2°C and tachycardia. Concern for sepsis.",
    "envDuring": "Kim evaluates for sepsis and initiates appropriate management in PCC environment.",
    "presentation": "Day 3 post-abdominal trauma with new fever, tachycardia, concerning for sepsis.",
    "opqrst": {
      "O": "Fever developed over past 6 hours",
      "P": "Progressive despite wound care",
      "Q": "Rigors, feeling 'terrible'",
      "R": "Systemic—fever, tachycardia",
      "S": "Fever 39.2°C, patient clearly ill",
      "T": "6 hours of progressive symptoms"
    },
    "vitals": "Temp 39.2°C, HR 118, BP 96/58, RR 24, WBC unknown (no lab), wound erythema noted",
    "assessment": [
      {
        "name": "Sepsis (Surgical Site Infection Source)",
        "level": "VERY HIGH",
        "detail": "Post-operative, fever, tachycardia, hypotension, wound changes"
      },
      {
        "name": "Other Infection Source",
        "level": "MODERATE",
        "detail": "Pneumonia, UTI, line infection—must consider all"
      }
    ],
    "questions": [
      "What are the criteria for sepsis?",
      "How do you identify sepsis without laboratory values?",
      "What is the Hour-1 Bundle for sepsis?",
      "What antibiotics are appropriate for abdominal source?",
      "How do you provide source control in PCC?",
      "What are the fluid resuscitation goals in sepsis?"
    ],
    "actions": [
      "RECOGNIZE SEPSIS: Suspected infection + qSOFA ≥2 (altered mentation, RR≥22, SBP≤100)",
      "FLUID RESUSCITATION: 30 mL/kg crystalloid within first 3 hours (for 80 kg: 2.4L)",
      "ANTIBIOTICS: Broad-spectrum within 1 hour—Piperacillin-tazobactam 4.5g IV or Meropenem 1g IV",
      "ALTERNATIVE: Ceftriaxone 2g + Metronidazole 500mg if limited formulary",
      "SOURCE CONTROL: Examine wounds, drains; open and drain any collections",
      "VASOPRESSORS: If hypotensive despite fluids—norepinephrine if available",
      "EXPEDITE EVACUATION: Sepsis requires higher level of care"
    ],
    "resolution": "Kim recognizes sepsis—qSOFA 2 (hypotension, tachypnea). Initiates Hour-1 bundle: 2L LR bolus started, meropenem 1g IV given. Examines wounds—identifies purulent drainage from one wound, opens and drains. Second liter running. After 2L, BP improves to 108/68. Continuous monitoring. Teleconsult confirms management. Evacuation expedited—Morrison reaches Role 3 at hour 18, survives with IV antibiotics and surgical washout. Key teaching: 'Sepsis kills fast. Recognize it (fever + hemodynamic changes), treat it aggressively (fluids, antibiotics, source control), and evacuate. The hour-1 bundle exists because hours matter.'",
    "cat": "INFECTION",
    "focus": "Sepsis · qSOFA · Hour-1 Bundle",
    "sys": "circulation",
    "priority": 0,
    "vitalsParsed": {
      "bp": "96/58",
      "hr": "118",
      "rr": "24",
      "spo2": null,
      "temp": "39.2",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Temp 39.2°C, HR 118, BP 96/58, RR 24, WBC unknown (no lab), wound erythema noted",
      "isTraining": false
    }
  },
  {
    "ctl": "2011",
    "title": "Perform Teleconsultation",
    "story": "The Remote Consultation",
    "location": "Triple Border Region — PCC Day 2",
    "characters": [
      {
        "who": "SFC Michael Okonkwo (18D Medical Sergeant)",
        "role": "Experienced with teleconsultation, knows how to present a patient."
      },
      {
        "who": "COL Patricia Hernandez (Remote Critical Care Physician)",
        "role": "ADVISOR teleconsult physician."
      },
      {
        "who": "SSG Kevin O'Brien (18B / Patient)",
        "role": "Complex multi-trauma patient requiring specialist guidance."
      }
    ],
    "envBefore": "O'Brien is day 2 of PCC with complex injuries. Okonkwo needs specialist input on management decisions.",
    "envDuring": "Okonkwo conducts teleconsultation with remote critical care physician for patient management guidance.",
    "presentation": "Complex multi-trauma patient, day 2 PCC, requiring teleconsultation for management guidance.",
    "opqrst": {
      "O": "Injury 48 hours ago",
      "P": "Complex management decisions required",
      "Q": "Multiple competing priorities",
      "R": "Multiple organ systems involved",
      "S": "Critical but stable",
      "T": "Ongoing management decisions"
    },
    "vitals": "Provided during teleconsult as comprehensive patient presentation",
    "assessment": [
      {
        "name": "Complex Multi-Trauma Requiring Specialist Input",
        "level": "CURRENT STATUS",
        "detail": "Multiple injuries, management complexity exceeds typical scope"
      }
    ],
    "questions": [
      "What are the available teleconsultation resources?",
      "How do you prepare for a teleconsultation?",
      "What information should be presented to the consultant?",
      "How do you implement consultant recommendations in austere settings?",
      "What are the limitations of teleconsultation?",
      "How do you document teleconsultation?"
    ],
    "actions": [
      "PREPARE: Gather all patient information before call—history, injuries, vitals trends, current management, questions",
      "PRESENT SYSTEMATICALLY: Use SBAR or similar structure—Situation, Background, Assessment, Recommendation/Request",
      "AVAILABLE RESOURCES: State what equipment/medications/capabilities you have",
      "DOCUMENT: Record recommendations, rationale, time of consultation",
      "IMPLEMENT: Adapt recommendations to your capabilities, clarify if unsure",
      "FOLLOW-UP: Schedule recontact, provide updates"
    ],
    "resolution": "Okonkwo prepares comprehensive patient summary. Contacts ADVISOR line. Presents: 'I have a 32-year-old male, 48 hours post-blast with traumatic amputation left BKA, penetrating abdominal wound, now developing increasing oxygen requirements...' Provides vitals, current management, resources available. COL Hernandez provides guidance on ventilator adjustments, antibiotic modification, and fluid management. Recommendations documented, implemented. Follow-up scheduled for 12 hours. O'Brien's condition improves with adjusted management. Key teaching: 'Teleconsultation extends specialist expertise to austere environments. Present clearly, know your resources, and implement what you can. Don't be afraid to call—that's what they're there for.'",
    "cat": "COORDINATION",
    "focus": "Teleconsult · SBAR",
    "sys": "comms",
    "priority": 2,
    "vitalsParsed": {
      "bp": null,
      "hr": null,
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Provided during teleconsult as comprehensive patient presentation",
      "isTraining": false
    }
  },
  {
    "ctl": "2012",
    "title": "Provide Analgesia (Multimodal)",
    "story": "The Pain Balance",
    "location": "Putumayo Department, Colombia — PCC Day 3",
    "characters": [
      {
        "who": "SSG Carlos Martinez (18D Medical Sergeant)",
        "role": "Pain management expertise, multimodal approach advocate."
      },
      {
        "who": "SFC Thomas Wright (18B / Patient)",
        "role": "Bilateral lower extremity injuries, day 3 PCC, severe pain limiting participation in care."
      }
    ],
    "envBefore": "Wright has bilateral lower extremity injuries, day 3 of PCC. Significant pain affecting ability to participate in care activities. Requires optimized analgesia.",
    "envDuring": "Martinez implements comprehensive pain management strategy for PCC patient.",
    "presentation": "Bilateral LE injuries, day 3 PCC, pain 8/10 despite current regimen.",
    "opqrst": {
      "O": "Pain since injury, inadequately controlled",
      "P": "Worse with any movement, dressing changes, positioning",
      "Q": "Constant aching with sharp breakthrough episodes",
      "R": "Bilateral lower extremities",
      "S": "Background 5/10, breakthrough 9/10",
      "T": "Continuous, worse during care activities"
    },
    "vitals": "BP 138/86 (pain component), HR 98, grimacing, reluctant to participate in care",
    "assessment": [
      {
        "name": "Inadequately Controlled Pain in PCC",
        "level": "CURRENT STATUS",
        "detail": "Injury severity, current regimen insufficient, affecting care participation"
      }
    ],
    "questions": [
      "What is the multimodal approach to pain management?",
      "What are background vs breakthrough vs procedural pain?",
      "What analgesics are appropriate for PCC?",
      "How do you balance analgesia with sedation and respiratory depression?",
      "What are the non-pharmacological adjuncts?",
      "How do you assess pain in non-communicative patients?"
    ],
    "actions": [
      "ASSESS PAIN: Location, character, severity, current regimen, response to treatment",
      "MULTIMODAL APPROACH: Combine different mechanisms for synergistic effect, lower individual doses",
      "BACKGROUND PAIN: Scheduled dosing—oral opioid (oxycodone) or IV morphine/fentanyl",
      "BREAKTHROUGH PAIN: PRN dosing—IV push opioid for rapid effect",
      "PROCEDURAL PAIN: Pre-medicate before dressing changes, positioning—ketamine excellent choice",
      "ADJUNCTS: Acetaminophen, NSAIDs (if no contraindications), ketamine low-dose, regional if possible",
      "NON-PHARMACOLOGICAL: Positioning, splinting, cooling, distraction"
    ],
    "resolution": "Martinez optimizes Wright's regimen: scheduled morphine 4mg IV q4h (background), morphine 2mg IV q2h PRN (breakthrough), ketamine 20mg IV before dressing changes (procedural), acetaminophen 1g PO q6h (adjunct). Positioning optimized, extremities elevated and splinted. Pain improves to 3/10 background, breakthrough rare, dressing changes tolerable. Wright able to participate in care activities. Key teaching: 'Pain management in PCC is about anticipating and addressing all three types: background, breakthrough, and procedural. Multimodal means using multiple agents to attack pain from different angles.'",
    "cat": "PROCEDURE",
    "focus": "Multimodal analgesia",
    "sys": "pain",
    "priority": 2,
    "vitalsParsed": {
      "bp": "138/86",
      "hr": "98",
      "rr": null,
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 138/86 (pain component), HR 98, grimacing, reluctant to participate in care",
      "isTraining": false
    }
  },
  {
    "ctl": "2014",
    "title": "Perform ARSC (Damage Control Surgery)",
    "story": "The Surgical Hold",
    "location": "Caquetá Department, Colombia — Austere Resuscitative Care",
    "characters": [
      {
        "who": "SFC Michael Okonkwo (18D Medical Sergeant)",
        "role": "ARSC trained, can perform damage control interventions."
      },
      {
        "who": "SSG Jake Morrison (18E / Patient)",
        "role": "Penetrating abdominal trauma, hemodynamically unstable, no surgical evacuation available for 12 hours."
      }
    ],
    "envBefore": "Morrison sustained penetrating abdominal trauma. Hemodynamically unstable despite resuscitation. Surgical evacuation 12 hours away. ARSC interventions needed.",
    "envDuring": "Okonkwo performs damage control interventions to bridge patient to surgical capability.",
    "presentation": "Penetrating abdominal trauma, unstable, surgical capability 12 hours away.",
    "opqrst": {
      "O": "Penetrating injury 2 hours ago",
      "P": "Unstable despite 4 units blood, ongoing resuscitation",
      "Q": "Distended abdomen, peritonitis",
      "R": "Abdomen",
      "S": "Critical—life-threatening",
      "T": "2 hours, not improving with resuscitation alone"
    },
    "vitals": "BP 82/58, HR 132, RR 28, abdomen distended and rigid, FAST positive",
    "assessment": [
      {
        "name": "Intra-abdominal Hemorrhage/Injury Requiring ARSC",
        "level": "CONFIRMED",
        "detail": "Penetrating trauma, peritonitis, positive FAST, hemodynamic instability"
      }
    ],
    "questions": [
      "What is Austere Resuscitative and Surgical Care (ARSC)?",
      "What interventions are within ARSC scope?",
      "When is exploratory laparotomy indicated vs REBOA/other temporizing measures?",
      "What is damage control surgery philosophy?",
      "How do you decide when ARSC is futile?",
      "What post-procedure care is required?"
    ],
    "actions": [
      "ARSC SCOPE: Limited laparotomy, hemorrhage control (packing, ligation), bowel resection without anastomosis, temporary closure",
      "DAMAGE CONTROL PRINCIPLES: Stop hemorrhage, control contamination, temporary closure, resuscitate, definitive repair later",
      "IF TRAINED AND EQUIPPED: Exploratory laparotomy for uncontrolled hemorrhage",
      "TECHNIQUE: Midline incision, four-quadrant packing, systematic exploration, control bleeding, control contamination",
      "TEMPORARY CLOSURE: Negative pressure wound therapy or simple plastic coverage",
      "POST-OPERATIVE: Continue DCR, antibiotics, keep warm, evacuate ASAP"
    ],
    "resolution": "Okonkwo, ARSC trained, performs damage control laparotomy. Midline incision, four-quadrant packing. Identifies small bowel injury and mesenteric bleeding. Ligates bleeding mesenteric vessel. Resects injured bowel segment, staples ends (no anastomosis). Packs abdomen, temporary closure with plastic and vacuum dressing. Morrison stabilizes: BP 96/62, HR 108. Continues blood product resuscitation. Evacuated at hour 12 to Role 3 for definitive repair. Morrison survives, eventually returns to duty. Key teaching: 'ARSC bridges the gap between point of injury and surgical capability. Damage control means stopping the dying—fix hemorrhage, control contamination, close temporarily. Definitive repair happens when the patient can tolerate it.'",
    "cat": "SURGICAL",
    "focus": "ARSC · damage control laparotomy",
    "sys": "surgical",
    "priority": 0,
    "vitalsParsed": {
      "bp": "82/58",
      "hr": "132",
      "rr": "28",
      "spo2": null,
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 82/58, HR 132, RR 28, abdomen distended and rigid, FAST positive",
      "isTraining": false
    }
  },
  {
    "ctl": "2015",
    "title": "Manage Chest Tube Drainage",
    "story": "The Chest Drainage",
    "location": "Tumaco, Colombia — PCC Day 2",
    "characters": [
      {
        "who": "SSG Rafael Mendez (18D Medical Sergeant)",
        "role": "Chest tube management experience."
      },
      {
        "who": "SFC Kevin O'Brien (18B / Patient)",
        "role": "Thoracic trauma, chest tube in place, day 2 PCC requiring ongoing drainage management."
      }
    ],
    "envBefore": "O'Brien has chest tube for hemopneumothorax, day 2 of PCC. Requires ongoing chest drainage system management.",
    "envDuring": "Mendez manages chest tube drainage system, monitors output, and troubleshoots issues.",
    "presentation": "Chest tube in place for hemopneumothorax, day 2 PCC, ongoing drainage management.",
    "opqrst": {
      "O": "Chest tube placed 36 hours ago",
      "P": "Ongoing drainage, requires management",
      "Q": "Serosanguinous output, air leak present",
      "R": "Right chest",
      "S": "Stable but requires active management",
      "T": "Day 2 of chest tube management"
    },
    "vitals": "SpO2 96% on 2L NC, RR 18, breath sounds present bilaterally",
    "assessment": [
      {
        "name": "Ongoing Chest Tube Management in PCC",
        "level": "CURRENT STATUS",
        "detail": "Functioning chest tube, air leak, continued drainage"
      }
    ],
    "questions": [
      "What are the components of a chest drainage system?",
      "How do you assess chest tube function?",
      "What does tidaling indicate?",
      "What does an air leak indicate and when is it concerning?",
      "What output volume/character is concerning?",
      "When can a chest tube be removed?"
    ],
    "actions": [
      "ASSESS DRAINAGE: Volume (record hourly), character (bloody→serosanguinous→serous), trend",
      "ASSESS AIR LEAK: Bubbling in water seal—continuous (large leak) vs with cough only (small leak)",
      "ASSESS TIDALING: Fluid fluctuation with respiration = patent tube, connected to pleural space",
      "MAINTAIN SYSTEM: Keep below chest level, secure connections, don't clamp (unless directed), keep upright",
      "CONCERNING OUTPUT: >200 mL/hr for 2-3 hours = potential thoracotomy indication",
      "REMOVAL CRITERIA: No air leak x 24-48 hours, <150-200 mL/24 hours, lung expanded on CXR"
    ],
    "resolution": "Mendez assesses O'Brien's chest tube: output 40 mL over past 4 hours (improving), serosanguinous, small air leak with cough only, tidaling present. System intact, connections secure. Documents trending output. By day 3, air leak resolved, output <100 mL/24 hours. Continues management until evacuation day 4, where chest tube removed at Role 3 after CXR confirms lung expansion. Key teaching: 'Chest tubes save lives, but they need babysitting. Assess output, air leak, and function every few hours. Know what's normal and what's concerning.'",
    "cat": "PROCEDURE",
    "focus": "Chest tube · air leak · tidaling",
    "sys": "respiratory",
    "priority": 2,
    "vitalsParsed": {
      "bp": null,
      "hr": null,
      "rr": "18",
      "spo2": "96",
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "SpO2 96% on 2L NC, RR 18, breath sounds present bilaterally",
      "isTraining": false
    }
  },
  {
    "ctl": "2016",
    "title": "Manage Mechanical Ventilation",
    "story": "The Breathing Machine",
    "location": "Loreto Region, Peru — PCC with Ventilated Patient",
    "characters": [
      {
        "who": "SFC David Kim (18D Medical Sergeant)",
        "role": "Ventilator management trained, understands the basics deeply."
      },
      {
        "who": "SFC Jake Morrison (18E / Patient)",
        "role": "Intubated trauma patient, day 2 PCC, requires ongoing ventilator management."
      }
    ],
    "envBefore": "Morrison is intubated on portable ventilator, day 2 of PCC. Requires ongoing ventilator management with basic principles.",
    "envDuring": "Kim manages ventilator settings using basic principles for prolonged mechanical ventilation.",
    "presentation": "Intubated trauma patient, day 2 PCC, on mechanical ventilation.",
    "opqrst": {
      "O": "Intubated 48 hours ago",
      "P": "Requires ongoing ventilator management",
      "Q": "Currently on volume-controlled ventilation",
      "R": "Pulmonary",
      "S": "Stable on current settings",
      "T": "Day 2 ventilator management"
    },
    "vitals": "SpO2 96%, ETCO2 38, RR 16 (set), no patient-ventilator dyssynchrony",
    "assessment": [
      {
        "name": "Stable Intubated Patient Requiring Ventilator Management",
        "level": "CURRENT STATUS",
        "detail": "Adequate oxygenation/ventilation, appropriate settings"
      }
    ],
    "questions": [
      "What are the basic ventilator modes?",
      "What are the initial settings for most trauma patients?",
      "How do you adjust FiO2 vs PEEP for oxygenation?",
      "How do you adjust rate vs tidal volume for ventilation?",
      "What are the signs of patient-ventilator dyssynchrony?",
      "What are the complications of mechanical ventilation?"
    ],
    "actions": [
      "BASIC SETTINGS: Mode (AC/VC typical), Rate 12-16, Tidal Volume 6-8 mL/kg IBW, FiO2 to maintain SpO2 >92%, PEEP 5-8",
      "OXYGENATION (SpO2): Adjust FiO2 and PEEP—if low, increase FiO2 first, then PEEP",
      "VENTILATION (ETCO2): Adjust rate and tidal volume—if high CO2, increase rate (first) or TV",
      "MONITOR: SpO2, ETCO2, peak pressures, patient comfort/synchrony",
      "DYSSYNCHRONY: Patient fighting vent—assess for pain, anxiety, hypoxia, auto-PEEP; may need sedation adjustment",
      "LUNG PROTECTIVE: Keep plateau pressure <30 cmH2O, TV 6-8 mL/kg to prevent VILI"
    ],
    "resolution": "Kim monitors Morrison's ventilator: SpO2 96% on FiO2 0.4, ETCO2 38 on rate 16, TV 500 (6 mL/kg for 80kg patient), PEEP 5. Peak pressures 22 cmH2O. No dyssynchrony. Maintains settings, documents hourly. When ETCO2 drifts up to 46, increases rate to 18—normalizes. When SpO2 dips to 91%, increases PEEP to 8—normalizes. Systematic management maintains stability through evacuation. Key teaching: 'Ventilators are simple once you understand: FiO2 and PEEP for oxygenation, rate and tidal volume for ventilation. Monitor, trend, adjust.'",
    "cat": "PROCEDURE",
    "focus": "Ventilator · FiO2/PEEP · RR/TV",
    "sys": "respiratory",
    "priority": 1,
    "vitalsParsed": {
      "bp": null,
      "hr": null,
      "rr": "16",
      "spo2": "96",
      "temp": null,
      "etco2": "38",
      "map": null,
      "pain": null,
      "other": "SpO2 96%, ETCO2 38, RR 16 (set), no patient-ventilator dyssynchrony",
      "isTraining": false
    }
  },
  {
    "ctl": "2017",
    "title": "Perform Neonatal Resuscitation",
    "story": "The First Breath",
    "location": "Putumayo Department, Colombia — PCC Environment",
    "characters": [
      {
        "who": "SFC Carlos Martinez (18D Medical Sergeant)",
        "role": "Neonatal resuscitation trained, has delivered babies in the field."
      },
      {
        "who": "CPT Maria Santos (Local Hospital Contact)",
        "role": "Supporting complicated field delivery."
      }
    ],
    "envBefore": "Scenario: Local national female in labor, complicated delivery, neonate requires resuscitation. (Training scenario for neonatal resuscitation principles.)",
    "envDuring": "Martinez performs neonatal resuscitation following NRP guidelines.",
    "presentation": "Training scenario—newborn resuscitation requiring positive pressure ventilation.",
    "opqrst": {
      "O": "Delivery moment",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Critical—non-breathing neonate",
      "T": "Time-critical"
    },
    "vitals": "BP 70/45, HR 140, RR 50, SpO2 94%, Temp 36.8°C. Newborn post-resuscitation: HR 140 from 80, spontaneous breathing, good color returning.",
    "assessment": [
      {
        "name": "Neonatal Resuscitation Required",
        "level": "SCENARIO",
        "detail": "Non-breathing neonate with bradycardia"
      }
    ],
    "questions": [
      "What are the initial steps in neonatal resuscitation?",
      "What determines whether PPV is needed?",
      "What is the correct rate and technique for neonatal PPV?",
      "What HR response indicates effective ventilation?",
      "When are chest compressions indicated in neonates?",
      "What medications are used in neonatal resuscitation?"
    ],
    "actions": [
      "INITIAL STEPS: Warm, dry, stimulate, position airway, clear secretions if needed",
      "ASSESS: Breathing and HR within 30 seconds",
      "IF NOT BREATHING/HR <100: Begin PPV with room air (or low O2) at 40-60 breaths/min",
      "EFFECTIVE VENTILATION: Look for chest rise, HR should increase rapidly if effective",
      "IF HR <60 DESPITE EFFECTIVE PPV: Chest compressions 3:1 ratio (90 compressions + 30 breaths/min)",
      "EPINEPHRINE: If HR remains <60 despite effective ventilation + compressions—0.01-0.03 mg/kg IV/IO"
    ],
    "resolution": "Martinez applies NRP principles: initial steps (warm, dry, stimulate), positions airway, assesses—HR 80, not breathing. Initiates PPV with BVM at 40 breaths/min. Observes chest rise. After 30 seconds: HR 110, pink color improving, beginning respiratory effort. Continues support. At 2 minutes: HR 140, spontaneous breathing, good color. Ongoing monitoring. Key teaching: 'Neonatal resuscitation is ventilation, ventilation, ventilation. Most babies respond to effective PPV alone. Compressions are rare, medications rarer. Get air in, and most babies pink up fast.'",
    "cat": "SPECIAL POP",
    "focus": "NRP · neonatal resuscitation",
    "sys": "neonatal",
    "priority": 0,
    "vitalsParsed": {
      "bp": "70/45",
      "hr": "140",
      "rr": "50",
      "spo2": "94",
      "temp": "36.8",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Newborn post-resuscitation: HR 140 from 80, spontaneous breathing, good color returning.",
      "isTraining": false
    }
  },
  {
    "ctl": "2018",
    "title": "Manage Pregnant Trauma Patient",
    "story": "The Pregnant Casualty",
    "location": "Training Scenario — OB Emergencies",
    "characters": [
      {
        "who": "SFC Michael Okonkwo (18D Instructor)",
        "role": "OB emergency experience, teaches the modifications."
      },
      {
        "who": "Students (Students)",
        "role": "Learning trauma care modifications for pregnant patients."
      }
    ],
    "envBefore": "Training scenario on modifications to trauma care for pregnant patients.",
    "envDuring": "Okonkwo teaches the physiological changes and management modifications for pregnant trauma patients.",
    "presentation": "Training scenario—pregnant trauma patient management principles.",
    "opqrst": {
      "O": "Training scenario",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Educational priority",
      "T": "N/A"
    },
    "vitals": "BP 104/62, HR 102, RR 20, SpO2 97%, Temp 36.9°C. Pregnant trauma (28 wk): fundus palpable, left lateral tilt initiated. Increased blood volume may mask early shock.",
    "assessment": [
      {
        "name": "Pregnant Trauma Patient Management Training",
        "level": "SCENARIO",
        "detail": "Educational objective"
      }
    ],
    "questions": [
      "What are the physiological changes of pregnancy affecting trauma care?",
      "How is blood volume different in pregnancy?",
      "What is aortocaval compression and how do you prevent it?",
      "When does the fetus become viable?",
      "What are the priorities in pregnant trauma care?",
      "What is perimortem cesarean section and when is it indicated?"
    ],
    "actions": [
      "PRIORITIZE THE MOTHER: Best care for the fetus is optimal care for the mother",
      "BLOOD VOLUME: Increased 30-50% in pregnancy—can lose significant blood before vital sign changes",
      "POSITION: Left lateral tilt (15-30°) to prevent aortocaval compression after 20 weeks",
      "FLUID RESUSCITATION: May need more aggressive resuscitation due to expanded blood volume",
      "MEDICATIONS: Most resuscitation meds safe; avoid ACE inhibitors, warfarin, certain antibiotics",
      "PERIMORTEM C-SECTION: If maternal cardiac arrest and >24 weeks, consider C-section within 5 minutes to save fetus and improve maternal resuscitation"
    ],
    "resolution": "Okonkwo teaches: 'Treat the mother aggressively—that's how you save the baby. Tilt her to the left, be aggressive with fluids, and know that her vital signs may look okay even when she's in trouble because of expanded blood volume. Pregnant patients compensate until they crash.'",
    "cat": "SPECIAL POP",
    "focus": "OB trauma · L-lateral tilt",
    "sys": "obstetric",
    "priority": 1,
    "vitalsParsed": {
      "bp": "104/62",
      "hr": "102",
      "rr": "20",
      "spo2": "97",
      "temp": "36.9",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Pregnant trauma (28 wk): fundus palpable, left lateral tilt initiated. Increased blood volume may mask early shock.",
      "isTraining": false
    }
  },
  {
    "ctl": "2019",
    "title": "Manage Pediatric Patient",
    "story": "The Pediatric Puzzle",
    "location": "Training Scenario — Pediatric Emergencies",
    "characters": [
      {
        "who": "SSG Rafael Mendez (18D Instructor)",
        "role": "Pediatric emergency experience."
      },
      {
        "who": "Students (Students)",
        "role": "Learning pediatric assessment and management modifications."
      }
    ],
    "envBefore": "Training scenario on pediatric assessment and management principles.",
    "envDuring": "Mendez teaches the anatomic and physiologic differences affecting pediatric emergency care.",
    "presentation": "Training scenario—pediatric patient assessment and management.",
    "opqrst": {
      "O": "Training scenario",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Educational priority",
      "T": "N/A"
    },
    "vitals": "BP 92/58, HR 138, RR 28, SpO2 96%, Temp 37.4°C. 6 y/o, ~20 kg (Broselow yellow). Tachycardia is earliest sign of shock; cap refill 3 s.",
    "assessment": [
      {
        "name": "Pediatric Emergency Care Training",
        "level": "SCENARIO",
        "detail": "Educational objective"
      }
    ],
    "questions": [
      "What are the key anatomic differences in pediatric airways?",
      "How do pediatric vital signs differ by age?",
      "How do you calculate weight-based dosing?",
      "What are the signs of shock in children?",
      "How does fluid resuscitation differ in children?",
      "What is the Broselow tape and how is it used?"
    ],
    "actions": [
      "AIRWAY: Larger head/tongue, anterior airway, narrowest at cricoid (uncuffed tubes historically, cuffed now acceptable)",
      "WEIGHT ESTIMATION: Broselow tape, or (age+4)×2 for kg",
      "VITAL SIGNS: HR and RR higher in children, BP lower—know normal ranges by age",
      "SHOCK RECOGNITION: Tachycardia is earliest sign; hypotension is late/ominous",
      "FLUID RESUSCITATION: 20 mL/kg boluses (not 1-2L adult boluses)",
      "DRUG DOSING: All weight-based—memorize key drugs or use reference"
    ],
    "resolution": "Mendez teaches: 'Kids aren't small adults. They have big heads, small airways, and fast heart rates. They compensate well until they don't—then they crash fast. Know your weight-based dosing, recognize tachycardia as the first sign of trouble, and use the Broselow tape if you have one.'",
    "cat": "SPECIAL POP",
    "focus": "Pediatric · weight-based dosing",
    "sys": "pediatric",
    "priority": 1,
    "vitalsParsed": {
      "bp": "92/58",
      "hr": "138",
      "rr": "28",
      "spo2": "96",
      "temp": "37.4",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "6 y/o, ~20 kg (Broselow yellow). Tachycardia is earliest sign of shock; cap refill 3 s.",
      "isTraining": false
    }
  },
  {
    "ctl": "2020",
    "title": "Manage Geriatric Patient",
    "story": "The Geriatric Challenge",
    "location": "Training Scenario — Geriatric Emergencies",
    "characters": [
      {
        "who": "SFC David Kim (18D Instructor)",
        "role": "Geriatric patient experience."
      },
      {
        "who": "Students (Students)",
        "role": "Learning geriatric assessment and management modifications."
      }
    ],
    "envBefore": "Training scenario on geriatric patient assessment and management principles.",
    "envDuring": "Kim teaches the physiologic changes and medication considerations in elderly patients.",
    "presentation": "Training scenario—geriatric patient assessment and management.",
    "opqrst": {
      "O": "Training scenario",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Educational priority",
      "T": "N/A"
    },
    "vitals": "BP 108/64, HR 74, RR 18, SpO2 95%, Temp 36.6°C. Elderly trauma, baseline BP ~150/90 on β-blocker. Apparently normal vitals may represent occult shock.",
    "assessment": [
      {
        "name": "Geriatric Emergency Care Training",
        "level": "SCENARIO",
        "detail": "Educational objective"
      }
    ],
    "questions": [
      "How do vital sign norms differ in elderly patients?",
      "What medications commonly affect elderly patient presentations?",
      "How does decreased physiologic reserve affect trauma response?",
      "What are the common injuries in elderly trauma?",
      "How does pain presentation differ in elderly?",
      "What are the polypharmacy considerations?"
    ],
    "actions": [
      "VITAL SIGNS: May normally be on beta blockers (won't get tachycardic), baseline hypertension (normal BP may be shock)",
      "MEDICATIONS: Anticoagulants (bleeding risk), beta blockers (blunted response), diuretics (dehydration)",
      "PHYSIOLOGIC RESERVE: Less ability to compensate—same injury is more severe",
      "COMMON INJURIES: Hip fractures, subdural hematomas (brain atrophy = more space to bleed)",
      "PAIN PRESENTATION: May not report pain typically—altered mental status may be only sign",
      "FLUID RESUSCITATION: Careful—less tolerance for overload, CHF risk"
    ],
    "resolution": "Kim teaches: 'Elderly patients are fragile—they have less reserve and more medications complicating the picture. Don't be reassured by normal vital signs if they're on beta blockers. What looks like mild confusion may be their version of severe pain or serious illness. Get a medication list and account for it.'",
    "cat": "SPECIAL POP",
    "focus": "Geriatric · polypharmacy",
    "sys": "geriatric",
    "priority": 2,
    "vitalsParsed": {
      "bp": "108/64",
      "hr": "74",
      "rr": "18",
      "spo2": "95",
      "temp": "36.6",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Elderly trauma, baseline BP ~150/90 on β-blocker. Apparently normal vitals may represent occult shock.",
      "isTraining": false
    }
  },
  {
    "ctl": "2021",
    "title": "Prepare Patient for Evacuation",
    "story": "The Evacuation Preparation",
    "location": "PCC Site — Preparing for MEDEVAC",
    "characters": [
      {
        "who": "SFC Carlos Martinez (18D Medical Sergeant)",
        "role": "Multiple combat evacuations, knows the handoff process."
      },
      {
        "who": "DUSTOFF Crew (Evacuation Team)",
        "role": "Arriving for patient pickup."
      },
      {
        "who": "SFC Thomas Wright (18B / Patient)",
        "role": "Multi-trauma patient, day 4 PCC, ready for evacuation."
      }
    ],
    "envBefore": "Wright has been in PCC for 4 days. MEDEVAC finally available. Must prepare patient and documentation for evacuation.",
    "envDuring": "Martinez prepares patient for evacuation—packaging, documentation, handoff.",
    "presentation": "Multi-trauma patient, day 4 PCC, stable for evacuation.",
    "opqrst": {
      "O": "Injury 4 days ago",
      "P": "Stable after PCC management",
      "Q": "Ready for evacuation",
      "R": "Multiple systems",
      "S": "Stable",
      "T": "Day 4, evacuation available"
    },
    "vitals": "BP 118/74, HR 82, SpO2 96% on 2L NC, stable",
    "assessment": [
      {
        "name": "PCC Patient Ready for Evacuation",
        "level": "CURRENT STATUS",
        "detail": "Stable, MEDEVAC available"
      }
    ],
    "questions": [
      "What are the components of patient packaging for evacuation?",
      "What documentation must accompany the patient?",
      "What is included in the evacuation handoff?",
      "How do you ensure continuity of care?",
      "What equipment stays with the patient?",
      "What are the potential complications during evacuation?"
    ],
    "actions": [
      "PATIENT PACKAGING: Secure all lines/tubes/drains, protect airway, immobilize as needed, thermal protection",
      "DOCUMENTATION: Mechanism of injury, all interventions, vital sign trends, current medications, allergies, blood products given",
      "HANDOFF: Verbal SBAR, written documentation, contact info for questions",
      "EQUIPMENT: Essential equipment travels with patient—adequate O2, monitors, IV pumps/fluids, medications",
      "ANTICIPATE PROBLEMS: Altitude effects, vibration, limited access in aircraft—address before loading",
      "COMMUNICATE: Confirm receiving facility knows patient is coming, what to expect"
    ],
    "resolution": "Martinez prepares Wright: all tubes secured, lines patent, thermal blanket, oxygen setup confirmed. Documentation packet completed—4 days of care summarized. Verbal handoff to DUSTOFF medic: 'This is Wright, day 4 post-blast bilateral LE amputations, last vitals stable, currently on morphine drip, last dose antibiotics 2 hours ago, 4 units PRBC total...' Documentation transferred. Wright loaded, evacuated successfully, arrives at Role 3 with complete picture of PCC care. Key teaching: 'The evacuation handoff is where things fall through the cracks. Document everything, give a clear verbal handoff, make sure the receiving facility knows what's coming. Your 4 days of work is worthless if the next team doesn't know what you did.'",
    "cat": "COORDINATION",
    "focus": "Evac packaging · SBAR handoff",
    "sys": "comms",
    "priority": 1,
    "vitalsParsed": {
      "bp": "118/74",
      "hr": "82",
      "rr": null,
      "spo2": "96",
      "temp": null,
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "BP 118/74, HR 82, SpO2 96% on 2L NC, stable",
      "isTraining": false
    }
  },
  {
    "ctl": "2022",
    "title": "Perform Mass Casualty Triage",
    "story": "The Ethical Decision",
    "location": "Remote Location — Mass Casualty with Limited Resources",
    "characters": [
      {
        "who": "MSG William Carter (18D Senior Medical Sergeant)",
        "role": "Multiple combat deployments, has faced impossible choices."
      },
      {
        "who": "Multiple Casualties (Patients)",
        "role": "Mass casualty event with resources insufficient for all."
      }
    ],
    "envBefore": "Mass casualty event with 8 severely injured casualties. Resources (blood, supplies, personnel) sufficient for perhaps 4. Evacuation 24 hours away.",
    "envDuring": "Carter must make triage decisions that will determine who receives care.",
    "presentation": "Mass casualty triage scenario—ethical decision-making.",
    "opqrst": {
      "O": "Mass casualty event",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Critical—resource limitation",
      "T": "Time-critical decisions"
    },
    "vitals": "BP 88/60, HR 124, RR 26, SpO2 93%, Temp 36.4°C. Index casualty of 8 — IMMEDIATE (red). Two patients categorized EXPECTANT; remainder DELAYED / MINIMAL.",
    "assessment": [
      {
        "name": "Mass Casualty Triage with Limited Resources",
        "level": "SCENARIO",
        "detail": "Demand exceeds capability"
      }
    ],
    "questions": [
      "What are the triage categories and their meanings?",
      "How do you determine survivability?",
      "What ethical principles guide triage decisions?",
      "How do you communicate triage decisions?",
      "What is the expectant category and when is it used?",
      "How do you deal with the psychological burden of triage decisions?"
    ],
    "actions": [
      "TRIAGE CATEGORIES: Immediate (red), Delayed (yellow), Minimal (green), Expectant (black)",
      "PRINCIPLE: Do the greatest good for the greatest number",
      "SURVIVABILITY ASSESSMENT: Injury severity, resources required, likelihood of survival with treatment",
      "EXPECTANT: Injuries incompatible with survival given available resources—provide comfort care",
      "DOCUMENTATION: Document triage decisions and rationale",
      "REASSESS: Triage is dynamic—reassess as resources change or patients change"
    ],
    "resolution": "Carter applies mass casualty triage principles. Two casualties with non-survivable injuries given available resources are categorized expectant—comfort care only. Remaining six are prioritized based on survivability and resource requirements. Carter documents decisions, ensures expectant patients receive pain control and dignity. All six treated casualties survive to evacuation. Carter processes the decisions later with support. Key teaching: 'Triage decisions are never easy, but they're essential. The goal is to save the most lives possible with the resources you have. Expectant is not abandonment—it's honest acknowledgment of reality and redirecting resources where they can make a difference.'",
    "cat": "TRIAGE",
    "focus": "Mass casualty triage · expectant",
    "sys": "triage",
    "priority": 0,
    "vitalsParsed": {
      "bp": "88/60",
      "hr": "124",
      "rr": "26",
      "spo2": "93",
      "temp": "36.4",
      "etco2": null,
      "map": null,
      "pain": "7",
      "other": "Index casualty of 8 — IMMEDIATE (red). Two patients categorized EXPECTANT; remainder DELAYED / MINIMAL.",
      "isTraining": false
    }
  },
  {
    "ctl": "2023",
    "title": "Provide End of Life Care",
    "story": "The Final Hours",
    "location": "PCC Site — End of Life Care",
    "characters": [
      {
        "who": "SFC Michael Okonkwo (18D Medical Sergeant)",
        "role": "Has provided comfort care in combat, knows its importance."
      },
      {
        "who": "SSG Kevin O'Brien (18B / Patient)",
        "role": "Catastrophic injuries, non-survivable, transitioning to comfort care."
      }
    ],
    "envBefore": "O'Brien sustained catastrophic injuries. Despite resuscitative efforts, injuries are non-survivable. Decision made to transition to comfort care.",
    "envDuring": "Okonkwo provides comfort care for a dying teammate.",
    "presentation": "Patient with non-survivable injuries, comfort care measures.",
    "opqrst": {
      "O": "Catastrophic injury",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Terminal",
      "T": "End of life"
    },
    "vitals": "BP 82/48, HR 46, RR 8, SpO2 88%, Temp 35.9°C. Declining trajectory — comfort care only. Opioid titrated to comfort, family at bedside.",
    "assessment": [
      {
        "name": "End of Life Care in PCC",
        "level": "SCENARIO",
        "detail": "Non-survivable injuries, comfort care appropriate"
      }
    ],
    "questions": [
      "When is the decision made to transition to comfort care?",
      "What are the components of comfort care?",
      "How do you manage pain and dyspnea at end of life?",
      "How do you provide dignity in dying?",
      "What support do teammates need?",
      "What are the after-death procedures?"
    ],
    "actions": [
      "DECISION: Made by senior medical personnel with command consultation when possible",
      "PAIN MANAGEMENT: Adequate opioids for comfort—no ceiling in end-of-life care",
      "DYSPNEA: Opioids, positioning, oxygen for comfort (not prolongation)",
      "DIGNITY: Clean, covered, accompanied—no one dies alone if possible",
      "COMMUNICATION: Keep teammates informed, allow time to say goodbye if possible",
      "AFTER DEATH: Dignified handling of remains, documentation, personal effects secured"
    ],
    "resolution": "Okonkwo ensures O'Brien is comfortable—morphine for pain, positioned comfortably, cleaned up, teammates present. No heroic measures that would only prolong suffering. Okonkwo stays with O'Brien, talks to him, ensures he's not alone. O'Brien passes peacefully. Teammates supported, rituals observed, remains handled with dignity. Okonkwo debriefs the team, ensures access to support. Key teaching: 'Sometimes the best care we can provide is a comfortable, dignified death surrounded by brothers. Comfort care is not giving up—it's the right care for the situation. And taking care of the living survivors is part of the job too.'",
    "cat": "END OF LIFE",
    "focus": "Comfort care · dignity",
    "sys": "eol",
    "priority": 2,
    "vitalsParsed": {
      "bp": "82/48",
      "hr": "46",
      "rr": "8",
      "spo2": "88",
      "temp": "35.9",
      "etco2": null,
      "map": null,
      "pain": "0",
      "other": "Declining trajectory — comfort care only. Opioid titrated to comfort, family at bedside.",
      "isTraining": false
    }
  },
  {
    "ctl": "2024",
    "title": "Complete PCC Documentation",
    "story": "The Living Document",
    "location": "PCC Site — Documentation Requirements",
    "characters": [
      {
        "who": "SSG Rafael Mendez (18D Medical Sergeant)",
        "role": "Meticulous documentation, knows its importance."
      },
      {
        "who": "Students (Students)",
        "role": "Learning PCC documentation requirements."
      }
    ],
    "envBefore": "Training on documentation requirements for prolonged casualty care.",
    "envDuring": "Mendez teaches comprehensive PCC documentation using the PCC flowsheet and related documents.",
    "presentation": "Training scenario—PCC documentation.",
    "opqrst": {
      "O": "Training requirement",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Administrative/legal priority",
      "T": "N/A"
    },
    "vitals": "BP 118/76, HR 84, RR 16, SpO2 97%, Temp 37.0°C. Stable PCC patient — exemplar flowsheet entry. q1h vitals, hourly I/O, intervention log current.",
    "assessment": [
      {
        "name": "PCC Documentation Training",
        "level": "SCENARIO",
        "detail": "Educational objective"
      }
    ],
    "questions": [
      "Why is documentation critical in PCC?",
      "What are the components of the PCC flowsheet?",
      "How often should vitals and assessments be documented?",
      "What input/output tracking is required?",
      "How do you document interventions and responses?",
      "What happens to documentation at evacuation?"
    ],
    "actions": [
      "TCCC CARD: Initial documentation at point of injury",
      "PCC FLOWSHEET: Ongoing documentation for prolonged care—vitals, I/O, interventions, assessments",
      "FREQUENCY: Vitals minimum every 1-2 hours; more frequent if unstable",
      "INPUT/OUTPUT: Track all fluids in (IV, oral, blood products) and out (urine, drains, estimated blood loss)",
      "INTERVENTIONS: Time, what was done, by whom, patient response",
      "TRANSFERS: Documentation travels with patient; copy retained if possible"
    ],
    "resolution": "Mendez demonstrates PCC flowsheet: header information (patient ID, injury, allergies), hourly vital signs grid, medication log with times and doses, I/O tracking, nursing interventions checklist, notes section for assessments and changes. Students practice completing flowsheets for simulated patients. Key teaching: 'If you didn't document it, it didn't happen. And more importantly, the next provider can't continue good care without knowing what you did. The flowsheet is the story of your patient's PCC journey.'",
    "cat": "DOCUMENTATION",
    "focus": "PCC flowsheet · I/O · interventions",
    "sys": "documentation",
    "priority": 2,
    "vitalsParsed": {
      "bp": "118/76",
      "hr": "84",
      "rr": "16",
      "spo2": "97",
      "temp": "37.0",
      "etco2": null,
      "map": null,
      "pain": null,
      "other": "Stable PCC patient — exemplar flowsheet entry. q1h vitals, hourly I/O, intervention log current.",
      "isTraining": false
    }
  },
  {
    "ctl": "2025",
    "title": "Integrate PCC Skills (Capstone)",
    "story": "The Complete Picture",
    "location": "Training Scenario — PCC Capstone",
    "characters": [
      {
        "who": "MSG William Carter (18D Senior Instructor)",
        "role": "Synthesizing all PCC elements."
      },
      {
        "who": "Students (Students)",
        "role": "Completing PCC training block."
      }
    ],
    "envBefore": "Capstone PCC exercise integrating all elements of prolonged casualty care.",
    "envDuring": "Carter leads comprehensive PCC scenario requiring integration of all skills.",
    "presentation": "Capstone scenario—multi-day PCC simulation.",
    "opqrst": {
      "O": "Capstone exercise",
      "P": "N/A",
      "Q": "N/A",
      "R": "N/A",
      "S": "Training priority",
      "T": "N/A"
    },
    "vitals": "BP 112/72, HR 94, RR 18, SpO2 96%, Temp 37.6°C, ETCO2 38. Hour 36 of 72-hr capstone: intubated, sedated (RASS −1), enteral feeds running, awaiting evac.",
    "assessment": [
      {
        "name": "PCC Capstone Training Exercise",
        "level": "SCENARIO",
        "detail": "Integration of all PCC skills"
      }
    ],
    "questions": [
      "How do you integrate all PCC skills in real-time care?",
      "What is the systematic approach to PCC management?",
      "How do you prioritize competing demands?",
      "What are the keys to successful PCC?",
      "How do you maintain your own health during PCC?",
      "What have you learned about PCC?"
    ],
    "actions": [
      "SYSTEMATIC APPROACH: Use checklists and schedules to ensure nothing missed",
      "CONTINUOUS REASSESSMENT: Patient status changes—reassess and adapt",
      "ANTICIPATE: Think ahead—what might go wrong, what will you need next",
      "COMMUNICATE: With patient (if able), teammates, chain of command, teleconsult",
      "DOCUMENT: Ongoing, real-time documentation",
      "SELF-CARE: Rotate rest, eat, hydrate—you can't care for others if you're broken"
    ],
    "resolution": "Carter leads capstone exercise: 72-hour simulated PCC scenario with evolving patient conditions, resource limitations, and decision points. Students rotate through roles, managing airway, circulation, nursing care, documentation, teleconsult, and eventual evacuation. After-action review identifies strengths and areas for improvement. Key teaching: 'PCC is a team effort over time. It requires all your skills, good judgment, systematic approach, and teamwork. The goal is to get your patient to surgery alive and in the best possible condition. Everything you've learned comes together here.'\n\nPCC Quick Reference Guide\n  4-2-1 Rule (Maintenance Fluids):\n• 4 mL/kg/hr for first 10 kg\n• 2 mL/kg/hr for next 10 kg\n• 1 mL/kg/hr for each kg thereafter\n• Example: 80 kg patient = (4×10) + (2×10) + (1×60) = 120 mL/hr\n  ETCO2 Targets:\n• TBI patients: 35-40 mmHg (normocapnia)\n• Acute herniation: Brief hyperventilation to 25-30 mmHg\n• High ETCO2 → Increase RR or TV\n• Low ETCO2 → Decrease RR or TV\nSepsis Hour-1 Bundle:\n• 30 mL/kg crystalloid within 3 hours\n• Broad-spectrum antibiotics within 1 hour\n• Source control (drain collections)\n• Vasopressors if hypotensive despite fluids\nRASS Sedation Scale:\n+4 Combative\n+3 Very agitated\n+2 Agitated\n+1 Restless\n0 Alert and calm\n-1 Drowsy\n-2 Light sedation (TARGET)\n-3 Moderate sedation\n-4 Deep sedation\n-5 Unarousable\nKey Medication Doses:\n• Ketamine sedation: 0.5-2 mg/kg bolus, 0.5-2 mg/kg/hr infusion\n• Midazolam: 0.05-0.1 mg/kg bolus, 0.02-0.1 mg/kg/hr infusion\n• Morphine: 4mg IV q4h scheduled, 2mg IV q2h PRN\n• Meropenem (sepsis): 1g IV\n• Ceftriaxone + Metronidazole: 2g + 500mg IV\n\nI've generated a comprehensive Word document for Subject Area 20: Prolonged Casualty Care.\nView your SA20 Prolonged Casualty Care Scenarios document\n\nDocument Contents: 23 Detailed PCC Scenarios\nCTL\nScenario Title\nFocus\n2002\n\"The Searching Sound\"\neFAST exam, ultrasound views, serial monitoring\n2003\n\"The Calculated Drip\"\n4-2-1 rule, maintenance fluids, resuscitation endpoints\n2004\n\"The Daily Rounds\"\nComprehensive nursing care, DVT prophylaxis, pulmonary toilet\n2005\n\"The Measured Flow\"\nFoley catheterization, urethral injury screening\n2006\n\"The Carbon Dioxide Truth\"\nETCO2 monitoring, TBI ventilation targets\n2007\n\"The Definitive Tube\"\nCricothyrotomy, CICO emergency, surgical airway\n2008\n\"The Quiet Mind\"\nSedation management, RASS scale, ketamine/midazolam\n2009\n\"The Calculated Drip (Day 4)\"\nProlonged fluid management, enteral transition\n2010\n\"The Fever Fight\"\nSepsis recognition, qSOFA, Hour-1 Bundle\n2011\n\"The Remote Consultation\"\nTeleconsultation, SBAR presentation\n2012\n\"The Pain Balance\"\nMultimodal analgesia, background/breakthrough/procedural pain\n2014\n\"The Surgical Hold\"\nARSC, damage control surgery, laparotomy\n2015\n\"The Chest Drainage\"\nChest tube management, air leak, tidaling\n2016\n\"The Breathing Machine\"\nVentilator management, FiO2/PEEP, rate/TV\n2017\n\"The First Breath\"\nNeonatal resuscitation, NRP principles\n2018\n\"The Pregnant Casualty\"\nOB modifications, left lateral tilt, perimortem C-section\n2019\n\"The Pediatric Puzzle\"\nPediatric differences, weight-based dosing, Broselow\n2020\n\"The Geriatric Challenge\"\nElderly physiology, polypharmacy, blunted responses\n2021\n\"The Evacuation Preparation\"\nPatient packaging, SBAR handoff, documentation\n2022\n\"The Ethical Decision\"\nMass casualty triage, expectant category\n2023\n\"The Final Hours\"\nEnd of life care, comfort measures, dignity\n2024\n\"The Living Document\"\nPCC documentation, flowsheet components\n2025\n\"The Complete Picture\"\nCapstone integration, systematic approach\nBonus: Quick Reference Guide with 4-2-1 rule, ETCO2 targets, sepsis bundle, RASS scale, and key medication doses.",
    "cat": "CAPSTONE",
    "focus": "Integration · systematic approach",
    "sys": "integration",
    "priority": 2,
    "vitalsParsed": {
      "bp": "112/72",
      "hr": "94",
      "rr": "18",
      "spo2": "96",
      "temp": "37.6",
      "etco2": "38",
      "map": null,
      "pain": "4",
      "other": "Hour 36 of 72-hr capstone: intubated, sedated (RASS −1), enteral feeds running, awaiting evac.",
      "isTraining": false
    }
  }
];