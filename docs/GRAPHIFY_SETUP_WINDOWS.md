# Graphify setup on Windows

Build a [graphify](https://github.com/safishamsi/graphify) knowledge graph of
this repo so Claude can **query** the codebase (`get_node`, `query_graph`, …)
instead of bulk-reading the big dashboard files (e.g. `cocom/index.html`,
~12.5k lines). See the [`CLAUDE.md`](../CLAUDE.md) note on token-efficient
navigation for why.

Run everything below in **PowerShell** (not the old `cmd` prompt), in order.
Each step lists how you know it worked.

## Part A — One-time setup

### 1. Check Python
```powershell
python --version
```
Need **3.10 or higher**. If you get *"Python was not found"* or it opens the
Microsoft Store, install from <https://www.python.org/downloads/> and tick
**"Add python.exe to PATH"** in the installer, then reopen PowerShell.

### 2. Install `uv`
Windows uses the PowerShell installer (not the `curl … | sh` one):
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
Then **close and reopen PowerShell** so the new PATH takes effect.
✅ `uv --version` prints a version.

### 3. Install graphify
```powershell
uv tool install graphifyy
```
(Spelling: `graphifyy`, double-y.)
✅ `graphify --help` prints usage.
If *"graphify is not recognized,"* run `uv tool update-shell`, then reopen PowerShell.

### 4. Register it with Claude Code
```powershell
graphify install
```
✅ It reports adding a skill / MCP server. **Quit and reopen Claude Code** so it
loads the `/graphify` skill.

## Part B — Build the graph

### 5. Go to the repo
```powershell
cd C:\path\to\Special-Purpose-Medics
```
✅ `dir` shows `cocom`, `index.html`, `CLAUDE.md`.

### 6. Build it
Inside Claude Code:
```
/graphify .
```
The `.` means "this folder." First run takes a few minutes.
✅ A new `graphify-out\` folder appears with `graph.html`, `GRAPH_REPORT.md`,
`graph.json`.

> **Cost note:** this repo is mostly code/HTML, and code extraction runs
> **locally — no API key, no token cost**. If graphify offers to process
> docs/PDFs/images via an LLM (that part needs a key and costs money), you can
> decline; the code graph alone is what saves tokens.

### 7. Eyeball it
Open `graphify-out\graph.html` in a browser and skim `GRAPH_REPORT.md`.
✅ You see nodes like `setCocom`, `applyFilters`, `build_standalone`.

## Part C — Make it stick

### 8. Commit the graph
So remote/web sessions start with it ready:
```powershell
git add graphify-out
git commit -m "chore: add graphify knowledge graph"
git push
```

### 9. Keep it fresh
```powershell
graphify hook install
```
✅ Each `git commit` now re-extracts changed files. Manual refresh anytime:
`/graphify . --update`.

## Using it
Next time you ask Claude to change something, say **"use the graphify graph."**
It will query nodes instead of reading whole files — the point of all this.

## Windows gotchas
The only real friction is steps 1–3 (PATH + the PowerShell `uv` installer). If a
step errors, copy the exact message — that's almost always a PATH issue fixed by
reopening PowerShell or running `uv tool update-shell`.
