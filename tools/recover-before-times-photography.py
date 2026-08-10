#!/usr/bin/env python3
"""Recover the curated chazwilke.com photography favorites from the Wayback Machine.

The script preserves the archived JPEG bytes under bt-assets and builds two WebP
derivatives for the Before Times lobby: a small contact-sheet thumbnail and a
larger lightbox image. A provenance-rich JSON manifest is written beside the
runtime images so the browser experience and the archival record stay in sync.

Run with the bundled workspace Python (it includes Pillow):

    /Users/cwilke/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
        tools/recover-before-times-photography.py
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import time
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "bt-assets" / "photography" / "favorites"
RUNTIME_DIR = ROOT / "images" / "before-times" / "photography"
SOURCE_SNAPSHOT = "20150206061524"
SOURCE_URL = "http://chazwilke.com/photography/favorites/"
SOURCE_ARCHIVE_URL = f"https://web.archive.org/web/{SOURCE_SNAPSHOT}id_/{SOURCE_URL}"
SOURCE_HTML_PATH = RAW_DIR / f"favorites-{SOURCE_SNAPSHOT}.html"
MANIFEST_PATH = RUNTIME_DIR / "manifest.json"
USER_AGENT = "BeforeTimesPhotographyRecovery/1.0 (+https://charleswilke.com/)"
THUMB_MAX = 560
DISPLAY_MAX = 1800


class FavoritesParser(HTMLParser):
    """Extract gallery image metadata and the enclosing attachment link."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_link = ""
        self.items: list[dict[str, object]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "a":
            self.current_link = values.get("href", "")
            return
        if tag != "img" or not values.get("data-orig-file"):
            return

        raw_meta = values.get("data-image-meta", "")
        try:
            image_meta = json.loads(html.unescape(raw_meta)) if raw_meta else {}
        except json.JSONDecodeError:
            image_meta = {}

        width, height = (0, 0)
        raw_size = values.get("data-orig-size", "")
        if re.fullmatch(r"\d+,\d+", raw_size):
            width, height = (int(part) for part in raw_size.split(",", 1))

        self.items.append(
            {
                "title": values.get("data-image-title") or values.get("title") or "Untitled",
                "originalUrl": values["data-orig-file"],
                "candidateUrls": [
                    values.get("data-orig-file", ""),
                    values.get("src", ""),
                    values.get("data-large-file", ""),
                    values.get("data-medium-file", ""),
                ],
                "attachmentUrl": self.current_link,
                "reportedWidth": width,
                "reportedHeight": height,
                "imageMeta": image_meta,
            }
        )

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self.current_link = ""


def request_bytes(url: str, attempts: int = 4) -> tuple[bytes, dict[str, str]]:
    last_error: Exception | None = None
    for attempt in range(attempts):
        request = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urlopen(request, timeout=90) as response:
                headers = {key.lower(): value for key, value in response.headers.items()}
                return response.read(), headers
        except (HTTPError, URLError, TimeoutError) as error:
            last_error = error
            if isinstance(error, HTTPError) and error.code in (400, 404):
                break
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to retrieve {url}: {last_error}")


def archive_index() -> dict[str, list[dict[str, str]]]:
    query = urlencode(
        {
            "url": "chazwilke.com/gmn1kjqt_content/uploads/",
            "matchType": "prefix",
            "output": "json",
            "filter": ["statuscode:200", "mimetype:image/.*"],
            "fl": "timestamp,original,mimetype,length,digest",
            "collapse": "digest",
        },
        doseq=True,
    )
    payload, _ = request_bytes(f"https://web.archive.org/cdx/search/cdx?{query}")
    rows = json.loads(payload)
    if len(rows) < 2:
        raise RuntimeError("The Wayback CDX index did not return any archived uploads")
    columns = rows[0]
    captures = [dict(zip(columns, row)) for row in rows[1:]]
    by_url: dict[str, list[dict[str, str]]] = {}
    for capture in captures:
        normalized_url = capture["original"].split("?", 1)[0]
        by_url.setdefault(normalized_url, []).append(capture)
    return by_url


def best_capture(item: dict[str, object], captures_by_url: dict[str, list[dict[str, str]]]) -> dict[str, str]:
    candidates: list[dict[str, str]] = []
    for candidate_url in item.get("candidateUrls", []):
        normalized_url = str(candidate_url).split("?", 1)[0]
        candidates.extend(captures_by_url.get(normalized_url, []))
    if not candidates:
        raise RuntimeError("none of the original, displayed, large, or medium files were archived")

    # The archived content length is a better quality signal than the WordPress
    # label: its custom tiled-gallery source can be wider than `data-large-file`.
    return max(candidates, key=lambda row: int(row.get("length") or 0))


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-") or "untitled"


def rational_text(value: object) -> str:
    if value in (None, "", 0, "0"):
        return ""
    return str(value)


def make_runtime_image(source: Path, destination: Path, max_dimension: int, quality: int) -> tuple[int, int]:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=quality, method=6)
        return image.size


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    source_html, source_headers = request_bytes(SOURCE_ARCHIVE_URL)
    SOURCE_HTML_PATH.write_bytes(source_html)

    parser = FavoritesParser()
    parser.feed(source_html.decode("utf-8", errors="replace"))
    if not parser.items:
        raise RuntimeError("The archived Favorites page did not contain any gallery originals")

    print("Loading the archived upload index…", flush=True)
    captures_by_url = archive_index()

    records: list[dict[str, object]] = []
    failures: list[str] = []
    for index, item in enumerate(parser.items, start=1):
        title = str(item["title"])
        original_url = str(item["originalUrl"])
        slug = slugify(title)
        stem = f"{index:02d}-{slug}"
        display_path = RUNTIME_DIR / f"{stem}.webp"
        thumb_path = RUNTIME_DIR / f"{stem}-thumb.webp"

        print(f"[{index:02d}/{len(parser.items):02d}] {title}", flush=True)
        try:
            capture = best_capture(item, captures_by_url)
            timestamp = capture["timestamp"]
            recovered_url = capture["original"].split("?", 1)[0]
            source_suffix = Path(recovered_url).suffix.lower() or ".jpg"
            if source_suffix == ".jpeg":
                source_suffix = ".jpg"
            raw_path = RAW_DIR / f"{stem}{source_suffix}"
            archive_url = f"https://web.archive.org/web/{timestamp}id_/{capture['original']}"
            if raw_path.exists():
                raw_bytes = raw_path.read_bytes()
                headers = {"content-type": "image/jpeg"}
            else:
                raw_bytes, headers = request_bytes(archive_url)
            if not raw_bytes.startswith(b"\xff\xd8") and "image" not in headers.get("content-type", ""):
                raise RuntimeError(f"archive response is not an image ({headers.get('content-type', 'unknown')})")
            raw_path.write_bytes(raw_bytes)

            with Image.open(raw_path) as image:
                recovered_width, recovered_height = ImageOps.exif_transpose(image).size
                image_format = image.format or "JPEG"

            thumb_width, thumb_height = make_runtime_image(raw_path, thumb_path, THUMB_MAX, 78)
            display_width, display_height = make_runtime_image(raw_path, display_path, DISPLAY_MAX, 86)
            meta = item.get("imageMeta") if isinstance(item.get("imageMeta"), dict) else {}
            created_timestamp = rational_text(meta.get("created_timestamp"))
            taken = ""
            if created_timestamp:
                try:
                    taken = datetime.fromtimestamp(int(float(created_timestamp)), tz=timezone.utc).date().isoformat()
                except (ValueError, OverflowError):
                    taken = ""

            records.append(
                {
                    "id": stem,
                    "sequence": index,
                    "title": title,
                    "collection": "Favorites",
                    "taken": taken,
                    "camera": rational_text(meta.get("camera")),
                    "aperture": rational_text(meta.get("aperture")),
                    "iso": rational_text(meta.get("iso")),
                    "shutterSpeed": rational_text(meta.get("shutter_speed")),
                    "focalLength": rational_text(meta.get("focal_length")),
                    "attachmentUrl": item.get("attachmentUrl", ""),
                    "originalUrl": original_url,
                    "recoveredUrl": recovered_url,
                    "recoveryQuality": "original" if recovered_url == original_url else "best-surviving-copy",
                    "archiveTimestamp": timestamp,
                    "archiveUrl": archive_url,
                    "archiveDigest": capture.get("digest", ""),
                    "rawPath": str(raw_path.relative_to(ROOT)),
                    "rawBytes": len(raw_bytes),
                    "sha256": hashlib.sha256(raw_bytes).hexdigest(),
                    "format": image_format,
                    "reportedWidth": item.get("reportedWidth", 0),
                    "reportedHeight": item.get("reportedHeight", 0),
                    "width": recovered_width,
                    "height": recovered_height,
                    "thumb": f"/{thumb_path.relative_to(ROOT).as_posix()}",
                    "thumbWidth": thumb_width,
                    "thumbHeight": thumb_height,
                    "src": f"/{display_path.relative_to(ROOT).as_posix()}",
                    "displayWidth": display_width,
                    "displayHeight": display_height,
                }
            )
        except Exception as error:  # Keep recovering the remaining independent files.
            failures.append(f"{title}: {error}")
            print(f"  FAILED: {error}")

    previous_recovered_at = ""
    if MANIFEST_PATH.exists():
        try:
            previous_recovered_at = json.loads(MANIFEST_PATH.read_text())["recoveredAt"]
        except (KeyError, json.JSONDecodeError):
            previous_recovered_at = ""

    manifest = {
        "schemaVersion": 1,
        "collection": "Favorites (2008–2014)",
        "description": "The curated photography contact sheet recovered from chazwilke.com.",
        "sourceUrl": SOURCE_URL,
        "sourceArchiveUrl": SOURCE_ARCHIVE_URL,
        "sourceArchiveTimestamp": SOURCE_SNAPSHOT,
        "sourceMementoDatetime": source_headers.get("memento-datetime", ""),
        "recoveredAt": previous_recovered_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(records),
        "items": records,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")

    total_raw = sum(int(item["rawBytes"]) for item in records)
    print(f"\nRecovered {len(records)}/{len(parser.items)} originals ({total_raw / 1024 / 1024:.1f} MiB raw)")
    print(f"Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
    if failures:
        print("\nFailures:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
