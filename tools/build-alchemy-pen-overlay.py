#!/usr/bin/env python3
"""Build the small pen overlay that sits on top of the pen-less Screening Room backdrop.

The scene used to ship two full 1.5MB backdrops that were identical except for the
painted fountain pen, swapping between them to make the pen appear and disappear.
This crops just the differing region out of the with-pen art and saves it as a tiny
lossless WebP. Composited over the pen-less backdrop it reproduces the original art
pixel for pixel, so hiding the overlay reveals the bare desk with no seam.

Run after regenerating either backdrop. Prints the CSS percentages to paste into
.bt-alchemy-pen-overlay in before-times.css if the pen ever moves.
"""

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
WITH_PEN = ROOT / "images/before-times/absurd-alchemy-clean-v4.webp"
NO_PEN = ROOT / "images/before-times/absurd-alchemy-clean-v4-no-pen.webp"
OUTPUT = ROOT / "images/before-times/layers/alchemy-pen-overlay-v1.webp"

# Margin lands on pixels that are identical in both backdrops, so any sub-pixel
# rounding at the overlay's edges falls on matching colour and stays invisible.
MARGIN = 4


def main() -> None:
    with_pen = Image.open(WITH_PEN).convert("RGB")
    no_pen = Image.open(NO_PEN).convert("RGB")
    if with_pen.size != no_pen.size:
        raise SystemExit(f"backdrops differ in size: {with_pen.size} vs {no_pen.size}")

    bbox = ImageChops.difference(with_pen, no_pen).getbbox()
    if bbox is None:
        raise SystemExit("backdrops are identical — nothing to crop")

    width, height = with_pen.size
    box = (bbox[0] - MARGIN, bbox[1] - MARGIN, bbox[2] + MARGIN, bbox[3] + MARGIN)
    crop = with_pen.crop(box)

    # Prove the composite is lossless before writing anything.
    rebuilt = no_pen.copy()
    rebuilt.paste(crop, (box[0], box[1]))
    if ImageChops.difference(rebuilt, with_pen).getbbox() is not None:
        raise SystemExit("composite does not reproduce the with-pen art — aborting")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    crop.save(OUTPUT, "WEBP", lossless=True, quality=100, method=6)

    print(f"wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes, {crop.width}x{crop.height})")
    print()
    print("CSS for .bt-alchemy-pen-overlay in before-times.css:")
    print(f"    left:   {box[0] / width * 100:.4f}%;")
    print(f"    top:    {box[1] / height * 100:.4f}%;")
    print(f"    width:  {(box[2] - box[0]) / width * 100:.4f}%;")
    print(f"    height: {(box[3] - box[1]) / height * 100:.4f}%;")
    print()
    print(f'HTML intrinsic size: width="{crop.width}" height="{crop.height}"')


if __name__ == "__main__":
    main()
