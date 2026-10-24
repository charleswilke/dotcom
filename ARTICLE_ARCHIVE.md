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
refreshed during backfill; posts still in RSS are refreshed on every sync. Online
syncs also retain missing video poster metadata so archived players can display
previews without a live metadata lookup; failed lookups leave videos playable
and retry on a later sync. Feed-file imports remain offline.

The RSS refresh and homepage fallback are saved before optional `--backfill`
work. A later backfill error exits unsuccessfully while retaining that valid
refresh. The manually dispatched workflow does not request backfill; run it explicitly when
needed. HTTP 401/403 and other permanent failures stop after one request.
Network/timeouts, 408, 429, and selected transient 5xx responses get up to three
attempts. Retry-After seconds and HTTP dates are respected; waits longer than
60 seconds fail for a later run instead of retrying early. Diagnostics omit
response bodies and request queries. Failed or malformed feeds leave both saved
files untouched and never claim a fresh fetch. Successful snapshots identify
`live-rss` or `offline-rss` and their import time; offline import is not evidence
of restored live access.

For an offline RSS import:

```sh
node tools/sync-article-archive.js --feed-file /absolute/path/feed.xml
```

The offline build generates:

- `vendor/sanitize-html.cjs`: bundled sanitizer for Vercel runtime compatibility.
- `reader-base.css`: shared navigation and article styles derived from styles.css.
- `lib/asset-versions.json`: versions of minified static assets used in runtime HTML.
- `articles/items/<slug>.json`: per-article fallback for the homepage reader.
- `articles/related.json`: three related essays for each essay and its conversation,
  used by the standalone pages and homepage reader.
- `articles/search.json`: full essay text fetched only when an archive search begins.
  Its content hash versions the URL embedded in the archive search field.
- `articles/local.json`: existing repository transcripts and their metadata,
  derived from `LOCAL_ARTICLES` in `main.js` and the transcript HTML files,
  with social images from `lib/local-article-images.json`.
- `writing-archive.html`: crawlable index of essays. Conversations are linked
  within their essays, without separate archive cards or a conversation count.
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

The archive uses the shared site navigation, fonts, publication header and texture,
with illustrated cards grouped chronologically by year. Desktop cards pack into
a masonry grid with natural content heights; mobile uses normal single-column
flow. Responsive repacking observes container width only, so browser chrome
changing viewport height does not reset scroll or rearrange cards. The publication dial
uses the same shared `laibor-rails.js` spark and electrical effects as the homepage. Search matches title, description and saved article body
words and combines with year filters. The initial HTML contains only card metadata;
the first nonempty query loads the full-text index once. Results update using the
current query and year when it arrives. If loading fails or times out, title and
description search stays available with a notice; editing the query retries.
Without JavaScript, all essays remain visible
and year links jump to their sections. Standalone articles reuse the microfiche reader styling. The recap player and
draggable tick-rail scrollbar come from `article-reader-ui.js`, shared with the
homepage overlay; standalone pages retain normal document scrolling and their
server-rendered text without JavaScript.

The homepage still opens its overlay reader. Old `/#read/<slug>` links now resolve
independently of the latest 19 cards and normalize to `/read/<slug>`. If the API
is unavailable, the reader loads the generated per-article JSON. Its original
snapshot fallback remains available. The homepage archive tray links to
`/writing-archive`, and archived essay links to other Substack essays point to
`/read/<slug>` on this site.

Unknown articles return 404; upstream outages for unsaved articles return 502.
Error pages are marked noindex. Neither redirects visitors into a silent failure.

## Related reading

Each essay ends with three related essay links, rendered in the standalone HTML
and loaded from the same generated catalog in the homepage reader. The 95 initial
essays have editorial selections in `lib/related-article-selections.json`, chosen
for connections between their arguments and themes. Each selection includes its
target slug and a single-sentence `reason` explaining that specific pairing;
the reason appears beneath the title instead of repeating the target's subtitle.
Write each connection individually, varying its structure and opening; distinguish
the linked article from what the reader just read without repeating a standard
setup across the three recommendations. Use “what you just read” when an explicit
reference to the current article helps avoid ambiguity.
Titles come from the retained records, so they stay in sync. Conversations reuse their parent
essay's selections and are never recommendation targets.

Newly retained essays receive deterministic TF-IDF text-similarity selections
at build time until an editorial entry is added. This fallback emphasizes the
title, subtitle and first 12,000 characters of body text; it is lexical matching,
not an AI editorial review. These fallback selections display the target's subtitle
until an editor supplies a reason, rather than inventing an editorial explanation.
To curate a new essay, add its slug with three `{ "slug": "target-essay", "reason":
"One sentence connecting the two essays." }` entries to the selections file and
run the archive build. Invalid targets, self-links, duplicate selections and
missing editorial reasons fail the build.

The site declares the dot com as the preferred version. Google ultimately chooses
its canonical; this does not change canonical tags on Substack. Search Console
setup, sitemap submission, and Google URL inspection are separate next steps.
The sitemap lists content pages, excluding album/song share stubs that redirect
into homepage players. Those share URLs and players still work. Use the final
canonical URL when adding entries. Only include `lastmod` when the date of a
significant content update is known; the archive build does not invent new dates.

## Automatic retention

`.github/workflows/archive-articles.yml` runs weekly on Mondays at 11:23 UTC
and can also be run manually. It refreshes RSS without historical backfill, builds
and tests the archive, then commits
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
source if that API becomes unavailable. The importer currently accepts RSS XML
through `--feed-file`, not a Substack export ZIP/CSV/HTML bundle. An owner-supplied
RSS file can be imported without network access; an owner export can be kept as
a separate backup or converted to validated RSS before import. Do not substitute
cached feed data as proof of a successful live fetch. Intentionally removing a
retained article requires an explicit deletion from the source archive and sitemap regeneration.

## Verification

```sh
node tools/build-article-archive.js
node --test tests/article-archive.test.cjs tests/article-archive-sync.test.cjs tests/related-articles.test.cjs tests/article-reader-browser.test.cjs tests/security.test.js
```

These checks cover rollover retention, invalid and missing slugs, offline archive
responses, server sanitization, legacy reader links outside the latest 19, and
readable direct pages without JavaScript at desktop and phone sizes.
