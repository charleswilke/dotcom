"""Build interactive prop layers for the Absurd Alchemy room.

The chair is a fresh isolated render matched to the original pose and room
style. All visible crate pixels still come from the original room plate. The
chair-removal repair is used only where the chair actually occluded the crate.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
OUTPUT_DIR = ROOT / "images/before-times/layers"

ORIGINAL_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v1.png"
BACKPLATE_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v3.png"
HAND_LAYER_PATH = OUTPUT_DIR / "alchemy-hand-logo-v1.png"
CHAIRLESS_REPAIR_PATH = PATCH_DIR / "alchemy-no-chair-v1.png"
CHAIR_SOURCE_PATH = PATCH_DIR / "alchemy-chair-isolated-v5.png"
ORIGINAL_CHAIR_MASK_PATH = PATCH_DIR / "alchemy-chair-mask-v4.png"
CRATE_MASK_PATH = PATCH_DIR / "alchemy-script-crate-mask-v3.png"

CHAIR_OUTPUT = OUTPUT_DIR / "alchemy-chair-v5.png"
CRATE_OUTPUT = OUTPUT_DIR / "alchemy-script-crate-v3.png"

CHAIR_BOX = (839, 523, 1174, 941)


def save_png_and_webp(image, path):
    image.save(path)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def build_chair(canvas_size):
    source = Image.open(CHAIR_SOURCE_PATH).convert("RGBA")
    alpha_box = source.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError(f"Chair source has no visible pixels: {CHAIR_SOURCE_PATH}")

    padding = 4
    crop_box = (
        max(0, alpha_box[0] - padding),
        max(0, alpha_box[1] - padding),
        min(source.width, alpha_box[2] + padding),
        min(source.height, alpha_box[3] + padding),
    )
    chair = source.crop(crop_box)
    chair = ImageEnhance.Brightness(chair).enhance(0.82)
    chair = ImageEnhance.Contrast(chair).enhance(1.04)
    chair = ImageEnhance.Color(chair).enhance(0.86)

    target_width = CHAIR_BOX[2] - CHAIR_BOX[0]
    target_height = CHAIR_BOX[3] - CHAIR_BOX[1]
    chair = chair.resize((target_width, target_height), Image.Resampling.LANCZOS)

    layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    layer.alpha_composite(chair, (CHAIR_BOX[0], CHAIR_BOX[1]))
    return layer


def main():
    original = Image.open(ORIGINAL_PATH).convert("RGBA")
    backplate = Image.open(BACKPLATE_PATH).convert("RGBA")
    crate_mask = Image.open(CRATE_MASK_PATH).convert("L")

    chair = build_chair(original.size)

    # Preserve the original crate everywhere it was visible. Under the chair's
    # exact matte, softly blend in the chair-removal repair that reconstructed
    # the previously hidden crate/floor boundary.
    repair = Image.open(CHAIRLESS_REPAIR_PATH).convert("RGBA").resize(
        original.size, Image.Resampling.LANCZOS
    )
    original_chair_alpha = np.asarray(Image.open(ORIGINAL_CHAIR_MASK_PATH).convert("L"))
    occlusion = np.zeros((original.height, original.width), dtype=np.uint8)
    occlusion[735:941, 1020:1200] = original_chair_alpha[735:941, 1020:1200]
    occlusion_mask = Image.fromarray(occlusion, "L").filter(ImageFilter.GaussianBlur(1.0))
    crate = Image.composite(repair, original, occlusion_mask)
    crate.putalpha(crate_mask)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    save_png_and_webp(chair, CHAIR_OUTPUT)
    save_png_and_webp(crate, CRATE_OUTPUT)

    preview = backplate.copy()
    preview.alpha_composite(chair)
    preview.alpha_composite(crate)
    if HAND_LAYER_PATH.exists():
        preview.alpha_composite(Image.open(HAND_LAYER_PATH).convert("RGBA"))
    preview.convert("RGB").save(Path("/tmp/bt-alchemy-layer-preview-v5.png"))


if __name__ == "__main__":
    main()
