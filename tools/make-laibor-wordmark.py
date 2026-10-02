#!/usr/bin/env python3
"""Generate images/laibor-wordmark.svg, the L.AI.BOR lettering in the Writing section header.

A figure from a 1970s technical manual: squared capitals with rounded corners
and an 8 degree lean, halftone dots darkening toward the baseline, a teal
second plate printed slightly out of register, crop marks and registration
targets, and a light ink grain. L and BOR are cream; AI is teal, the machine
inside the word.

The letters are fitted to the tagline's measure (Weekly field notes on ...):
narrower bowls and tight spacing rather than a horizontal squash, which would
leave the verticals lighter than the bars. The fit holds at every width
because both scale with the heading's font size; index.html sizes the <img>
in em from CAP_EM below.

Pure Python, no dependencies. Usage:

    python3 tools/make-laibor-wordmark.py            # write the SVG
    python3 tools/make-laibor-wordmark.py --check    # exit 1 if it's stale

The file lives under /images/, so it is served immutable: after regenerating,
bump the ?v= on the <img> in index.html by hand (bump-cover.sh does not know
about .svg), and update the width/height attributes if the viewBox changed.
"""
import math
import pathlib
import re
import sys

OUT = pathlib.Path(__file__).resolve().parent.parent / 'images' / 'laibor-wordmark.svg'

CREAM = '#fff3d7'
TEAL = '#2fe6c2'
LEAN = math.tan(math.radians(8))
STROKE = 24          # every stem and bar, in units of a 100-unit cap height
GAPS = (8, 8, 5, 8, 8, 6, 6)   # after L . A I . B O


def fmt(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


# ---------------------------------------------------------------- geometry
def glyphs(L=62, A=80, B=80, O=86, R=84):
    """Cap 100, stroke 24. Widths are parameters so the word can be fitted."""
    k = 0.5523  # cubic quarter-circle constant

    def rounded(x0, y0, x1, y1, r):
        c = r * (1 - k)
        return (f'M{x0 + r} {y0}H{x1 - r}C{x1 - c} {y0} {x1} {y0 + c} {x1} {y0 + r}'
                f'V{y1 - r}C{x1} {y1 - c} {x1 - c} {y1} {x1 - r} {y1}'
                f'H{x0 + r}C{x0 + c} {y1} {x0} {y1 - c} {x0} {y1 - r}'
                f'V{y0 + r}C{x0} {y0 + c} {x0 + c} {y0} {x0 + r} {y0}Z')

    ra = 26
    ca = ra * (1 - k)
    a = (f'M0 100V{ra}C0 {ca} {ca} 0 {ra} 0H{A - ra}C{A - ca} 0 {A} {ca} {A} {ra}'
         f'V100H{A - 24}V68H24V100Z '
         f'M24 46H{A - 24}V32C{A - 24} 27 {A - 27} 24 {A - 32} 24H32C27 24 24 27 24 32Z')
    w = B
    b = (f'M0 0H{w-24}C{w-10} 0 {w} 10 {w} 24V36C{w} 43 {w-3} 48 {w-8} 50C{w-3} 52 {w} 57 {w} 64'
         f'V76C{w} 90 {w-10} 100 {w-24} 100H0Z '
         f'M24 22H{w-30}C{w-26} 22 {w-24} 24 {w-24} 28V34C{w-24} 38 {w-26} 40 {w-30} 40H24Z '
         f'M24 60H{w-30}C{w-26} 60 {w-24} 62 {w-24} 66V74C{w-24} 78 {w-26} 80 {w-30} 80H24Z')
    w = R
    r = (f'M0 0H{w-26}C{w-12} 0 {w-2} 10 {w-2} 24V38C{w-2} 50 {w-10} 58 {w-22} 60'
         f'L{w} 100H{w-27}L{w-47} 62H24V100H0Z '
         f'M24 22H{w-32}C{w-28} 22 {w-26} 24 {w-26} 28V36C{w-26} 40 {w-28} 42 {w-32} 42H24Z')
    dot = 'M4 76H20C22 76 24 78 24 80V96C24 98 22 100 20 100H4C2 100 0 98 0 96V80C0 78 2 76 4 76Z'
    return {
        'L': (L, f'M0 0H24V76H{L}V100H0Z'),
        'A': (A, a),
        'I': (STROKE, 'M0 0H24V100H0Z'),
        'B': (B, b),
        'O': (O, rounded(0, 0, O, 100, 30) + ' ' + rounded(24, 24, O - 24, 76, 10)),
        'R': (R, r),
        '.': (24, dot),
    }


def parse_path(d):
    """Absolute M/L/H/V/C/Z only, as authored above."""
    toks = re.findall(r'[MLHVCZ]|-?[\d.]+', d)
    subs, cur, pos, start, i, cmd = [], None, (0, 0), (0, 0), 0, None

    def num():
        nonlocal i
        i += 1
        return float(toks[i - 1])

    while i < len(toks):
        if re.match(r'[MLHVCZ]', toks[i]):
            cmd = toks[i]
            i += 1
        if cmd == 'M':
            pos = start = (num(), num())
            cur = []
            subs.append(cur)
            cmd = 'L'
        elif cmd == 'L':
            p = (num(), num()); cur.append(('L', pos, p)); pos = p
        elif cmd == 'H':
            p = (num(), pos[1]); cur.append(('L', pos, p)); pos = p
        elif cmd == 'V':
            p = (pos[0], num()); cur.append(('L', pos, p)); pos = p
        elif cmd == 'C':
            c1 = (num(), num()); c2 = (num(), num()); p = (num(), num())
            cur.append(('C', pos, c1, c2, p)); pos = p
        elif cmd == 'Z':
            if pos != start:
                cur.append(('L', pos, start))
            pos = start
            cmd = None
    return subs


def leaned(d, dx):
    """Shift a glyph into place and lean it about the baseline. Lines stay
    lines and curves stay curves under a shear, so control points transform
    directly and the output keeps the authored curves."""
    tx = lambda x, y: f'{fmt(x + dx + LEAN * (100 - y))} {fmt(y)}'
    out = []
    for segs in parse_path(d):
        parts = [f'M{tx(*segs[0][1])}']
        for seg in segs:
            if seg[0] == 'L':
                parts.append(f'L{tx(*seg[2])}')
            else:
                parts.append(f'C{tx(*seg[2])} {tx(*seg[3])} {tx(*seg[4])}')
        out.append(''.join(parts) + 'Z')
    return ''.join(out)


# ---------------------------------------------------------------- the figure
def build():
    shapes = glyphs()
    x = 0
    cream, teal = [], []
    for ch, gap in zip('L.AI.BOR', list(GAPS) + [0]):
        w, d = shapes[ch]
        (teal if ch in 'AI' else cream).append(leaned(d, x))
        x += w + gap
    cream, teal = ''.join(cream), ''.join(teal)
    width = x + LEAN * 100            # the lean carries the tops past the last advance

    # Halftone: one pattern per row, dots growing toward the baseline and
    # staggered on alternate rows. A light tint through the mask keeps the
    # printed shading smooth when the dots shrink below a mobile pixel.
    patterns, rows = [], []
    for row, y in enumerate(range(48, 104, 4)):
        r = 0.25 + (y - 48) / 56 * 1.75
        patterns.append(
            f'<pattern id="h{row}" patternUnits="userSpaceOnUse" x="{2 if row % 2 else 0}" y="{y - 2}" '
            f'width="4" height="4"><circle cx="2" cy="2" r="{r:.2f}"/></pattern>')
        rows.append(f'<rect x="-10" y="{y - 2}" width="{fmt(width + 20)}" height="4" fill="url(#h{row})" opacity=".22"/>')

    left, right = -12, width + 12
    crop = (f'M{left} -8H{left + 10}M{left} -8V2M{fmt(right)} -8H{fmt(right - 10)}M{fmt(right)} -8V2'
            f'M{left} 108H{left + 10}M{left} 108V98M{fmt(right)} 108H{fmt(right - 10)}M{fmt(right)} 108V98')
    target = lambda cx: f'<circle cx="{fmt(cx)}" cy="50" r="5"/><path d="M{fmt(cx - 8)} 50H{fmt(cx + 8)}M{fmt(cx)} 42V58"/>'

    # Painted bounds: the registration targets reach 10.5 units past the crop
    # marks' x, the crop marks 8.5 above and below. One unit of margin.
    vx0, vx1 = left - 2 - 8.5 - 1, right + 2 + 8.5 + 1
    vb = (vx0, -9.5, vx1 - vx0, 119)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{' '.join(fmt(v) for v in vb)}" width="{fmt(vb[2])}" height="{fmt(vb[3])}">
<!-- Generated by tools/make-laibor-wordmark.py. Don't hand-edit; re-run the tool. -->
<defs>
{chr(10).join(patterns)}
<mask id="halftone" maskUnits="userSpaceOnUse" x="{fmt(vx0)}" y="-10" width="{fmt(vb[2])}" height="120">
<rect x="{fmt(vx0)}" y="-10" width="{fmt(vb[2])}" height="120" fill="#fff"/>
{''.join(rows)}
</mask>
<filter id="grain" x="-5%" y="-10%" width="110%" height="125%">
<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="21" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.18 1" result="grain"/>
<feComposite in="SourceGraphic" in2="grain" operator="in"/>
</filter>
</defs>
<g fill="none" stroke="{TEAL}" stroke-width="1" opacity=".55">
<path d="{crop}"/>{target(left - 2)}{target(right + 2)}
</g>
<g fill-rule="evenodd" filter="url(#grain)">
<path d="{cream}{teal}" fill="{TEAL}" opacity=".55" transform="translate(3.5 3)"/>
<g mask="url(#halftone)">
<path d="{cream}" fill="{CREAM}"/>
<path d="{teal}" fill="{TEAL}"/>
</g>
</g>
</svg>
'''
    return svg, vb


def main():
    svg, vb = build()
    if '--check' in sys.argv:
        current = OUT.read_text() if OUT.exists() else ''
        if current != svg:
            print(f'{OUT.name} is stale; run tools/make-laibor-wordmark.py')
            sys.exit(1)
        print(f'{OUT.name} is up to date')
        return
    OUT.write_text(svg)
    print(f'wrote {OUT.relative_to(OUT.parent.parent)} ({len(svg.encode()):,} bytes)')
    print(f'viewBox {" ".join(fmt(v) for v in vb)}  ->  <img width="{round(vb[2])}" height="{round(vb[3])}">')


if __name__ == '__main__':
    main()
