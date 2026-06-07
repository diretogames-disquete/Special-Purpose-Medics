# Special-Purpose-Medics — project memory

A suite of medical-training dashboards deployed to GitHub Pages. A landing
**hub** at `/` links each dashboard, which lives in its own folder
(`pfc/`, `tccc/`, `t360/`, `humanoid/`, `pharm/`).

## Before doing dashboard work, read these
- **`.claude/skills/spm-dashboards/SKILL.md`** — the repeatable workflow and all
  conventions (unpacking artifacts, WebGL field + glass, standalone builds, hub
  integration, deploy, accessibility, domain correctness). Invoke/follow it for
  any "add a dashboard / enhance this html / same treatment" request.
- **`docs/HOW_THIS_WAS_BUILT.md`** — plain-language explanation of the whole build.

## Token-efficient navigation (graphify)
- If a `graphify-out/` graph is present (built locally with
  [graphify](https://github.com/safishamsi/graphify), `/graphify .`), **query it
  instead of bulk-reading large files**. Use the graphify MCP tools
  (`query_graph`, `get_node`, `get_neighbors`, `shortest_path`) to locate
  functions/sections — the big dashboards (e.g. `cocom/index.html`, ~12.5k lines)
  are expensive to read whole just to navigate.
- Complements, doesn't replace, the cheap habits: `/compact` at breakpoints,
  narrow `Read` ranges over whole-file reads, route big JSON dumps to files.

## Quick conventions
- Separate HTML / CSS / JS; never ship one blob.
- Every dashboard keeps an offline `*_Standalone.html` built by its
  `build_standalone.py` — rebuild + commit it in the same change after edits.
- Verify in headless Chromium (Playwright, `--use-gl=swiftshader
  --enable-unsafe-swiftshader`); aim for **0 console errors** before merging.
- Work on the session's designated branch → PR → merge to `main` (which deploys
  via `.github/workflows/pages.yml`). The site serves from `main` root.
- This sandbox cannot reach `github.io` ("Host not in allowlist") — confirm live
  deploys with the user, not by fetching the URL.
- Keep clinical values exact; label modelled numbers as estimates.
