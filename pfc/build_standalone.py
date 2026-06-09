#!/usr/bin/env python3
"""Build a fully self-contained, offline single-file version of the dashboard.

Inlines every stylesheet, font (as data: URIs), vendor script, data script and
React component into one HTML file that runs straight from file:// — no server
and no network required.

Each React component is wrapped in an IIFE so that, as an inline `text/babel`
script, it keeps its own lexical scope (the multi-file build gets this for free
because each component is a separate external script). Cross-component sharing
already happens through `window.*`, so the wrapping is transparent.

Usage:  python3 build_standalone.py
Output: PFC_Dashboard_Standalone.html
"""
import base64
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "PFC_Dashboard_Standalone.html")

# Component load order matters — later files read window.* set by earlier ones.
COMPONENTS = [
    "tweaks-panel.jsx", "core.jsx", "ecg.jsx", "hero.jsx",
    "right-panel.jsx", "docs.jsx", "tweaks-ui.jsx", "app.jsx",
]


def read(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return f.read()


def read_bytes(rel):
    with open(os.path.join(HERE, rel), "rb") as f:
        return f.read()


def esc(js):
    """Neutralise any literal </script so inlined JS can't close its tag early."""
    return js.replace("</script", "<\\/script")


def inline_fonts(css):
    def repl(m):
        b64 = base64.b64encode(read_bytes(f"assets/fonts/{m.group(1)}.woff2")).decode()
        return f'url("data:font/woff2;base64,{b64}")'
    return re.sub(r'url\("\.\./assets/fonts/([0-9a-f\-]{36})\.woff2"\)', repl, css)


def main():
    fonts_css = inline_fonts(read("css/fonts.css"))
    dashboard_css = read("css/dashboard.css")
    webgl_css = read("css/webgl.css")

    vendor = [esc(read(f"js/vendor/{f}")) for f in
              ("react.development.js", "react-dom.development.js", "babel.min.js")]
    webgl_js = esc(read("js/webgl-background.js"))
    data_js = [esc(read(p)) for p in
               ("js/data/scenarios.js", "js/data/decision-points.js", "js/sound.js")]
    comps = [(f, esc(";(function(){\n" + read(f"js/components/{f}") + "\n})();"))
             for f in COMPONENTS]

    p = ['<!DOCTYPE html>',
         '<html lang="en" data-theme="dark">',
         '<head>',
         '<meta charset="utf-8">',
         '<title>Special-Purpose-Medic_direct</title>',
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
