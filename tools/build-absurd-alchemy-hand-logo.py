#!/usr/bin/env python3
"""Replace the baked Alchemy production camera with the hand-logo prop."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
LAYER_DIR = ROOT / "images/before-times/layers"

BASE_PLATE_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v2.png"
CAMERA_REPAIR_PATH = PATCH_DIR / "alchemy-no-production-camera-v1.png"
CAMERA_LAYER_PATH = LAYER_DIR / "alchemy-production-camera-original-v1.png"
HAND_SOURCE_PATH = PATCH_DIR / "alchemy-hand-logo-isolated-v1.png"

PLATE_PNG_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v3.png"
HAND_PNG_PATH = LAYER_DIR / "alchemy-hand-logo-v1.png"

HAND_CENTER_X = 1508
HAND_BOTTOM = 551
HAND_HEIGHT = 154


def save_png_and_webp(image: Image.Image, path: Path) -> None:
    image.save(path, optimize=True)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def build_clean_plate() -> Image.Image:
    base = Image.open(BASE_PLATE_PATH).convert("RGBA")
    repair = Image.open(CAMERA_REPAIR_PATH).convert("RGBA")
    camera_alpha = Image.open(CAMERA_LAYER_PATH).convert("RGBA").getchannel("A")

    if repair.size != base.size or camera_alpha.size != base.size:
        raise ValueError("Alchemy plate, repair, and camera mask must share dimensions")

    # The camera layer is pixel-aligned with the baked camera. Expand its matte
    # enough to clear dark antialiasing and the tiny contact shadow, then feather
    # the generated empty-shelf repair into the locked V2 plate.
    repair_mask = camera_alpha.filter(ImageFilter.MaxFilter(17))
    repair_mask = repair_mask.filter(ImageFilter.GaussianBlur(1.6))
    clean = Image.composite(repair, base, repair_mask)
    return clean


def build_hand_layer(canvas_size: tuple[int, int]) -> Image.Image:
    source = Image.open(HAND_SOURCE_PATH).convert("RGBA")
    alpha_box = source.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError(f"Hand source has no visible pixels: {HAND_SOURCE_PATH}")

    padding = 6
    crop_box = (
        max(0, alpha_box[0] - padding),
        max(0, alpha_box[1] - padding),
        min(source.width, alpha_box[2] + padding),
        min(source.height, alpha_box[3] + padding),
    )
    hand = source.crop(crop_box)
    target_width = round(hand.width * HAND_HEIGHT / hand.height)
    hand = hand.resize((target_width, HAND_HEIGHT), Image.Resampling.LANCZOS)
    hand = ImageEnhance.Brightness(hand).enhance(1.06)
    hand = ImageEnhance.Contrast(hand).enhance(1.035)
    hand = hand.filter(ImageFilter.UnsharpMask(radius=0.7, percent=48, threshold=2))

    left = round(HAND_CENTER_X - target_width / 2)
    top = HAND_BOTTOM - HAND_HEIGHT
    layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    layer.alpha_composite(hand, (left, top))
    return layer


def main() -> None:
    clean = build_clean_plate()
    hand = build_hand_layer(clean.size)

    LAYER_DIR.mkdir(parents=True, exist_ok=True)
    save_png_and_webp(clean, PLATE_PNG_PATH)
    save_png_and_webp(hand, HAND_PNG_PATH)

    preview = clean.copy()
    preview.alpha_composite(hand)
    preview.convert("RGB").save(Path("/tmp/bt-alchemy-hand-logo-preview-v1.png"))

    print(f"Wrote {PLATE_PNG_PATH.relative_to(ROOT)}")
    print(f"Wrote {HAND_PNG_PATH.relative_to(ROOT)}")
    print("Wrote /tmp/bt-alchemy-hand-logo-preview-v1.png")


if __name__ == "__main__":
    main()
