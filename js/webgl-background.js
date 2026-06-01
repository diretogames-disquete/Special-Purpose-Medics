/* =====================================================================
 * PFC Dashboard — WebGL ambient background
 * ---------------------------------------------------------------------
 * A self-contained, dependency-free WebGL layer that renders behind the
 * whole dashboard. It paints a slow domain-warped "aurora" field in the
 * clinical brand palette, a faint scrolling monitor grid, a travelling
 * ECG pulse trace and a soft vignette + film grain on top.
 *
 * Design goals:
 *   - Purely decorative: the canvas is pointer-events:none and never
 *     intercepts input, so every existing dashboard interaction is intact.
 *   - Theme aware: re-tints live when the app toggles data-theme on <html>.
 *   - Considerate: caps device-pixel-ratio, pauses when the tab is hidden,
 *     and renders a single static frame when prefers-reduced-motion is set.
 *   - Defensive: if WebGL is unavailable it silently bails and the CSS
 *     gradient fallback on <body> takes over.
 * ===================================================================== */
(function () {
  'use strict';

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
    'uniform vec3  u_c1;',      // accent A (green)
    'uniform vec3  u_c2;',      // accent B (cyan)
    'uniform vec3  u_c3;',      // accent C (violet)
    'uniform vec3  u_bg;',      // deep background

    // --- value-noise / fbm -------------------------------------------
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
    '  for (int i = 0; i < 5; i++){',
    '    v += amp * noise(p);',
    '    p *= 2.02; amp *= 0.5;',
    '  }',
    '  return v;',
    '}',

    // --- distance to a moving ECG-style trace ------------------------
    'float ecgWave(float x, float t){',
    '  float y = 0.0;',
    '  float ph = fract(x * 0.8 - t * 0.12);',          // beat phase
    '  y += 0.10 * sin((x + t * 0.15) * 6.2831);',      // baseline drift
    '  float spike = smoothstep(0.46, 0.5, ph) - smoothstep(0.5, 0.54, ph);',
    '  y += spike * 0.55;',                              // R spike
    '  y -= (smoothstep(0.54, 0.57, ph) - smoothstep(0.57, 0.60, ph)) * 0.22;', // S dip
    '  y += (smoothstep(0.30, 0.36, ph) - smoothstep(0.36, 0.42, ph)) * 0.07;', // P
    '  return y;',
    '}',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res.xy;',
    '  vec2 p  = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;', // aspect-correct, centred
    '  float t = u_time;',

    // domain-warped aurora field
    '  vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t * 0.05)),',
    '                fbm(p * 1.6 + vec2(5.2, -t * 0.04)));',
    '  vec2 r = vec2(fbm(p * 1.6 + q * 1.4 + vec2(1.7, 9.2) + t * 0.03),',
    '                fbm(p * 1.6 + q * 1.4 + vec2(8.3, 2.8) - t * 0.025));',
    '  float f = fbm(p * 1.6 + r * 1.2);',

    '  float band1 = smoothstep(0.2, 0.9, f);',
    '  float band2 = smoothstep(0.4, 1.0, fbm(p * 2.3 + r));',
    '  vec3 col = u_bg;',
    '  col = mix(col, u_c1, band1 * 0.55);',
    '  col = mix(col, u_c2, band2 * 0.45);',
    '  col = mix(col, u_c3, pow(band1 * band2, 1.5) * 0.6);',

    // faint monitor grid that scrolls left
    '  vec2 gp = (gl_FragCoord.xy + vec2(t * 14.0, 0.0)) / 46.0;',
    '  vec2 gline = abs(fract(gp) - 0.5);',
    '  float grid = smoothstep(0.0, 0.03, min(gline.x, gline.y));',
    '  col = mix(col, col + u_c2 * 0.10, (1.0 - grid) * 0.18);',

    // travelling ECG trace through a horizontal band
    '  float ex = uv.x * 3.0;',
    '  float ey = 0.5 + ecgWave(ex, t) * 0.16;',
    '  float d  = abs(uv.y - ey);',
    '  float glow = smoothstep(0.16, 0.0, d);',
    '  float core = smoothstep(0.012, 0.0, d);',
    '  float scan = smoothstep(0.55, 0.5, abs(uv.y - 0.5));', // confine glow to mid band
    '  col += u_c1 * glow * 0.10 * scan;',
    '  col += u_c1 * core * 0.55 * scan;',

    // radial corner glows reminiscent of the original CSS ambience
    '  col += u_c1 * smoothstep(0.9, 0.0, length(uv - vec2(0.08, 1.05))) * 0.06;',
    '  col += u_c2 * smoothstep(0.9, 0.0, length(uv - vec2(1.05, -0.05))) * 0.05;',

    // vignette
    '  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));',
    '  col *= mix(0.55, 1.0, vig);',

    // film grain
    '  float g = hash(gl_FragCoord.xy + fract(t)) - 0.5;',
    '  col += g * 0.02;',

    // light-theme: lift toward paper and reduce intensity
    '  col = mix(col, mix(u_bg, col, 0.5) + 0.04, u_theme);',

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

  // fullscreen triangle pair
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    theme: gl.getUniformLocation(prog, 'u_theme'),
    c1: gl.getUniformLocation(prog, 'u_c1'),
    c2: gl.getUniformLocation(prog, 'u_c2'),
    c3: gl.getUniformLocation(prog, 'u_c3'),
    bg: gl.getUniformLocation(prog, 'u_bg')
  };

  /* ---------- theme palettes ---------- */
  var PALETTE = {
    dark:  { c1: [0.435, 0.851, 0.604], c2: [0.369, 0.792, 0.878], c3: [0.694, 0.435, 0.851], bg: [0.027, 0.035, 0.039], theme: 0.0 },
    light: { c1: [0.122, 0.541, 0.357], c2: [0.122, 0.478, 0.600], c3: [0.478, 0.247, 0.639], bg: [0.933, 0.949, 0.957], theme: 1.0 }
  };
  function currentPalette() {
    var th = document.documentElement.getAttribute('data-theme');
    return th === 'light' ? PALETTE.light : PALETTE.dark;
  }
  function applyPalette() {
    var p = currentPalette();
    gl.uniform3fv(U.c1, p.c1);
    gl.uniform3fv(U.c2, p.c2);
    gl.uniform3fv(U.c3, p.c3);
    gl.uniform3fv(U.bg, p.bg);
    gl.uniform1f(U.theme, p.theme);
  }
  applyPalette();

  // re-tint when the dashboard flips the theme attribute
  var mo = new MutationObserver(function () {
    applyPalette();
    if (!running) drawOnce();   // refresh the static frame in reduced-motion
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- sizing ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = Math.floor(window.innerWidth * dpr);
    var h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- render loop ---------- */
  var start = performance.now();
  var running = false;
  var raf = 0;

  function drawOnce(now) {
    var t = ((now || performance.now()) - start) / 1000;
    gl.uniform1f(U.time, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function frame(now) {
    drawOnce(now);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running || prefersReduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
    else play();
  });

  if (prefersReduced) {
    drawOnce();           // single, calm frame
  } else {
    play();
  }
})();
