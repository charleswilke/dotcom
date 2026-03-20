#!/usr/bin/env python3
"""
Cross-reference lyric videos against Whisper-generated JSON files.

Extracts frames from each track's lyric video, OCRs the text,
and compares against the JSON lyrics to find discrepancies.

Usage:
    python tools/verify-lyrics.py --all
    python tools/verify-lyrics.py --album exploring-laibor-mixtape
    python tools/verify-lyrics.py --track hum-of-humanity
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher, unified_diff

# Ensure NVIDIA DLLs are findable
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

ALBUMS = {
    "exploring-laibor-mixtape": {
        "title": "Exploring L.A.I.bor Mixtape",
        "video_exts": [".mp4", ".mov"],
    },
    "grief-without-ritual": {
        "title": "Grief without Ritual",
        "video_exts": [".mp4", ".mov"],
    },
}


def get_project_root():
    return Path(__file__).resolve().parent.parent


def find_video_for_track(audio_dir, slug, video_exts):
    """Find the video file matching a track slug."""
    for ext in video_exts:
        video_path = audio_dir / f"{slug}{ext}"
        if video_path.exists():
            return video_path
    return None


def extract_frames(video_path, interval_sec=2.0, max_frames=120):
    """Extract frames from a video at regular intervals using av."""
    import av

    frames = []
    try:
        container = av.open(str(video_path))
        stream = container.streams.video[0]
        duration = float(stream.duration * stream.time_base) if stream.duration else 0

        if duration <= 0:
            # Fallback: just decode all frames and sample
            all_frames = []
            for frame in container.decode(video=0):
                all_frames.append(frame)
            if not all_frames:
                return []
            step = max(1, len(all_frames) // max_frames)
            for i in range(0, len(all_frames), step):
                img = all_frames[i].to_ndarray(format='rgb24')
                timestamp = float(all_frames[i].pts * stream.time_base) if all_frames[i].pts else i
                frames.append((timestamp, img))
            container.close()
            return frames[:max_frames]

        # Seek to specific timestamps
        fps = float(stream.average_rate) if stream.average_rate else 24
        timestamps = []
        t = 0.5  # Start slightly after beginning
        while t < duration and len(timestamps) < max_frames:
            timestamps.append(t)
            t += interval_sec

        for target_time in timestamps:
            target_pts = int(target_time / stream.time_base)
            container.seek(target_pts, stream=stream)
            for frame in container.decode(video=0):
                img = frame.to_ndarray(format='rgb24')
                actual_time = float(frame.pts * stream.time_base) if frame.pts else target_time
                frames.append((actual_time, img))
                break

        container.close()
    except Exception as e:
        print(f"    Warning: Could not extract frames from {video_path.name}: {e}")

    return frames


def is_timestamp_or_noise(text):
    """Check if OCR text is a video timestamp, timecode, or noise rather than lyrics."""
    cleaned = text.strip()
    # Timestamps like "02:33", "03:09", "01:53"
    if re.match(r'^\d{1,2}[:.]\d{2}(\s*\d*\s*\d{1,2}[:.]\d{2})?$', cleaned):
        return True
    # Very short fragments that are likely noise
    if len(cleaned) <= 2:
        return True
    # Pure numbers
    if re.match(r'^[\d\s:.]+$', cleaned):
        return True
    return False


def ocr_frames(frames, reader):
    """Run OCR on extracted frames and return unique lyric lines with timestamps."""
    seen_lines = set()
    results = []

    for timestamp, img in frames:
        try:
            ocr_results = reader.readtext(img, detail=0, paragraph=True)
        except Exception:
            continue

        for text in ocr_results:
            text = text.strip()
            if not text:
                continue

            # Skip timestamps and noise
            if is_timestamp_or_noise(text):
                continue

            # Remove bracketed production cues
            text = re.sub(r'\[.*?\]', '', text).strip()
            if not text or len(text) < 3:
                continue

            # Fix common OCR spacing issues
            text = re.sub(r"(\w)'(\s?)s\b", r"\1's", text)  # Fix "That' s" -> "That's"
            text = re.sub(r'(\w)\s*n\s*t\b', r"\1n't", text)  # Fix "won t" -> "won't"
            text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Fix "spillingin" -> "spilling in"

            # Normalize for dedup
            normalized = re.sub(r'[^\w\s]', '', text.lower())
            normalized = re.sub(r'\s+', ' ', normalized).strip()

            if normalized and normalized not in seen_lines:
                seen_lines.add(normalized)
                results.append({
                    "timestamp": round(timestamp, 2),
                    "text": text,
                })

    return results


def clean_ocr_text(text):
    """Remove production cues in [brackets] and normalize."""
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def load_json_lyrics(json_path):
    """Load lyrics from a JSON file and return cleaned text lines."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    lines = []
    for line in data.get("lines", []):
        text = line.get("text", "").strip()
        if text:
            lines.append(text)
    return lines


def normalize_for_comparison(text):
    """Normalize text for fuzzy comparison."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def compare_lyrics(video_lines, json_lines):
    """Compare OCR lines against JSON lines and return a report.

    Uses substring/containment matching in addition to similarity,
    since OCR often captures fragments of full JSON lines.
    """
    video_normalized = [normalize_for_comparison(clean_ocr_text(l["text"])) for l in video_lines]
    json_normalized = [normalize_for_comparison(l) for l in json_lines]

    video_clean = [(video_lines[i], video_normalized[i]) for i in range(len(video_lines)) if video_normalized[i]]
    json_clean = [(json_lines[i], json_normalized[i]) for i in range(len(json_lines)) if json_normalized[i]]

    report = {
        "video_line_count": len(video_clean),
        "json_line_count": len(json_clean),
        "matched": [],
        "video_only": [],
        "json_only": [],
        "mismatches": [],
    }

    json_matched = set()

    for v_orig, v_norm in video_clean:
        best_match = None
        best_score = 0
        match_type = None

        for j_idx, (j_orig, j_norm) in enumerate(json_clean):
            # Check containment first (OCR fragment inside JSON line or vice versa)
            if v_norm in j_norm or j_norm in v_norm:
                score = len(v_norm) / max(len(j_norm), 1)  # Higher = more complete match
                if score > best_score or (score == best_score and match_type != 'contains'):
                    best_score = max(score, 0.85)  # Treat containment as good match
                    best_match = (j_idx, j_orig, j_norm)
                    match_type = 'contains'
                continue

            # Fuzzy match
            ratio = SequenceMatcher(None, v_norm, j_norm).ratio()
            if ratio > best_score:
                best_score = ratio
                best_match = (j_idx, j_orig, j_norm)
                match_type = 'fuzzy'

        if best_match and best_score >= 0.55:
            json_matched.add(best_match[0])
            if best_score >= 0.85:
                report["matched"].append({
                    "video": v_orig["text"],
                    "json": best_match[1],
                    "similarity": round(best_score, 3),
                })
            else:
                report["mismatches"].append({
                    "video": v_orig["text"],
                    "json": best_match[1],
                    "similarity": round(best_score, 3),
                    "timestamp": v_orig.get("timestamp", 0),
                })
        else:
            report["video_only"].append({
                "text": v_orig["text"],
                "timestamp": v_orig.get("timestamp", 0),
            })

    # JSON lines not matched to any video line
    for j_idx, (j_orig, j_norm) in enumerate(json_clean):
        if j_idx not in json_matched:
            report["json_only"].append({"text": j_orig})

    return report


def process_track(slug, album_slug, reader, root):
    """Process a single track: extract video frames, OCR, compare."""
    album_info = ALBUMS[album_slug]
    audio_dir = root / "audio" / album_slug
    json_path = root / "lyrics" / album_slug / f"{slug}.json"

    if not json_path.exists():
        print(f"  Skipping {slug}: no JSON file")
        return None

    video_path = find_video_for_track(audio_dir, slug, album_info["video_exts"])
    if not video_path:
        print(f"  Skipping {slug}: no video file found")
        return None

    print(f"  Processing: {slug}")
    print(f"    Video: {video_path.name}")
    print(f"    JSON: {json_path.name}")

    # Extract frames
    print(f"    Extracting frames...")
    frames = extract_frames(video_path, interval_sec=1.5, max_frames=150)
    print(f"    Got {len(frames)} frames")

    if not frames:
        print(f"    Warning: No frames extracted")
        return None

    # OCR
    print(f"    Running OCR...")
    video_lines = ocr_frames(frames, reader)
    print(f"    Found {len(video_lines)} unique text segments")

    # Load JSON
    json_lines = load_json_lyrics(json_path)

    # Compare
    report = compare_lyrics(video_lines, json_lines)
    report["slug"] = slug
    report["album"] = album_slug

    # Print summary
    matched = len(report["matched"])
    mismatches = len(report["mismatches"])
    video_only = len(report["video_only"])
    json_only = len(report["json_only"])
    total = matched + mismatches + video_only + json_only

    print(f"    Results: {matched} matched, {mismatches} mismatches, "
          f"{video_only} video-only, {json_only} json-only")

    if mismatches > 0:
        print(f"    --- Mismatches ---")
        for m in report["mismatches"]:
            print(f"      Video: \"{m['video']}\"")
            print(f"      JSON:  \"{m['json']}\"")
            print(f"      Similarity: {m['similarity']}")
            print()

    if video_only:
        print(f"    --- In video but not JSON (possible missed lyrics) ---")
        for v in report["video_only"]:
            cleaned = clean_ocr_text(v["text"])
            if cleaned:
                print(f"      @{v['timestamp']}s: \"{v['text']}\"")

    if json_only:
        print(f"    --- In JSON but not video (possible Whisper hallucination) ---")
        for j in report["json_only"]:
            print(f"      \"{j['text']}\"")

    return report


def process_album(album_slug, reader, root):
    """Process all tracks in an album."""
    album_info = ALBUMS[album_slug]
    lyrics_dir = root / "lyrics" / album_slug

    if not lyrics_dir.exists():
        print(f"No lyrics directory for {album_slug}")
        return []

    json_files = sorted(lyrics_dir.glob("*.json"))
    print(f"\nAlbum: {album_info['title']} ({len(json_files)} tracks)")
    print("=" * 60)

    reports = []
    for json_file in json_files:
        slug = json_file.stem
        report = process_track(slug, album_slug, reader, root)
        if report:
            reports.append(report)

    return reports


def save_correction_report(reports, output_path):
    """Save a combined correction report as JSON."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=2, ensure_ascii=False)
    print(f"\nCorrection report saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Verify lyrics against video OCR")
    parser.add_argument("--album", choices=list(ALBUMS.keys()), help="Album to verify")
    parser.add_argument("--track", type=str, help="Single track slug to verify")
    parser.add_argument("--all", action="store_true", help="Verify all albums")
    parser.add_argument("--interval", type=float, default=1.5, help="Frame extraction interval in seconds")
    args = parser.parse_args()

    if not (args.album or args.track or args.all):
        parser.print_help()
        sys.exit(1)

    root = get_project_root()

    print("Loading EasyOCR reader...")
    import easyocr
    reader = easyocr.Reader(['en'], gpu=True)
    print("OCR reader loaded.\n")

    all_reports = []

    if args.track:
        # Detect album from existing JSON
        for album_slug in ALBUMS:
            json_path = root / "lyrics" / album_slug / f"{args.track}.json"
            if json_path.exists():
                report = process_track(args.track, album_slug, reader, root)
                if report:
                    all_reports.append(report)
                break
        else:
            print(f"Could not find JSON for track: {args.track}")
            sys.exit(1)

    elif args.all:
        for album_slug in ALBUMS:
            all_reports.extend(process_album(album_slug, reader, root))

    elif args.album:
        all_reports.extend(process_album(args.album, reader, root))

    # Save report
    if all_reports:
        report_path = root / "tools" / "lyrics-verification-report.json"
        save_correction_report(all_reports, report_path)

        # Print overall summary
        print("\n" + "=" * 60)
        print("OVERALL SUMMARY")
        print("=" * 60)
        total_matched = sum(len(r["matched"]) for r in all_reports)
        total_mismatches = sum(len(r["mismatches"]) for r in all_reports)
        total_video_only = sum(len(r["video_only"]) for r in all_reports)
        total_json_only = sum(len(r["json_only"]) for r in all_reports)
        print(f"Tracks analyzed: {len(all_reports)}")
        print(f"Lines matched:   {total_matched}")
        print(f"Mismatches:      {total_mismatches}")
        print(f"Video-only:      {total_video_only} (lyrics in video but missing from JSON)")
        print(f"JSON-only:       {total_json_only} (in JSON but not found in video)")


if __name__ == "__main__":
    main()
