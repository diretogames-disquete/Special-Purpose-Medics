/**
 * Special-Purpose-Medics — narration proxy (Cloudflare Worker)
 * --------------------------------------------------------------
 * Holds your Anthropic API key server-side so the static dashboards can call
 * Claude to rewrite a casualty brief in a chosen tone — without ever exposing
 * the key in the browser.
 *
 * Request:  POST { brief: string, tone: "calm"|"urgent"|"instructor", model?: string }
 * Response: { text: string }
 *
 * Deploy: see proxy/README.md. Set the secret ANTHROPIC_API_KEY and (optionally)
 * the vars ALLOWED_ORIGIN and SHARED_TOKEN.
 */

const TONES = {
  calm:       'a calm, measured, clinical tone — like a composed flight medic giving a handoff',
  urgent:     'an urgent, high-tempo field tone — terse, driving, point-of-injury energy, but still precise',
  instructor: 'an instructive tone — a seasoned SOF medical instructor walking a student through the picture',
};

const SYSTEM = (toneText) => [
  'You rewrite a tactical casualty handoff brief for a combat medic to HEAR read aloud.',
  `Rewrite it in ${toneText}.`,
  'Hard rules:',
  '- Use ONLY the facts in the provided brief. Do NOT invent, add, infer, or change any clinical value, mechanism, timeline, finding, drug, or dose.',
  '- Keep every number and side (left/right) exactly as given.',
  '- Make it a spoken handoff: ~20–45 seconds, flowing prose. No markdown, no headings, no bullet lists, no stage directions.',
  '- Expand abbreviations naturally for speech (e.g., "SpO2" → "oxygen sat", "GSW" → "gunshot wound") without changing meaning.',
  '- Output ONLY the rewritten brief text, nothing else.',
].join('\n');

function cors(origin, allowed) {
  const allow = (!allowed || allowed === '*') ? (origin || '*') : allowed;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-narration-token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

const json = (obj, status, headers) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const ch = cors(origin, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: ch });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, ch);

    // Optional shared-token gate to keep your key from being used by strangers.
    if (env.SHARED_TOKEN && request.headers.get('x-narration-token') !== env.SHARED_TOKEN) {
      return json({ error: 'unauthorized' }, 401, ch);
    }
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500, ch);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400, ch); }
    const brief = String(body.brief || '').slice(0, 6000).trim();
    if (!brief) return json({ error: 'brief required' }, 400, ch);
    const toneText = TONES[body.tone] || TONES.calm;
    const model = String(body.model || env.MODEL || 'claude-haiku-4-5-20251001');

    let resp;
    try {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 700,
          temperature: 0.6,
          system: SYSTEM(toneText),
          messages: [{ role: 'user', content: brief }],
        }),
      });
    } catch (e) {
      return json({ error: 'upstream fetch failed', detail: String(e) }, 502, ch);
    }

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return json({ error: 'anthropic error', status: resp.status, detail: detail.slice(0, 500) }, 502, ch);
    }

    const data = await resp.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (!text) return json({ error: 'empty completion' }, 502, ch);
    return json({ text, model }, 200, ch);
  },
};
