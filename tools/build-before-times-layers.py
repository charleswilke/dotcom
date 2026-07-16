#!/usr/bin/env python3
"""Build pixel-exact Before Times sprites and a masked clean lobby plate."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images/before-times/lobby-v1.webp"
OUTPUT_DIR = ROOT / "images/before-times/layers"
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
MASK_DIR = ROOT / "tmp/before-times-extraction"
MEDALLION_PATCH_BOX = (805, 720, 915, 815)
RADIO_GHOST_PATCH_BOX = (480, 470, 820, 630)
SCALE = 4


def scaled_points(points):
    return [(round(x * SCALE), round(y * SCALE)) for x, y in points]


def ellipse(draw, box):
    draw.ellipse(tuple(round(value * SCALE) for value in box), fill=255)


def polygon(draw, points):
    draw.polygon(scaled_points(points), fill=255)


def line(draw, points, width):
    draw.line(scaled_points(points), fill=255, width=round(width * SCALE), joint="curve")


def cut_polygon(draw, points):
    draw.polygon(scaled_points(points), fill=0)


def cut_ellipse(draw, box):
    draw.ellipse(tuple(round(value * SCALE) for value in box), fill=0)


def make_mask(size, painter):
    mask = Image.new("L", (size[0] * SCALE, size[1] * SCALE), 0)
    painter(ImageDraw.Draw(mask))
    return mask.resize(size, Image.Resampling.LANCZOS)


def isolate_changed_object(before, after, broad_mask, threshold):
    """Use the empty plate to trim broad hand masks down to object pixels."""
    difference = ImageChops.difference(before, after)
    red, green, blue = difference.split()
    strongest_channel = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    strongest_channel = strongest_channel.filter(ImageFilter.GaussianBlur(0.7))
    changed = strongest_channel.point(lambda value: 255 if value >= threshold else 0)
    changed = changed.filter(ImageFilter.MaxFilter(7))
    changed = changed.filter(ImageFilter.MinFilter(5))
    changed = ImageChops.multiply(changed, broad_mask)

    # Keep fine exterior contours from the difference image while filling
    # accidental transparent pinholes inside opaque painted props.
    flooded = changed.point(lambda value: 255 if value >= 128 else 0)
    width, height = flooded.size
    for x in range(width):
        if flooded.getpixel((x, 0)) == 0:
            ImageDraw.floodfill(flooded, (x, 0), 128)
        if flooded.getpixel((x, height - 1)) == 0:
            ImageDraw.floodfill(flooded, (x, height - 1), 128)
    for y in range(height):
        if flooded.getpixel((0, y)) == 0:
            ImageDraw.floodfill(flooded, (0, y), 128)
        if flooded.getpixel((width - 1, y)) == 0:
            ImageDraw.floodfill(flooded, (width - 1, y), 128)
    holes = flooded.point(lambda value: 255 if value == 0 else 0)
    return ImageChops.lighter(changed, holes)


def paint_bell(draw):
    ellipse(draw, (22, 84, 108, 124))
    ellipse(draw, (31, 59, 100, 111))
    polygon(draw, [(37, 74), (45, 63), (59, 56), (77, 55), (92, 66), (100, 91), (94, 105), (38, 105), (30, 91)])
    ellipse(draw, (56, 53, 80, 72))
    polygon(draw, [(63, 48), (72, 48), (72, 62), (63, 62)])
    ellipse(draw, (60, 41, 75, 55))


def paint_radio(draw):
    polygon(draw, [(43, 130), (286, 120), (306, 127), (317, 140), (316, 268), (304, 276), (62, 282), (44, 272)])
    ellipse(draw, (64, 116, 83, 145))
    ellipse(draw, (104, 117, 120, 133))
    ellipse(draw, (139, 115, 157, 132))
    ellipse(draw, (174, 112, 193, 130))
    ellipse(draw, (228, 108, 248, 129))
    # Keep the entire telescoping antenna, including both rounded caps. The
    # earlier narrow polygon clipped its upper-right tip after antialiasing.
    line(draw, [(71, 125), (231, 65)], 6)
    ellipse(draw, (66, 120, 78, 132))
    ellipse(draw, (227, 61, 237, 70))


def paint_portal(draw):
    # Follow the solid outer frame rather than the luminous interior. Ambient
    # spill stays on the clean plate and is enhanced separately in CSS so it
    # never inherits a rectangular sprite boundary.
    polygon(
        draw,
        [
            (106, 53),
            (247, 51),
            (258, 57),
            (282, 80),
            (286, 96),
            (283, 420),
            (279, 443),
            (268, 468),
            (258, 481),
            (102, 487),
            (91, 479),
            (78, 451),
            (82, 110),
            (87, 91),
            (98, 68),
        ],
    )


def paint_alchemy_door(draw):
    polygon(draw, [(38, 16), (293, 8), (329, 86), (329, 468), (296, 510), (51, 526), (31, 472), (31, 92)])


def paint_games_door(draw):
    polygon(draw, [(24, 26), (256, 22), (279, 68), (279, 447), (250, 494), (119, 512), (26, 478), (15, 78)])


def paint_content_door(draw):
    polygon(draw, [(4, 34), (285, 22), (317, 74), (313, 408), (284, 435), (20, 432), (0, 396), (0, 82)])


def paint_docs_door(draw):
    polygon(draw, [(0, 34), (269, 15), (294, 70), (294, 408), (260, 438), (25, 440), (0, 414)])


def paint_floor_repair(draw):
    # One broad, feathered floor repair replaces the small per-door floor
    # patches that created clipped shadows and a triangular portal-light notch.
    polygon(
        draw,
        [
            (0, 530),
            (185, 528),
            (420, 478),
            (720, 470),
            (1035, 472),
            (1215, 484),
            (1370, 522),
            (1672, 586),
            (1672, 760),
            (0, 760),
        ],
    )

    # floor-v2 preserved every foreground object in this band, so it can run
    # continuously beneath the scene without feathered exclusion seams.


def paint_medallion_repair(draw):
    # The source painting contains an info medallion baked into the divider.
    # Keep this patch local so the generated repair cannot alter the room.
    polygon(draw, [(6, 4), (104, 4), (104, 91), (6, 91)])


def paint_radio_ghost_repair(draw):
    # Remove the antenna and low radio body left behind by the first extraction
    # without replacing the surrounding floor or central chair.
    line(draw, [(90, 116), (232, 25)], width=30)
    polygon(draw, [(12, 74), (286, 72), (312, 98), (312, 160), (12, 160)])
    cut_ellipse(draw, (306, 32, 370, 178))


def paint_bulletin(draw):
    # Cork board, wooden frame, right-side mounting wedge, and hanging badge.
    polygon(draw, [(0, 16), (124, 22), (132, 212), (0, 206)])
    polygon(draw, [(123, 42), (145, 51), (141, 64), (125, 67)])
    polygon(draw, [(84, 191), (108, 191), (113, 228), (108, 237), (85, 235), (80, 204)])


def paint_bulletin_badge(draw):
    polygon(draw, [(84, 191), (108, 191), (113, 228), (108, 237), (85, 235), (80, 204)])


def paint_newsstand(draw):
    polygon(
        draw,
        [
            (14, 66),
            (52, 48),
            (180, 64),
            (199, 84),
            (219, 287),
            (213, 310),
            (51, 339),
            (14, 310),
            (9, 103),
        ],
    )
    # Long chrome handle above the cabinet.
    line(draw, [(31, 63), (123, 22)], 6)
    ellipse(draw, (27, 58, 37, 68))
    ellipse(draw, (119, 18, 128, 27))


def paint_newsstand_details(draw):
    line(draw, [(31, 63), (123, 22)], 6)
    ellipse(draw, (27, 58, 37, 68))
    ellipse(draw, (119, 18, 128, 27))


def paint_photo_display(draw):
    # The frame exits the right edge of the master painting, so keep that edge
    # flush rather than inventing transparency there.
    polygon(draw, [(13, 33), (139, 27), (149, 39), (149, 214), (142, 220), (19, 204), (7, 196), (7, 50)])
    polygon(draw, [(72, 16), (83, 15), (85, 29), (70, 30)])


def paint_camera(draw):
    # Hanging pin, strap, camera body, and lens. The fixed reader pedestal and
    # wall cable intentionally remain on the background plate.
    ellipse(draw, (70, 19, 90, 39))
    line(draw, [(79, 31), (43, 65), (112, 66), (79, 31)], 6)
    polygon(draw, [(39, 59), (116, 60), (126, 79), (119, 133), (103, 145), (50, 141), (31, 123), (30, 84)])
    ellipse(draw, (47, 79, 111, 142))


def paint_guestbook(draw):
    # Open book and plaque as one desk interaction; bell and radio are already
    # separate layers of their own.
    polygon(draw, [(18, 53), (56, 38), (110, 25), (150, 24), (181, 34), (199, 47), (216, 38), (260, 32), (320, 34), (365, 42), (380, 51), (397, 183), (381, 199), (236, 205), (210, 196), (183, 207), (18, 198), (3, 182)])
    polygon(draw, [(430, 150), (555, 139), (579, 163), (569, 198), (445, 200), (417, 173)])


LAYERS = {
    "bell": {
        "box": (380, 560, 520, 700),
        "paint": paint_bell,
        "patch": "bell.webp",
        "expand": 9,
        "feather": 2.2,
    },
    "radio": {
        "box": (480, 450, 830, 750),
        "paint": paint_radio,
        "patch": "radio.webp",
        "expand": 12,
        "feather": 3.0,
    },
    "portal": {
        "box": (1210, 100, 1535, 640),
        "paint": paint_portal,
        "patch": "portal.webp",
        "expand": 4,
        "feather": 1.6,
    },
}


# These masks replace the original flattened doorway assemblies with generated
# wall-and-floor repairs. The new interactive doorway sprites are authored
# separately, so the architecture can move without revealing a duplicate.
BACKGROUND_PATCHES = {
    "alchemy": {
        "box": (90, 55, 420, 585),
        "paint": paint_alchemy_door,
        "patch": "alchemy.webp",
        "expand": 3,
        "feather": 2.2,
    },
    "games": {
        "box": (420, 55, 700, 575),
        "paint": paint_games_door,
        "patch": "games.webp",
        "expand": 3,
        "feather": 2.2,
    },
    "content": {
        "box": (700, 55, 1020, 575),
        "paint": paint_content_door,
        "patch": "content.webp",
        "expand": 3,
        "feather": 2.2,
    },
    "docs": {
        "box": (980, 50, 1275, 580),
        "paint": paint_docs_door,
        "patch": "docs.webp",
        "expand": 3,
        "feather": 4.0,
    },
}


# Remaining lobby props are extracted from the original painting with exact
# perspective and linework. A single generated empty-room plate is used only
# beneath these masks, never as a wholesale replacement for the lobby.
PROP_LAYERS = {
    "bulletin": {
        "box": (0, 175, 145, 456),
        "paint": paint_bulletin,
        "expand": 9,
        "feather": 2.4,
        "threshold": 34,
        "detail_paint": paint_bulletin_badge,
    },
    "newsstand": {
        "box": (15, 415, 255, 765),
        "paint": paint_newsstand,
        "expand": 18,
        "feather": 3.2,
        "threshold": 34,
        "detail_paint": paint_newsstand_details,
    },
    "photo-display": {
        "box": (1520, 175, 1672, 417),
        "paint": paint_photo_display,
        "expand": 9,
        "feather": 2.4,
        "threshold": 34,
    },
    "camera": {
        "box": (1500, 385, 1640, 545),
        "paint": paint_camera,
        "expand": 9,
        "feather": 2.4,
        "threshold": 28,
    },
    "guestbook": {
        "box": (820, 525, 1405, 745),
        "paint": paint_guestbook,
        "expand": 15,
        "feather": 2.8,
        "threshold": 30,
    },
}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    clean_plate = source.copy()

    for name, config in LAYERS.items():
        left, top, right, bottom = config["box"]
        size = (right - left, bottom - top)
        mask = make_mask(size, config["paint"])

        sprite = source.crop(config["box"]).convert("RGBA")
        sprite.putalpha(mask)
        sprite.save(OUTPUT_DIR / f"{name}.png", optimize=True)

        patch = Image.open(PATCH_DIR / config["patch"]).convert("RGB")
        patch = patch.resize(size, Image.Resampling.LANCZOS)
        original_region = clean_plate.crop(config["box"])
        fill_mask = mask.filter(ImageFilter.MaxFilter(config["expand"] * 2 + 1))
        fill_mask = fill_mask.filter(ImageFilter.GaussianBlur(config["feather"]))
        repaired_region = Image.composite(patch, original_region, fill_mask)
        clean_plate.paste(repaired_region, (left, top))

        MASK_DIR.mkdir(parents=True, exist_ok=True)
        mask.save(MASK_DIR / f"{name}-mask.png")

    for name, config in BACKGROUND_PATCHES.items():
        left, top, right, bottom = config["box"]
        size = (right - left, bottom - top)
        mask = make_mask(size, config["paint"])
        patch = Image.open(PATCH_DIR / config["patch"]).convert("RGB")
        patch = patch.resize(size, Image.Resampling.LANCZOS)
        original_region = clean_plate.crop(config["box"])
        fill_mask = mask.filter(ImageFilter.MaxFilter(config["expand"] * 2 + 1))
        fill_mask = fill_mask.filter(ImageFilter.GaussianBlur(config["feather"]))
        repaired_region = Image.composite(patch, original_region, fill_mask)
        clean_plate.paste(repaired_region, (left, top))
        mask.save(MASK_DIR / f"{name}-background-mask.png")

    clean_plate.save(OUTPUT_DIR / "lobby-clean-v3.png", optimize=True)

    floor_patch = Image.open(PATCH_DIR / "floor-v2.webp").convert("RGB")
    floor_patch = floor_patch.resize(source.size, Image.Resampling.LANCZOS)
    floor_mask = make_mask(source.size, paint_floor_repair)
    floor_mask = floor_mask.filter(ImageFilter.GaussianBlur(8.0))
    clean_floor_plate = Image.composite(floor_patch, clean_plate, floor_mask)

    medallion_patch = Image.open(PATCH_DIR / "medallion-v1.webp").convert("RGB")
    medallion_size = (
        MEDALLION_PATCH_BOX[2] - MEDALLION_PATCH_BOX[0],
        MEDALLION_PATCH_BOX[3] - MEDALLION_PATCH_BOX[1],
    )
    medallion_patch = medallion_patch.resize(medallion_size, Image.Resampling.LANCZOS)
    medallion_mask = make_mask(medallion_size, paint_medallion_repair)
    medallion_mask = medallion_mask.filter(ImageFilter.GaussianBlur(5.0))
    medallion_region = clean_floor_plate.crop(MEDALLION_PATCH_BOX)
    repaired_medallion_region = Image.composite(
        medallion_patch,
        medallion_region,
        medallion_mask,
    )
    clean_floor_plate.paste(
        repaired_medallion_region,
        (MEDALLION_PATCH_BOX[0], MEDALLION_PATCH_BOX[1]),
    )

    radio_ghost_patch = Image.open(PATCH_DIR / "radio-ghost-v1.webp").convert("RGB")
    radio_ghost_size = (
        RADIO_GHOST_PATCH_BOX[2] - RADIO_GHOST_PATCH_BOX[0],
        RADIO_GHOST_PATCH_BOX[3] - RADIO_GHOST_PATCH_BOX[1],
    )
    radio_ghost_patch = radio_ghost_patch.resize(radio_ghost_size, Image.Resampling.LANCZOS)
    radio_ghost_mask = make_mask(radio_ghost_size, paint_radio_ghost_repair)
    radio_ghost_mask = radio_ghost_mask.filter(ImageFilter.GaussianBlur(5.0))
    radio_ghost_region = clean_floor_plate.crop(RADIO_GHOST_PATCH_BOX)
    repaired_radio_ghost_region = Image.composite(
        radio_ghost_patch,
        radio_ghost_region,
        radio_ghost_mask,
    )
    clean_floor_plate.paste(
        repaired_radio_ghost_region,
        (RADIO_GHOST_PATCH_BOX[0], RADIO_GHOST_PATCH_BOX[1]),
    )

    clean_floor_plate.save(OUTPUT_DIR / "lobby-clean-v4.png", optimize=True)
    floor_mask.save(MASK_DIR / "floor-background-mask.png")
    medallion_mask.save(MASK_DIR / "medallion-background-mask.png")
    radio_ghost_mask.save(MASK_DIR / "radio-ghost-background-mask.png")

    props_patch = Image.open(PATCH_DIR / "props-v1.webp").convert("RGB")
    props_patch = props_patch.resize(source.size, Image.Resampling.LANCZOS)
    clean_props_plate = clean_floor_plate.copy()

    for name, config in PROP_LAYERS.items():
        left, top, right, bottom = config["box"]
        size = (right - left, bottom - top)
        broad_mask = make_mask(size, config["paint"])
        before_region = clean_floor_plate.crop(config["box"])
        patch_region = props_patch.crop(config["box"])
        # Difference matting gives the cleanest organic edge for the large
        # silhouettes. Thin metal details get an explicit hand mask so they
        # cannot disappear merely because their color resembles the repair.
        mask = isolate_changed_object(
            before_region,
            patch_region,
            broad_mask,
            config["threshold"],
        )
        if detail_paint := config.get("detail_paint"):
            mask = ImageChops.lighter(mask, make_mask(size, detail_paint))

        trim = ImageDraw.Draw(mask)
        if name == "newsstand":
            trim.rectangle((0, 0, 6, size[1]), fill=0)
            trim.rectangle((0, 342, size[0], size[1]), fill=0)
            trim.polygon([(0, 70), (12, 70), (18, 150), (24, 230), (30, 304), (0, 322)], fill=0)
            trim.polygon([(178, 331), (240, 300), (240, 350), (170, 350)], fill=0)
            mask = ImageChops.lighter(mask, make_mask(size, paint_newsstand_details))
        elif name == "bulletin":
            trim.rectangle((0, 208, size[0], size[1]), fill=0)
            mask = ImageChops.lighter(mask, make_mask(size, paint_bulletin_badge))
        elif name == "guestbook":
            trim.rectangle((0, 0, size[0], 20), fill=0)
            trim.rectangle((0, 55, 20, 78), fill=0)
            trim.rectangle((397, 50, 423, 80), fill=0)
            trim.rectangle((570, 145, 584, 219), fill=0)

        sprite = source.crop(config["box"]).convert("RGBA")
        sprite.putalpha(mask)
        sprite.save(OUTPUT_DIR / f"{name}.png", optimize=True)

        original_region = clean_props_plate.crop(config["box"])
        fill_mask = broad_mask.filter(ImageFilter.MaxFilter(config["expand"] * 2 + 1))
        fill_mask = fill_mask.filter(ImageFilter.GaussianBlur(config["feather"]))
        repaired_region = Image.composite(patch_region, original_region, fill_mask)
        clean_props_plate.paste(repaired_region, (left, top))
        mask.save(MASK_DIR / f"{name}-mask.png")

    clean_props_plate.save(OUTPUT_DIR / "lobby-clean-v5.png", optimize=True)


if __name__ == "__main__":
    main()
