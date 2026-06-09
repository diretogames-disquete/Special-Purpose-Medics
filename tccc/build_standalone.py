#!/usr/bin/env python3
"""Build a fully self-contained, offline single-file TCCC dashboard.

Inlines every stylesheet, font + body-diagram image (as data: URIs), vendor
script, data script and React component into one HTML file that runs straight
from file:// — no server and no network.

Each React component is wrapped in an IIFE so that, as an inline text/babel
script, it keeps its own lexical scope (the multi-file build gets this for free
because each component is a separate external script). Cross-component sharing
already happens through window.*, so the wrapping is transparent.

Usage:  python3 build_standalone.py
Output: TCCC_Dashboard_Standalone.html
"""
import base64
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "TCCC_Dashboard_Standalone.html")

COMPONENTS = [
    "tweaks-panel.jsx", "engine.jsx", "casualty-panel.jsx",
    "vitals-panel.jsx", "treatments-panel.jsx", "app.jsx",
]


def read(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return f.read()


def b64(rel):
    with open(os.path.join(HERE, rel), "rb") as f:
        return base64.b64encode(f.read()).decode()


def esc(js):
    return js.replace("</script", "<\\/script")


def main():
    # fonts.css with woff2 inlined as data URIs
    import re
    fonts_css = read("css/fonts.css")
    fonts_css = re.sub(
        r'url\("\.\./assets/fonts/([0-9a-f\-]{36})\.woff2"\)',
        lambda m: f'url("data:font/woff2;base64,{b64("assets/fonts/" + m.group(1) + ".woff2")}")',
        fonts_css,
    )
    dashboard_css = read("css/dashboard.css")
    webgl_css = read("css/webgl.css")

    vendor = [esc(read(f"js/vendor/{f}")) for f in
              ("react.development.js", "react-dom.development.js", "babel.min.js")]
    webgl_js = esc(read("js/webgl-background.js"))
    data_js = [esc(read(p)) for p in ("js/data/scenarios.js", "js/sound.js")]
    # NB: unlike the PFC build, these components are NOT wrapped in IIFEs.
    # engine.jsx declares `const { useState, ... } = React` once at top level
    # and app.jsx / treatments-panel.jsx rely on that shared binding, so they
    # must run in the same (global) scope — exactly as the external scripts do
    # in the multi-file build. Each such name is declared only once, so there
    # is no redeclaration collision.
    comps = [(f, esc(read(f"js/components/{f}"))) for f in COMPONENTS]

    # body-diagram images embedded as data URIs
    resources = (
        'window.__resources = {'
        f'bodyFront: "data:image/png;base64,{b64("assets/img/bodyFront.png")}",'
        f'bodyBack: "data:image/png;base64,{b64("assets/img/bodyBack.png")}"'
        '};'
    )

    p = ['<!DOCTYPE html>',
         '<html lang="en" data-theme="dark">',
         '<head>',
         '<meta charset="utf-8">',
         '<title>TCCC · Patient Treatment Dashboard</title>',
         '<meta name="viewport" content="width=1320, viewport-fit=cover">',
         '<meta name="color-scheme" content="dark light">',
         '<style>\n' + fonts_css + '\n</style>',
         '<style>\n' + dashboard_css + '\n</style>',
         '<style>\n' + webgl_css + '\n</style>',
         '</head><body>',
         '<canvas id="webgl-bg" aria-hidden="true"></canvas>',
         '<noscript><div style="position:fixed;inset:0;display:flex;align-items:center;'
         'justify-content:center;background:#07090a;color:#9aa3a6;'
         'font:14px/1.5 system-ui,sans-serif;text-align:center;z-index:9999;padding:24px;">'
         'This dashboard requires JavaScript to display.</div></noscript>',
         '<div id="root"></div>']
    for v in vendor:
        p.append('<script>\n' + v + '\n</script>')
    p.append('<script>\n' + resources + '\n</script>')
    p.append('<script>\n' + webgl_js + '\n</script>')
    for d in data_js:
        p.append('<script>\n' + d + '\n</script>')
    for name, c in comps:
        p.append(f'<script type="text/babel">\n/* {name} */\n' + c + '\n</script>')
    import re as _re
    _bed = _re.search(r'<!-- SPM ambient soundbed.*?</script>', read("index.html"), _re.S)
    if _bed:
        p.append(_bed.group(0))
    p.append('</body></html>')

    html = "\n".join(p)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {os.path.basename(OUT)}  ({len(html.encode()) / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
