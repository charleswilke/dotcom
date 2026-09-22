#!/usr/bin/env python3
"""Generate the "Playable Browser Games" section-title lettering.

    python3 tools/make-games-title-svg.py                    # the live one (marquee)
    python3 tools/make-games-title-svg.py --variant vector   # the alternative
    python3 tools/make-games-title-svg.py --out DIR          # somewhere else

Two variants share the geometry. "marquee" (live since 2026-09-22) has a
cream-to-amber face and a shaded magenta extrusion; "vector" has a dark face,
a cyan outline and a hidden-line-removed magenta wireframe extrusion. Vector
was the runner-up: the more literal vector-monitor idea, but its wire competes
with the letters at phone width.

The output lives under /images/, which is served immutable: after
regenerating, bump the ?v= on the <img> in index.html by hand.

BROWSER GAMES is heavy chamfered arcade capitals, extruded in one-point
perspective toward a vanishing point below the line. PLAYABLE is single-stroke
vector capitals, the way a vector monitor actually drew text.

The geometry is the source of truth: glyphs are polygons on a 100-unit cap
height, and everything else (extrusion, hidden faces, shading, viewBox) is
derived. Edit a glyph here and re-run; don't hand-edit the SVGs.
"""

import math
import os
import sys

# --- Glyphs -------------------------------------------------------------------
# Filled glyphs: a list of contours, filled evenodd. y runs down, 0..100.
# Rule of thumb: corners that are round in a conventional face are chamfered
# (O, G, S, A, the bowls of B/R); stems and arms stay square.
FILLED = {
    'B': (78, [
        [(0, 0), (62, 0), (74, 12), (74, 38), (66, 50), (78, 62), (78, 88), (66, 100), (0, 100)],
        [(24, 22), (46, 22), (50, 26), (50, 36), (46, 40), (24, 40)],
        [(24, 60), (50, 60), (54, 64), (54, 74), (50, 78), (24, 78)],
    ]),
    'R': (78, [
        [(0, 0), (62, 0), (74, 12), (74, 44), (64, 54), (78, 100), (52, 100), (41, 60), (24, 60), (24, 100), (0, 100)],
        [(24, 22), (46, 22), (50, 26), (50, 34), (46, 38), (24, 38)],
    ]),
    'O': (78, [
        [(12, 0), (66, 0), (78, 12), (78, 88), (66, 100), (12, 100), (0, 88), (0, 12)],
        [(30, 22), (48, 22), (54, 28), (54, 72), (48, 78), (30, 78), (24, 72), (24, 28)],
    ]),
    'W': (106, [
        [(0, 0), (24, 0), (30, 62), (41, 24), (65, 24), (76, 62), (82, 0), (106, 0),
         (96, 100), (68, 100), (53, 54), (38, 100), (10, 100)],
    ]),
    'S': (78, [
        [(12, 0), (78, 0), (78, 22), (28, 22), (24, 26), (24, 35), (28, 39), (66, 39), (78, 51),
         (78, 88), (66, 100), (0, 100), (0, 78), (50, 78), (54, 74), (54, 65), (50, 61),
         (12, 61), (0, 49), (0, 12)],
    ]),
    'E': (70, [
        [(0, 0), (70, 0), (70, 22), (24, 22), (24, 39), (58, 39), (58, 61), (24, 61),
         (24, 78), (70, 78), (70, 100), (0, 100)],
    ]),
    'G': (78, [
        [(12, 0), (78, 0), (78, 22), (30, 22), (24, 28), (24, 72), (30, 78), (54, 78), (54, 64),
         (42, 64), (42, 44), (78, 44), (78, 88), (66, 100), (12, 100), (0, 88), (0, 12)],
    ]),
    'A': (82, [
        [(0, 12), (12, 0), (70, 0), (82, 12), (82, 100), (58, 100), (58, 66), (24, 66), (24, 100), (0, 100)],
        [(28, 22), (54, 22), (58, 26), (58, 46), (24, 46), (24, 26)],
    ]),
    'M': (102, [
        [(0, 0), (27, 0), (51, 36), (75, 0), (102, 0), (102, 100), (78, 100), (78, 46),
         (57, 74), (45, 74), (24, 46), (24, 100), (0, 100)],
    ]),
}

# Single-stroke glyphs: polylines along the centreline, same 100-unit height.
STROKED = {
    'P': (54, [[(0, 100), (0, 0), (44, 0), (54, 10), (54, 38), (44, 48), (0, 48)]]),
    'L': (46, [[(0, 0), (0, 100), (46, 100)]]),
    'A': (58, [[(0, 100), (0, 14), (14, 0), (44, 0), (58, 14), (58, 100)], [(0, 56), (58, 56)]]),
    'Y': (58, [[(0, 0), (29, 46), (58, 0)], [(29, 46), (29, 100)]]),
    'B': (56, [[(0, 0), (44, 0), (54, 10), (54, 36), (44, 46), (56, 58), (56, 90), (46, 100), (0, 100), (0, 0)],
               [(0, 46), (44, 46)]]),
    'E': (50, [[(50, 0), (0, 0), (0, 100), (50, 100)], [(0, 48), (40, 48)]]),
}

TRACK = 12          # between filled letters
WORD_GAP = 38
KICK_H = 36         # PLAYABLE cap height
KICK_TRACK = 44     # in 100-unit glyph space, before scaling
KICK_GAP = 28       # PLAYABLE baseline to BROWSER GAMES cap line
VP_DROP = 760       # vanishing point distance below the baseline
DEPTH = 0.042       # fraction of the way to the vanishing point


def fmt(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def path_d(contours, closed=True):
    out = []
    for c in contours:
        out.append('M' + ' L'.join(f'{fmt(x)} {fmt(y)}' for x, y in c) + (' Z' if closed else ''))
    return ' '.join(out)


def inside(pt, contours):
    x, y = pt
    hit = False
    for c in contours:
        n = len(c)
        for i in range(n):
            (x1, y1), (x2, y2) = c[i], c[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                hit = not hit
    return hit


def layout_line(text):
    """Place BROWSER GAMES; returns [(letter, contours)] in line space."""
    placed, x = [], 0
    for ch in text:
        if ch == ' ':
            x += WORD_GAP - TRACK
            continue
        w, contours = FILLED[ch]
        placed.append((ch, [[(px + x, py) for px, py in c] for c in contours]))
        x += w + TRACK
    return placed, x - TRACK


def layout_kicker(text, cx, base_y):
    s = KICK_H / 100
    widths = [STROKED[ch][0] for ch in text]
    total = (sum(widths) + KICK_TRACK * (len(text) - 1)) * s
    x = cx - total / 2
    lines = []
    for ch in text:
        w, polys = STROKED[ch]
        for p in polys:
            lines.append([(x + px * s, base_y - KICK_H + py * s) for px, py in p])
        x += (w + KICK_TRACK) * s
    return lines, cx - total / 2, cx + total / 2


def extrude(contours, vp):
    """Back contours plus visible side quads, each with its outward normal."""
    back = [[(x + (vp[0] - x) * DEPTH, y + (vp[1] - y) * DEPTH) for x, y in c] for c in contours]
    quads = []
    for ci, c in enumerate(contours):
        n = len(c)
        for i in range(n):
            a, b = c[i], c[(i + 1) % n]
            dx, dy = b[0] - a[0], b[1] - a[1]
            ln = math.hypot(dx, dy)
            nx, ny = dy / ln, -dx / ln
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            if inside((mid[0] + nx * 0.5, mid[1] + ny * 0.5), contours):
                nx, ny = -nx, -ny
            # A side face shows when its edge faces the vanishing point.
            if nx * (vp[0] - mid[0]) + ny * (vp[1] - mid[1]) <= 0:
                continue
            ba, bb = back[ci][i], back[ci][(i + 1) % n]
            dist = math.hypot(vp[0] - mid[0], vp[1] - mid[1])
            quads.append((dist, (nx, ny), [a, b, bb, ba]))
    quads.sort(key=lambda q: -q[0])
    return back, quads


def mix(c1, c2, t):
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(a[i] + (b[i] - a[i]) * t):02x}' for i in range(3))


def build(variant):
    placed, width = layout_line('BROWSER GAMES')
    cx = width / 2
    vp = (cx, 100 + VP_DROP)
    kick_base = -KICK_GAP
    kick, kx0, kx1 = layout_kicker('PLAYABLE', cx, kick_base)

    letters = [(ch, c, *extrude(c, vp)) for ch, c in placed]

    # Painted bounds: faces, extrusion, kicker, flank rules; then glow room.
    pts = [p for _, c, back, _ in letters for cc in c + back for p in cc]
    pts += [p for l in kick for p in l]
    rule_len, rule_gap = 118, 20
    pts += [(kx0 - rule_gap - rule_len, kick_base - KICK_H / 2), (kx1 + rule_gap + rule_len, kick_base)]
    pad = 18
    x0 = min(p[0] for p in pts) - pad
    y0 = min(p[1] for p in pts) - pad
    x1 = max(p[0] for p in pts) + pad
    y1 = max(p[1] for p in pts) + pad
    vb = (x0, y0, x1 - x0, y1 - y0)

    cyan, magenta, amber = '#00f7c2', '#e500cb', '#ffb93a'
    out = []
    w = out.append
    w(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(fmt(v) for v in vb)}" '
      f'width="{fmt(vb[2])}" height="{fmt(vb[3])}" role="img" aria-labelledby="title">')
    w('  <title id="title">Playable Browser Games</title>')
    w(f'  <!-- Generated by tools/make-games-title-svg.py ({variant}). Edit the script, not this file. -->')
    w('  <defs>')
    w('    <filter id="glow" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">')
    w('      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="wide"/>')
    w('      <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="tight"/>')
    w('      <feMerge><feMergeNode in="wide"/><feMergeNode in="tight"/><feMergeNode in="SourceGraphic"/></feMerge>')
    w('    </filter>')
    w('    <linearGradient id="face" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">')
    w('      <stop offset="0" stop-color="#fff7dc"/><stop offset="0.55" stop-color="#ffe0a3"/>'
      f'<stop offset="1" stop-color="{amber}"/>')
    w('    </linearGradient>')
    w('    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">')
    w('      <path d="M0 1H4" stroke="#8a3d10" stroke-opacity="0.16" stroke-width="0.8"/>')
    w('    </pattern>')
    w('  </defs>')

    # Kicker: flank rules with a diamond cap, then the single-stroke letters.
    ky = kick_base - KICK_H / 2
    lx0, lx1 = kx0 - rule_gap - rule_len, kx0 - rule_gap
    rx0, rx1 = kx1 + rule_gap, kx1 + rule_gap + rule_len
    kick_col = amber if variant == 'vector' else cyan
    w(f'  <g fill="none" stroke="{kick_col}" stroke-width="4.6" stroke-linecap="round" '
      'stroke-linejoin="round" filter="url(#glow)">')
    w(f'    <path d="M{fmt(lx0 + 8)} {fmt(ky)} H{fmt(lx1)} M{fmt(rx0)} {fmt(ky)} H{fmt(rx1 - 8)}" stroke-opacity="0.7"/>')
    for x in (lx0, rx1):
        w(f'    <path d="M{fmt(x - 5)} {fmt(ky)} L{fmt(x)} {fmt(ky - 5)} L{fmt(x + 5)} {fmt(ky)} '
          f'L{fmt(x)} {fmt(ky + 5)} Z" fill="{kick_col}"/>')
    w(f'    <path d="{path_d(kick, closed=False)}"/>')
    w('  </g>')

    if variant == 'vector':
        # Wireframe with hidden lines removed: only the far edge of each
        # visible side face, plus a connector where a visible face meets a
        # hidden one (the silhouette). Faces between two visible neighbours
        # keep their shared connector too, since that is a real fold.
        # Opaque letter faces then cover whatever the front hides.
        wire = []
        for _, c, back, quads in letters:
            ends = {}
            for _, _, (a, b, bb, ba) in quads:
                wire.append(f'M{fmt(ba[0])} {fmt(ba[1])} L{fmt(bb[0])} {fmt(bb[1])}')
                for f, k in ((a, ba), (b, bb)):
                    ends[f] = k
            for (fx, fy), (bx, by) in ends.items():
                wire.append(f'M{fmt(fx)} {fmt(fy)} L{fmt(bx)} {fmt(by)}')
        w(f'  <g fill="none" stroke="{magenta}" stroke-width="2" stroke-linejoin="round" '
          'stroke-linecap="round" filter="url(#glow)">')
        w(f'    <path d="{" ".join(wire)}"/>')
        w('  </g>')
        faces = ' '.join(path_d(c) for _, c, _, _ in letters)
        w(f'  <path d="{faces}" fill="#05060d" fill-rule="evenodd"/>')
        w(f'  <path d="{faces}" fill="none" stroke="{cyan}" stroke-width="3.2" stroke-linejoin="round" '
          'filter="url(#glow)"/>')
    else:
        # Marquee: shaded side faces (lit from the top left), then the face.
        lite, dark = '#ff5fd6', '#3c0752'
        w('  <g stroke-linejoin="round">')
        for _, c, back, quads in letters:
            for _, (nx, ny), q in quads:
                shade = (1 - (nx * -0.55 + ny * -0.83)) / 2        # 0 = facing the light
                col = mix(lite, dark, min(1, max(0, shade * 1.15)))
                w(f'    <path d="{path_d([q])}" fill="{col}" stroke="{col}" stroke-width="0.7"/>')
        w('  </g>')
        faces = ' '.join(path_d(c) for _, c, _, _ in letters)
        w(f'  <path d="{faces}" fill="none" stroke="{cyan}" stroke-width="3" stroke-linejoin="round" '
          'filter="url(#glow)" stroke-opacity="0.85"/>')
        w(f'  <path d="{faces}" fill="url(#face)" fill-rule="evenodd"/>')
        w(f'  <path d="{faces}" fill="url(#scan)" fill-rule="evenodd"/>')

    w('</svg>')
    return '\n'.join(out) + '\n'


def main(argv):
    out_dir = 'images/games'
    if '--out' in argv:
        out_dir = argv[argv.index('--out') + 1]
    variant = 'marquee'
    if '--variant' in argv:
        variant = argv[argv.index('--variant') + 1]
    if variant not in ('marquee', 'vector'):
        sys.exit(f'unknown variant {variant!r}: marquee or vector')
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f'section-title-{variant}.svg')
    with open(path, 'w') as f:
        f.write(build(variant))
    print(f'  {path}: {os.path.getsize(path) / 1024:.1f}K')


if __name__ == '__main__':
    main(sys.argv[1:])
