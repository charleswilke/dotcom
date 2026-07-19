#!/usr/bin/env python3
"""Build the separated lobby guestbook, placed pen, and clean desk plate."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
LAYER_DIR = ROOT / "images/before-times/layers"
PATCH_DIR = ROOT / "tools/before-times-clean-patches"

BASE_PLATE = LAYER_DIR / "lobby-clean-v4-newsstand-v1.png"
DESK_DONOR = PATCH_DIR / "guestbook-empty-desk-fullscene-v3.png"
BOOK_MASTER = PATCH_DIR / "guestbook-fresh-isolated-v1.png"
PEN_MASTER = ROOT / "images/before-times/inventory/fountain-pen-v1.png"

OUTPUT_PLATE_PNG = LAYER_DIR / "lobby-clean-v4-newsstand-guestbook-v3.png"
OUTPUT_PLATE_WEBP = LAYER_DIR / "lobby-clean-v4-newsstand-guestbook-v3.webp"
OUTPUT_BOOK_PNG = LAYER_DIR / "guestbook-fresh-v1.png"
OUTPUT_BOOK_WEBP = LAYER_DIR / "guestbook-fresh-v1.webp"
OUTPUT_PEN_PNG = LAYER_DIR / "guestbook-placed-pen-v1.png"
OUTPUT_PEN_WEBP = LAYER_DIR / "guestbook-placed-pen-v1.webp"

DESK_BOX = (820, 525, 1405, 745)
DESK_SIZE = (DESK_BOX[2] - DESK_BOX[0], DESK_BOX[3] - DESK_BOX[1])
DESK_CONTEXT_BOX = (740, 455, 1460, 815)
DESK_CONTEXT_SIZE = (
    DESK_CONTEXT_BOX[2] - DESK_CONTEXT_BOX[0],
    DESK_CONTEXT_BOX[3] - DESK_CONTEXT_BOX[1],
)
BOOK_TARGET_BOX = (117, 64, 380, 192)
PEN_TARGET_CENTER = (315, 135)


def fit_alpha_to_box(source: Image.Image, target_box: tuple[int, int, int, int]) -> Image.Image:
    """Crop transparent padding and fit the visible object into target_box."""
    source = source.convert("RGBA")
    alpha_box = source.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("The source image has no visible pixels")

    visible = source.crop(alpha_box)
    width = target_box[2] - target_box[0]
    height = target_box[3] - target_box[1]
    visible = visible.resize((width, height), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", DESK_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(visible, target_box[:2])
    return canvas


def build_desk_plate() -> Image.Image:
    base = Image.open(BASE_PLATE).convert("RGB")
    donor_full = Image.open(DESK_DONOR).convert("RGB").resize(
        base.size,
        Image.Resampling.LANCZOS,
    )
    donor = donor_full.crop(DESK_CONTEXT_BOX)

    # Replace the original book and its grounding shadow, with enough repaired
    # surface around the silhouette for the separated sprite to lift on hover.
    mask = Image.new("L", DESK_CONTEXT_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(
        [
            (98, 123),
            (136, 108),
            (190, 95),
            (230, 94),
            (261, 104),
            (279, 117),
            (296, 108),
            (340, 102),
            (400, 104),
            (445, 112),
            (460, 121),
            (486, 292),
            (470, 302),
            (316, 305),
            (290, 305),
            (250, 305),
            (70, 298),
            (70, 260),
        ],
        fill=255,
    )
    mask = mask.filter(ImageFilter.MaxFilter(9))
    mask = mask.filter(ImageFilter.GaussianBlur(3.2))

    # The brass plaque is already clean original art and remains part of the
    # background, independent from both the book and the placed pen.
    preserve = ImageDraw.Draw(mask)
    preserve.rectangle((489, 0, DESK_CONTEXT_SIZE[0], DESK_CONTEXT_SIZE[1]), fill=0)

    original_region = base.crop(DESK_CONTEXT_BOX)
    repaired_region = Image.composite(donor, original_region, mask)
    base.paste(repaired_region, DESK_CONTEXT_BOX[:2])
    return base


def build_placed_pen() -> Image.Image:
    pen = Image.open(PEN_MASTER).convert("RGBA")
    alpha_box = pen.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("The pen source has no visible pixels")

    pen = pen.crop(alpha_box).resize((75, 23), Image.Resampling.LANCZOS)
    pen = pen.rotate(66, resample=Image.Resampling.BICUBIC, expand=True)

    canvas = Image.new("RGBA", DESK_SIZE, (0, 0, 0, 0))
    left = round(PEN_TARGET_CENTER[0] - pen.width / 2)
    top = round(PEN_TARGET_CENTER[1] - pen.height / 2)
    canvas.alpha_composite(pen, (left, top))
    return canvas


def save_runtime_pair(image: Image.Image, png_path: Path, webp_path: Path) -> None:
    image.save(png_path, optimize=True)
    image.save(webp_path, "WEBP", quality=92, method=6)
    print(f"Wrote {png_path.relative_to(ROOT)}")
    print(f"Wrote {webp_path.relative_to(ROOT)}")


def main() -> None:
    book = fit_alpha_to_box(Image.open(BOOK_MASTER), BOOK_TARGET_BOX)
    pen = build_placed_pen()
    desk_plate = build_desk_plate()

    save_runtime_pair(desk_plate, OUTPUT_PLATE_PNG, OUTPUT_PLATE_WEBP)
    save_runtime_pair(book, OUTPUT_BOOK_PNG, OUTPUT_BOOK_WEBP)
    save_runtime_pair(pen, OUTPUT_PEN_PNG, OUTPUT_PEN_WEBP)


if __name__ == "__main__":
    main()
