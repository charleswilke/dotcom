#!/usr/bin/env python3
"""Build precomputed ambilight "glow tracks" for the Absurd Alchemy hero CRT.

The hero screen plays cross-origin Vimeo embeds, so the page can never sample
pixels live. Instead this script analyzes low-res local copies of the same
videos once, offline, and writes a small JSON the runtime can index by
playback time (Vimeo's timeupdate event) to tint the TV light spill.

Per sample (default every 0.5s of video) it stores [r, g, b, m]:

- r,g,b — the frame's average color, saturation-boosted and normalized to a
  consistent lightness so dark scenes still tint the glow instead of killing
  it. This is the lamp color.
- m     — 0-200 intensity derived from the frame's real luma (100 = neutral).
  This is how hard the lamp is driven. Dark scenes dim the room, bright
  scenes flare it.

A short moving average keeps hard cuts from strobing; the runtime adds its
own lerp on top.

Usage:
  python3 tools/build-alchemy-glow-tracks.py <src-dir-with-key.mp4-files> \
      [out.json]

Source videos are keyed by filename stem, which must match the `key` fields
in ALCHEMY_VIDEOS (before-times.js). Requires ffmpeg + ffprobe on PATH.
The downloaded source videos are analysis-only inputs; do not commit them.
"""

import json
import subprocess
import sys
from pathlib import Path

INTERVAL = 0.5          # seconds between samples
FRAME_W, FRAME_H = 32, 18
SMOOTH_WINDOW = 3       # moving-average window, in samples
SAT_BOOST = 1.45        # how far to push chroma on the lamp color
TARGET_VALUE = 210      # normalize lamp color's max channel toward this
MIN_CHROMA = 14         # below this spread, treat the frame as near-gray

# Near-gray frames fall back toward the room's native teal so the set never
# goes fully colorless.
FALLBACK_RGB = (116, 239, 207)


def sample_video(path):
    """Yield (r, g, b) average color per INTERVAL of video."""
    proc = subprocess.Popen(
        [
            "ffmpeg", "-v", "error", "-i", str(path),
            "-vf", f"fps=1/{INTERVAL},scale={FRAME_W}:{FRAME_H}",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
        ],
        stdout=subprocess.PIPE,
    )
    frame_bytes = FRAME_W * FRAME_H * 3
    while True:
        buf = proc.stdout.read(frame_bytes)
        if len(buf) < frame_bytes:
            break
        n = FRAME_W * FRAME_H
        r = sum(buf[0::3]) / n
        g = sum(buf[1::3]) / n
        b = sum(buf[2::3]) / n
        yield (r, g, b)
    proc.stdout.close()
    proc.wait()


def lamp_color(r, g, b):
    """Turn a raw average frame color into a usable lamp color."""
    mx, mn = max(r, g, b), min(r, g, b)
    chroma = mx - mn
    if chroma < MIN_CHROMA:
        # Near-gray frame: blend the fallback teal in, weighted by how gray.
        t = 1 - chroma / MIN_CHROMA
        r = r + (FALLBACK_RGB[0] - r) * t * 0.6
        g = g + (FALLBACK_RGB[1] - g) * t * 0.6
        b = b + (FALLBACK_RGB[2] - b) * t * 0.6
        mx, mn = max(r, g, b), min(r, g, b)

    # Saturation boost: push channels away from the mean.
    mean = (r + g + b) / 3
    r = mean + (r - mean) * SAT_BOOST
    g = mean + (g - mean) * SAT_BOOST
    b = mean + (b - mean) * SAT_BOOST
    r, g, b = (min(255, max(0, c)) for c in (r, g, b))

    # Normalize lightness so the tint survives dark scenes.
    mx = max(r, g, b)
    if mx > 0:
        scale = TARGET_VALUE / mx
        r, g, b = r * scale, g * scale, b * scale
    return round(r), round(g), round(b)


def intensity(r, g, b):
    """Map real frame luma to a 0-200 drive level (100 = neutral)."""
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    m = 45 + (luma / 255) * 130  # 45 (near black) .. 175 (white-hot)
    return round(m)


def smooth(samples):
    if len(samples) <= SMOOTH_WINDOW:
        return samples
    half = SMOOTH_WINDOW // 2
    out = []
    for i in range(len(samples)):
        lo, hi = max(0, i - half), min(len(samples), i + half + 1)
        window = samples[lo:hi]
        out.append([round(sum(s[k] for s in window) / len(window)) for k in range(4)])
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else (
        Path(__file__).resolve().parent.parent
        / "images" / "before-times" / "glow-tracks-v1.json"
    )

    tracks = {}
    for video in sorted(src.glob("*.mp4")):
        key = video.stem
        samples = []
        for raw in sample_video(video):
            r, g, b = lamp_color(*raw)
            samples.append([r, g, b, intensity(*raw)])
        if not samples:
            print(f"WARN no frames decoded for {key}", file=sys.stderr)
            continue
        tracks[key] = smooth(samples)
        print(f"{key}: {len(samples)} samples ({len(samples) * INTERVAL:.0f}s)")

    payload = {"version": 1, "interval": INTERVAL, "tracks": tracks}
    out_path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
