#!/usr/bin/env python3
"""
Build images/before-times-door-card.svg from the raster Recently card art.

The Before Times card (images/before-times-door-card.webp) is a cut-paper
poster: six flat colours, a slanted door frame, an orange slab hinged at the
opening's right jamb and swung out toward the viewer, a stack of sage/teal
blocks in the opening, and a spill of light across the floor. main.js's door flight (initBeforeTimesDoor) needs that design as
vectors so it can scale the poster eight times over without pixelating, swing
the slab, and push the blocks away for parallax. Raster zooms can't do that.

Two kinds of geometry come out of here:

  * The lettering ("THE BEFORE TIMES") is traced from the art. Every pixel is
    classified to the nearest palette colour, the cream mask is cleaned with a
    small open/close, and each letter's outer contour and holes come out as one
    evenodd path. approxPolyDP with a 1.2px tolerance keeps the hand-cut wobble.

  * The door, wall, blocks and floor are hand-authored polygons below, read off
    the same trace once and tidied. They have to be authored, not traced: the
    flight sweeps the slab aside, so the wall has to be solid where the raster
    only shows orange, and the opening has to stop at the hinge.

Re-run this whenever the source art changes. The output is deterministic, so a
no-op run produces no diff. Needs numpy, Pillow and opencv-python (the
transcription env in tools/requirements.txt does not carry them):

    pip install numpy pillow opencv-python
    python3 tools/make-bt-door-svg.py [--check]

--check reports whether the committed SVG is current without writing.
"""

import argparse
import os
import sys

import numpy as np

try:
    import cv2
    from PIL import Image
except ImportError as error:  # pragma: no cover
    sys.exit(f"missing dependency: {error} (pip install numpy pillow opencv-python)")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "images", "before-times-door-card.webp")
OUTPUT = os.path.join(ROOT, "images", "before-times-door-card.svg")

W, H = 1400, 910

# The six flat paper colours, in the order they were sampled from the art.
PALETTE = {
    "teal": (0, 58, 58),
    "dark": (8, 14, 15),
    "orange": (208, 131, 3),
    "cream": (250, 224, 182),
    "sageLight": (167, 172, 132),
    "sageMid": (106, 123, 93),
}

# Fill colours for the emitted shapes. Slightly tuned from the sampled means so
# the flat vector reads like the textured print rather than a swatch of it.
FILL = {
    "sky": "#013a3a",
    "skyEdge": "#002a2b",
    "cream": "#fbe1b6",
    "floor": "#f8dbb0",
    "wall": "#080e0f",
    "door": "#d38504",
    "doorEdge": "#a86503",
    "sageLight": "#a7ac84",
    "sageMid": "#6a7b5d",
    "tealBlock": "#0b4d4a",
    "tealBlockDeep": "#034240",
}

# ---- hand-authored geometry (SVG user units, 1400 x 910) --------------------

# Outer silhouette of the dark wall, clockwise from the top-right corner.
WALL_OUTER = "1291,38 1106,76 810,148 785,689 841,690 850,685 1275,716 1383,743 1339,376"
# The opening cut through it. Its right jamb is the slab's hinge edge: the
# door is swung open toward the viewer and to the right, so its taller right
# edge is the free edge nearest the camera, and the wall is solid behind it.
OPENING = "904,263 1103,208 1120,679 850,685"
# Backing plane that shows through the opening once the slab swings away: the
# opening itself, so nothing of it can peek past the wall's slanted top edge.
INTERIOR = OPENING

# Orange slab. Hinge runs down its LEFT edge, (1104,208) -> (1120,679); the
# right edge is the free edge, swung out toward the viewer.
DOOR = "1211,98 1104,208 1120,679 1275,751 1215,98"
HINGE_TOP = (1104, 208)
HINGE_BOTTOM = (1120, 679)

# Spill of light across the floor, in front of the wall.
FLOOR = "849,691 316,909 1256,909 1119,681"

# The stacked blocks seen through the opening, back to front.
BLOCKS = [
    ("sageLight", "910,339 905,418 924,422 927,390 955,391 953,348"),
    ("sageMid", "928,390 925,423 983,437 986,515 990,516 987,540 991,613 1017,612 1009,401"),
    ("tealBlockDeep", "982,437 905,421 888,674 991,642"),
    ("sageLight", "1012,447 1018,612 1028,612 1031,537 1041,536 1043,497 1058,496 1055,454"),
    ("sageMid", "1044,497 1042,536 1101,533 1105,567 1109,567 1104,497"),
    ("tealBlock", "1101,534 1033,538 1030,612 1111,613"),
]


def classify(rgb):
    """Nearest-palette-colour label map for an (H, W, 3) uint8 image."""
    names = list(PALETTE)
    centres = np.array([PALETTE[n] for n in names], dtype=np.float32)
    flat = rgb.reshape(-1, 3).astype(np.float32)
    dist = ((flat[:, None, :] - centres[None, :, :]) ** 2).sum(axis=2)
    return dist.argmin(axis=1).reshape(rgb.shape[:2]), names


def title_path(rgb):
    labels, names = classify(rgb)
    cream = (labels == names.index("cream")).astype(np.uint8) * 255
    kernel = np.ones((5, 5), np.uint8)
    cream = cv2.morphologyEx(cream, cv2.MORPH_OPEN, kernel)
    cream = cv2.morphologyEx(cream, cv2.MORPH_CLOSE, kernel)
    contours, hierarchy = cv2.findContours(cream, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        sys.exit("no cream regions found; is the source art the door poster?")
    hierarchy = hierarchy[0]
    # The letters live left of the door; the interior + floor is one big
    # component whose box reaches the right edge. Keep only letter outers.
    keep = set()
    for index, contour in enumerate(contours):
        parent = hierarchy[index][3]
        if parent != -1:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        if x + w > 800 or cv2.contourArea(contour) < 400:
            continue
        keep.add(index)
    if len(keep) < 10:
        sys.exit(f"only {len(keep)} letter outlines found; expected the fourteen letters")
    pieces = []
    for index in sorted(keep, key=lambda i: cv2.boundingRect(contours[i])[0]):
        pieces.append(polyline(contours[index], 1.2))
        child = hierarchy[index][2]
        while child != -1:
            if cv2.contourArea(contours[child]) >= 60:
                pieces.append(polyline(contours[child], 1.2))
            child = hierarchy[child][0]
    return " ".join(pieces)


def ring(points):
    """'x,y x,y ...' polygon points as one closed path subpath."""
    pairs = [pair.split(",") for pair in points.split()]
    head = f"M{pairs[0][0]} {pairs[0][1]}"
    tail = " ".join(f"L{x} {y}" for x, y in pairs[1:])
    return f"{head} {tail} Z"


def polyline(contour, epsilon):
    points = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
    head = f"M{points[0][0]} {points[0][1]}"
    tail = " ".join(f"L{x} {y}" for x, y in points[1:])
    return f"{head} {tail} Z"


def build(title):
    blocks = "\n".join(
        f'      <polygon fill="{FILL[colour]}" points="{points}"/>' for colour, points in BLOCKS
    )
    hinge_mid = ((HINGE_TOP[0] + HINGE_BOTTOM[0]) / 2, (HINGE_TOP[1] + HINGE_BOTTOM[1]) / 2)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="bt-door-title">
  <!-- Generated by tools/make-bt-door-svg.py from images/before-times-door-card.webp. Do not hand-edit; re-run the tool. -->
  <title id="bt-door-title">The Before Times: an open archive doorway spills warm light across a deep teal cut-paper poster</title>
  <defs>
    <radialGradient id="bt-door-sky" cx="42%" cy="40%" r="78%">
      <stop offset="0" stop-color="{FILL['sky']}"/>
      <stop offset="1" stop-color="{FILL['skyEdge']}"/>
    </radialGradient>
    <linearGradient id="bt-door-slab" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{FILL['door']}"/>
      <stop offset="1" stop-color="{FILL['doorEdge']}"/>
    </linearGradient>
  </defs>
  <rect class="bt-door-sky" width="{W}" height="{H}" fill="url(#bt-door-sky)"/>
  <g class="bt-door-title" fill="{FILL['cream']}" fill-rule="evenodd">
    <path d="{title}"/>
  </g>
  <g class="bt-door-scene">
    <polygon class="bt-door-interior" fill="{FILL['cream']}" points="{INTERIOR}"/>
    <g class="bt-door-blocks" data-origin="1060 420">
{blocks}
    </g>
    <path class="bt-door-wall" fill="{FILL['wall']}" fill-rule="evenodd" d="{ring(WALL_OUTER)} {ring(OPENING)}"/>
    <polygon class="bt-door-floor" fill="{FILL['floor']}" points="{FLOOR}"/>
    <g class="bt-door-slab" data-hinge="{HINGE_TOP[0]} {HINGE_TOP[1]} {HINGE_BOTTOM[0]} {HINGE_BOTTOM[1]}" data-hinge-mid="{hinge_mid[0]:g} {hinge_mid[1]:g}">
      <polygon fill="url(#bt-door-slab)" points="{DOOR}"/>
      <polygon class="bt-door-slab-shade" fill="#000" opacity="0" points="{DOOR}"/>
    </g>
  </g>
</svg>
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="report staleness without writing")
    args = parser.parse_args()

    image = Image.open(SOURCE).convert("RGB")
    if image.size != (W, H):
        sys.exit(f"expected {W}x{H} source art, got {image.size[0]}x{image.size[1]}")
    rgb = np.asarray(image)
    svg = build(title_path(rgb))

    current = None
    if os.path.exists(OUTPUT):
        with open(OUTPUT, "r", encoding="utf-8", newline="") as handle:
            current = handle.read()
    if current == svg:
        print(f"up to date: {os.path.relpath(OUTPUT, ROOT)} ({len(svg):,} bytes)")
        return 0
    if args.check:
        print(f"stale: {os.path.relpath(OUTPUT, ROOT)}")
        return 1
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(svg)
    print(f"wrote {os.path.relpath(OUTPUT, ROOT)} ({len(svg):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
