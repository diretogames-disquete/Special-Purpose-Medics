---
name: spm-dashboards
description: >-
  Conventions and repeatable workflow for the Special-Purpose-Medics dashboard
  suite (the special-purpose-medics repo / GitHub Pages site). Use this whenever
  adding a new dashboard or enhancing an existing one — unpacking single-file
  HTML artifacts, the WebGL ambient field + glass mode, offline standalone
  builds, the landing hub + back-to-hub link, accessibility, mobile sizing, and
  the GitHub Pages deploy. Triggers: "add a dashboard", "enhance this html",
  "give it the same treatment", "add a standalone", "WebGL/glass", "PK/PD".
---

# Special-Purpose-Medics dashboard suite — working guide

A suite of medical-training dashboards under one repo, deployed to GitHub Pages.
A landing **hub** at `/` links each dashboard, which lives in its own folder
(`pfc/`, `tccc/`, `t360/`, `humanoid/`, `pharm/`, …). Keep new work consistent
with the patterns below. Always verify in a headless browser and aim for **0
console errors** before merging.

## Golden rules
- **Separate concerns:** HTML (`index.html`) · CSS (`css/`) · JS (`js/`). Never
  ship one giant blob.
- **Preserve original functionality** when enhancing; add, don't break.
- **Verify before merge** with Playwright (headless Chromium). Screenshot, read
  state back, assert 0 console errors. Use swiftshader flags for WebGL/3D:
  `--use-gl=swiftshader --enable-unsafe-swiftshader`.
- **Each dashboard keeps an offline standalone** built by its `build_standalone.py`.
  Rebuild and commit it in the SAME change after editing sources.
- **Commit messages / PR bodies** end with the session URL line the harness
  provides. Do not put model identifiers in commits.
- Work on the session's designated branch → PR → merge to `main`. Only merge
  when asked, or when the user's intent is clearly "make it live".

## Unpacking a single-file artifact
Two cases:
1. **Bundler artifact** (has `<script type="__bundler/manifest|template|ext_resources">`):
   the real app is gzip+base64 inside the manifest; the template is a
   JSON-encoded HTML string referencing assets by UUID. Decode with Python:
   read the manifest JSON, `base64.b64decode` then `gzip.decompress` (when
   `compressed`), write each asset out; `json.loads` the template for the app
   HTML. `ext_resources` maps ids (e.g. `bodyFront`) to UUIDs → expose via
   `window.__resources`.
2. **Plain HTML** (inline `<style>`/`<script>`): just split style → `css/` and
   script → `js/`, rebuild `index.html`.

Map assets to friendly paths: vendor (React/ReactDOM/Babel) → `js/vendor/`,
data/components → `js/`/`js/components/`, fonts → `assets/fonts/`, images →
`assets/img/`.

## The WebGL field (`js/webgl-background.js`)
Copy an existing one (e.g. `pfc/js/webgl-background.js`). It paints a fragment
shader (domain-warped noise aurora + ECG trace + vignette/grain) behind a fixed
`<canvas id="webgl-bg">`, `pointer-events:none`, `z-index:0`. API on
`window.PFC_BG`:
- `setCondition('stable'|'urgent'|'critical', {hr})` → colour (green/amber/red) + tempo.
- `setGlass(on)` → brighten the field (use when panels are translucent).
- `setAccent([r,g,b])` (0..1) → arbitrary colour (e.g. tie to a tier/category).
It is theme-aware via `document.documentElement[data-theme]`, caps DPR, pauses
when hidden, honours `prefers-reduced-motion`, and bails silently without WebGL.
Drive it from the app whenever the patient state / selection changes.

## Glass mode (in the dashboard's `css/webgl.css`)
Add `<canvas id="webgl-bg">` to the page; set `.app { position:relative; z-index:1 }`
so content sits above the canvas. If a container paints its own opaque
background over the canvas, clear it (`background: transparent`). Make panels
translucent by **re-pointing the surface design tokens** under `body.glass`
(per theme) to `rgba(...)` driven by `--glass-alpha`, plus
`backdrop-filter: blur()` on the big surfaces. Expose Glass on/off + opacity +
"tint to condition" in the Tweaks panel where the dashboard has one.

## React-in-browser scope (for standalone builds)
Bundled apps run React via Babel `text/babel` scripts. Inline scripts share one
global scope:
- If components reference each other by **bare name** / declare a shared
  `const {useState}=React` once → keep them in shared scope (NO IIFE).
- If each component is self-contained (its own `const {useState}=React`) →
  wrap each in `;(function(){ ... })();` in the standalone so they don't collide.
Decide by reading whether cross-file sharing goes through `window.*` (shared) or
bare globals. Vanilla-JS dashboards don't have this issue.

## Offline standalone (`build_standalone.py`)
Inline fonts (woff2 → `data:font/woff2;base64`), CSS into `<style>`, JS into
`<script>` (escape `</script` → `<\/script`), images → `data:` URLs. For Spline:
embed the scene + WASM as data URLs and set `window.__SPLINE_*_URL` globals.
Keep the same `<title>` and `data-theme`. Output `<Name>_Standalone.html`.

## Landing hub + back-to-hub
- Add a card to the root `index.html` grid (`<a class="card" href="<folder>/">`),
  bump the "N dashboards" count, and add the standalone link in the footer.
- Add a `.hub-link` "‹ Hub" tab (`href="../"`) to each dashboard's `index.html`
  (hosted pages only — not standalones, not the hub itself).

## Mobile sizing
Responsive dashboards: keep `width=device-width`. Fixed/dense desktop layouts:
set the viewport to the **design width** (`<meta name="viewport"
content="width=1320, viewport-fit=cover">`) so phones scale-to-fit (pinch-zoom)
without breaking the layout. Desktop ignores viewport width.

## Deploy (GitHub Pages)
`.github/workflows/pages.yml` stages the hub + every dashboard folder into
`_site`, adds `.nojekyll`, and deploys. When adding a dashboard, add its folder
to the `cp -r ... _site/` line. The site serves from `main` root; the repo must
be **public** for anonymous viewing. NOTE: the sandbox cannot reach `github.io`
("Host not in allowlist") — verify deploys via the user, not by curling the URL.

## Domain correctness (don't fake it)
- Drip: `gtt/min = mL/hr × drop-factor ÷ 60`; `mL/hr = dose ÷ concentration`.
- PK/PD: Bateman `C(t) = (ka/(ka−ke))(e^−ke·t − e^−ka·t)` for concentration;
  sigmoid Emax for effect; reduced clearance = smaller `ke` → longer duration.
- Anatomical laterality: on an **anterior** view the patient's right = the
  viewer's left (lower x); reversed on a posterior view.
- Label modelled numbers as estimates; keep real clinical values exact.

## Accessibility & polish
Keyboard-activate custom controls (`role="button"`, `tabindex="0"`, Enter/Space
via delegated listeners), `aria-pressed`/`aria-expanded`/`aria-live`, visible
`:focus-visible` rings, and `prefers-reduced-motion` fallbacks. Prefer smooth
CSS transitions for "fluid" feel.
