const $ = id => document.getElementById(id);
const val = id => { const e=$(id); return e.type==='checkbox'?e.checked:(e.type==='range'||e.type==='number')?parseFloat(e.value):e.value; };
const r = (n,d=0) => d===0?Math.round(n):parseFloat(n.toFixed(d));
const gtt = (mlhr,f) => Math.round((mlhr*f)/60);

let currentTier = 1;
let selectedDrugKey = null;

// Tier accent colours (match --green / --blue / --purple) for the WebGL field.
const TIER_ACCENT = { 1: [0.290, 0.871, 0.502], 2: [0.376, 0.647, 0.980], 3: [0.753, 0.518, 0.988] };

function setTier(t) {
  currentTier = t;
  document.querySelectorAll('.tier-btn').forEach(b => {
    const on = parseInt(b.dataset.tier) === t;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  if (window.PFC_BG) window.PFC_BG.setAccent(TIER_ACCENT[t]);
  recalc();
}
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  $('theme-btn').textContent = isLight ? '☀️ Day' : '🌙 Night';
}

function getMods() {
  const w=val('weight'),age=val('age'),hemo=val('hemo'),airway=val('airway'),pain=val('pain');
  const tbi=val('tbi'),burns=val('burns'),preg=val('pregnancy');
  const hepatic=val('hepatic'),renal=val('renal'),opioidTol=val('opioid_tol');
  const hypo=val('hypothermic'),elderly=val('elderly'),alt=val('altitude'),cbrn=val('cbrn');
  const df=parseInt(val('dropfactor'));
  let pk=1.0;
  if(hepatic==='impaired')pk*=0.65;
  if(renal==='impaired')pk*=0.7;
  if(hypo)pk*=0.75;
  if(elderly||age>55)pk*=0.8;
  let opMod=opioidTol==='tolerant'?1.3:1.0;
  return{w,age,hemo,airway,pain,tbi,burns,preg,hepatic,renal,opioidTol,hypo,elderly,alt,cbrn,pk,opMod,df};
}

// ═══ DRUG DATABASE ═══
function buildDrugs(m) {
  const {w,pk,opMod,hemo,pain,burns,tbi,preg,renal,hepatic,alt,cbrn}=m;
  const inShock=hemo==='decompensated'||hemo==='compensated';
  const pkOp=(base)=>r(base*pk*opMod,1);

  // Succinylcholine contraindication logic
  const suxContra = burns||val('hypothermic'); // simplified — in real tool would track hours-since-injury

  const DB = {
  analgesics:{label:'Analgesics',color:'var(--green)',drugs:[
    {key:'acetaminophen',name:'Acetaminophen',tier:1,rows:[
      {dose:'1000–1300 mg PO q8h',formula:'CWMP fixed',route:'PO',onset:'30–60 min',peak:'1–2 hr',dur:'4–6 hr',speed:'—',ind:'Mild pain (CWMP)'}
    ],refs:'TCCC 2026 CWMP · Cap 4g/day · Hepatic flag reduces cap',
    explain:{title:'Acetaminophen (CWMP)',body:'Part of the 2026 Combat Wound Medication Pack (CWMP). Non-opioid, no respiratory depression. Updated from 1g to 1000–1300 mg q8h in 2026. Avoid in severe hepatic impairment. At altitude, AUC and t½ both increase (Wang et al. 2021) — consider extending dosing interval above 12,000 ft.',mods:hepatic==='impaired'?'⚠ Hepatic impairment: reduce max daily to 2g':'None applied',contras:'Severe liver disease; allergy',ref:'TCCC Guidelines 1 May 2026 §CWMP · Wang et al. 2021 Pharmaceuticals (altitude PK)'}},
    {key:'meloxicam',name:'Meloxicam',tier:1,rows:[
      {dose:'15 mg PO daily',formula:'CWMP fixed',route:'PO',onset:'1 hr',peak:'4–5 hr',dur:'24 hr',speed:'—',ind:'Mild pain (CWMP)',adj:inShock?'⚠ AVOID in shock/hemorrhage':''}
    ],refs:'TCCC 2026 CWMP · NOT in shock, resp distress, or pregnancy >20 wk',
    explain:{title:'Meloxicam (CWMP)',body:'NSAID component of the CWMP for stay-in-the-fight casualties. Provides anti-inflammatory analgesia without CNS depression. Contraindicated in active hemorrhage, hemorrhagic shock, TBI with bleeding risk, renal impairment, and pregnancy after 20 weeks.',mods:renal==='impaired'?'⚠ Renal impairment: AVOID':'Pregnancy: AVOID after 20 weeks',contras:'Active hemorrhage · Shock · Renal impairment · Pregnancy >20 wk',ref:'TCCC Guidelines 1 May 2026 §CWMP'}},
    {key:'suzetrigine',name:'Suzetrigine',tier:1,rows:[
      {dose:'100 mg PO ×1 load, then 50 mg PO q12h',formula:'CWMP fixed (two 50mg tabs load)',route:'PO',onset:'~1 hr',peak:'2–3 hr',dur:'12 hr',speed:'—',ind:'Mild-mod pain (CWMP 2026)',adj:''}
    ],refs:'TCCC 2026 CWMP (NEW) · NaV1.8 inhibitor · No resp depression · No addiction liability',
    explain:{title:'Suzetrigine (CWMP 2026 — NEW)',body:'First-in-class selective NaV1.8 sodium channel inhibitor targeting peripheral nociceptors. FDA-approved January 2025. Added to the CWMP in the 2026 TCCC revision specifically because it provides meaningful analgesia without respiratory depression, CNS sedation, or addiction liability — ideal for stay-in-the-fight. Load with 100 mg (two 50 mg tabs), then 50 mg q12h. No known drug interactions with TCCC medications. No SOF-specific outcome data yet.',mods:'None — not affected by PK modifiers in current evidence',contras:'Allergy · No data in pregnancy',ref:'TCCC Guidelines 1 May 2026 §CWMP · FDA NDA 216981 (suzetrigine) Jan 2025 · NCBl PMC12369754 (review)'}},
    {key:'ketamine',name:'Ketamine',tier:1,rows:[
      {dose:`${r(w*0.2)}–${r(w*0.3)} mg IV`,formula:`0.2–0.3 mg/kg × ${w} (TCCC)`,route:'IV',onset:'~30s',peak:'~30s',dur:'10–15 min',speed:'Over 1 min',ind:'Pain',adj:inShock?'✓ PREFERRED in shock':''},
      {dose:'50 mg IN',formula:'Fixed (TCCC 2026)',route:'IN',onset:'2–5 min',peak:'5–10 min',dur:'15–20 min',speed:'—',ind:'Pain'},
      {dose:'100 mg IM',formula:'Fixed (TCCC 2026)',route:'IM',onset:'1–5 min',peak:'1–5 min',dur:'20–30 min',speed:'—',ind:'Pain'},
      {dose:`${r(w*1)}–${r(w*2)} mg IV`,formula:`1–2 mg/kg × ${w}`,route:'IV',onset:'~30s',peak:'~30s',dur:'10–15 min',speed:'30–60s',ind:'Procedural sedation'},
    ],refs:`<span class="ref-tccc">TCCC: 0.2–0.3 mg/kg = ${r(w*0.2)}–${r(w*0.3)} mg IV</span> · <span class="ref-pcc">PCC drip: 750mg/250mL NS</span> · <span class="ref-jts">JTS CPG 61</span> · Stay-out zone: ${r(w*0.3)}–${r(w*0.8)} mg`,
    explain:{title:'Ketamine — The SOF Workhorse',body:`Ketamine is the primary analgesic across all TCCC tiers for moderate-to-severe pain, especially in shock. It maintains hemodynamic stability, preserves airway reflexes at analgesic doses, and provides bronchodilation. The 2026 TCCC simplified dosing to fixed options: 100 mg IM, 50 mg IN, or 25 mg (0.2–0.3 mg/kg) IV over 1 min.\n\nThe "stay-out zone" (0.3–0.8 mg/kg IV = ${r(w*0.3)}–${r(w*0.8)} mg for this patient) produces emergence reactions without reliable sedation. Either stay in analgesia (≤${r(w*0.2)} mg) or commit to procedural dissociation (≥${r(w*1)} mg).\n\nKetamine is SAFE in TBI (prior ICP concerns debunked). It is the PREFERRED analgesic in hemorrhagic shock, burns, and respiratory compromise.\n\nPFC drip: 750 mg in 250 mL NS = 3 mg/mL. Non-intubated: 1 mg/kg/h. Rule of thumb: mL/h ≈ weight ÷ 2.`,mods:alt!=='low'?'⚠ Altitude: expect prolonged duration, reduce re-dosing frequency':'Standard dosing',contras:'Known allergy (extremely rare) · Disarm casualty before administration',ref:'TCCC Guidelines 1 May 2026 §Analgesia · JTS CPG 61 (PFC Analgesia) · PCC CPG 91 Table 15'},
    drip:{name:'Ketamine',mix:'750 mg in 250 mL NS',conc:'3 mg/mL',lowMlhr:r(w/2),highMlhr:r(w),unit:'mL/hr',note:`≈ ${r(w*1.5/1000*60,1)}–${r(w*3/1000*60,1)} mg/min`}},
    {key:'esketamine',name:'Esketamine IN',tier:2,rows:[
      {dose:'14 or 28 mg IN ×1',formula:'Fixed (Spravato device)',route:'IN',onset:'2–5 min',peak:'20–40 min',dur:'2–4 hr',speed:'—',ind:'Pain (2026 addition)',adj:''}
    ],refs:'TCCC 2026 (NEW) · S(+) enantiomer ≈ 2× potency of racemic · Do NOT co-administer with benzodiazepines',
    explain:{title:'Esketamine IN (2026 — NEW)',body:'S-enantiomer of ketamine, approximately twice as potent. Added to TCCC 2026 as an intranasal option using the FDA-approved Spravato device (28 mg per device; half-device = 14 mg). Default to 14 mg with option to repeat at 30 min. The CoTCCC explicitly warns against co-administration with benzodiazepines.',mods:'None established',contras:'Do NOT co-administer with benzodiazepines · Same cautions as racemic ketamine',ref:'TCCC Guidelines 1 May 2026 §Analgesia'}},
    {key:'fentanyl',name:'Fentanyl*',tier:2,rows:[
      {dose:`${pkOp(25)}–${pkOp(100)} mcg IV`,formula:`25–100 mcg (PK adj)`,route:'IV',onset:'2 min',peak:'3–5 min',dur:'30–60 min',speed:'30–60s',ind:'Pain',adj:renal==='impaired'?'':''},
      {dose:`${pkOp(50)}–${pkOp(100)} mcg IM`,formula:'PK adjusted',route:'IM',onset:'5–15 min',peak:'20–30 min',dur:'1–2 hr',speed:'30–60s',ind:'Pain'},
    ],refs:`<span class="ref-tccc">⚠ REMOVED from initial TCCC 2026</span> · <span class="ref-pcc">PCC CPG 61: 25–100 mcg IV</span> · <span class="ref-jts">JTS: 25–200 mcg</span> · Drip: ${r(m.w*0.03,1)}–${r(m.w*0.1,1)} mcg/min`,
    explain:{title:'Fentanyl',body:'Removed from initial TCCC analgesia in 2026 (supply chain + respiratory depression concerns) but retained in PFC CPG 61 for intubated/secured-airway casualties. Short-acting, highly potent. Reduce 25% in hepatic/renal impairment. Rigid-chest syndrome risk with rapid IV push. SSRI/MAOI interaction warning (serotonin syndrome).',mods:[hepatic==='impaired'?'Hepatic: −25%':'',renal==='impaired'?'Renal: −25%':'',opMod>1?'Opioid tolerant: +30%':''].filter(Boolean).join(' · ')||'None',contras:'Respiratory depression without secured airway · MAOI within 14 days',ref:'JTS CPG 61 §Opioid Analgesics · PCC CPG 91'}},
    {key:'hydromorphone',name:'Hydromorphone',tier:2,rows:[
      {dose:`${r(0.25*pk*opMod,2)}–${r(2*pk*opMod,1)} mg IV`,formula:'0.25–2 mg (PK adj)',route:'IV',onset:'<5 min',peak:'15–30 min',dur:'1–4 hr',speed:'30–60s',ind:'Pain',adj:renal==='impaired'?'✓ Preferred over morphine in renal impairment':''},
    ],refs:'<span class="ref-pcc">PCC CPG 61: OPIOID OF CHOICE</span> · JTS 0.25–4 mg',
    explain:{title:'Hydromorphone',body:'PFC CPG 61 designates hydromorphone as the opioid of choice for prolonged care. Preferred over morphine because it lacks active metabolites that accumulate in renal impairment. Starting dose 0.5 mg IV; titrate to effect.',mods:[hepatic==='impaired'?'Hepatic: −25%':'',renal==='impaired'?'Renal: −25% (still preferred over morphine)':'',opMod>1?'Tolerant: +30%':''].filter(Boolean).join(' · ')||'None',contras:'Respiratory depression without monitoring · MAOIs',ref:'JTS CPG 61 §Opioid Analgesics · PCC CPG 91'}},
    {key:'morphine',name:'Morphine*',tier:2,rows:[
      {dose:`${r(2.5*pk*opMod,1)}–${r(10*pk*opMod)} mg IV`,formula:'2.5–10 mg (PK adj)',route:'IV',onset:'<5 min',peak:'20 min',dur:'1–4 hr',speed:'30–60s',ind:'Pain',adj:renal==='impaired'?'⚠ Active metabolites accumulate — prefer hydromorphone':''},
    ],refs:'REMOVED from TCCC 2026 · PCC CPG 61 retains for PFC · JTS 2.5–10 mg',
    explain:{title:'Morphine',body:'Removed from TCCC 2026 analgesia but retained in PFC CPG 61 for end-of-life/expectant care. Active metabolite M6G accumulates in renal failure. Histamine release can worsen hypotension. Use hydromorphone or fentanyl instead when possible.',mods:renal==='impaired'?'⚠ AVOID — active metabolites accumulate':'Standard',contras:'Renal impairment (prefer hydromorphone) · Shock (histamine release)',ref:'JTS CPG 61 · PCC CPG 91'}},
  ]},
  antibiotics:{label:'Antibiotics',color:'var(--amber)',drugs:[
    {key:'ceftriaxone',name:'Ceftriaxone',tier:1,rows:[
      {dose:'2g IV/IO over 3–5 min',formula:'Fixed',route:'IV/IO',onset:'30 min',peak:'1–2 hr',dur:'24 hr',speed:'3–5 min',ind:'POW prophylaxis'},
      {dose:'2g IM (in 4.2 mL NS or 1% lido)',formula:'Fixed',route:'IM',onset:'1 hr',peak:'2–3 hr',dur:'24 hr',speed:'—',ind:'POW prophylaxis'},
    ],refs:'<span class="ref-tccc">TCCC Change 25-1: REPLACES ertapenem</span> · NS ONLY — precipitates with LR/Ca++ · Flush 10–20 mL NS before/after',
    explain:{title:'Ceftriaxone (Change 25-1)',body:'Replaced ertapenem as the parenteral antibiotic in TCCC Change 25-1 (May 2025). Third-generation cephalosporin with excellent gram-negative coverage and better antibiotic stewardship profile than carbapenems.\n\nCRITICAL: Must be reconstituted and administered in NS ONLY. Ceftriaxone precipitates with calcium-containing solutions (LR, D5LR, Hartmann\'s). Always flush lines with 10–20 mL NS before and after. This is a testable, real-world patient safety issue.\n\nIM route: reconstitute in 4.2 mL NS or 1% lidocaine to reduce injection pain. Lateral thigh preferred.',mods:'None — fixed dose',contras:'Cephalosporin/penicillin allergy · NEVER in calcium-containing solutions',ref:'TCCC Change 25-1 (Wisniewski et al., JSOM 25(4), Dec 2025) · TCCC Guidelines 1 May 2026 §Antibiotics'}},
    {key:'cefadroxil',name:'Cefadroxil',tier:1,rows:[
      {dose:'1g PO daily',formula:'Fixed',route:'PO',onset:'1–2 hr',peak:'1.5–2 hr',dur:'24 hr',speed:'—',ind:'POW prophylaxis (oral)'},
    ],refs:'<span class="ref-tccc">TCCC 2026: preferred PO antibiotic (replaces moxifloxacin)</span> · Alt: cephalexin 500mg q6h',
    explain:{title:'Cefadroxil (replaces moxifloxacin)',body:'New preferred oral antibiotic in TCCC 2026, replacing moxifloxacin. First-generation cephalosporin with good gram-positive coverage appropriate for wound prophylaxis. Alternative: cephalexin 500 mg PO q6h if cefadroxil unavailable.',mods:'None',contras:'Cephalosporin allergy',ref:'TCCC Change 25-1 · TCCC Guidelines 1 May 2026'}},
    {key:'metronidazole',name:'Metronidazole',tier:2,rows:[
      {dose:'500 mg IV/PO q8h',formula:'Fixed',route:'IV/PO',onset:'1 hr',peak:'1–2 hr',dur:'8 hr',speed:'30–60 min IV',ind:'Anaerobic coverage (PFC)',adj:''},
    ],refs:'<span class="ref-pcc">PFC Sepsis CPG 75</span> · Add to ceftriaxone for abdominal/wound infections',
    explain:{title:'Metronidazole (PFC anaerobic coverage)',body:'Added to ceftriaxone in PFC settings when abdominal injury, wound contamination with soil/fecal material, or gas gangrene is suspected. Covers Bacteroides, Clostridium, and other anaerobes not covered by ceftriaxone alone.',mods:'None',contras:'Alcohol within 48h (disulfiram reaction) · First trimester pregnancy',ref:'JTS CPG 75 (Sepsis-PFC) · JTS CPG 91 §Antibiotics'}},
  ]},
  resuscitation:{label:'Resuscitation & Blood',color:'var(--red)',drugs:[
    {key:'txa',name:'TXA',tier:1,rows:[
      {dose:'2g IV/IO slow push',formula:'Fixed single dose (2026)',route:'IV/IO',onset:'5–10 min',peak:'3 hr',dur:'~24 hr',speed:'≤1 min push',ind:'Hemorrhage AND/OR TBI',adj:tbi?'✓ TBI = standalone indication (2026)':''},
    ],refs:'<span class="ref-tccc">TCCC 2026: single 2g push within 3h of injury</span> · TBI is now standalone indication · Replaces 1g+1g protocol',
    explain:{title:'Tranexamic Acid (TXA)',body:'The 2026 TCCC simplified TXA to a single 2g slow IV/IO push (previously 1g load + 1g infusion from CRASH-2). Must be given within 3 hours of injury — beyond 3 hours may INCREASE mortality.\n\nMajor 2026 change: TBI is now a STANDALONE indication for TXA. Previously required concurrent hemorrhage. Give TXA for significant TBI regardless of hemorrhage status.\n\nThe clock starts at time of wounding, not time of IV access.',mods:'None — fixed dose regardless of weight/PK',contras:'>3 hours post-injury (relative) · Active intravascular clotting (DIC)',ref:'TCCC Guidelines 1 May 2026 §TXA · Drew et al., JSOM Fall 2020 (single-dose rationale) · JTS CPG 18 (DCR)'}},
    {key:'calcium',name:'Calcium (with blood)',tier:2,rows:[
      {dose:'1g Ca gluconate (30 mL 10%) or 1g CaCl (10 mL 10%)',formula:'After 1st unit + q4 units',route:'IV/IO',onset:'1–3 min',peak:'5 min',dur:'30–60 min',speed:'2–3 min',ind:'Blood product administration',adj:'CaCl: central/IO only — caustic'},
    ],refs:'<span class="ref-jts">JTS DCR CPG 18</span> · After 1st blood unit, then every 4 units · Do NOT mix with ceftriaxone line',
    explain:{title:'Calcium with Blood Products',body:'Citrate in stored blood products chelates calcium, causing hypocalcemia that impairs coagulation and cardiac function. JTS DCR CPG 18 mandates 1g of calcium (elemental) after the first unit of blood and after every 4 units thereafter.\n\nCalcium gluconate 10%: 30 mL = ~270 mg elemental Ca. Safe peripherally.\nCalcium chloride 10%: 10 mL = ~270 mg elemental Ca. Caustic — central/IO only.\n\nDo NOT run calcium through the same line as ceftriaxone (precipitation).',mods:'None',contras:'Digoxin toxicity (use NaHCO₃ instead) · Same line as ceftriaxone',ref:'JTS CPG 18 (DCR) · JTS CPG 73 (DCR-PFC)'}},
  ]},
  sedatives:{label:'Sedatives',color:'var(--blue)',drugs:[
    {key:'midazolam',name:'Midazolam',tier:2,rows:[
      {dose:`${r(0.5*pk)}–${r(2*pk)} mg IV`,formula:`0.5–2 mg (PK adj, non-intubated)`,route:'IV',onset:'1–5 min',peak:'2–5 min',dur:'2–6 hr',speed:'>2 min',ind:'Sedation + seizure',adj:inShock?'⚠ Worsens hypotension':''},
      {dose:`${r(5*pk)}–${r(10*pk)} mg IM`,formula:'PK adjusted',route:'IM',onset:'15 min',peak:'15–60 min',dur:'2–6 hr',speed:'>2 min',ind:'Sedation + seizure'},
    ],refs:'<span class="ref-tccc">TCCC: 0.5–2 mg</span> · <span class="ref-pcc">PCC: 0.5–4 mg</span> · Do NOT co-administer with opioids for analgesia (TCCC 2026)',
    explain:{title:'Midazolam',body:'Benzodiazepine for sedation, seizures, and emergence prophylaxis with ketamine. TCCC 2026 explicitly states: give more ketamine before reaching for a benzodiazepine if dissociation is incomplete. Do NOT co-administer with opioids for analgesia.\n\nPFC drip: 0.25–1.0 mcg/kg/min. Hepatically metabolized — reduce in liver impairment. Synergistic respiratory depression with opioids — advanced airway readiness required at higher doses.',mods:[hepatic==='impaired'?'Hepatic: −35%':'',pk<0.9?'PK modifiers applied':''].filter(Boolean).join(' · ')||'Standard',contras:'Co-admin with opioids for analgesia · Uncontrolled shock',ref:'TCCC 2026 §Sedation · JTS CPG 61 §Sedation · PCC CPG 91'}},
    {key:'propofol',name:'Propofol',tier:3,rows:[
      {dose:`${r(w*2)}–${r(w*2.5)} mg IV (induction)`,formula:`2–2.5 mg/kg × ${w}`,route:'IV',onset:'15–30s',peak:'Titrate',dur:'5–10 min',speed:'~40mg q10s',ind:'Gen induction',adj:inShock?'⚠⚠ AVOID in shock — severe hypotension':''},
      {dose:`${r(w*0.025*60)}–${r(w*0.075*60)} mg/hr`,formula:`25–75 µg/kg/min × ${w}`,route:'IV drip',onset:'—',peak:'—',dur:'Continuous',speed:'Titrate',ind:'Maintenance sedation'},
    ],refs:'⚠ No analgesia · Causes hypotension · PRIS risk >4 mg/kg/h for >48h · Altitude: ↑t½, ↓clearance',
    explain:{title:'Propofol',body:'Tier 3 only — requires secured airway, hemodynamic monitoring, and ideally telemed consult. No analgesic properties — always pair with an analgesic.\n\nPropofol infusion syndrome (PRIS): monitor at rates >4 mg/kg/h for >48h. Check pH, CK, triglycerides, lactate.\n\nAltitude: animal data (Liu et al. 2024) show prolonged t½ and increased AUC under hypoxia — start lower, titrate slower.',mods:[alt!=='low'?'⚠ Altitude: reduced clearance — start lower':'',inShock?'⚠⚠ CONTRAINDICATED in shock':''].filter(Boolean).join(' · ')||'Standard',contras:'Hemorrhagic/decompensated shock · Egg/soy allergy · Unsecured airway',ref:'JTS CPG 61 §Sedation · Liu et al. 2024 Front Pharmacol (altitude PK) · PCC CPG 91'}},
  ]},
  rsi:{label:'RSI / Paralytics',color:'var(--pink)',drugs:[
    {key:'rocuronium',name:'Rocuronium',tier:2,rows:[
      {dose:`${r(w*1.2)} mg IV (RSI)`,formula:`1.2 mg/kg × ${w} (IBW-based)`,route:'IV',onset:'60–90s',peak:'2–3 min',dur:'45–70 min',speed:'Rapid push',ind:'RSI paralysis'},
      {dose:`${r(w*0.1)}–${r(w*0.2)} mg q30–45 min`,formula:'0.1–0.2 mg/kg PRN',route:'IV',onset:'1–2 min',peak:'—',dur:'30–45 min',speed:'Push',ind:'Maintenance paralysis'},
    ],refs:'<span class="ref-pcc">PFC default paralytic</span> · Sugammadex 16 mg/kg reversal (Tier 3) · FAKT RSI: fentanyl + ketamine + roc',
    explain:{title:'Rocuronium',body:`Non-depolarizing neuromuscular blocker. Default paralytic for SOF RSI when succinylcholine is contraindicated (which is most PFC scenarios).\n\nRSI dose: 1.2 mg/kg IV for 60–90s onset. "Shock-dose RSI" at 1.6 mg/kg matches succinylcholine onset speed.\n\nFor this ${w} kg patient: RSI dose = ${r(w*1.2)} mg. Shock-dose = ${r(w*1.6)} mg.\n\nReversible with sugammadex 16 mg/kg = ${r(w*16)} mg (Tier 3) — reversal within ~3 min.\n\nSOF default RSI cocktail (FAKT): ketamine 1–2 mg/kg + rocuronium 1.2–1.6 mg/kg.`,mods:'IBW-based dosing recommended in obese patients (NCBl PMC10777192)',contras:'⚠ NEVER give paralysis without sedation — locked-in conscious paralysis is the worst iatrogenic harm in medicine',ref:'JTS CPG 80 (Airway-PFC) · FAKT trial (Acad EM 2022) · NCBl PMC10777192 (IBW vs TBW)'}},
    {key:'succinylcholine',name:'Succinylcholine',tier:2,rows:[
      {dose:suxContra?'⛔ CONTRAINDICATED':(`${r(w*1.5)} mg IV`),formula:suxContra?'Burns/crush >24h = hard block':`1.5 mg/kg × ${w} (TBW)`,route:'IV',onset:'30–60s',peak:'1 min',dur:'6–10 min',speed:'Rapid push',ind:suxContra?'BLOCKED':'RSI (within 24h of injury only)',adj:suxContra?'⛔ Auto-substituted: use rocuronium 1.2 mg/kg':''},
    ],refs:suxContra?'⛔ HARD STOP — Burns/crush/denervation >24h. Use rocuronium.':'Safe within first 24h post-injury · Contraindicated 24h–2yr post-burn/crush/SCI',
    explain:{title:'Succinylcholine — Timeline-Dependent Contraindication',body:`Depolarizing neuromuscular blocker with fastest onset (30–60s). Safe within the first 24 hours after burn, crush, or denervation injuries.\n\nAFTER 24–72 HOURS: Denervated muscle upregulates acetylcholine receptors → succinylcholine causes massive potassium release → cardiac arrest. Peak risk 7–10 days post-injury, persists months to years until healing complete.\n\nThe tool uses the conservative 24-hour cutoff.\n\nHard contraindications: Burns >24h · Crush >48–72h · SCI >24h · Myopathy/Duchenne · MH history · K⁺ >5.5`,mods:suxContra?'⛔ BLOCKED — patient has burn/crush flag active':'Safe (within 24h window assumed)',contras:'Burns >24h · Crush >48h · SCI >24h · Hyperkalemia · Malignant hyperthermia · Myopathies',ref:'Hovgaard & Juhl-Olsen 2021 (Crit Care) · Gronert, Anesthesiology 1999 · StatPearls NBK499984 · JTS CPG 80'}},
  ]},
  vasopressors:{label:'Vasopressors',color:'var(--orange)',drugs:[
    {key:'norepinephrine',name:'Norepinephrine',tier:3,rows:[
      {dose:`${r(w*0.05,1)}–${r(w*0.3,1)} mcg/min`,formula:`0.05–0.3 mcg/kg/min × ${w}`,route:'IV drip',onset:'1–2 min',peak:'5 min',dur:'Continuous',speed:'Titrate',ind:'Septic/neurogenic shock',adj:'Target MAP ≥65'},
    ],refs:'<span class="ref-pcc">First-line vasopressor (Surviving Sepsis 2021 + PCC CPG 91)</span> · Mix: 4mg/250mL D5W = 16 µg/mL',
    explain:{title:'Norepinephrine',body:'First-line vasopressor for septic shock, neurogenic shock, and distributive shock refractory to fluids. Alpha-1 predominant with mild beta-1 activity.\n\nStandard mix: 4 mg in 250 mL D5W = 16 µg/mL. Start 0.05–0.1 µg/kg/min, titrate to MAP ≥65.\n\nD5W is preferred over NS (norepi degrades faster in NS). Central/IO access preferred but peripheral acceptable in extremis.',mods:'None — titrate to hemodynamic target',contras:'Must have volume resuscitation first · Extravasation → tissue necrosis (phentolamine rescue)',ref:'Surviving Sepsis Campaign 2021 · JTS PCC CPG 91 Table 15 · JTS CPG 75 (Sepsis-PFC)'},
    drip:{name:'Norepinephrine',mix:'4 mg in 250 mL D5W',conc:'16 µg/mL',lowMlhr:r(w*0.05*60/16,1),highMlhr:r(w*0.3*60/16,1),unit:'mL/hr',note:`${r(w*0.05,1)}–${r(w*0.3,1)} µg/min`}},
    {key:'push_epi',name:'Push-dose Epinephrine',tier:2,rows:[
      {dose:'5–20 mcg (0.5–2 mL) IV q2–5 min',formula:'10 µg/mL syringe',route:'IV',onset:'1 min',peak:'1–2 min',dur:'5–10 min',speed:'Over 15–30s',ind:'Peri-intubation hypotension'},
    ],refs:'<span class="ref-pcc">EMCrit protocol</span> · Mix: 1 mL of 1:10,000 + 9 mL NS = 10 µg/mL · Pre-mix before RSI',
    explain:{title:'Push-dose Epinephrine',body:'Bolus vasopressor for transient/peri-intubation hypotension. Standard in SOF RSI preparation.\n\nMix recipe: Take 1 mL of cardiac epinephrine (1:10,000 = 100 µg/mL) and add to 9 mL NS → final concentration 10 µg/mL. Give 0.5–2 mL (5–20 µg) q2–5 min.\n\nThe recipe MUST be displayed with the dose — dilution errors are the dominant adverse event. Pre-mix before RSI so it\'s ready when you need it.',mods:'None — titrate to effect',contras:'Do not confuse with 1:1000 (1 mg/mL) concentration — 100× overdose',ref:'EMCrit Push-Dose Pressor Protocol (Weingart 2009, updates 2017/2021) · PCC CPG 91'},
    drip:{name:'Push-dose Epi',mix:'1 mL 1:10,000 + 9 mL NS',conc:'10 µg/mL',lowMlhr:0,highMlhr:0,unit:'BOLUS only',note:'0.5–2 mL q2–5 min PRN',bolus:true}},
    {key:'epi_anaphylaxis',name:'Epinephrine (Anaphylaxis)',tier:1,rows:[
      {dose:'0.3–0.5 mg IM (1:1,000)',formula:'0.3 mL of 1 mg/mL',route:'IM',onset:'3–5 min',peak:'10 min',dur:'15–20 min',speed:'Rapid',ind:'Anaphylaxis',adj:'Mid-outer thigh · Repeat q5–15 min'},
    ],refs:'<span class="ref-tccc">TCCC 2026</span> · THIS IS THE TREATMENT — everything else is adjunct · No absolute contraindications in anaphylaxis',
    explain:{title:'Epinephrine — Anaphylaxis',body:'IM epinephrine in the mid-outer thigh is THE treatment for anaphylaxis. There are no absolute contraindications in anaphylaxis.\n\n0.3–0.5 mg (0.3–0.5 mL of 1:1,000 = 1 mg/mL) IM. Repeat q5–15 min as needed. Up to 20% of patients need a second dose.\n\nDo NOT delay for antihistamines or steroids — those are adjuncts that do not treat airway obstruction or shock.\n\nKeep patient SUPINE with legs elevated. Sitting/standing → "empty ventricle syndrome" → cardiac arrest.',mods:'None — fixed dose',contras:'None in anaphylaxis (benefits always outweigh risks)',ref:'TCCC 2026 · ACLS 2020 · JTS CPG 91'}},
  ]},
  adjuncts:{label:'Adjuncts',color:'var(--cyan)',drugs:[
    {key:'ondansetron',name:'Ondansetron',tier:2,rows:[{dose:'4 mg IV/IM/ODT q4–8h',formula:'Fixed (max 8mg/8h)',route:'IV/IM/PO',onset:'5–10 min',peak:'10 min',dur:'4–6 hr',speed:'30–60s',ind:'Nausea'}],
    explain:{title:'Ondansetron',body:'5-HT3 antagonist for nausea/vomiting. QT prolongation flag — use caution with other QT-prolonging medications. ODT (orally-disintegrating tablet) useful when IV unavailable.',mods:'None',contras:'QT prolongation · Serotonin syndrome risk with SSRIs in high doses',ref:'JTS CPG 61 §Adjuncts'}},
    {key:'diphenhydramine',name:'Diphenhydramine',tier:2,rows:[{dose:'25–50 mg IV/IM/PO',formula:'Fixed',route:'IV/IM/PO',onset:'>5 min',peak:'1 hr',dur:'4–6 hr',speed:'30–60s',ind:'Allergic reactions',adj:'Adjunct only — NOT first-line for anaphylaxis'}],
    explain:{title:'Diphenhydramine',body:'H1 blocker for allergic reactions, itching, and as adjunct in anaphylaxis AFTER epinephrine. Does NOT reverse airway obstruction or shock. May cause sedation — factor into multimodal sedation awareness.',mods:'None',contras:'Should never delay epinephrine in anaphylaxis',ref:'JTS CPG 61 · TCCC 2026'}},
    {key:'glycopyrrolate',name:'Glycopyrrolate',tier:2,rows:[{dose:'0.1–0.2 mg IV/IM',formula:'Fixed',route:'IV/IM',onset:'1 min',peak:'30–45 min',dur:'2–6 hr',speed:'30–60s',ind:'Hypersalivation (ketamine)'}],
    explain:{title:'Glycopyrrolate',body:'Anticholinergic for ketamine-induced sialorrhea. Does not cross BBB (unlike atropine), so no CNS effects. Max 4 doses/day per PFC CPG 61.',mods:'None',contras:'Narrow-angle glaucoma · Urinary retention',ref:'JTS CPG 61 §Adjuncts'}},
    {key:'hts',name:'Hypertonic Saline',tier:1,rows:[
      {dose:'250 mL of 3% or 5% IV/IO',formula:'Over ≥10 min',route:'IV/IO',onset:'5–10 min',peak:'15–20 min',dur:'2–4 hr',speed:'≥10 min',ind:'TBI herniation',adj:'Max 2 doses, 20 min apart'},
      {dose:'30 mL of 23.4% IV/IO',formula:'Over ≥10 min',route:'IV/IO',onset:'5 min',peak:'10–15 min',dur:'2–4 hr',speed:'≥10 min',ind:'TBI herniation (concentrated)'},
    ],refs:'<span class="ref-tccc">TCCC 2026</span> · <span class="ref-jts">JTS CPG 63 (TBI-PFC)</span> · NOT a resuscitative fluid — herniation only',
    explain:{title:'Hypertonic Saline',body:'Osmotic agent for suspected elevated ICP/herniation signs (fixed/dilated pupil, Cushing\'s triad). Draws water out of brain tissue to reduce swelling.\n\n3%/5%: 250 mL over ≥10 min. May repeat ×1 after 20 min (max 2 doses).\n23.4%: 30 mL over ≥10 min (concentrated — less volume).\n\nThis is NOT a resuscitative fluid. Do not use prophylactically.',mods:'None — fixed dose',contras:'Not for prophylactic ICP management · Not a resuscitation fluid',ref:'TCCC 2026 §TBI · JTS CPG 63 (TBI-PFC)'}},
  ]},
  reversals:{label:'Reversals',color:'var(--red)',drugs:[
    {key:'naloxone',name:'Naloxone (Narcan)',tier:2,rows:[{dose:'0.4–2.0 mg IV/IM/IN',formula:'Fixed · PFC dilution: 0.4mg in 9mL NS, give 1mL aliquots',route:'IV/IM/IN',onset:'2 min',peak:'10 min',dur:'30–60 min',speed:'15–30s',ind:'Opioid reversal',adj:'⚠ Duration shorter than most opioids — monitor for re-sedation'}],
    explain:{title:'Naloxone',body:'Opioid antagonist. Duration only 30–60 min — most opioids outlast it. Monitor for re-sedation and re-dose or start infusion.\n\nPFC dilution: 0.4 mg into 9 mL NS = ~0.04 mg/mL. Give 1 mL aliquots to avoid precipitating severe withdrawal in opioid-tolerant patients.\n\nCap 10 mg total. If no response after 10 mg, reconsider diagnosis.',mods:'None',contras:'May precipitate withdrawal in opioid-dependent patients',ref:'JTS CPG 61 §Reversals · PCC CPG 91'}},
    {key:'flumazenil',name:'Flumazenil',tier:2,rows:[{dose:'0.2 mg IV, then 0.1 mg q1min',formula:'Max 1 mg/hr',route:'IV',onset:'>30 sec',peak:'45 sec',dur:'20 min',speed:'15–30s',ind:'Benzo reversal',adj:'⚠ Seizure risk in chronic benzo users'}],
    explain:{title:'Flumazenil',body:'Benzodiazepine antagonist. Use cautiously — may precipitate seizures in chronic benzodiazepine users or in mixed overdose with pro-convulsant agents.\n\nShort duration (20 min) — benzo effects will return. Monitor closely.',mods:'None',contras:'Chronic benzodiazepine use · TCA co-ingestion · Seizure history',ref:'JTS CPG 61 §Reversals'}},
    {key:'sugammadex',name:'Sugammadex',tier:3,rows:[{dose:`${r(w*16)} mg IV (immediate reversal)`,formula:`16 mg/kg × ${w}`,route:'IV',onset:'1–3 min',peak:'3 min',dur:'Complete',speed:'Rapid push',ind:'Rocuronium reversal',adj:`Moderate block: ${r(w*4)} mg (4 mg/kg)`}],
    explain:{title:'Sugammadex',body:`Modified gamma-cyclodextrin that encapsulates rocuronium. Tier 3 only.\n\nImmediate reversal (post 1.2 mg/kg roc): 16 mg/kg = ${r(w*16)} mg — full reversal within ~3 min.\nDeep block: 4 mg/kg = ${r(w*4)} mg.\nModerate block: 2 mg/kg = ${r(w*2)} mg.\n\nGame-changer for SOF: eliminates the "can\'t intubate, can\'t ventilate, can\'t reverse" scenario with rocuronium.`,mods:'None',contras:'Not effective against succinylcholine · Hormonal contraceptive interaction (treat as missed pill)',ref:'FDA label · JTS CPG 80 (Airway-PFC)'}},
  ]},
  };

  // CBRN (Tier 3, shown if cbrn toggle active)
  if(cbrn){
    DB.cbrn={label:'CBRN',color:'var(--pink)',drugs:[
      {key:'atropine_cbrn',name:'Atropine (nerve agent)',tier:3,rows:[{dose:'2–6 mg IV/IM q5–10 min',formula:'Until secretions dry',route:'IV/IM',onset:'1–4 min',peak:'5–10 min',dur:'4 hr',speed:'Rapid',ind:'Organophosphate/nerve agent',adj:'DuoDote/Mark I: atropine 2.1mg + 2-PAM 600mg per auto-injector × 3'}],
      explain:{title:'Atropine (CBRN — Nerve Agent)',body:'Anticholinergic for organophosphate/nerve agent exposure. Titrate to drying of secretions, NOT to pupil size. May require massive doses (20+ mg in severe exposure).\n\nDuoDote/Mark I auto-injectors contain atropine 2.1 mg + pralidoxime 600 mg each. Standard field dose: 3 auto-injectors for severe symptoms.',mods:'None — titrate to secretions',contras:'None in nerve agent exposure',ref:'TCCC 2026 · NATO AMP-6 · CBRN Field Manual'}},
      {key:'hydroxocobalamin',name:'Hydroxocobalamin (Cyanokit)',tier:3,rows:[{dose:'5g IV over 15 min',formula:'Fixed',route:'IV',onset:'Minutes',peak:'15 min',dur:'Hours',speed:'15 min',ind:'Cyanide poisoning',adj:'May repeat ×1'}],
      explain:{title:'Hydroxocobalamin (Cyanide Antidote)',body:'Binds cyanide to form cyanocobalamin (vitamin B12). 5g IV over 15 min. May repeat once. Turns skin/urine red — expected. Preferred over sodium nitrite/thiosulfate in field settings.',mods:'None',contras:'None in cyanide exposure',ref:'Cyanokit FDA label · TCCC 2026 §CBRN'}},
    ]};
  }

  return DB;
}

function recalc() {
  const m = getMods();
  $('wt-display').textContent = m.w;
  $('zone-wt').textContent = m.w;
  $('z-a').textContent = `${r(m.w*0.1)}–${r(m.w*0.2)} mg`;
  $('z-s').textContent = `${r(m.w*0.3)}–${r(m.w*0.8)} mg`;
  $('z-p').textContent = `${r(m.w*1)}–${r(m.w*2)} mg`;

  // Alerts
  const alerts = [];
  if(m.tbi) alerts.push({t:'danger',m:'TBI: NO permissive hypotension. SBP ≥100, SpO₂ ≥92%. TXA 2g = standalone indication. Ketamine is SAFE.'});
  if(m.hemo==='decompensated') alerts.push({t:'danger',m:'Decompensated shock: Ketamine preferred. AVOID propofol, midazolam. Reduce opioids 50%.'});
  if(m.hemo==='compensated') alerts.push({t:'warn',m:'Compensated shock: Ketamine preferentially. Opioids at lower range. Avoid propofol bolus.'});
  if(m.burns) alerts.push({t:'warn',m:'Burns: Ketamine ideal. Succinylcholine blocked >24h post-burn. Altered drug distribution after 24h.'});
  if(m.alt!=='low') alerts.push({t:'info',m:`Altitude (${m.alt==='moderate'?'8–12K':'12K+'} ft): ↓hepatic clearance, ↑drug t½. Start low, go slow. Expect prolonged duration for propofol, fentanyl, midazolam, acetaminophen.`});
  if(m.hypo) alerts.push({t:'warn',m:'Hypothermia: Drug metabolism ↓7–22% per °C drop. Delayed onset, prolonged duration. Rewarm patient.'});
  if(m.preg) alerts.push({t:'info',m:'Pregnancy: TXA, ketamine, ceftriaxone acceptable. AVOID meloxicam >20 wk. AVOID succinylcholine if HELLP suspected.'});
  if(m.cbrn) alerts.push({t:'danger',m:'CBRN active: Nerve agent → atropine + 2-PAM (DuoDote ×3). Cyanide → hydroxocobalamin 5g IV. Seizure → midazolam 10mg IM.'});
  if(m.airway==='at_risk') alerts.push({t:'danger',m:'Airway at risk: Avoid deep sedation without cric kit ready. Ketamine analgesia preserves airway reflexes.'});
  $('alerts').innerHTML = alerts.map(a=>`<div class="alert ${a.t==='danger'?'danger':a.t==='warn'?'warn':'info'}">${a.t==='danger'?'🔴':a.t==='warn'?'🟡':'🔵'} ${a.m}</div>`).join('');

  // Build drug tables
  const DB = buildDrugs(m);
  const drips = [];
  let html = '';

  Object.keys(DB).forEach(section => {
    const sec = DB[section];
    const visibleDrugs = sec.drugs.filter(d => d.tier <= currentTier);
    const lockedDrugs = sec.drugs.filter(d => d.tier > currentTier);
    if(visibleDrugs.length===0 && lockedDrugs.length===0) return;

    html += `<div class="drug-section"><div class="drug-section-header" role="button" tabindex="0" aria-expanded="true" style="color:${sec.color}"><span class="icon" style="background:${sec.color}"></span>${sec.label}<span class="count">${visibleDrugs.length} drug${visibleDrugs.length!==1?'s':''}</span></div>`;
    html += `<table><thead><tr><th>Drug</th><th>Calculated dose</th><th>Route</th><th>Onset</th><th>Peak</th><th>Duration</th><th>Speed</th><th>Indication</th></tr></thead><tbody>`;

    visibleDrugs.forEach(drug => {
      const tierBadge = `<span class="tier-badge t${drug.tier}">T${drug.tier}</span>`;
      drug.rows.forEach((row,i) => {
        html += `<tr onclick="showExplain('${drug.key}')" tabindex="0" role="button" aria-label="${drug.name} — show detail" class="${selectedDrugKey===drug.key?'selected':''}">`;
        html += i===0?`<td class="drug-name">${drug.name}${tierBadge}</td>`:`<td></td>`;
        html += `<td><span class="dose-val">${row.dose}</span><br><span class="dose-formula">${row.formula}</span>${row.adj?`<span class="adj-note">${row.adj}</span>`:''}</td>`;
        html += `<td><span class="route-badge">${row.route}</span></td>`;
        html += `<td>${row.onset}</td><td>${row.peak||'—'}</td><td>${row.dur}</td><td>${row.speed}</td><td>${row.ind}</td></tr>`;
      });
      if(drug.refs) html += `<tr class="ref-row"><td></td><td colspan="7">${drug.refs}</td></tr>`;
      if(drug.drip && !drug.drip.bolus) drips.push(drug.drip);
    });

    // Show locked drugs as faded
    lockedDrugs.forEach(drug => {
      html += `<tr class="locked-row" style="position:relative"><td class="drug-name">${drug.name}<span class="tier-badge t${drug.tier}">T${drug.tier} 🔒</span></td><td colspan="7" style="color:var(--text3);font-style:italic">Unlock Tier ${drug.tier} to access this medication</td></tr>`;
    });

    html += `</tbody></table></div>`;
  });

  $('drug-tables').innerHTML = html;

  // Drip cards
  if(drips.length>0){
    $('drip-section').style.display='';
    $('drip-factor-label').textContent=m.df;
    let dh='';
    drips.forEach(d=>{
      const gttLow=gtt(d.lowMlhr,m.df);
      const gttHigh=gtt(d.highMlhr,m.df);
      const dpsLow=(gttLow/60).toFixed(1);
      const dpsHigh=(gttHigh/60).toFixed(1);
      const spdLow=gttHigh>0?(60/gttHigh).toFixed(1):'—';
      const spdHigh=gttLow>0?(60/gttLow).toFixed(1):'—';
      dh+=`<div class="drip-card">
        <div class="dc-name">${d.name}</div>
        <div class="dc-mix">${d.mix}</div>
        <div class="dc-conc">${d.conc}</div>
        <div class="dc-rate">${d.lowMlhr}–${d.highMlhr}</div>
        <div class="dc-unit">${d.unit}</div>
        <div class="dc-gtt">${gttLow}–${gttHigh} gtt/min</div>
        <div class="dc-dps">${dpsLow}–${dpsHigh} drops/sec</div>
        <div class="dc-spd">≈ 1 drop every ${spdLow}–${spdHigh} sec</div>
      </div>`;
    });
    $('drip-grid').innerHTML=dh;
  } else { $('drip-section').style.display='none'; }

  // Re-show explanation if drug still selected
  if(selectedDrugKey) showExplain(selectedDrugKey);
}

// ═══ EXPLANATION PANEL ═══
function showExplain(key) {
  selectedDrugKey = key;
  const m = getMods();
  const DB = buildDrugs(m);
  let drug = null;
  Object.values(DB).forEach(sec => { sec.drugs.forEach(d => { if(d.key===key) drug=d; }); });
  if(!drug || !drug.explain) {
    $('explain-body').innerHTML='<div class="explain-empty">No detailed explanation available for this drug.</div>';
    return;
  }
  const e = drug.explain;
  let html = `<h3>${e.title}</h3>`;
  html += `<p>${e.body.replace(/\n/g,'<br>')}</p>`;
  html += pkpdHTML(drug);
  html += `<h3>Modifiers applied</h3><p class="mod-line">${e.mods||'None'}</p>`;
  html += `<h3>Contraindications</h3><p class="warn-line">${e.contras||'None listed'}</p>`;
  html += `<div class="ref-line"><strong>References:</strong> ${e.ref||'—'}</div>`;
  $('explain-body').innerHTML = html;

  // Highlight selected row
  document.querySelectorAll('tbody tr').forEach(tr=>tr.classList.remove('selected'));
  document.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.getAttribute('onclick')&&tr.getAttribute('onclick').includes(`'${key}'`)) tr.classList.add('selected');
  });
}

// ═══ PHARMACOKINETICS / PHARMACODYNAMICS ═══
// Parse the human-readable onset/peak/duration strings to minutes.
function parseTimeMin(s) {
  if (s == null) return null;
  s = String(s).toLowerCase().trim();
  if (!s || /contin|titrate|complete|^—$|^-+$|^—+$/.test(s)) return null;
  const nums = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (!nums.length) return null;
  let v = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
  if (nums.length === 1 && /</.test(s)) v *= 0.7;        // "<5 min"
  let unit = 'min';
  if (/h/.test(s)) unit = 'hr';
  else if (/s/.test(s) && !/min/.test(s)) unit = 's';
  return unit === 'hr' ? v * 60 : unit === 's' ? v / 60 : v;
}
// Solve the Bateman absorption rate ka (>ke) giving the target Tmax.
function solveKa(ke, Tmax) {
  const f = ka => Math.log(ka / ke) / (ka - ke) - Tmax; // decreasing in ka
  let lo = ke * 1.0001, hi = ke * 5000;
  for (let i = 0; i < 60; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi);
}
function pkCurve(onsetM, peakM, durM, N) {
  const Tmax = (peakM && peakM > 0) ? peakM : (onsetM || 1) + (durM || 10) * 0.15;
  const thalf = Math.max((durM || Tmax * 3) / 3, Tmax * 0.4);
  const ke = Math.LN2 / thalf;
  let ka = solveKa(ke, Tmax);
  if (!isFinite(ka) || ka <= ke) ka = ke * 4;
  const Tend = Math.max(Tmax * 1.25, ((onsetM || 0) + (durM || Tmax * 2)) * 1.15);
  const pts = []; let cmax = 0;
  for (let i = 0; i <= N; i++) {
    const t = Tend * i / N;
    const c = (ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
    pts.push([t, Math.max(0, c)]); if (c > cmax) cmax = c;
  }
  return { pts: pts.map(([t, c]) => [t, cmax > 0 ? c / cmax : 0]), Tend, Tmax };
}
function pdFromPk(pk) {
  const EC = 0.2, h = 2; // sigmoid Emax: effect plateaus while concentration is high
  return { pts: pk.pts.map(([t, c]) => [t, Math.pow(c, h) / (Math.pow(EC, h) + Math.pow(c, h))]), Tend: pk.Tend };
}
function fmtT(m) {
  if (m == null) return '—';
  if (m < 1) return Math.round(m * 60) + 's';
  if (m >= 60) return ((m / 60) % 1 === 0 ? (m / 60) : (m / 60).toFixed(1)) + 'h';
  return Math.round(m) + 'm';
}
function pkpdHTML(drug) {
  let row = null;
  for (const rw of drug.rows) {
    const o = parseTimeMin(rw.onset), d = parseTimeMin(rw.dur), p = parseTimeMin(rw.peak);
    if (d != null && (o != null || p != null)) { row = rw; break; }
  }
  if (!row) return `<h3>Pharmacokinetics / Pharmacodynamics</h3><p class="pkpd-note">Continuous infusion / titrated agent — no fixed onset–peak–duration curve. Titrate to clinical effect and monitor.</p>`;
  const onsetM = parseTimeMin(row.onset), peakM = parseTimeMin(row.peak), durM = parseTimeMin(row.dur);
  const N = 64;
  const pk = pkCurve(onsetM, peakM, durM, N);
  const pd = pdFromPk(pk);
  const W = 168, H = 80, padL = 6, padR = 6, padT = 8, hh = H - padT - 14, w = W - padL - padR;
  const peakMk = (peakM != null ? peakM : pk.Tmax);
  function chart(curve, color, title, sub) {
    const X = t => padL + (curve.Tend > 0 ? Math.min(t, curve.Tend) / curve.Tend : 0) * w;
    const Y = v => padT + (1 - v) * hh;
    const d = 'M' + curve.pts.map(([t, v]) => X(t).toFixed(1) + ',' + Y(v).toFixed(1)).join(' L');
    const area = d + ` L${X(curve.Tend).toFixed(1)},${Y(0).toFixed(1)} L${X(0).toFixed(1)},${Y(0).toFixed(1)} Z`;
    const mk = (t, lbl, c) => (t == null) ? '' :
      `<line x1="${X(t).toFixed(1)}" y1="${padT}" x2="${X(t).toFixed(1)}" y2="${padT + hh}" stroke="${c}" stroke-width="0.7" stroke-dasharray="2 2" opacity="0.6"/>` +
      `<text x="${X(t).toFixed(1)}" y="${H - 3}" font-size="6" fill="${c}" text-anchor="middle">${lbl}</text>`;
    return `<div class="pkpd-chart"><div class="pkpd-ct">${title}</div>
      <svg viewBox="0 0 ${W} ${H}" class="pkpd-svg" role="img" aria-label="${title}: ${sub}">
        <line x1="${padL}" y1="${padT + hh}" x2="${W - padR}" y2="${padT + hh}" stroke="var(--border2)" stroke-width="0.6"/>
        <path d="${area}" fill="${color}" opacity="0.13"/>
        <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
        ${mk(onsetM, 'onset', 'var(--text3)')}${mk(peakMk, 'peak', 'var(--text2)')}${mk((onsetM || 0) + (durM || 0), 'end', 'var(--text3)')}
      </svg><div class="pkpd-sub">${sub}</div></div>`;
  }
  return `<h3>Pharmacokinetics / Pharmacodynamics</h3>
    <div class="pkpd-wrap">
      ${chart(pk, 'var(--green)', 'PK · plasma concentration', 'concentration vs time')}
      ${chart(pd, 'var(--cyan)', 'PD · clinical effect', 'effect vs time')}
    </div>
    <div class="pkpd-meta">${row.route} · onset ${fmtT(onsetM)} · peak ${fmtT(peakMk)} · duration ${fmtT(durM)}${drug.rows.length > 1 ? ' · curve shown for first timed route' : ''}</div>`;
}

// ═══ ACCESSIBILITY + FLUIDITY WIRING ═══
(function () {
  const et = $('explain-toggle');
  if (et) {
    const toggle = () => { const c = $('explain-body').classList.toggle('collapsed'); et.setAttribute('aria-expanded', String(!c)); };
    et.addEventListener('click', toggle);
    et.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  }
  const dt = $('drug-tables');
  if (dt) {
    dt.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tr = e.target.closest && e.target.closest('tr[role=button]');
      if (tr) { e.preventDefault(); tr.click(); return; }
      const h = e.target.closest && e.target.closest('.drug-section-header');
      if (h) { e.preventDefault(); h.click(); }
    });
    dt.addEventListener('click', e => {
      const h = e.target.closest && e.target.closest('.drug-section-header');
      if (h) { const c = h.parentElement.classList.toggle('collapsed'); h.setAttribute('aria-expanded', String(!c)); }
    });
  }
})();

// WebGL field: glass + tier accent on load.
document.body.classList.add('glass');
if (window.PFC_BG) { window.PFC_BG.setGlass(true); window.PFC_BG.setAccent(TIER_ACCENT[currentTier]); }

recalc();
