#!/usr/bin/env python3
"""Build matched Knowledge Maze runtime plates from generated masters."""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ROOM = ROOT / "images" / "before-times" / "knowledge-maze"


def composite_corrected_lobby_view() -> None:
    """Carry the corrected reverse-lobby sightline into the breached plate."""
    contained = Image.open(ROOM / "knowledge-maze-contained-v3.png").convert("RGB")
    breached = Image.open(ROOM / "knowledge-maze-breached-source-v1.png").convert("RGB")
    mask = Image.new("L", contained.size, 0)

    # The polygon stays inside the generated doorway frame. A small feather
    # blends only the lobby interior and leaves the frame and Maze room intact.
    door = Image.new("L", contained.size, 0)
    door.paste(255, (1448, 126, 1617, 716))
    mask = Image.composite(door, mask, door).filter(ImageFilter.GaussianBlur(4))

    output = Image.composite(contained, breached, mask)
    output.save(ROOM / "knowledge-maze-breached-v2.png", optimize=True)


if __name__ == "__main__":
    composite_corrected_lobby_view()
