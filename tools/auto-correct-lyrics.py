#!/usr/bin/env python3
"""
Auto-correct lyrics JSON files using video OCR verification data.

Uses the verification report to:
1. Remove Whisper hallucinations (JSON-only lines not found in video)
2. Fix mismatched text (replace Whisper text with video OCR text)
3. Add missing lyrics found only in video OCR
4. Re-run Whisper on corrected text to preserve word-level timing

Usage:
    python tools/auto-correct-lyrics.py
    python tools/auto-correct-lyrics.py --track hum-of-humanity
    python tools/auto-correct-lyrics.py --dry-run
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from copy import deepcopy
from difflib import SequenceMatcher


def get_project_root():
    return Path(__file__).resolve().parent.parent


def normalize(text):
    """Normalize text for comparison."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def is_production_cue(text):
    """Check if text is a production cue, title card, noise, or OCR garbage — not actual lyrics."""
    cleaned = text.strip()

    # Bracketed content
    if re.match(r'^\[.*\]$', cleaned):
        return True

    # Contains brackets (production cues like [exhale], [intro])
    if re.search(r'\[.*?\]', cleaned):
        # If the non-bracketed part is very short, skip the whole thing
        without_brackets = re.sub(r'\[.*?\]', '', cleaned).strip()
        if len(without_brackets) < 10:
            return True

    # Common production labels
    production_words = [
        'verse', 'chorus', 'bridge', 'outro', 'intro', 'hook',
        'pre-chorus', 'interlude', 'suno', 'instrumental',
        'fade', 'solo', 'break',
    ]
    if cleaned.lower().strip('_.: ') in production_words:
        return True

    # Title cards like "Track Name by artist" or "cwilke"
    if re.search(r'\bby\s+(cwilke|charles\s*wilke)\b', cleaned, re.I):
        return True
    if re.search(r'\bcwilke\b', cleaned, re.I):
        return True

    # Production direction text (instrument cues, arrangement notes)
    production_patterns = [
        r'\b(drum|snare|bass|guitar|piano|synth|wurlitzer|urlitzer)\b',
        r'\b(rim\s+tap|brushed|strum|arpeggio)\b',
        r'\b(solo|fade\s*(in|out)|crescendo|decrescendo)\b',
        r'\bIssion\b',  # common OCR misread of production text
        r'\b(audible|enters|noise)\b',
        r'\bSTAL\b',  # OCR artifact
        r'\bTELEPH',  # OCR artifact
        r'\bIONE\b',  # OCR artifact
    ]
    for pat in production_patterns:
        if re.search(pat, cleaned, re.I):
            return True

    # Timecodes like "0o:00 1 03:13"
    if re.match(r'^[\d\s:oO|]+$', cleaned):
        return True

    # Very short fragments that are likely OCR noise
    if len(cleaned) <= 3 and not cleaned.isalpha():
        return True

    # Lines starting with numbers/timecodes followed by short text
    if re.match(r'^\d+\s', cleaned) and len(cleaned) < 15:
        return True

    # Lines that are mostly uppercase gibberish (OCR noise)
    upper_ratio = sum(1 for c in cleaned if c.isupper()) / max(len(cleaned), 1)
    if upper_ratio > 0.7 and len(cleaned) > 5:
        return True

    return False


def fix_ocr_artifacts(text):
    """Fix common OCR misreads."""
    # Fix apostrophe issues
    text = re.sub(r"(\w)'\$", r"\1's", text)  # it'$ -> it's
    text = re.sub(r"(\w)'t\b", r"\1't", text)  # preserve contractions
    text = re.sub(r"n'(?=t\b)", "n'", text)

    # Fix joined words (common OCR issue)
    # Only fix obvious cases where a capital letter appears mid-word
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

    # Fix "Im" -> "I'm" at word boundary
    text = re.sub(r'\bIm\b', "I'm", text)

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def find_best_json_line(text_norm, json_lines):
    """Find the JSON line that best matches a given normalized text."""
    best_idx = -1
    best_ratio = 0

    for i, line in enumerate(json_lines):
        line_norm = normalize(line.get("text", ""))
        if not line_norm:
            continue

        # Check containment
        if text_norm in line_norm or line_norm in text_norm:
            ratio = len(text_norm) / max(len(line_norm), 1)
            ratio = max(ratio, 0.7)
        else:
            ratio = SequenceMatcher(None, text_norm, line_norm).ratio()

        if ratio > best_ratio:
            best_ratio = ratio
            best_idx = i

    return best_idx, best_ratio


def create_line_from_ocr(text, timestamp, word_duration=0.3):
    """Create a new lyrics JSON line from OCR text with estimated timing."""
    words = text.split()
    word_entries = []
    current_time = timestamp

    for w in words:
        word_entries.append({
            "word": w,
            "start": round(current_time, 3),
            "end": round(current_time + word_duration, 3),
        })
        current_time += word_duration + 0.05  # small gap between words

    return {
        "start": round(timestamp, 3),
        "end": round(current_time, 3),
        "text": text,
        "words": word_entries,
    }


def update_line_text(line, new_text):
    """Update a line's text while trying to preserve timing structure."""
    old_words = line.get("words", [])
    new_words_list = new_text.split()

    if not old_words:
        # No existing timing, create estimated
        return create_line_from_ocr(new_text, line["start"])

    # If word count is similar, try to map timing
    new_word_entries = []
    old_duration = line["end"] - line["start"]
    avg_word_dur = old_duration / max(len(new_words_list), 1)

    for i, word in enumerate(new_words_list):
        if i < len(old_words):
            # Reuse existing timing
            new_word_entries.append({
                "word": word,
                "start": old_words[i]["start"],
                "end": old_words[i]["end"],
            })
        else:
            # Estimate timing for extra words
            prev_end = new_word_entries[-1]["end"] if new_word_entries else line["start"]
            new_word_entries.append({
                "word": word,
                "start": round(prev_end + 0.05, 3),
                "end": round(prev_end + 0.05 + avg_word_dur, 3),
            })

    updated = deepcopy(line)
    updated["text"] = new_text
    updated["words"] = new_word_entries
    if new_word_entries:
        updated["start"] = new_word_entries[0]["start"]
        updated["end"] = new_word_entries[-1]["end"]

    return updated


def correct_track(report, root, dry_run=False):
    """Apply corrections to a single track's JSON file."""
    slug = report["slug"]
    album = report["album"]
    json_path = root / "lyrics" / album / f"{slug}.json"

    if not json_path.exists():
        print(f"  Skipping {slug}: JSON not found")
        return False

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_line_count = len(data.get("lines", []))
    changes = []

    # 1. Remove hallucinated lines (JSON-only)
    json_only_texts = set()
    for entry in report.get("json_only", []):
        json_only_texts.add(normalize(entry["text"]))

    lines_to_keep = []
    for line in data.get("lines", []):
        line_norm = normalize(line.get("text", ""))
        if line_norm in json_only_texts:
            changes.append(f"  REMOVE (hallucination): \"{line['text'][:80]}...\"" if len(line['text']) > 80 else f"  REMOVE (hallucination): \"{line['text']}\"")
        else:
            lines_to_keep.append(line)

    data["lines"] = lines_to_keep

    # 2. Fix mismatched text (use video as ground truth for TEXT, keep Whisper TIMING)
    for mismatch in report.get("mismatches", []):
        video_text = fix_ocr_artifacts(mismatch["video"])
        json_text = mismatch["json"]

        if is_production_cue(video_text):
            continue

        # Skip OCR fragments that are too short to be useful corrections
        video_norm = normalize(video_text)
        if len(video_norm.split()) < 3:
            continue

        # Find the matching JSON line
        json_norm = normalize(json_text)
        for i, line in enumerate(data["lines"]):
            if normalize(line.get("text", "")) == json_norm:
                # Only replace if video text is substantially different
                # and is a meaningful correction (not just a fragment)
                if len(video_norm) > len(json_norm) * 0.4:
                    old_text = line["text"]
                    # Keep the original timing, just update the text and word text
                    data["lines"][i] = update_line_text(line, video_text)
                    changes.append(f"  FIX: \"{old_text[:60]}\" -> \"{video_text[:60]}\"")
                break

    # 3. Add missing video-only lines (lyrics in video but not in JSON)
    #    Video timestamps are frame capture times, NOT audio timestamps.
    #    Use them only for rough ordering. Timing will need manual adjustment.
    existing_norms = set(normalize(l.get("text", "")) for l in data["lines"])

    video_only_additions = []
    for entry in report.get("video_only", []):
        text = fix_ocr_artifacts(entry["text"])

        if is_production_cue(text):
            continue

        text_norm = normalize(text)

        # Skip if too short (likely a fragment)
        if len(text_norm.split()) < 4:
            continue

        # Skip lines with trailing underscores or obvious OCR junk
        if text.endswith('_') or text.startswith('_'):
            continue
        if re.search(r'[_|]{2,}', text):
            continue

        # Skip if already exists or is a substring of an existing line
        already_covered = False
        for existing in existing_norms:
            if text_norm in existing or existing in text_norm:
                already_covered = True
                break
            if SequenceMatcher(None, text_norm, existing).ratio() > 0.7:
                already_covered = True
                break

        if already_covered:
            continue

        # Use video frame timestamp as rough placement
        timestamp = entry.get("timestamp", 0)
        new_line = create_line_from_ocr(text, timestamp)
        new_line["_needs_timing"] = True  # Flag for manual review
        video_only_additions.append(new_line)
        existing_norms.add(text_norm)
        changes.append(f"  ADD (from video @{timestamp}s): \"{text[:70]}\"")

    data["lines"].extend(video_only_additions)

    # Sort lines by start time
    data["lines"].sort(key=lambda l: l["start"])

    # Summary
    final_line_count = len(data["lines"])
    print(f"  {slug}: {original_line_count} -> {final_line_count} lines ({len(changes)} changes)")

    if changes:
        for c in changes[:20]:  # Show first 20 changes
            print(c)
        if len(changes) > 20:
            print(f"  ... and {len(changes) - 20} more changes")

    if not dry_run and changes:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Saved: {json_path.name}")

    return bool(changes)


def main():
    parser = argparse.ArgumentParser(description="Auto-correct lyrics from video OCR")
    parser.add_argument("--track", type=str, help="Single track slug to correct")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without saving")
    args = parser.parse_args()

    root = get_project_root()
    report_path = root / "tools" / "lyrics-verification-report.json"

    if not report_path.exists():
        print("Error: No verification report found. Run verify-lyrics.py first.")
        sys.exit(1)

    with open(report_path, 'r', encoding='utf-8') as f:
        reports = json.load(f)

    print(f"Loaded verification report with {len(reports)} tracks")
    if args.dry_run:
        print("DRY RUN — no files will be modified\n")
    print()

    corrected = 0
    for report in reports:
        if args.track and report["slug"] != args.track:
            continue
        if correct_track(report, root, args.dry_run):
            corrected += 1
        print()

    print(f"{'Would correct' if args.dry_run else 'Corrected'} {corrected} of {len(reports)} tracks")


if __name__ == "__main__":
    main()
