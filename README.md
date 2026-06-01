# PFC · Prolonged Casualty Care Scenarios Dashboard

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

It is engineered to stay out of the way of the application:

- the canvas is `pointer-events: none`, so **no interaction is affected**;
- panels stay fully opaque — the shader reads as ambient glow in the gutters;
- it is **theme-aware** (re-tints live when you switch dark/light in Tweaks);
- it caps device-pixel-ratio, **pauses when the tab is hidden**, renders a
  single static frame under `prefers-reduced-motion`, and **falls back
  silently** to the CSS gradient if WebGL is unavailable.

## Running it

Because the JSX components are loaded as external `text/babel` scripts (and
transformed in the browser by Babel), the page must be served over HTTP —
opening `index.html` directly via `file://` will not load the components.

From the repository root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works (`npx serve`, nginx, GitHub Pages, etc.). All paths are
relative, so it can also be hosted under a sub-path (e.g. GitHub Pages project
sites).

## Keyboard shortcuts

- `←` / `→` — previous / next scenario
- `/` — focus the scenario filter
