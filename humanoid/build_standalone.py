#!/usr/bin/env python3
"""Build a fully self-contained, offline single-file Humanoid presentation.

Inlines every stylesheet, font, the Spline 3D scene + lazy WASM/JS modules,
the Spline runtime, React/Babel and the components into one HTML file that runs
from file:// with no server. Spline assets are exposed as data: URLs (the
runtime dynamic-import()s the JS and fetch()es the scene/WASM, both of which
work from a data: URL).

Components run in shared (non-IIFE) scope: tweaks-panel.jsx declares the shared
helpers that scene-app.jsx references by bare name — same as the multi-file
external scripts.

Usage:  python3 build_standalone.py
Output: Humanoid_Standalone.html
"""
import base64
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Humanoid_Standalone.html")


def read(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return f.read()


def b64(rel):
    with open(os.path.join(HERE, rel), "rb") as f:
        return base64.b64encode(f.read()).decode()


def esc(js):
    return js.replace("</script", "<\\/script")


def main():
    fonts_css = re.sub(
        r'url\("\.\./assets/fonts/([0-9a-f\-]{36})\.woff2"\)',
        lambda m: f'url("data:font/woff2;base64,{b64("assets/fonts/" + m.group(1) + ".woff2")}")',
        read("css/fonts.css"),
    )
    dashboard_css = read("css/dashboard.css")
    webgl_css = read("css/webgl.css")

    # Spline assets as data: URLs
    scene = "data:application/octet-stream;base64," + b64("assets/spline/scene.splinecode")
    procjs = "data:text/javascript;base64," + b64("assets/spline/process.js")
    navjs = "data:text/javascript;base64," + b64("assets/spline/navmesh.js")
    procwasm = "data:application/wasm;base64," + b64("assets/spline/process.wasm")
    navwasm = "data:application/wasm;base64," + b64("assets/spline/navmesh.wasm")

    resources = (
        "window.__resources={"
        f'splineScene:"{scene}",splineProcess:"{procjs}",splineProcessWasm:"{procwasm}",'
        f'splineNavmesh:"{navjs}",splineNavmeshWasm:"{navwasm}"}};'
        f'window.__SPLINE_PROCESS_JS_URL="{procjs}";'
        f'window.__SPLINE_PROCESS_WASM_URL="{procwasm}";'
        f'window.__SPLINE_NAVMESH_JS_URL="{navjs}";'
        f'window.__SPLINE_NAVMESH_WASM_URL="{navwasm}";'
    )

    webgl_js = esc(read("js/webgl-background.js"))
    spline_mod = esc(read("js/vendor/spline-viewer.module.js"))
    vendor = [esc(read(f"js/vendor/{f}")) for f in
              ("react.development.js", "react-dom.development.js", "babel.min.js")]
    comps = [(f, esc(read(f"js/components/{f}")))
             for f in ("tweaks-panel.jsx", "scene-app.jsx")]

    p = ['<!DOCTYPE html>',
         '<html lang="en" data-theme="dark">',
         '<head>',
         '<meta charset="utf-8">',
         '<title>Humanoid · Casualty Reach</title>',
         '<meta name="viewport" content="width=device-width, initial-scale=1">',
         '<meta name="color-scheme" content="dark light">',
         '<style>\n' + fonts_css + '\n</style>',
         '<style>\n' + dashboard_css + '\n</style>',
         '<style>\n' + webgl_css + '\n</style>',
         '</head><body>',
         '<canvas id="webgl-bg" aria-hidden="true"></canvas>',
         '<div id="root"></div>',
         '<div class="loader" id="loader"><div class="spinner"></div>'
         '<div class="loader-label">Booting Humanoid · Stand by</div></div>',
         '<script>\n' + resources + '\n</script>',
         '<script>\n' + webgl_js + '\n</script>',
         '<script type="module">\n' + spline_mod + '\n</script>']
    for v in vendor:
        p.append('<script>\n' + v + '\n</script>')
    for name, c in comps:
        p.append(f'<script type="text/babel">\n/* {name} */\n' + c + '\n</script>')
    p.append('</body></html>')

    html = "\n".join(p)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {os.path.basename(OUT)}  ({len(html.encode()) / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
