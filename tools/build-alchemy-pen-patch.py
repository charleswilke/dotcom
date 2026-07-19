#!/usr/bin/env python3
"""Build the coherent paper-stack layer shown after collecting the Alchemy pen."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DONOR = ROOT / "tools/before-times-clean-patches/alchemy-paper-single-sheet-generated-v3.png"
OUTPUT_PNG = ROOT / "images/before-times/layers/alchemy-pen-free-patch-v4.png"
OUTPUT_WEBP = ROOT / "images/before-times/layers/alchemy-pen-free-patch-v4.webp"

PATCH_SIZE = (340, 190)


def main() -> None:
    result = Image.open(DONOR).convert("RGBA").resize(PATCH_SIZE, Image.Resampling.LANCZOS)
    mask = Image.new("L", result.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((-12, 8, result.width - 8, result.height - 6), radius=10, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(4.5))
    result.putalpha(mask)
    result.save(OUTPUT_PNG, optimize=True)
    result.save(OUTPUT_WEBP, "WEBP", quality=91, method=6)
    print(f"Wrote {OUTPUT_PNG.relative_to(ROOT)}")
    print(f"Wrote {OUTPUT_WEBP.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
