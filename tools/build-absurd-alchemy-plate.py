#!/usr/bin/env python3
"""Build the Absurd Alchemy clean plate from the locked concept and screen patch."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = ROOT / "images/before-times/absurd-alchemy-concept-v1.png"
PATCH_PATH = ROOT / "tools/before-times-clean-patches/alchemy-hero-screen-dark-v1.webp"
PNG_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v1.png"
WEBP_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v1.webp"

PATCH_BOX = (190, 110, 790, 470)
SCREEN_POLYGON = (
    (211, 145),
    (229, 125),
    (253, 119),
    (704, 132),
    (741, 145),
    (759, 168),
    (763, 410),
    (752, 438),
    (717, 456),
    (248, 452),
    (220, 438),
    (208, 411),
    (207, 171),
)


def main() -> None:
    base = Image.open(BASE_PATH).convert("RGB")
    patch = Image.open(PATCH_PATH).convert("RGB")
    if patch.size != (PATCH_BOX[2] - PATCH_BOX[0], PATCH_BOX[3] - PATCH_BOX[1]):
        raise ValueError(f"Unexpected screen patch size: {patch.size}")

    donor = base.copy()
    donor.paste(patch, PATCH_BOX[:2])

    mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(SCREEN_POLYGON, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.6))

    clean = Image.composite(donor, base, mask)
    clean.save(PNG_PATH, optimize=True)
    clean.save(WEBP_PATH, "WEBP", quality=91, method=6)

    print(f"Wrote {PNG_PATH.relative_to(ROOT)}")
    print(f"Wrote {WEBP_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
