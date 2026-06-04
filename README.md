# Special-Purpose-Medics · Training Dashboards

This repository hosts **seven** interactive medical-training dashboards, each
unpacked from a single-file artifact into a clean, structured website with
separated CSS, self-hosted fonts, modular scripts, a **high-end WebGL ambient
background** (condition-tinted, with a glass/transparency mode), and an offline
single-file build — every original feature preserved. A small **landing hub** at
the site root links them all.

| Dashboard | Path | Live URL |
|-----------|------|----------|
| **Landing hub** | `/` | `…github.io/special-purpose-medics/` |
| **PFC** · Prolonged Casualty Care (23 scenarios) | `/pfc/` | `…github.io/special-purpose-medics/pfc/` |
| **TCCC 360°** · Tactical Casualty (DD-1380 + drip calc) | `/t360/` | `…github.io/special-purpose-medics/t360/` |
| **TCCC** · Patient Treatment Dashboard (6-patient live trauma sim) | `/tccc/` | `…github.io/special-purpose-medics/tccc/` |
| **Humanoid** · Casualty Reach (3D field brief) | `/humanoid/` | `…github.io/special-purpose-medics/humanoid/` |
| **Pharmacology** · Tiered drug reference (PK/PD graphs) | `/pharm/` | `…github.io/special-purpose-medics/pharm/` |
| **Prompt Library** · SOF Medic AI prompts (200, MARCH PAWS sort) | `/prompts/` | `…github.io/special-purpose-medics/prompts/` |
| **Special Purpose Medic Drug Box** · Robust drug reference + quiz (165 drugs) | `/formulary/` | `…github.io/special-purpose-medics/formulary/` |

The **TCCC 360°** dashboard (in [`t360/`](t360/)) is a DD-1380 tactical casualty
card: injury map with front/back body diagrams, mechanism + acute findings, a
live vitals timeline, MIST auto-fill, treatments/meds/blood logs — plus a
**separate Drip &amp; Dosage calculator box** (floating, glass) with a built-in
calculator and **teaching mode** that shows every formula worked out. Three
modes — weight-based infusion (`mL/hr = dose ÷ concentration`, `gtt/min = mL/hr ×
drop-set ÷ 60`), weight bolus, and simple fluid drip — all using standard,
field-correct drip math. Its WebGL field tracks the casualty's acuity from the
latest vitals. Offline standalone: `t360/TCCC360_Standalone.html`.

The **Humanoid · Casualty Reach** presentation (in [`humanoid/`](humanoid/)) is
a cinematic field brief: a live **3D humanoid casualty** (Spline/WebGL) beside a
narrative on robotic medical-reach teammates, with editable vitals/triage. Its
WebGL ambient field shows as **glass motion behind the text panel** that tracks
the patient's state — green (stable) → amber (guarded) → red (critical), with
the field tempo following heart rate. The brief is contextualized with an
**Innovation Front** section drawn from real autonomous-systems programs
(next-gen UAS, subsea autonomy, swarm UAVs, EW-resilient ISR, AMRs, and more).
Offline standalone: `humanoid/Humanoid_Standalone.html`.

Each has its own offline standalone you can download and double-click:
`PFC_Dashboard_Standalone.html` and `tccc/TCCC_Dashboard_Standalone.html`.

The **TCCC** dashboard (in [`tccc/`](tccc/)) is a real-time Tactical Combat
Casualty Care simulation: front/back body-diagram injury maps, live vitals with
an animated ECG, a treatment engine (TX / MEDS / DRIP / BLOOD / REF) with
scoring, a survival-probability readout, decision log and debrief. Its WebGL
background tracks the patient's **live acuity** — green (likely survives) →
amber (guarded) → red (likely dies / cardiac arrest) — straight from the
survival probability, with the trace tempo following heart rate.

The **Prompt Library** (in [`prompts/`](prompts/)) is a searchable catalogue of
**200 engineered AI prompts** for the SOF medic: **100 training scenarios** (each
tagged to a MARCH PAWS phase and built around a modern model-extraction technique
— chain-of-thought, decision-matrix, red-team-the-plan, etc., tuned per model),
**50 text-to-image** and **50 image-to-video** generation prompts. Filter by
category, search full text, copy any prompt in one click, and toggle a **MARCH
PAWS sort** that regroups the scenarios into the trauma algorithm (Massive
hemorrhage → Airway → Respiration → Circulation → Hypothermia/Head → Pain →
Antibiotics → Wounds → Splinting). Offline standalone:
`prompts/SOFMedic_Prompts_Standalone.html`.

The **Special Purpose Medic Drug Box** (in [`formulary/`](formulary/)) is the robust,
encyclopedic drug reference and trainer — distinct from the hands-on tiered Pharmacology
tool. It covers **165 medications across 28 categories**, each with mechanism, dosing,
indications, contraindications, side effects, **international/alternate names** (e.g.
paracetamol, salbutamol, adrenaline, pethidine), and a **case-based field scenario**
(OPQRST/SAMPLE, **interactive vitals** with a lub-dub heartbeat + MAP, a reveal-on-hover
diagnosis, GO/NO-GO duty status, cognitive impact, field considerations). It includes a
**3-level tiered quiz** (495 questions — Recall / Application / Clinical Reasoning,
covering every drug, filterable by category and level) and optional **UI click sounds**.
Offline standalone: `formulary/SOF_Formulary_Standalone.html`.

---

## PFC · Prolonged Casualty Care Scenarios Dashboard

An interactive **Special-Purpose-Medics** training dashboard covering 23
Prolonged Casualty Care (PCC) scenarios (2002–2025): a live monitor view with
scenario index, physiologically-accurate ECG/PQRST waveform, OPQRST assessment,
decision-point actions, Socratic questions, and a full PFC documentation-sheet
view — plus a Web-Audio telemetry engine and a draggable Tweaks panel
(theme / density / sound / ECG).

This repository is the **standalone web build**: the original single-file
artifact has been unpacked into a clean, properly-structured website with
separated CSS, self-hosted fonts, modular scripts, and a **high-end WebGL
ambient background** — with every original feature preserved.

## What's here

```
index.html                 Page shell · loads styles, fonts, WebGL, React app
css/
  fonts.css                Self-hosted Inter + JetBrains Mono @font-face rules
  dashboard.css            The full dashboard visual system (dark + light themes)
  webgl.css                WebGL canvas layer + integration overrides
js/
  webgl-background.js      ★ High-end WebGL ambient layer (no dependencies)
  sound.js                 Web-Audio telemetry synth + tweak defaults
  data/
    scenarios.js           The 23 scenario definitions (window.PCC_SCENARIOS)
    decision-points.js     Per-scenario interactive Action decision points
  components/              React components (JSX, transformed in-browser)
    tweaks-panel.jsx       Tweaks shell + useTweaks hook + form controls
    core.jsx               Helpers + left Scenario Index
    ecg.jsx                PQRST interactive ECG monitor
    hero.jsx               Scenario hero + mechanism/context + cast
    right-panel.jsx        Actions / Questions / Resolution tabs
    docs.jsx               PFC casualty-card documentation sheets
    tweaks-ui.jsx          Dashboard-specific Tweaks UI
    app.jsx               Top bar, footer, quick-reference, App + mount
  vendor/                  React, ReactDOM, and Babel (in-browser JSX)
assets/fonts/              woff2 font files referenced by css/fonts.css
```

## The WebGL integration

`js/webgl-background.js` is a self-contained, dependency-free WebGL layer that
paints behind the entire dashboard:

- a slow **domain-warped aurora field** in the clinical brand palette,
- a faint **scrolling monitor grid**,
- a **travelling ECG pulse trace**, and
- a soft **vignette + film grain**.

The dominant colour **tracks the patient's condition** — derived from the
scenario priority (green = stable, amber = urgent, red = life-threat) — and the
heartbeat tempo of the trace follows the patient's heart rate. The React app
drives this through a tiny global API (`window.PFC_BG.setCondition(...)`).

**Glass mode** (on by default) makes the panels translucent with a frosted
backdrop blur so the condition-coloured field reads through the chrome. From the
**Tweaks** panel → *Background · WebGL* you can:

- toggle **Glass panels** on/off,
- adjust **Glass opacity** (panel translucency), and
- toggle **Tint to patient condition** (off = calm green regardless of acuity).

It is engineered to stay out of the way of the application:

- the canvas is `pointer-events: none`, so **no interaction is affected**;
- it is **theme-aware** (re-tints live when you switch dark/light in Tweaks);
- it caps device-pixel-ratio, **pauses when the tab is hidden**, renders a
  single static frame under `prefers-reduced-motion`, and **falls back
  silently** to the CSS gradient if WebGL is unavailable.

## Running it

There are two ways to view the dashboard.

### 1. Standalone single file (no server — just double-click)

**`PFC_Dashboard_Standalone.html`** is a fully self-contained build: every
stylesheet, font, script, React component and the WebGL layer are inlined into
one file. Download it and open it directly in any modern browser — no server,
no internet connection required.

- **From GitHub:** open `PFC_Dashboard_Standalone.html`, click the **Download
  raw file** button (or **Raw → Save As…**), then double-click the saved file.
- **From a clone:** just open the file in your browser.

It is ~6 MB (it embeds React, the Babel JSX transformer and the woff2 fonts) and
runs entirely offline.

### 2. Multi-file site (served over HTTP)

The unbundled `index.html` keeps the project as separate files, which is nicer
for editing and hosting. Because the JSX components are loaded as external
`text/babel` scripts and transformed in the browser by Babel, this version must
be served over HTTP — opening `index.html` via `file://` will not load the
components (use the standalone file for that).

From the repository root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works (`npx serve`, nginx, GitHub Pages, etc.). All paths are
relative, so it can also be hosted under a sub-path (e.g. GitHub Pages project
sites).

### Rebuilding the standalone file

The standalone file is generated from the multi-file sources. If you edit any
CSS/JS, regenerate it with:

```bash
python3 build_standalone.py
```

## Keyboard shortcuts

- `←` / `→` — previous / next scenario
- `/` — focus the scenario filter
