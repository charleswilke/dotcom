#!/usr/bin/env python3
"""Build matched Knowledge Maze progression plates from generated masters."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ROOM = ROOT / "images" / "before-times" / "knowledge-maze"


PROGRESSION = (
    ("knowledge-maze-crack-stage-1-source-v1.png", "knowledge-maze-crack-stage-1-v1.png"),
    ("knowledge-maze-crack-stage-2-source-v1.png", "knowledge-maze-crack-stage-2-v1.png"),
    ("knowledge-maze-crack-stage-3-source-v1.png", "knowledge-maze-crack-stage-3-v1.png"),
    ("knowledge-maze-breached-source-v2.png", "knowledge-maze-breached-v3.png"),
)


def maze_mask(size: tuple[int, int]) -> Image.Image:
    """Limit generated pixels to the maze wall so room furniture never flickers."""
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(
        (
            (735, 0),
            (965, 0),
            (1116, 54),
            (1116, 500),
            (553, 500),
            (553, 54),
        ),
        fill=255,
    )
    return mask.filter(ImageFilter.GaussianBlur(10))


def build_progression() -> None:
    """Composite only image-generated maze damage over the locked room plate."""
    contained = Image.open(ROOM / "knowledge-maze-contained-v3.png").convert("RGB")
    mask = maze_mask(contained.size)

    for source_name, output_name in PROGRESSION:
        generated = Image.open(ROOM / source_name).convert("RGB")
        if generated.size != contained.size:
            raise ValueError(
                f"{source_name} is {generated.size}; expected {contained.size}"
            )
        output = Image.composite(generated, contained, mask)
        output.save(ROOM / output_name, optimize=True)


if __name__ == "__main__":
    build_progression()
