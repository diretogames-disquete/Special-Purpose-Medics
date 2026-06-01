# Narration proxy

A tiny serverless proxy that lets the dashboards call **Claude** to rewrite a
casualty brief in a chosen tone — while your Anthropic API key stays
**server-side** (never shipped to the browser).

Pick whichever host you like; the contract is the same:

```
POST <proxy-url>
  body: { "brief": "<text>", "tone": "calm" | "urgent" | "instructor" }
  ->    { "text": "<rewritten brief>" }
```

## Option A — Cloudflare Workers (free tier, recommended)

```bash
npm i -g wrangler
cd proxy
wrangler login
wrangler secret put ANTHROPIC_API_KEY     # paste your key when prompted
wrangler deploy
```

You'll get a URL like `https://spm-narration-proxy.<you>.workers.dev`.

**Lock it down (recommended)** — edit `wrangler.toml` `[vars]`:
- `ALLOWED_ORIGIN = "https://diretogames-disquete.github.io"` — only your site may call it.
- `SHARED_TOKEN = "<long-random-string>"` — require a token header (set the same value in the dashboard, below).
- `MODEL` — defaults to `claude-haiku-4-5-20251001` (fast + cheap; great for rewrites).

Re-deploy after changing vars: `wrangler deploy`.

## Option B — Vercel / Netlify / any function host

Port `worker.js` to your platform's handler (it's ~60 lines of standard
`fetch`). Read `ANTHROPIC_API_KEY` from the environment; keep the same
request/response shape and CORS headers.

## Point the dashboards at it

In `tccc/js/narration-config.js` set:

```js
window.NARRATION = {
  proxyUrl: "https://spm-narration-proxy.<you>.workers.dev",
  token: ""   // set if you used SHARED_TOKEN
};
```

(You can also override at runtime without editing files: append
`?proxy=<url>` to the dashboard URL, or run
`localStorage.setItem('spm.narration.proxy','<url>')` in the console.)

## Notes
- **Safety:** the system prompt forbids the model from inventing or changing any
  clinical fact, value, or side — it only re-voices the brief you already wrote.
- **Cost:** Haiku rewrites are a few hundred tokens — fractions of a cent each.
- Without a configured proxy, the dashboard still works: the **free Web Speech
  read-aloud** narrates the original brief; only the "Enhance tone" button is
  disabled.
