/* =====================================================================
 * Special Purpose Medic — ECG Simulator — WebGL ambient background
 * ---------------------------------------------------------------------
 * A self-contained, dependency-free WebGL layer that renders behind the
 * whole dashboard: a slow domain-warped "aurora" field, a faint scrolling
 * monitor grid, a travelling ECG pulse trace and a soft vignette + grain.
 *
 * The dominant colour tracks the ACTIVE PROMPT CATEGORY (scenarios =
 * teal, text-to-image = violet, image-to-video = red, all = cyan). The
 * app drives this through a tiny global API:
 *
 *     window.SPM_BG.setAccent([r,g,b]);   // 0..1 colour for the active tab
 *     window.SPM_BG.setGlass(true);       // brighten when panels go glass
 *
 * Design goals:
 *   - Purely decorative: pointer-events:none, never intercepts input.
 *   - Theme aware: re-tints live on data-theme change.
 *   - Considerate: caps DPR, pauses when hidden, single static frame under
 *     prefers-reduced-motion, and bails silently if WebGL is unavailable.
 * ===================================================================== */
(function () {
  'use strict';

  var api = { setCondition: function () {}, setGlass: function () {}, setAccent: function () {} };
  window.SPM_BG = api;

  var canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  var gl = null;
  try {
    var opts = { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' };
    gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  } catch (e) { gl = null; }
  if (!gl) { canvas.style.display = 'none'; return; }

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shaders ---------- */
  var VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform float u_theme;',   // 0 = dark, 1 = light
    'uniform float u_gain;',    // overall intensity (raised in glass mode)
    'uniform float u_tempo;',   // heartbeat speed multiplier
    'uniform vec3  u_c1;',      // accent colour (primary aurora + ECG)
    'uniform vec3  u_c2;',      // accent B (cyan)
    'uniform vec3  u_c3;',      // accent C (violet)
    'uniform vec3  u_bg;',      // deep background

    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float amp = 0.5;',
    '  for (int i = 0; i < 5; i++){ v += amp * noise(p); p *= 2.02; amp *= 0.5; }',
    '  return v;',
    '}',

    'float ecgWave(float x, float t){',
    '  float y = 0.0;',
    '  float ph = fract(x * 0.8 - t * 0.12 * u_tempo);',
    '  y += 0.10 * sin((x + t * 0.15) * 6.2831);',
    '  float spike = smoothstep(0.46, 0.5, ph) - smoothstep(0.5, 0.54, ph);',
    '  y += spike * 0.55;',
    '  y -= (smoothstep(0.54, 0.57, ph) - smoothstep(0.57, 0.60, ph)) * 0.22;',
    '  y += (smoothstep(0.30, 0.36, ph) - smoothstep(0.36, 0.42, ph)) * 0.07;',
    '  return y;',
    '}',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res.xy;',
    '  vec2 p  = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;',
    '  float t = u_time;',

    '  vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t * 0.05)),',
    '                fbm(p * 1.6 + vec2(5.2, -t * 0.04)));',
    '  vec2 r = vec2(fbm(p * 1.6 + q * 1.4 + vec2(1.7, 9.2) + t * 0.03),',
    '                fbm(p * 1.6 + q * 1.4 + vec2(8.3, 2.8) - t * 0.025));',
    '  float f = fbm(p * 1.6 + r * 1.2);',

    '  float band1 = smoothstep(0.2, 0.9, f);',
    '  float band2 = smoothstep(0.4, 1.0, fbm(p * 2.3 + r));',
    '  vec3 col = u_bg;',
    '  col = mix(col, u_c1, band1 * 0.60);',
    '  col = mix(col, u_c2, band2 * 0.32);',
    '  col = mix(col, u_c3, pow(band1 * band2, 1.5) * 0.45);',

    '  vec2 gp = (gl_FragCoord.xy + vec2(t * 14.0, 0.0)) / 46.0;',
    '  vec2 gline = abs(fract(gp) - 0.5);',
    '  float grid = smoothstep(0.0, 0.03, min(gline.x, gline.y));',
    '  col = mix(col, col + u_c1 * 0.10, (1.0 - grid) * 0.18);',

    '  float ex = uv.x * 3.0;',
    '  float ey = 0.5 + ecgWave(ex, t) * 0.16;',
    '  float d  = abs(uv.y - ey);',
    '  float glow = smoothstep(0.16, 0.0, d);',
    '  float core = smoothstep(0.012, 0.0, d);',
    '  float scan = smoothstep(0.55, 0.5, abs(uv.y - 0.5));',
    '  float ecgAmt = (glow * 0.12 + core * 0.60) * scan;',
    '  vec3 ecgDark  = col + u_c1 * ecgAmt;',
    '  vec3 ecgLight = mix(col, u_c1, clamp(ecgAmt, 0.0, 1.0));',
    '  col = mix(ecgDark, ecgLight, u_theme);',

    '  col += u_c1 * smoothstep(0.9, 0.0, length(uv - vec2(0.08, 1.05))) * 0.07 * (1.0 - u_theme);',
    '  col += u_c2 * smoothstep(0.9, 0.0, length(uv - vec2(1.05, -0.05))) * 0.05 * (1.0 - u_theme);',

    '  col = mix(u_bg, col, u_gain);',

    '  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));',
    '  col *= mix(mix(0.55, 0.82, u_theme), 1.0, vig);',

    '  float g = hash(gl_FragCoord.xy + fract(t)) - 0.5;',
    '  col += g * mix(0.02, 0.012, u_theme);',

    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[webgl-bg] shader error:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[webgl-bg] link error:', gl.getProgramInfoLog(prog));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    theme: gl.getUniformLocation(prog, 'u_theme'),
    gain: gl.getUniformLocation(prog, 'u_gain'),
    tempo: gl.getUniformLocation(prog, 'u_tempo'),
    c1: gl.getUniformLocation(prog, 'u_c1'),
    c2: gl.getUniformLocation(prog, 'u_c2'),
    c3: gl.getUniformLocation(prog, 'u_c3'),
    bg: gl.getUniformLocation(prog, 'u_bg')
  };

  /* ---------- palettes ---------- */
  var THEME = {
    dark:  { bg: [0.024, 0.035, 0.051], c2: [0.000, 0.898, 1.000], c3: [0.702, 0.533, 1.000], theme: 0.0 },
    light: { bg: [0.933, 0.949, 0.957], c2: [0.122, 0.478, 0.600], c3: [0.478, 0.247, 0.639], theme: 1.0 }
  };
  // Default accent (cyan "all") — overridden per active tab by the app.
  var DEFAULT_ACCENT = { dark: [0.000, 0.898, 1.000], light: [0.067, 0.553, 0.667] };

  var accent = null;         // explicit accent [r,g,b]
  function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  var targetC1 = DEFAULT_ACCENT.dark.slice();
  var targetC2 = THEME.dark.c2.slice();
  var targetC3 = THEME.dark.c3.slice();
  var curC1 = targetC1.slice(), curC2 = targetC2.slice(), curC3 = targetC3.slice();
  var targetGain = 1.0, curGain = 1.0;
  var targetTempo = 1.0, curTempo = 1.0;

  function themeName() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function recomputeTargets() {
    var th = THEME[themeName()];
    var base = accent ? accent : DEFAULT_ACCENT[themeName()];
    targetC1 = base.slice();
    targetC2 = mix3(th.c2, targetC1, 0.55);
    targetC3 = mix3(th.c3, targetC1, 0.35);
  }
  function applyTheme() {
    var th = THEME[themeName()];
    gl.uniform3fv(U.bg, th.bg);
    gl.uniform1f(U.theme, th.theme);
    recomputeTargets();
  }
  applyTheme();
  curC1 = targetC1.slice(); curC2 = targetC2.slice(); curC3 = targetC3.slice();
  gl.uniform3fv(U.c1, curC1);
  gl.uniform3fv(U.c2, curC2);
  gl.uniform3fv(U.c3, curC3);
  gl.uniform1f(U.gain, curGain);
  gl.uniform1f(U.tempo, curTempo);

  /* ---------- public API ---------- */
  api.setAccent = function (rgb) {
    accent = (rgb && rgb.length === 3) ? rgb.slice() : null;
    recomputeTargets();
    if (!running) drawOnce();
  };
  api.setGlass = function (on) {
    targetGain = on ? 1.28 : 1.0;
    if (!running) drawOnce();
  };
  // kept for API parity with the other dashboards
  api.setCondition = function () {};

  new MutationObserver(function () {
    applyTheme();
    if (!running) drawOnce();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- sizing ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = Math.floor(window.innerWidth * dpr);
    var h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- render loop ---------- */
  var start = performance.now();
  var last = start;
  var running = false;
  var raf = 0;

  function step(dt) {
    var k = Math.min(1, dt * 2.5);
    for (var i = 0; i < 3; i++) {
      curC1[i] += (targetC1[i] - curC1[i]) * k;
      curC2[i] += (targetC2[i] - curC2[i]) * k;
      curC3[i] += (targetC3[i] - curC3[i]) * k;
    }
    curGain += (targetGain - curGain) * k;
    curTempo += (targetTempo - curTempo) * Math.min(1, dt * 1.5);
    gl.uniform3fv(U.c1, curC1);
    gl.uniform3fv(U.c2, curC2);
    gl.uniform3fv(U.c3, curC3);
    gl.uniform1f(U.gain, curGain);
    gl.uniform1f(U.tempo, curTempo);
  }

  function drawOnce(now) {
    now = now || performance.now();
    step(Math.min(0.05, (now - last) / 1000));
    last = now;
    gl.uniform1f(U.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function frame(now) {
    drawOnce(now);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running || prefersReduced) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause(); else play();
  });

  if (prefersReduced) {
    curC1 = targetC1.slice(); curC2 = targetC2.slice(); curC3 = targetC3.slice();
    curGain = targetGain; curTempo = targetTempo;
    drawOnce();
  } else {
    play();
  }
})();
