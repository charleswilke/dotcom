#!/usr/bin/env python3
"""
Transcribe album tracks using Whisper to generate word-level timed lyrics.

Usage:
    python tools/transcribe.py --album exploring-laibor-mixtape
    python tools/transcribe.py --album grief-without-ritual
    python tools/transcribe.py --track audio/exploring-laibor-mixtape/hum-of-humanity.mp3
    python tools/transcribe.py --all

Options:
    --model    Whisper model size (default: medium). Options: tiny, base, small, medium, large-v3
    --force    Overwrite existing lyric JSON files
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Ensure NVIDIA CUDA DLLs from pip packages are findable
def _add_nvidia_dll_dir(pkg_name):
    try:
        pkg = __import__(f"nvidia.{pkg_name}", fromlist=[pkg_name])
        pkg_dir = pkg.__path__[0] if hasattr(pkg, '__path__') else os.path.dirname(pkg.__file__)
        bin_dir = os.path.join(pkg_dir, "bin")
        if os.path.isdir(bin_dir):
            os.add_dll_directory(bin_dir)
            os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")
    except (ImportError, IndexError, TypeError):
        pass

_add_nvidia_dll_dir("cublas")
_add_nvidia_dll_dir("cudnn")

# Album metadata for track title lookup
ALBUM_TITLES = {
    "exploring-laibor-mixtape": "Exploring L.A.I.bor Mixtape",
    "grief-without-ritual": "Grief without Ritual",
}

ALBUMS = list(ALBUM_TITLES.keys())

def get_project_root():
    """Get the WWW project root (parent of tools/)."""
    return Path(__file__).resolve().parent.parent

def slug_from_filename(filepath):
    """Derive slug from MP3 filename, matching getTrackSlug() in main.js."""
    return Path(filepath).stem

def title_from_slug(slug):
    """Convert slug to a human-readable title."""
    return slug.replace("-", " ").title()

def find_mp3s(audio_dir):
    """Find all MP3 files in a directory, sorted by name."""
    return sorted(audio_dir.glob("*.mp3"))

def transcribe_track(mp3_path, model, album_slug):
    """Transcribe a single MP3 file and return the lyric JSON structure."""
    from faster_whisper import WhisperModel

    print(f"  Transcribing: {mp3_path.name}...")

    whisper_model = model
    segments, info = whisper_model.transcribe(
        str(mp3_path),
        language="en",
        word_timestamps=True,
        vad_filter=True,
    )

    slug = slug_from_filename(mp3_path)
    track_title = title_from_slug(slug)

    lines = []
    for segment in segments:
        if not segment.words:
            continue

        words = []
        for w in segment.words:
            words.append({
                "word": w.word.strip(),
                "start": round(w.start, 3),
                "end": round(w.end, 3),
            })

        if words:
            lines.append({
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "text": " ".join(w["word"] for w in words),
                "words": words,
            })

    return {
        "track": track_title,
        "album": album_slug,
        "duration": round(info.duration, 3),
        "lines": lines,
    }

def process_track(mp3_path, album_slug, model, output_dir, force=False):
    """Process a single track: transcribe and save JSON."""
    slug = slug_from_filename(mp3_path)
    output_file = output_dir / f"{slug}.json"

    if output_file.exists() and not force:
        print(f"  Skipping {mp3_path.name} (JSON exists, use --force to overwrite)")
        return False

    lyrics_data = transcribe_track(mp3_path, model, album_slug)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(lyrics_data, f, indent=2, ensure_ascii=False)

    word_count = sum(len(line["words"]) for line in lyrics_data["lines"])
    print(f"  Saved: {output_file.name} ({len(lyrics_data['lines'])} lines, {word_count} words)")
    return True

def process_album(album_slug, model, root, force=False):
    """Process all tracks in an album."""
    audio_dir = root / "audio" / album_slug
    output_dir = root / "lyrics" / album_slug

    if not audio_dir.exists():
        print(f"Error: Audio directory not found: {audio_dir}")
        return 0

    mp3s = find_mp3s(audio_dir)
    if not mp3s:
        print(f"No MP3 files found in {audio_dir}")
        return 0

    print(f"\nProcessing album: {ALBUM_TITLES.get(album_slug, album_slug)}")
    print(f"  Found {len(mp3s)} tracks in {audio_dir}")
    print(f"  Output: {output_dir}\n")

    processed = 0
    for mp3 in mp3s:
        if process_track(mp3, album_slug, model, output_dir, force):
            processed += 1

    return processed

def main():
    parser = argparse.ArgumentParser(description="Transcribe album tracks with Whisper")
    parser.add_argument("--album", choices=ALBUMS, help="Album to transcribe")
    parser.add_argument("--track", type=str, help="Single MP3 file to transcribe")
    parser.add_argument("--all", action="store_true", help="Transcribe all albums")
    parser.add_argument("--model", default="medium", help="Whisper model size (default: medium)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing JSON files")
    args = parser.parse_args()

    if not (args.album or args.track or args.all):
        parser.print_help()
        sys.exit(1)

    root = get_project_root()

    print(f"Loading Whisper model '{args.model}'...")
    from faster_whisper import WhisperModel
    model = WhisperModel(args.model, device="auto", compute_type="auto")
    print("Model loaded.\n")

    total = 0

    if args.track:
        mp3_path = Path(args.track)
        if not mp3_path.is_absolute():
            mp3_path = root / mp3_path
        if not mp3_path.exists():
            print(f"Error: File not found: {mp3_path}")
            sys.exit(1)
        # Detect album from path
        album_slug = mp3_path.parent.name
        output_dir = root / "lyrics" / album_slug
        if process_track(mp3_path, album_slug, model, output_dir, args.force):
            total = 1

    elif args.all:
        for album in ALBUMS:
            total += process_album(album, model, root, args.force)

    elif args.album:
        total = process_album(args.album, model, root, args.force)

    print(f"\nDone! Processed {total} track(s).")

if __name__ == "__main__":
    main()
