"""Build clean, moveable prop layers for the Absurd Alchemy room.

The backplate was inpainted without the chair or crate. The two foreground
sources were then rendered as complete isolated props and keyed to alpha. This
script color-matches, sizes, and registers those sources on the 1672x941 scene.
"""

from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
PATCH_DIR = ROOT / "tools/before-times-clean-patches"
OUTPUT_DIR = ROOT / "images/before-times/layers"

BACKPLATE_PATH = ROOT / "images/before-times/absurd-alchemy-clean-v2.png"
CHAIR_SOURCE_PATH = PATCH_DIR / "alchemy-chair-isolated-v2.png"
CRATE_SOURCE_PATH = PATCH_DIR / "alchemy-script-crate-isolated-v2.png"

CHAIR_OUTPUT = OUTPUT_DIR / "alchemy-chair-v2.png"
CRATE_OUTPUT = OUTPUT_DIR / "alchemy-script-crate-v2.png"

# x, y, width, height in the 1672x941 scene. Both props remain fully inside the
# canvas so their lower edges stay intact when the hover animation lifts them.
CHAIR_BOX = (840, 510, 340, 425)
CRATE_BOX = (1040, 725, 455, 210)


def color_grade(image, brightness, contrast, saturation):
    """Match the isolated prop's brighter studio render to the dark room."""
    red, green, blue, alpha = image.split()
    rgb = Image.merge("RGB", (red, green, blue))
    rgb = ImageEnhance.Brightness(rgb).enhance(brightness)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    rgb = ImageEnhance.Color(rgb).enhance(saturation)
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def place_prop(source, canvas_size, box, grade):
    source = Image.open(source).convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if not bounds:
        raise ValueError(f"No opaque pixels found in {source}")
    source = source.crop(bounds)
    source = color_grade(source, *grade)

    x, y, width, height = box
    source = source.resize((width, height), Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", canvas_size)
    layer.alpha_composite(source, (x, y))
    return layer


def save_png_and_webp(image, path):
    image.save(path)
    image.save(path.with_suffix(".webp"), "WEBP", lossless=True, method=6)


def main():
    backplate = Image.open(BACKPLATE_PATH).convert("RGBA")
    chair = place_prop(
        CHAIR_SOURCE_PATH,
        backplate.size,
        CHAIR_BOX,
        grade=(0.82, 1.04, 0.82),
    )
    crate = place_prop(
        CRATE_SOURCE_PATH,
        backplate.size,
        CRATE_BOX,
        grade=(0.76, 1.06, 0.78),
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    save_png_and_webp(chair, CHAIR_OUTPUT)
    save_png_and_webp(crate, CRATE_OUTPUT)

    preview = backplate.copy()
    preview.alpha_composite(crate)
    preview.alpha_composite(chair)
    preview.convert("RGB").save(Path("/tmp/bt-alchemy-layer-preview-v2.png"))


if __name__ == "__main__":
    main()
