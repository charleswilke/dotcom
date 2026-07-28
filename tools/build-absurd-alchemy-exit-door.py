"""Build the Absurd Alchemy inside-facing exit doorway.

The lobby view and threshold deliberately keep the original concept pixels.
The frame is a generated inside-facing soundproof cinema surround warped into
the installed perspective.  They share one alpha silhouette so the frame and
lobby glimpse remain a single hoverable asset.
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
OUTPUT_LAYER = LAYER_DIR / "alchemy-exit-door-lobby-v3.png"

# The generated repair uses this exact source crop as its composition target.
REPAIR_BOX = (1110, 18, 1515, 725)

# The opening belongs to the sprite along with the physical frame.  These
# points follow the hand-drawn keystone rather than imposing a rectangle.
OPENING_POLYGON = (
    (1200, 156),
    (1393, 162),
    (1396, 625),
    (1200, 652),
)

THRESHOLD_POLYGON = (
    (1188, 625),
    (1422, 606),
    (1428, 666),
    (1186, 676),
)

# These polygons isolate only the generated blackened-steel, oxblood acoustic,
# and brass surround.  All regenerated lobby and room pixels stay excluded.
INTERIOR_FRAME_SOURCE_POLYGONS = (
    ((95, 72), (812, 43), (852, 67), (851, 196), (704, 242), (218, 271), (96, 195)),
    ((96, 181), (218, 238), (242, 1565), (98, 1492)),
    ((701, 208), (851, 190), (852, 1454), (696, 1513)),
)

# Pillow's perspective transform maps destination pixels back into the source
# image.  These coefficients align the generated frame's four inner corners
# with the installed doorway while letting its outer silhouette stay distinct.
INTERIOR_FRAME_PERSPECTIVE = (
    1.7845989974577003,
    0.062289127619887606,
    -1970.422942482766,
    -0.24851261612859515,
    2.2206249770224646,
    152.70403554287313,
    -0.00019326111462076185,
    0.00011812481932794536,
)

def save_png_and_webp(image: Image.Image, path: Path) -> None:
    image.save(path)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def build_original_door_alpha(
    frame: Image.Image, size: tuple[int, int]
) -> Image.Image:
    """Return the old doorway footprint used to repair the clean room plate."""
    frame_alpha = frame.getchannel("A")
    clip = Image.new("L", size, 0)
    ImageDraw.Draw(clip).polygon(
        (
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
        ),
        fill=255,
    )
    frame_alpha = ImageChops.multiply(frame_alpha, clip)

    opening = Image.new("L", size, 0)
    ImageDraw.Draw(opening).polygon(
        ((1200, 156), (1410, 162), (1412, 625), (1200, 652)),
        fill=255,
    )

    return ImageChops.lighter(frame_alpha, opening)


def build_interior_frame(size: tuple[int, int]) -> Image.Image:
    source = Image.open(INTERIOR_FRAME_SOURCE).convert("RGBA")
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for polygon in INTERIOR_FRAME_SOURCE_POLYGONS:
        draw.polygon(polygon, fill=255)
    source.putalpha(mask.filter(ImageFilter.GaussianBlur(0.65)))

    return source.transform(
        size,
        Image.Transform.PERSPECTIVE,
        data=INTERIOR_FRAME_PERSPECTIVE,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )


def build_doorway(source: Image.Image) -> Image.Image:
    keep = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(keep)
    draw.polygon(OPENING_POLYGON, fill=255)
    draw.polygon(THRESHOLD_POLYGON, fill=255)
    keep = keep.filter(ImageFilter.GaussianBlur(0.35))

    original_pixels = source.copy()
    original_pixels.putalpha(keep)

    doorway = Image.new("RGBA", source.size, (0, 0, 0, 0))
    doorway.alpha_composite(original_pixels)
    doorway.alpha_composite(build_interior_frame(source.size))
    return doorway


def main() -> None:
    source = Image.open(SOURCE_PLATE).convert("RGBA")
    frame = Image.open(FRAME_LAYER).convert("RGBA")
    if frame.size != source.size:
        raise ValueError("Door frame and room plate must share a raster origin")

    repair_alpha = build_original_door_alpha(frame, source.size)
    doorway = build_doorway(source)

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
