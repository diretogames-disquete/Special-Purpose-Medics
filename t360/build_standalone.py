#!/usr/bin/env python3
"""Build a self-contained, offline single-file TCCC 360 dashboard.

Fonts + body-diagram PNGs are inlined as data: URIs; components run in shared
(non-IIFE) scope, mirroring the multi-file external scripts. (drip-dosage.jsx
carries its own IIFE in source and exports window.DripDosageBox.)

Usage:  python3 build_standalone.py   ->  TCCC360_Standalone.html
"""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "TCCC360_Standalone.html")
COMPONENTS = ["tweaks-panel.jsx", "body-diagram.jsx", "vitals-panel.jsx",
              "treatments.jsx", "drip-dosage.jsx", "app.jsx"]


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
        read("css/fonts.css"))
    dashboard_css = read("css/dashboard.css")
    webgl_css = read("css/webgl.css")
    resources = (
        'window.__resources={'
        f'bodyFront:"data:image/png;base64,{b64("assets/img/bodyFront.png")}",'
        f'bodyBack:"data:image/png;base64,{b64("assets/img/bodyBack.png")}"' '};')
    webgl_js = esc(read("js/webgl-background.js"))
    heart_js = esc(read("js/heart-audio.js"))
    vendor = [esc(read(f"js/vendor/{f}")) for f in
              ("react.development.js", "react-dom.development.js", "babel.min.js")]
    comps = [(f, esc(read(f"js/components/{f}"))) for f in COMPONENTS]

    p = ['<!DOCTYPE html>',
         '<html lang="en" data-theme="tactical" data-accent="op">',
         '<head>', '<meta charset="utf-8">',
         '<title>TCCC 360° — Tactical Casualty Dashboard</title>',
         '<meta name="viewport" content="width=1440, viewport-fit=cover">',
         '<meta name="color-scheme" content="dark light">',
         '<style>\n' + fonts_css + '\n</style>',
         '<style>\n' + dashboard_css + '\n</style>',
         '<style>\n' + webgl_css + '\n</style>',
         '</head><body>',
         '<canvas id="webgl-bg" aria-hidden="true"></canvas>',
         '<div id="root"></div>',
         '<script>\n' + resources + '\n</script>',
         '<script>\n' + webgl_js + '\n</script>',
         '<script>\n' + heart_js + '\n</script>']
    for v in vendor:
        p.append('<script>\n' + v + '\n</script>')
    for name, c in comps:
        p.append(f'<script type="text/babel" data-presets="react">\n/* {name} */\n' + c + '\n</script>')
    p.append('</body></html>')

    html = "\n".join(p)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {os.path.basename(OUT)}  ({len(html.encode())/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
