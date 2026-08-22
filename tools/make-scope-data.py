#!/usr/bin/env python3
"""
Precompute oscilloscope data for the album players' mobile path.

On touch devices main.js no longer routes the <audio> element through Web Audio
(createMediaElementSource), because iOS suspends the AudioContext when the screen
locks and takes the music down with it. The scope still needs a signal, so this
tool bakes one: for every track it writes `<track>.scope.bin` next to the mp3,
holding a time-domain snapshot and a handful of frequency bands at 60 frames per
second (one per display frame, like the live analyser), in the same 0..255 units an AnalyserNode hands back. main.js reads it by
audio.currentTime through an AnalyserNode-shaped adapter, so the drawing code is
untouched.

Layout (little-endian):

    0   4s   magic  "SCOP"
    4   u8   version (1)
    5   u8   fps
    6   u8   samples per wave snapshot (48)
    7   u8   frequency bands per frame (8)
    8   u32  frame count
    12  u32  decode sample rate (informational)
    16  ...  frames, each  wave[48] + bands[8]  bytes

Wave bytes follow getByteTimeDomainData: 128 * (1 + x), where the 48 points are
box-averaged from a 256-sample window (the analyser's fftSize in main.js) at the
frame's start. Bands follow getByteFrequencyData: Blackman window, magnitude
scaled by 1/N, smoothed across frames, 20*log10 mapped from -100..-30 dB onto
0..255. Band 0 is the mean of FFT bins 1..3 (the kick band the scope's bass pulse
reads); bands 1..7 are bins 9, 19, 28, 38, 48, 57, 67 — the ones the bars
visualizer samples.

Pure Python + ffmpeg on purpose: tools/ has no numpy, and only 60 windows per
second need transforming, so a radix-2 FFT is fast enough (~5s per track;
tracks run in parallel).

Usage:
    python3 tools/make-scope-data.py            # every track listed in main.js
    python3 tools/make-scope-data.py a.mp3 b.mp3
    python3 tools/make-scope-data.py --force    # rebuild even if up to date

Outputs land under /audio/, which Vercel serves immutable. main.js appends its
own ?v= (SCOPE_DATA_VERSION) to every .scope.bin request — bump that constant
whenever this format or its output changes, or returning visitors keep the old
files for a year.
"""
import array
import cmath
import math
import os
import re
import struct
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIN_JS = os.path.join(ROOT, 'main.js')

VERSION = 1
FPS = 60
RATE = 44100
FFT_SIZE = 256          # matches analyser.fftSize in createVisualizerController
WAVE_POINTS = 48
BAND_BINS = [None, 9, 19, 28, 38, 48, 57, 67]   # None = bass (mean of bins 1..3)
MIN_DB, MAX_DB = -100.0, -30.0
# The analyser smooths at the display rate (~60 Hz) with tau 0.7. Derive the
# per-stored-frame factor from FPS so a lower rate stays equivalent (at 20 fps
# three display frames pass per stored frame, so 0.7^3).
SMOOTH = 0.7 ** (60 / FPS)

BLACKMAN = [0.42 - 0.5 * math.cos(2 * math.pi * n / FFT_SIZE)
            + 0.08 * math.cos(4 * math.pi * n / FFT_SIZE) for n in range(FFT_SIZE)]


def fft(x):
    """Iterative radix-2 FFT on a list of complex numbers (len must be 2^k)."""
    n = len(x)
    j = 0
    x = list(x)
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j |= bit
        if i < j:
            x[i], x[j] = x[j], x[i]
    length = 2
    while length <= n:
        w_len = cmath.exp(-2j * math.pi / length)
        half = length // 2
        for start in range(0, n, length):
            w = 1
            for k in range(half):
                u = x[start + k]
                v = x[start + k + half] * w
                x[start + k] = u + v
                x[start + k + half] = u - v
                w *= w_len
        length <<= 1
    return x


def decode(path):
    out = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1',
         '-ar', str(RATE), 'pipe:1'],
        stdout=subprocess.PIPE, check=True).stdout
    pcm = array.array('h')
    pcm.frombytes(out[:len(out) - (len(out) % 2)])
    return pcm


def build(path):
    pcm = decode(path)
    total = len(pcm)
    frames = int(total * FPS // RATE)
    body = bytearray()
    smoothed = [0.0] * (FFT_SIZE // 2)
    scale = 1.0 / 32768.0
    step = FFT_SIZE / WAVE_POINTS
    db_span = MAX_DB - MIN_DB

    for f in range(frames):
        start = f * RATE // FPS
        window = pcm[start:start + FFT_SIZE]
        if len(window) < FFT_SIZE:
            window = window + array.array('h', [0] * (FFT_SIZE - len(window)))

        # Time domain: box-average the 256-sample window down to 48 points.
        for i in range(WAVE_POINTS):
            a = int(i * step)
            b = int((i + 1) * step)
            mean = sum(window[a:b]) / (b - a) * scale
            body.append(max(0, min(255, int(round(128 * (1 + mean))))))

        # Frequency domain, the way RealtimeAnalyser does it.
        spec = fft([complex(window[n] * scale * BLACKMAN[n], 0) for n in range(FFT_SIZE)])
        for k in range(FFT_SIZE // 2):
            mag = abs(spec[k]) / FFT_SIZE
            smoothed[k] = SMOOTH * smoothed[k] + (1 - SMOOTH) * mag

        def band_byte(mag):
            if mag <= 0:
                return 0
            db = 20 * math.log10(mag)
            return max(0, min(255, int(round(255 * (db - MIN_DB) / db_span))))

        for bin_index in BAND_BINS:
            if bin_index is None:
                mag = (smoothed[1] + smoothed[2] + smoothed[3]) / 3
            else:
                mag = smoothed[bin_index]
            body.append(band_byte(mag))

    header = struct.pack('<4sBBBBII', b'SCOP', VERSION, FPS, WAVE_POINTS,
                         len(BAND_BINS), frames, RATE)
    return bytes(header) + bytes(body), frames


def output_path(mp3):
    return re.sub(r'\.mp3$', '.scope.bin', mp3)


def tracks_from_main_js():
    with open(MAIN_JS, encoding='utf-8') as fh:
        src = fh.read()
    # Every `file: 'audio/....mp3'` entry: the album tracks (one directory down)
    # and the top-level Time Dial recaps, which take the same native-audio path.
    files = re.findall(r"file:\s*'(audio/[^'?]+\.mp3)", src)
    seen = []
    for rel in files:
        if rel not in seen:
            seen.append(rel)
    return [os.path.join(ROOT, rel) for rel in seen]


def process(args):
    mp3, force = args
    out = output_path(mp3)
    if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(mp3):
        return mp3, None, 'up to date'
    data, frames = build(mp3)
    with open(out, 'wb') as fh:
        fh.write(data)
    return mp3, len(data), f'{frames} frames'


def main(argv):
    force = '--force' in argv
    paths = [a for a in argv if not a.startswith('--')]
    mp3s = [os.path.abspath(p) for p in paths] or tracks_from_main_js()
    missing = [m for m in mp3s if not os.path.exists(m)]
    for m in missing:
        print(f'! missing: {os.path.relpath(m, ROOT)}', file=sys.stderr)
    mp3s = [m for m in mp3s if os.path.exists(m)]
    total = 0
    with ProcessPoolExecutor() as pool:
        for mp3, size, note in pool.map(process, [(m, force) for m in mp3s]):
            rel = os.path.relpath(mp3, ROOT)
            if size is None:
                print(f'  {rel}: {note}')
            else:
                total += size
                print(f'  {rel}: {note}, {size / 1024:.0f}K')
    print(f'{len(mp3s)} tracks, {total / 1024 / 1024:.1f}M written')
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
