#!/usr/bin/env python3
"""Henter eventyrteksterne fra andersenstories.com og skriver dem ind i
content/*.txt under "## Tekst". Header og "## Forord" bevares.

Brug:  python3 scripts/fetch_texts.py            (henter fra nettet)
       python3 scripts/fetch_texts.py --cache DIR (bruger lokale .html-filer)
"""
import html
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.andersenstories.com/da/andersen_fortaellinger/"

# content-fil -> slug på andersenstories.com
SOURCES = {
    "anne-lisbeth.txt": "anne_lisbeth",
    "bedstemoder.txt": "bedstemoder",
    "dyndkongen.txt": "dyndkongens_datter",
    "elverhoj.txt": "elverhoj",
    "fyrtojet.txt": "fyrtojet",
    "grantraeet.txt": "grantraeet",
    "hyrdinden.txt": "hyrdinden_og_skorstensfejeren",
    "ib-og-christine.txt": "ib_og_ille_christine",
    "klods-hans.txt": "klods_hans",
    "lille-claus.txt": "lille_claus_og_store_claus",
    "nattergalen.txt": "nattergalen",
    "ole-lukoje.txt": "ole_lukoje",
    "prinsessen.txt": "prinsessen_pa_aerten",
    "rejsekammeraten.txt": "rejsekammeraten",
    "snedronningen.txt": "snedronningen",
    "tommelise.txt": "tommelise",
    "vanddraaben.txt": "vanddraben",
}


class StoryParser(HTMLParser):
    """Samler tekst fra <div class="s"> inde i itemprop="text"."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0          # div-dybde inde i et afsnit
        self.paras = []
        self.buf = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "div" and self.buf is None and a.get("class") == "s":
            self.buf = []
            self.depth = 1
        elif tag == "div" and self.buf is not None:
            self.depth += 1
        elif tag == "br" and self.buf is not None:
            self.buf.append("\n")

    def handle_endtag(self, tag):
        if tag == "div" and self.buf is not None:
            self.depth -= 1
            if self.depth == 0:
                text = "".join(self.buf)
                self.paras.append(text)
                self.buf = None

    def handle_data(self, data):
        if self.buf is not None:
            self.buf.append(data)


def danish_quotes(text):
    """Skifter "lige" anførselstegn ud med »…«."""
    out = []
    for i, ch in enumerate(text):
        if ch == '"':
            prev = text[i - 1] if i > 0 else " "
            out.append("»" if (prev.isspace() or prev in "(–-—:;") else "«")
        else:
            out.append(ch)
    return "".join(out)


def clean(p):
    p = html.unescape(p)
    p = p.replace("\xa0", " ")
    p = re.sub(r"[ \t]+", " ", p)
    p = re.sub(r" *\n *", "\n", p).strip()
    p = danish_quotes(p)
    p = re.sub(r"\s+([,.!?;:])", r"\1", p)
    p = re.sub(r" - ", " – ", p)
    p = re.sub(r"^- ", "– ", p)
    return p


def get_html(slug, cache):
    if cache:
        with open(os.path.join(cache, slug + ".html"), encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(BASE + slug, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def main():
    cache = None
    if "--cache" in sys.argv:
        cache = sys.argv[sys.argv.index("--cache") + 1]
    for fn, slug in SOURCES.items():
        path = os.path.join(ROOT, "content", fn)
        with open(path, encoding="utf-8") as f:
            src = f.read()
        head = src.split("## Tekst")[0].rstrip() + "\n\n## Tekst\n\n"
        parser = StoryParser()
        parser.feed(get_html(slug, cache))
        paras = [clean(p) for p in parser.paras]
        paras = [p for p in paras if p and not re.fullmatch(r"[*\s]+", p)]
        if len(paras) < 3:
            raise SystemExit(f"For lidt tekst i {slug}: {len(paras)} afsnit")
        with open(path, "w", encoding="utf-8") as f:
            f.write(head + "\n\n".join(paras) + "\n")
        print(f"{fn:28} {len(paras):4} afsnit  {sum(map(len, paras)):6} tegn")


if __name__ == "__main__":
    main()
