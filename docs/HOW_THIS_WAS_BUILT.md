# How this was built — a plain-language guide

This repository is a suite of five interactive medical-training dashboards plus
a landing "hub". Each dashboard started life as a **single self-contained HTML
file** and was rebuilt into a clean, hostable website with a high-end WebGL
background, an offline single-file version, and a shared look and feel.

This document explains, in everyday language, *how* that was done and *why* —
so anyone (coder or not) can follow the reasoning and continue the work.

---

## The big idea: separate the three layers

Every web page is really three things working together:

| Layer | Plain meaning | Lives in |
|-------|---------------|----------|
| **HTML** | the structure / skeleton | `index.html` |
| **CSS**  | the styling / appearance | `css/*.css` |
| **JavaScript** | the behavior / interactivity | `js/*.js` |

The original files crammed all three into one blob. Step one was always to
**pull them apart** into folders so they're readable and editable.

---

## What the original files actually were

Two formats showed up:

1. **"Bundler" artifacts** (PFC, TCCC, TCCC 360°, Humanoid). These looked like
   one HTML file but secretly contained the whole app **compressed (gzip) and
   text-encoded (base64)** inside a `<script>` tag, with a loader that unpacked
   itself in the browser. To work with them I ran a small Python script that
   reversed the packing and wrote out the ~25 hidden pieces (React, fonts,
   images, the app code).
   *Analogy: the file was a vacuum-sealed flat-pack; I unpacked it before
   remodeling.*

2. **A plain app** (Pharmacology). This one was ordinary HTML + CSS + JavaScript,
   so it only needed splitting into folders.

---

## The signature features (and how they work)

### 1. The WebGL "living" background
WebGL paints using the graphics card. The heart of it is a **fragment shader**:
a tiny program that runs *for every pixel, every frame* and computes a color
from math (layered "noise" makes the flowing aurora; a sine-based path makes the
ECG line). The colour is wired to mean something:

- **Patient state** → green (stable) · amber (guarded) · red (critical)
- **Heart rate** → speed of the pulse
- (Pharmacology) **Tier** → green / blue / purple

It lives in `js/webgl-background.js`, exposes a tiny API (`window.PFC_BG`), is
`pointer-events:none` (never blocks clicks), pauses when the tab is hidden, and
falls back silently if WebGL is unavailable.

### 2. "Glass" panels
To let the background show through, the CSS **design tokens** (named colours
like `--panel`) are redefined to be semi-transparent when `body.glass` is on,
plus a `backdrop-filter: blur()` for the frosted look. Changing a couple of
variables re-skins the whole UI — no per-panel edits.

### 3. React-in-the-browser + a scope gotcha
The bundled apps run React live using **Babel** (a translator). When inlining
everything into one offline file, components can collide because several files
declare the same top-level variable. The fix depends on the app:
- if components **share** values on purpose (via `window.X`), keep them in one
  shared scope;
- if each component is **self-contained**, wrap each in an **IIFE** (a private
  bubble) so their variables don't clash.

### 4. The offline "standalone"
Each dashboard has a `build_standalone.py` that **inlines everything** — CSS,
fonts and images as `data:` URLs, all scripts — into one file you can
double-click with no server or internet. (The 3D one even embeds the Spline
scene + WebAssembly.)

### 5. The landing hub
The site root (`index.html`) is a hub linking all dashboards, with its own
lightweight WebGL field and an ambient-sound toggle. Each dashboard has a
"‹ Hub" tab to return.

---

## How quality was checked

Nothing was trusted blindly. A **headless browser** (Playwright — a real Chrome
with no window) was driven like a robot user: load the page, click buttons,
read values back, screenshot, and confirm **zero console errors** before every
merge. This caught the iPhone layout overflow, a left/right injury mix-up, the
calculator math, and more.

---

## Real-world correctness

- **Drip rates** use the standard field formula
  `gtt/min = mL/hr × drop-factor ÷ 60`, verified against known cases.
- **Blood delivery** models how IV gauge, a pressure bag, and a warmer change
  flow — clearly labelled as teaching estimates.
- **PK/PD graphs** use a real pharmacology model (the **Bateman function** for
  concentration-over-time, a sigmoid for effect) and can overlay a "modified"
  curve to show how impaired clearance stretches a drug's duration.

---

## How it ships

Work happens on a feature branch → verified in the headless browser →
Pull Request → merge to `main` → **GitHub Pages** rebuilds the live site.
GitHub Pages serves from the `main` branch root; a `.nojekyll` file keeps the
files served exactly as-is.

---

## Map of the repository

```
index.html              Landing hub (links all dashboards, ambient sound)
pfc/                    PFC · Prolonged Casualty Care (React, in-browser Babel)
tccc/                   TCCC · Patient Treatment trauma sim (React)
t360/                   TCCC 360° · DD-1380 card + drip/dose calculator (React)
humanoid/              Humanoid · Casualty Reach (Spline 3D + React)
pharm/                  Pharmacology · tiered drug reference + PK/PD graphs (vanilla JS)
.github/workflows/      GitHub Pages deploy
docs/                   This guide
.claude/skills/         Reusable instructions for future sessions

Inside each dashboard folder:
  index.html            Page shell
  css/                  fonts.css, dashboard.css (or styles.css), webgl.css
  js/                   webgl-background.js + the app/components
  assets/               fonts, images (where used)
  build_standalone.py   Generates the offline single-file build
  *_Standalone.html     The offline build (commit it; regenerate after edits)
```
