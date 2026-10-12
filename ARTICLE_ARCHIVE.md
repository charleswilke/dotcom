# Permanent writing archive

The permanent source is `articles/archive.json`, keyed by the original Substack
slug. Each record retains the full publicly available HTML, title, publication
date, description, source URL, and image metadata. Git history preserves earlier
versions. An article disappearing from RSS or the public listing does not delete
its saved record.

## Import and build

Run `npm ci --ignore-scripts` once, then:

```sh
node tools/sync-article-archive.js --backfill
node tools/build-article-archive.js
```

The importer preserves the old fallback snapshot, merges the current RSS feed,
and optionally walks the public Substack archive to backfill missing public
posts. It only imports individual historical posts whose audience is `everyone`.
It uses bounded requests, throttling, retries, and atomic checkpoints after each
batch. Failed imports exit unsuccessfully; existing saved records survive.
Rerunning resumes by skipping already saved posts. Older saved posts are not
refreshed during backfill; posts still in RSS are refreshed on every sync.

For an offline RSS import:

```sh
node tools/sync-article-archive.js --feed-file /absolute/path/feed.xml
```

The offline build generates:

- `vendor/sanitize-html.cjs`: bundled sanitizer for Vercel runtime compatibility.
- `articles/items/<slug>.json`: per-article fallback for the homepage reader.
- `articles/local.json`: existing repository transcripts and their metadata,
  derived from `LOCAL_ARTICLES` in `main.js` and the transcript HTML files,
  with social images from `lib/local-article-images.json`.
- `writing-archive.html`: crawlable index of essays and local transcripts.
- Article and archive entries in `sitemap.xml`, preserving other site entries.

Generated data and index HTML are ignored by Git and regenerated before the
existing Vercel build steps. Run the build before local development or tests.
The generated sitemap is tracked. No upstream requests occur during build.

## URLs and search

`/read/<slug>` serves complete, sanitized HTML through `api/article-preview.js`;
it no longer redirects to a hash route. It includes a self-referencing canonical,
article social previews, and BlogPosting data identifying Charles Wilke as author.
Saved posts and local transcripts load without contacting Substack. Newly
published posts not yet imported can temporarily fall back to RSS.

The archive uses the shared site navigation, fonts, and printed article cards,
grouped by year. Standalone articles reuse the microfiche reader styling.

The homepage still opens its overlay reader. Old `/#read/<slug>` links now resolve
independently of the latest 19 cards and normalize to `/read/<slug>`. If the API
is unavailable, the reader loads the generated per-article JSON. Its original
snapshot fallback remains available. The homepage archive tray links to
`/writing-archive`, and archived essay links to other Substack essays point to
`/read/<slug>` on this site.

Unknown articles return 404; upstream outages for unsaved articles return 502.
Error pages are marked noindex. Neither redirects visitors into a silent failure.

The site declares the dot com as the preferred version. Google ultimately chooses
its canonical; this does not change canonical tags on Substack. Search Console
setup, sitemap submission, and Google URL inspection are separate next steps.

## Automatic retention

`.github/workflows/archive-articles.yml` runs daily at 11:23 UTC and can also be
run manually. It imports public posts, builds and tests the archive, then commits
changed archive, fallback, and sitemap files to `main`. Those commits use the
existing Vercel deployment integration. It needs GitHub Actions enabled and
permission to push to `main`; branch protection may require a different commit
workflow. The schedule becomes active when the workflow reaches the default
branch. Check Actions failures if sync stops.

## Preservation limits

Article HTML and metadata are retained locally. Images, audio, video, and external
embeds still reference their original hosts; this is not a complete media backup.
Subscriber-only content and drafts are not backfilled. The public Substack archive
API is not a guaranteed service contract; a Substack export is an alternative
source if that API becomes unavailable. Intentionally removing a retained article
requires an explicit deletion from the source archive and sitemap regeneration.

## Verification

```sh
node tools/build-article-archive.js
node --test tests/article-archive.test.cjs tests/article-reader-browser.test.cjs tests/security.test.js
```

These checks cover rollover retention, invalid and missing slugs, offline archive
responses, server sanitization, legacy reader links outside the latest 19, and
readable direct pages without JavaScript at desktop and phone sizes.
