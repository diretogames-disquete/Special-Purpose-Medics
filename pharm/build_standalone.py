#!/usr/bin/env python3
"""Build a self-contained, offline single-file Pharmacology dashboard.

Inlines styles.css, webgl.css, webgl-background.js and app.js into index.html.
(The DM Sans / DM Mono webfont link is kept; offline it falls back to the
system sans/mono stack declared in the CSS.)

Usage:  python3 build_standalone.py   ->  Pharmacology_Standalone.html
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Pharmacology_Standalone.html")


def read(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return f.read()


def main():
    html = read("index.html")
    styles = read("css/styles.css")
    webgl_css = read("css/webgl.css")
    webgl_js = read("js/webgl-background.js").replace("</script", "<\\/script")
    app_js = read("js/app.js").replace("</script", "<\\/script")

    html = html.replace('<link rel="stylesheet" href="css/styles.css">',
                        '<style>\n' + styles + '\n</style>')
    html = html.replace('<link rel="stylesheet" href="css/webgl.css">',
                        '<style>\n' + webgl_css + '\n</style>')
    html = html.replace('<script src="js/webgl-background.js"></script>',
                        '<script>\n' + webgl_js + '\n</script>')
    html = html.replace('<script src="js/app.js"></script>',
                        '<script>\n' + app_js + '\n</script>')

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Wrote {os.path.basename(OUT)}  ({len(html.encode()) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
