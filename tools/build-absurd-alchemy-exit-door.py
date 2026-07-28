"""Build the Absurd Alchemy inside-facing exit doorway.

The complete generated render supplies the frame, lobby view, and threshold as
one continuous painted composition.  It is fitted directly into the source
crop's full-scene origin and clipped only at the outside doorway silhouette, so
the lintel and jambs are never reconstructed from separate pieces.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
LAYER_DIR = ROOT / "images/before-times/layers"

SOURCE_PLATE = ROOT / "images/before-times/absurd-alchemy-clean-v3.png"
FRAME_LAYER = LAYER_DIR / "alchemy-exit-door-frame-original-v1.png"
REPAIR_SOURCE = PATCH_DIR / "alchemy-no-exit-door-v1.png"
INTERIOR_FRAME_SOURCE = (
    PATCH_DIR / "alchemy-exit-door-interior-frame-source-v1.png"
)

OUTPUT_PLATE = ROOT / "images/before-times/absurd-alchemy-clean-v4.png"
OUTPUT_NO_PEN_PLATE = (
    ROOT / "images/before-times/absurd-alchemy-clean-v4-no-pen.png"
)
OUTPUT_LAYER = LAYER_DIR / "alchemy-exit-door-lobby-v4.png"

# The generated repair uses this exact source crop as its composition target.
REPAIR_BOX = (1110, 18, 1515, 725)

# The generated render derives from this exact crop of the installed scene and
# has the same aspect ratio. A direct fit preserves its coherent perspective.
RENDER_BOX = (1116, 58, 1474, 719)
RENDER_SOURCE_SIZE = (922, 1705)
PEN_FREE_PATCH_BOX = (99, 579, 186, 613)

# One continuous outside contour retains the entire rendered frame and lobby
# opening. No internal cuts are made through the jambs, lintel, or threshold.
RENDERED_DOORWAY_POLYGON = (
    (95, 153),
    (812, 43),
    (852, 67),
    (852, 1454),
    (700, 1595),
    (240, 1595),
    (98, 1492),
    (96, 181),
)

def save_png_and_webp(image: Image.Image, path: Path) -> None:
    image.save(path)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def build_original_door_alpha(
    frame: Image.Image, size: tuple[int, int]
) -> Image.Image:
    """Return the old doorway footprint used to repair the clean room plate."""
    frame_alpha = frame.getchannel("A")

    opening = Image.new("L", size, 0)
    ImageDraw.Draw(opening).polygon(
        ((1200, 156), (1410, 162), (1412, 625), (1200, 652)),
        fill=255,
    )

    # The flattened source plate retains two tiny cap fragments outside the
    # separately extracted legacy-frame alpha. Include those fragments in the
    # repair footprint so they cannot peek out above the replacement lintel.
    remnants = Image.new("L", size, 0)
    draw = ImageDraw.Draw(remnants)
    draw.polygon(
        ((1158, 58), (1194, 58), (1194, 121), (1154, 127), (1154, 88)),
        fill=255,
    )
    draw.polygon(
        ((1375, 24), (1417, 24), (1421, 84), (1374, 84)),
        fill=255,
    )

    return ImageChops.lighter(ImageChops.lighter(frame_alpha, opening), remnants)


def build_rendered_doorway(size: tuple[int, int]) -> Image.Image:
    source = Image.open(INTERIOR_FRAME_SOURCE).convert("RGBA")
    if source.size != RENDER_SOURCE_SIZE:
        raise ValueError(
            f"Expected generated doorway source {RENDER_SOURCE_SIZE}, got {source.size}"
        )

    mask = Image.new("L", source.size, 0)
    ImageDraw.Draw(mask).polygon(RENDERED_DOORWAY_POLYGON, fill=255)
    source.putalpha(mask.filter(ImageFilter.GaussianBlur(0.8)))

    render_size = (
        RENDER_BOX[2] - RENDER_BOX[0],
        RENDER_BOX[3] - RENDER_BOX[1],
    )
    fitted = source.resize(render_size, Image.Resampling.LANCZOS)

    doorway = Image.new("RGBA", size, (0, 0, 0, 0))
    doorway.alpha_composite(fitted, dest=RENDER_BOX[:2])
    return doorway


def main() -> None:
    source = Image.open(SOURCE_PLATE).convert("RGBA")
    no_pen_source = Image.open(OUTPUT_NO_PEN_PLATE).convert("RGBA")
    frame = Image.open(FRAME_LAYER).convert("RGBA")
    if frame.size != source.size:
        raise ValueError("Door frame and room plate must share a raster origin")
    if no_pen_source.size != source.size:
        raise ValueError("Pen-free room plate must share the source raster origin")

    repair_alpha = build_original_door_alpha(frame, source.size)
    doorway = build_rendered_doorway(source.size)

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
    repair_core = repair_alpha.point(lambda value: 255 if value >= 254 else 0)
    repair_mask = repair_core.filter(ImageFilter.MinFilter(5)).filter(
        ImageFilter.GaussianBlur(0.45)
    )
    clean_plate = Image.composite(repair, source, repair_mask)
    clean_plate.putalpha(255)

    # The live page uses the pen-free plate plus a tiny lossless pen overlay.
    # Preserve the stable pen-free donor crop while applying this doorway repair
    # to that runtime plate as well.
    pen_free_patch = no_pen_source.crop(PEN_FREE_PATCH_BOX)
    no_pen_plate = clean_plate.copy()
    no_pen_plate.paste(pen_free_patch, PEN_FREE_PATCH_BOX[:2])

    save_png_and_webp(clean_plate, OUTPUT_PLATE)
    save_png_and_webp(no_pen_plate, OUTPUT_NO_PEN_PLATE)
    save_png_and_webp(doorway, OUTPUT_LAYER)

    preview = clean_plate.copy()
    preview.alpha_composite(doorway)
    preview.convert("RGB").save(Path("/tmp/bt-alchemy-exit-door-preview-v2.png"))

    print(f"Wrote {OUTPUT_PLATE}")
    print(f"Wrote {OUTPUT_LAYER}")
    print("Wrote /tmp/bt-alchemy-exit-door-preview-v2.png")


if __name__ == "__main__":
    main()
