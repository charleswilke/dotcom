"""Separate the Absurd Alchemy exit doorway from the room plate.

The doorway layer deliberately keeps the original concept pixels.  Its alpha
combines the existing frame extraction with the lobby view inside the opening,
so the reverse-side clapboard, frame, threshold, and lobby glimpse behave as
one hoverable asset without changing their installed perspective.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
LAYER_DIR = ROOT / "images/before-times/layers"

SOURCE_PLATE = ROOT / "images/before-times/absurd-alchemy-clean-v3.png"
FRAME_LAYER = LAYER_DIR / "alchemy-exit-door-frame-original-v1.png"
REPAIR_SOURCE = PATCH_DIR / "alchemy-no-exit-door-v1.png"

OUTPUT_PLATE = ROOT / "images/before-times/absurd-alchemy-clean-v4.png"
OUTPUT_LAYER = LAYER_DIR / "alchemy-exit-door-lobby-v2.png"

# The generated repair uses this exact source crop as its composition target.
REPAIR_BOX = (1110, 18, 1515, 725)

# The opening belongs to the sprite along with the physical frame.  These
# points follow the hand-drawn keystone rather than imposing a rectangle.
OPENING_POLYGON = (
    (1200, 156),
    (1410, 162),
    (1412, 625),
    (1200, 652),
)

# Keep the useful original frame extraction while trimming the adjacent shelf
# and table fragments that were harmless on the old hollow frame layer but
# would make a whole-door glow read as a ragged panel.
ASSEMBLY_CLIP = (
    (1170, 78),
    (1399, 43),
    (1427, 61),
    (1445, 104),
    (1443, 575),
    (1419, 625),
    (1414, 654),
    (1200, 668),
    (1155, 652),
    (1156, 126),
)


def save_png_and_webp(image: Image.Image, path: Path) -> None:
    image.save(path)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def build_door_alpha(frame: Image.Image, size: tuple[int, int]) -> Image.Image:
    frame_alpha = frame.getchannel("A")

    clip = Image.new("L", size, 0)
    ImageDraw.Draw(clip).polygon(ASSEMBLY_CLIP, fill=255)
    frame_alpha = ImageChops.multiply(frame_alpha, clip)

    opening = Image.new("L", size, 0)
    ImageDraw.Draw(opening).polygon(OPENING_POLYGON, fill=255)

    return ImageChops.lighter(frame_alpha, opening)


def main() -> None:
    source = Image.open(SOURCE_PLATE).convert("RGBA")
    frame = Image.open(FRAME_LAYER).convert("RGBA")
    if frame.size != source.size:
        raise ValueError("Door frame and room plate must share a raster origin")

    alpha = build_door_alpha(frame, source.size)
    doorway = source.copy()
    doorway.putalpha(alpha)

    repair_source = Image.open(REPAIR_SOURCE).convert("RGB")
    repair_size = (REPAIR_BOX[2] - REPAIR_BOX[0], REPAIR_BOX[3] - REPAIR_BOX[1])
    repair_source = ImageOps.fit(
        repair_source,
        repair_size,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    repair = Image.new("RGBA", source.size, (0, 0, 0, 0))
    repair.paste(repair_source.convert("RGBA"), REPAIR_BOX[:2])

    # Keep the generated repair just inside the opaque sprite footprint.  The
    # antialiased fringe retains its identical source pixels underneath, which
    # prevents a repair-colored seam while the layer is at rest.
    repair_core = alpha.point(lambda value: 255 if value >= 254 else 0)
    repair_mask = repair_core.filter(ImageFilter.MinFilter(5)).filter(
        ImageFilter.GaussianBlur(0.45)
    )
    clean_plate = Image.composite(repair, source, repair_mask)
    clean_plate.putalpha(255)

    save_png_and_webp(clean_plate, OUTPUT_PLATE)
    save_png_and_webp(doorway, OUTPUT_LAYER)

    preview = clean_plate.copy()
    preview.alpha_composite(doorway)
    preview.convert("RGB").save(Path("/tmp/bt-alchemy-exit-door-preview-v2.png"))

    print(f"Wrote {OUTPUT_PLATE}")
    print(f"Wrote {OUTPUT_LAYER}")
    print("Wrote /tmp/bt-alchemy-exit-door-preview-v2.png")


if __name__ == "__main__":
    main()
