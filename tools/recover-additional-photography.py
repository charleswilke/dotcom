#!/usr/bin/env python3
"""Recover non-Favorites chazwilke.com portfolio images from the Wayback Machine.

The output is a human-browsable folder containing the Travel, Animals, and Event
collections, plus a provenance manifest and archived copies of the gallery pages.
Images already present in the curated Favorites collection are omitted. Cross-listed
images remain visible in each original collection but are downloaded only once per run.
"""

from __future__ import annotations

import argparse
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
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


DEFAULT_DESTINATION = Path("/Users/cwilke/Documents/Pictures/chazwilke.com-recovery")
SOURCE_SNAPSHOT = "20150206061524"
UPLOAD_PREFIX = "chazwilke.com/gmn1kjqt_content/uploads/"
COLLECTIONS = ("favorites", "travel", "animals", "event")
USER_AGENT = "ChazWilkePortfolioRecovery/1.0 (+https://charleswilke.com/)"


class GalleryParser(HTMLParser):
    """Extract gallery items and the archived WordPress image candidates."""

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


def request_bytes(url: str, attempts: int = 8) -> tuple[bytes, dict[str, str]]:
    """Retrieve a URL with patient retries for the occasionally fragile archive."""

    last_error: Exception | None = None
    for attempt in range(attempts):
        request = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urlopen(request, timeout=120) as response:
                headers = {key.lower(): value for key, value in response.headers.items()}
                return response.read(), headers
        except (HTTPError, URLError, TimeoutError, ConnectionError, OSError) as error:
            last_error = error
            if isinstance(error, HTTPError) and error.code in (400, 404):
                break
            if attempt + 1 < attempts:
                time.sleep(min(20, 2 * (attempt + 1)))
    raise RuntimeError(f"Unable to retrieve {url}: {last_error}")


def archive_index() -> dict[str, list[dict[str, str]]]:
    query = urlencode(
        {
            "url": UPLOAD_PREFIX,
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
        raise RuntimeError("The Wayback CDX index did not return archived uploads")

    columns = rows[0]
    by_url: dict[str, list[dict[str, str]]] = {}
    for row in rows[1:]:
        capture = dict(zip(columns, row))
        normalized = normalize_url(capture["original"])
        by_url.setdefault(normalized, []).append(capture)
    return by_url


def normalize_url(value: str) -> str:
    return value.split("?", 1)[0]


def family_key(value: str) -> str:
    """Group WordPress crops and edits that belong to the same uploaded image."""

    path = Path(urlparse(normalize_url(value)).path)
    stem = path.stem.lower()
    stem = re.sub(r"-\d+x\d+$", "", stem)
    stem = re.sub(r"-e\d+$", "", stem)
    stem = re.sub(r"-\d+x\d+$", "", stem)
    return f"{path.parent.as_posix().lower()}/{stem}"


def best_capture(
    item: dict[str, object],
    captures_by_url: dict[str, list[dict[str, str]]],
    captures_by_family: dict[str, list[dict[str, str]]],
) -> dict[str, str]:
    candidates: list[dict[str, str]] = []
    for candidate_url in item.get("candidateUrls", []):
        candidates.extend(captures_by_url.get(normalize_url(str(candidate_url)), []))
    if not candidates:
        # Many archive crawls kept just one unlisted WordPress resize. Falling
        # back to its canonical upload family can rescue those surviving bytes.
        candidates.extend(captures_by_family.get(family_key(str(item["originalUrl"])), []))
    if not candidates:
        raise RuntimeError("no archived file or related WordPress resize was found")
    return max(candidates, key=lambda capture: int(capture.get("length") or 0))


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-") or "untitled"


def rational_text(value: object) -> str:
    if value in (None, "", 0, "0"):
        return ""
    return str(value)


def image_details(payload: bytes, path: Path) -> tuple[int, int, str]:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(path.suffix + ".part")
    temporary_path.write_bytes(payload)
    try:
        with Image.open(temporary_path) as image:
            image.load()
            width, height = ImageOps.exif_transpose(image).size
            image_format = image.format or "UNKNOWN"
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise
    temporary_path.replace(path)
    return width, height, image_format


def existing_image_details(path: Path) -> tuple[bytes, int, int, str] | None:
    if not path.exists():
        return None
    try:
        payload = path.read_bytes()
        with Image.open(path) as image:
            image.load()
            width, height = ImageOps.exif_transpose(image).size
            image_format = image.format or "UNKNOWN"
        return payload, width, height, image_format
    except Exception:
        return None


def download_capture(
    capture: dict[str, str],
    output_path: Path,
    cache: dict[str, tuple[bytes, dict[str, str]]],
) -> tuple[bytes, dict[str, str], int, int, str]:
    existing = existing_image_details(output_path)
    if existing:
        payload, width, height, image_format = existing
        return payload, {"content-type": f"image/{image_format.lower()}"}, width, height, image_format

    archive_url = f"https://web.archive.org/web/{capture['timestamp']}id_/{capture['original']}"
    cache_key = capture.get("digest") or archive_url
    if cache_key in cache:
        payload, headers = cache[cache_key]
    else:
        payload, headers = request_bytes(archive_url)
        cache[cache_key] = (payload, headers)
        time.sleep(0.35)
    width, height, image_format = image_details(payload, output_path)
    return payload, headers, width, height, image_format


def archive_extra_path(destination: Path, capture: dict[str, str]) -> Path:
    path = Path(urlparse(normalize_url(capture["original"])).path)
    parts = list(path.parts)
    try:
        uploads_index = parts.index("uploads")
        tail = parts[uploads_index + 1 :]
    except ValueError:
        tail = parts[-3:]
    year = tail[0] if len(tail) >= 3 and re.fullmatch(r"\d{4}", tail[0]) else "undated"
    month = tail[1] if len(tail) >= 3 and re.fullmatch(r"\d{2}", tail[1]) else "misc"
    stem = family_key(capture["original"]).rsplit("/", 1)[-1]
    suffix = output_suffix(normalize_url(capture["original"]))
    return destination / "Archive Extras" / year / month / f"{slugify(stem)}{suffix}"


def taken_date(meta: dict[str, object]) -> str:
    created_timestamp = rational_text(meta.get("created_timestamp"))
    if not created_timestamp:
        return ""
    try:
        return datetime.fromtimestamp(int(float(created_timestamp)), tz=timezone.utc).date().isoformat()
    except (ValueError, OverflowError):
        return ""


def fetch_collections(destination: Path) -> tuple[dict[str, list[dict[str, object]]], dict[str, object]]:
    collections: dict[str, list[dict[str, object]]] = {}
    source_pages: dict[str, object] = {}
    source_dir = destination / "_provenance" / "archive-pages"
    source_dir.mkdir(parents=True, exist_ok=True)

    for collection in COLLECTIONS:
        source_url = f"http://chazwilke.com/photography/{collection}/"
        archive_url = f"https://web.archive.org/web/{SOURCE_SNAPSHOT}id_/{source_url}"
        payload, headers = request_bytes(archive_url)
        (source_dir / f"{collection}-{SOURCE_SNAPSHOT}.html").write_bytes(payload)

        parser = GalleryParser()
        parser.feed(payload.decode("utf-8", errors="replace"))
        if not parser.items:
            raise RuntimeError(f"No gallery images found on archived {collection} page")
        collections[collection] = parser.items
        source_pages[collection] = {
            "sourceUrl": source_url,
            "sourceArchiveUrl": archive_url,
            "requestedArchiveTimestamp": SOURCE_SNAPSHOT,
            "mementoDatetime": headers.get("memento-datetime", ""),
            "itemCount": len(parser.items),
        }
        print(f"Cataloged {len(parser.items):2d} {collection.title()} images", flush=True)

    return collections, source_pages


def output_suffix(recovered_url: str, image_format: str = "") -> str:
    suffix = Path(recovered_url).suffix.lower()
    if suffix in (".jpeg", ".jpe"):
        return ".jpg"
    if suffix in (".jpg", ".png", ".gif", ".webp", ".tif", ".tiff"):
        return suffix
    return {
        "JPEG": ".jpg",
        "PNG": ".png",
        "GIF": ".gif",
        "WEBP": ".webp",
        "TIFF": ".tif",
    }.get(image_format.upper(), ".jpg")


def write_readme(
    destination: Path,
    records: list[dict[str, object]],
    extra_records: list[dict[str, object]],
    unique_portfolio_count: int,
    skipped_count: int,
    favorite_family_count: int,
    unavailable_count: int,
) -> None:
    total_bytes = sum(int(record["bytes"]) for record in records + extra_records)
    originals = sum(record["recoveryQuality"] == "original" for record in records)
    text = f"""CHAZWILKE.COM PHOTOGRAPHY RECOVERY
====================================

Recovered from archived versions of chazwilke.com using the Internet Archive's
Wayback Machine. This folder contains the Travel, Animals, and Event portfolio
entries that were not already part of the recovered Favorites contact sheet.

Gallery placements: {len(records)}
Unique gallery-linked archived images: {unique_portfolio_count}
Exact original-resolution recoveries: {originals}
Best surviving resized copies: {len(records) - originals}
Additional archived image families: {len(extra_records)}
Cross-listed placements matching Favorites omitted: {skipped_count}
Recovered Favorites families not duplicated here: {favorite_family_count}
Named collection entries with no archived image bytes: {unavailable_count}
Total bytes across all folders: {total_bytes:,}

The same photograph may appear in more than one collection because that reflects
the original site. Those cross-listed files have identical SHA-256 checksums.

Archive Extras contains the best surviving copy from every other archived upload
family found in the site's image directory. It can include artwork or site graphics
alongside photography because the archive does not reliably distinguish them.

See manifest.json for titles, source URLs, archive captures, dimensions, camera
metadata, recovery quality, and checksums. Archived gallery HTML is preserved in
_provenance/archive-pages.
"""
    (destination / "README.txt").write_text(text)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--destination",
        type=Path,
        default=DEFAULT_DESTINATION,
        help=f"output folder (default: {DEFAULT_DESTINATION})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    destination = args.destination.expanduser().resolve()
    destination.mkdir(parents=True, exist_ok=True)

    collections, source_pages = fetch_collections(destination)
    favorite_urls = {normalize_url(str(item["originalUrl"])) for item in collections["favorites"]}
    additional: list[dict[str, object]] = []
    skipped_favorites = 0
    for collection in COLLECTIONS[1:]:
        for sequence, item in enumerate(collections[collection], start=1):
            if normalize_url(str(item["originalUrl"])) in favorite_urls:
                skipped_favorites += 1
                continue
            additional.append({**item, "collection": collection.title(), "sequence": sequence})

    print(
        f"Recovering {len(additional)} additional gallery placements "
        f"({len({normalize_url(str(item['originalUrl'])) for item in additional})} unique URLs)…",
        flush=True,
    )
    captures_by_url = archive_index()
    captures_by_family: dict[str, list[dict[str, str]]] = {}
    for captures in captures_by_url.values():
        for capture in captures:
            captures_by_family.setdefault(family_key(capture["original"]), []).append(capture)

    records: list[dict[str, object]] = []
    failures: list[str] = []
    unavailable: list[str] = []
    download_cache: dict[str, tuple[bytes, dict[str, str]]] = {}
    for position, item in enumerate(additional, start=1):
        title = str(item["title"])
        collection = str(item["collection"])
        sequence = int(item["sequence"])
        original_url = normalize_url(str(item["originalUrl"]))
        print(f"[{position:02d}/{len(additional):02d}] {collection} · {title}", flush=True)
        try:
            capture = best_capture(item, captures_by_url, captures_by_family)
            timestamp = capture["timestamp"]
            recovered_url = normalize_url(capture["original"])
            archive_url = f"https://web.archive.org/web/{timestamp}id_/{capture['original']}"
            suffix = output_suffix(recovered_url)
            filename = f"{sequence:02d}-{slugify(title)}{suffix}"
            output_path = destination / collection / filename
            payload, headers, width, height, image_format = download_capture(
                capture, output_path, download_cache
            )
            actual_suffix = output_suffix(recovered_url, image_format)
            if actual_suffix != suffix:
                corrected_path = output_path.with_suffix(actual_suffix)
                output_path.replace(corrected_path)
                output_path = corrected_path

            meta = item.get("imageMeta") if isinstance(item.get("imageMeta"), dict) else {}
            records.append(
                {
                    "id": f"{collection.lower()}-{sequence:02d}-{slugify(title)}",
                    "sequence": sequence,
                    "title": title,
                    "collection": collection,
                    "relativePath": output_path.relative_to(destination).as_posix(),
                    "taken": taken_date(meta),
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
                    "archiveReportedBytes": int(capture.get("length") or 0),
                    "contentType": headers.get("content-type", ""),
                    "bytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "format": image_format,
                    "reportedWidth": item.get("reportedWidth", 0),
                    "reportedHeight": item.get("reportedHeight", 0),
                    "width": width,
                    "height": height,
                }
            )
        except Exception as error:
            message = f"{collection} #{sequence} {title}: {error}"
            if str(error) == "no archived file or related WordPress resize was found":
                unavailable.append(message)
                print(f"  UNAVAILABLE: {error}", flush=True)
            else:
                failures.append(message)
                print(f"  FAILED: {error}", flush=True)

    favorite_family_keys = {family_key(str(item["originalUrl"])) for item in collections["favorites"]}
    portfolio_family_keys = {
        family_key(str(item["originalUrl"]))
        for item in additional
    }
    extra_families = sorted(set(captures_by_family) - favorite_family_keys - portfolio_family_keys)
    print(f"\nRecovering {len(extra_families)} additional archived image families…", flush=True)
    extra_records: list[dict[str, object]] = []
    extra_failures: list[str] = []
    for position, key in enumerate(extra_families, start=1):
        captures = captures_by_family[key]
        capture = max(captures, key=lambda row: int(row.get("length") or 0))
        recovered_url = normalize_url(capture["original"])
        output_path = archive_extra_path(destination, capture)
        print(
            f"[extra {position:03d}/{len(extra_families):03d}] "
            f"{output_path.relative_to(destination).as_posix()}",
            flush=True,
        )
        try:
            payload, headers, width, height, image_format = download_capture(
                capture, output_path, download_cache
            )
            actual_suffix = output_suffix(recovered_url, image_format)
            if actual_suffix != output_path.suffix.lower():
                corrected_path = output_path.with_suffix(actual_suffix)
                output_path.replace(corrected_path)
                output_path = corrected_path
            timestamp = capture["timestamp"]
            extra_records.append(
                {
                    "id": f"archive-extra-{position:03d}",
                    "familyKey": key,
                    "relativePath": output_path.relative_to(destination).as_posix(),
                    "recoveredUrl": recovered_url,
                    "archiveTimestamp": timestamp,
                    "archiveUrl": (
                        f"https://web.archive.org/web/{timestamp}id_/{capture['original']}"
                    ),
                    "archiveDigest": capture.get("digest", ""),
                    "archiveReportedBytes": int(capture.get("length") or 0),
                    "contentType": headers.get("content-type", ""),
                    "bytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "format": image_format,
                    "width": width,
                    "height": height,
                    "archivedVariants": [
                        {
                            "url": normalize_url(variant["original"]),
                            "timestamp": variant["timestamp"],
                            "reportedBytes": int(variant.get("length") or 0),
                            "digest": variant.get("digest", ""),
                        }
                        for variant in sorted(
                            captures,
                            key=lambda row: int(row.get("length") or 0),
                            reverse=True,
                        )
                    ],
                }
            )
        except Exception as error:
            message = f"{key}: {error}"
            extra_failures.append(message)
            print(f"  FAILED: {error}", flush=True)

    failures.extend(extra_failures)

    unique_records: dict[str, dict[str, object]] = {}
    for record in records:
        unique_records.setdefault(str(record["sha256"]), record)

    manifest = {
        "schemaVersion": 1,
        "description": (
            "Additional Travel, Animals, and Event portfolio images recovered from "
            "chazwilke.com; images already represented in Favorites are omitted."
        ),
        "destination": str(destination),
        "recoveredAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourcePages": source_pages,
        "favoritesOmitted": skipped_favorites,
        "galleryPlacementCount": len(records),
        "uniqueImageCount": len(unique_records),
        "archiveExtraCount": len(extra_records),
        "archivedCaptureCount": sum(len(captures) for captures in captures_by_url.values()),
        "archivedImageFamilyCount": len(captures_by_family),
        "unavailableCollectionItems": unavailable,
        "failures": failures,
        "items": records,
        "archiveExtras": extra_records,
    }
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    write_readme(
        destination,
        records,
        extra_records,
        len(unique_records),
        skipped_favorites,
        len(favorite_family_keys),
        len(unavailable),
    )

    total_bytes = sum(int(record["bytes"]) for record in records + extra_records)
    print(
        f"\nRecovered {len(records)}/{len(additional)} placements "
        f"({len(unique_records)} unique images) and {len(extra_records)}/{len(extra_families)} extras "
        f"({total_bytes / 1024 / 1024:.1f} MiB across all folders)",
        flush=True,
    )
    if unavailable:
        print(
            f"Documented {len(unavailable)} named collection entries with no archived image bytes",
            flush=True,
        )
    print(f"Output: {destination}", flush=True)
    if failures:
        print("\nFailures:", flush=True)
        for failure in failures:
            print(f"- {failure}", flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
