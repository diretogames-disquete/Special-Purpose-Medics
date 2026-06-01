# Special-Purpose-Medics · Training Dashboards

This repository hosts **two** interactive medical-training dashboards, each
unpacked from a single-file artifact into a clean, structured website with
separated CSS, self-hosted fonts, modular scripts, a **high-end WebGL ambient
background** (condition-tinted, with a glass/transparency mode), and an offline
single-file build — every original feature preserved.

| Dashboard | Path | Live URL |
|-----------|------|----------|
| **PFC** · Prolonged Casualty Care (23 scenarios) | `/` | `…github.io/special-purpose-medics/` |
| **TCCC** · Patient Treatment Dashboard (6-patient live trauma sim) | `/tccc/` | `…github.io/special-purpose-medics/tccc/` |

Each has its own offline standalone you can download and double-click:
`PFC_Dashboard_Standalone.html` and `tccc/TCCC_Dashboard_Standalone.html`.

The **TCCC** dashboard (in [`tccc/`](tccc/)) is a real-time Tactical Combat
Casualty Care simulation: front/back body-diagram injury maps, live vitals with
an animated ECG, a treatment engine (TX / MEDS / DRIP / BLOOD / REF) with
scoring, a survival-probability readout, decision log and debrief. Its WebGL
background tracks the patient's **live acuity** — green (likely survives) →
amber (guarded) → red (likely dies / cardiac arrest) — straight from the
survival probability, with the trace tempo following heart rate.

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
