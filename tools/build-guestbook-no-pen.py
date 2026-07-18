#!/usr/bin/env python3
"""Build the coherent pen-free lobby guestbook replacement layer."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images/before-times/layers/guestbook.png"
DONOR = ROOT / "tools/before-times-clean-patches/guestbook-no-pen-generated-v2.png"
OUTPUT_PNG = ROOT / "images/before-times/layers/guestbook-no-pen-v4.png"
OUTPUT_WEBP = ROOT / "images/before-times/layers/guestbook-no-pen-v4.webp"

DONOR_PAGE_BOX = (900, 150, 1370, 560)
TARGET_PAGE_BOX = (202, 28, 397, 198)


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    donor_page = Image.open(DONOR).convert("RGB").crop(DONOR_PAGE_BOX).resize(
        (TARGET_PAGE_BOX[2] - TARGET_PAGE_BOX[0], TARGET_PAGE_BOX[3] - TARGET_PAGE_BOX[1]),
        Image.Resampling.LANCZOS,
    )
    red, green, blue = donor_page.split()
    donor_page = Image.merge(
        "RGB",
        (
            red.point(lambda value: min(255, round(value * 1.005))),
            green.point(lambda value: min(255, round(value * 1.03))),
            blue.point(lambda value: min(255, round(value * 1.068))),
        ),
    )

    replacement = source.copy()
    replacement.paste(donor_page, TARGET_PAGE_BOX[:2])

    # Copy only the pixels covered by the original pen and its contact shadow.
    # Everything else remains byte-for-byte sourced from guestbook.png.
    core_mask = Image.new("L", source.size, 0)
    core_draw = ImageDraw.Draw(core_mask)
    core_draw.line(((332, 87), (278, 168)), fill=255, width=36)
    core_draw.ellipse((313, 68, 351, 106), fill=255)
    core_draw.ellipse((260, 148, 298, 184), fill=255)
    mask = core_mask.filter(ImageFilter.GaussianBlur(1.1))
    result = Image.composite(replacement, source, mask)

    result.save(OUTPUT_PNG, optimize=True)
    result.save(OUTPUT_WEBP, "WEBP", quality=92, method=6)
    print(f"Wrote {OUTPUT_PNG.relative_to(ROOT)}")
    print(f"Wrote {OUTPUT_WEBP.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
