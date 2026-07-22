#!/usr/bin/env python3
"""Build the Game Development room plate with the baked desk lamp removed."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images/before-times/games/game-development-room-v1.png"
LAMP = ROOT / "images/before-times/games/game-development-lamp-v1.png"
REPAIR = ROOT / "tools/before-times-clean-patches/game-development-lamp-removal-generated-v1.png"
OUTPUT = ROOT / "images/before-times/games/game-development-room-v2-no-lamp.png"

# The square repair reference was cropped from this exact source rectangle.
CROP_X = 128
CROP_Y = 170
CROP_SIZE = 512

# Keep this placement in sync with .bt-game-lamp-foreground in before-times.css.
LAMP_LEFT = 0.108
LAMP_TOP = 0.348
LAMP_WIDTH = 0.1615


def main() -> None:
    room = Image.open(SOURCE).convert("RGBA")
    repair = Image.open(REPAIR).convert("RGB").resize(
        (CROP_SIZE, CROP_SIZE), Image.Resampling.LANCZOS
    )
    lamp = Image.open(LAMP).convert("RGBA")

    lamp_size = round(room.width * LAMP_WIDTH)
    lamp_left = round(room.width * LAMP_LEFT)
    lamp_top = round(room.height * LAMP_TOP)
    lamp_alpha = lamp.getchannel("A").resize(
        (lamp_size, lamp_size), Image.Resampling.LANCZOS
    )

    # Expand just beyond the extracted silhouette to cover every baked edge,
    # then feather the repair into the untouched plate.
    lamp_alpha = lamp_alpha.filter(ImageFilter.MaxFilter(7))
    lamp_alpha = lamp_alpha.filter(ImageFilter.GaussianBlur(1.1))

    repair_layer = Image.new("RGBA", room.size, (0, 0, 0, 0))
    repair_layer.paste(repair, (CROP_X, CROP_Y))

    repair_mask = Image.new("L", room.size, 0)
    repair_mask.paste(lamp_alpha, (lamp_left, lamp_top))

    # The isolated foreground lamp is a faithful redraw, not a pixel-identical
    # cutout. Cover the original plate's slightly wider hook, arm, shade glow,
    # and base so none of the baked silhouette can ghost around the new layer.
    original_footprint = Image.new("L", room.size, 0)
    footprint_draw = ImageDraw.Draw(original_footprint)
    footprint_draw.polygon(
        [
            (278, 329),
            (309, 330),
            (318, 365),
            (350, 378),
            (372, 402),
            (367, 435),
            (337, 449),
            (318, 441),
            (308, 470),
            (318, 522),
            (349, 538),
            (347, 570),
            (260, 573),
            (256, 540),
            (277, 520),
            (272, 451),
            (251, 430),
            (255, 393),
            (272, 372),
        ],
        fill=255,
    )
    original_footprint = original_footprint.filter(ImageFilter.MaxFilter(9))
    original_footprint = original_footprint.filter(ImageFilter.GaussianBlur(1.5))
    repair_mask = ImageChops.lighter(repair_mask, original_footprint)

    clean_room = Image.composite(repair_layer, room, repair_mask)
    clean_room.convert("RGB").save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
