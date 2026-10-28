# SEO & Performance Optimization Playbook

Reference guide distilled from optimizing three sites in April 2026: **fellowvector.com** (Astro), **charleswilke.com** (vanilla HTML), and **hausoftoots.com** (vanilla HTML + Shopify API).

## The Checklist

Run through this for any new or existing site. Each item takes minutes but compounds significantly.

### 1. WebP Image Conversion

The single highest-impact optimization across all three sites.

**Tool:** `brew install webp`, then `cwebp`

**Quality tiers:**
| Content type | Flag | Rationale |
|---|---|---|
| Showcase/portfolio work | `cwebp -q 90` | Preserve fidelity for visual work |
| General photos, covers, cards | `cwebp -q 80` | Visually indistinguishable, big savings |
| Game sprites with transparency | `cwebp -lossless` | Lossless = smaller PNG, no quality tradeoff |

**Conversion command (per directory):**
```bash
for f in *.jpg *.png; do
  [ -f "$f" ] && cwebp -q 80 "$f" -o "${f%.*}.webp"
done
```

**After converting, always verify:**
- Check for cases where WebP is *larger* than the original (rare but happens with certain PNGs). Delete those `.webp` files and keep the originals.
- Update all `src`, `url()`, `preload`, and JS string references.
- OG/Twitter meta image tags: update to `.webp` too — all major platforms support it now. If you're worried about edge cases, keep the original alongside the `.webp` for social tags only.

**Results across our sites:**
| Site | Before | After | Reduction |
|---|---|---|---|
| fellowvector.com | 6.0 MB | 2.2 MB | 63% |
| charleswilke.com | 110.0 MB | 21.1 MB | 80% |
| hausoftoots.com | 29.1 MB | 13.7 MB | 52% |

### 2. robots.txt

```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

Drop this in the site root (`/public` for Astro, repo root for static sites).

### 3. Sitemap

**Astro sites:** `npm install @astrojs/sitemap`, add `site` and `integrations: [sitemap()]` to `astro.config.mjs`. Auto-generates on build.

**Static sites:** Create `sitemap.xml` manually. Template:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- one <url> block per page -->
</urlset>
```

Remember to update when adding/removing pages.

### 4. JSON-LD Structured Data

Add a `<script type="application/ld+json">` block in the `<head>`. Schema type depends on the site:

| Site type | Schema types |
|---|---|
| Personal portfolio | `Person`, `WebSite` |
| Consulting/services | `ProfessionalService`, `Person`, `WebSite` |
| E-commerce / shop | `Organization`, `WebSite`, `CollectionPage`, `AboutPage` |
| Blog / writing | `Person`, `WebSite`, `Blog` |

**Minimum viable Person schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Your Name",
  "url": "https://yourdomain.com",
  "jobTitle": "Your Title",
  "sameAs": ["https://linkedin.com/in/you", "https://instagram.com/you"]
}
```

### 5. Canonical Tags

```html
<link rel="canonical" href="https://yourdomain.com/current-page">
```

One per page. Prevents duplicate content issues. Astro can generate these dynamically from `Astro.url.pathname`.

### Shared Homepage Links

`/junkyard-cabaret` and `/l.ai.bor` serve the complete homepage with custom social
preview metadata. `tools/build-share-pages.js` combines `index.html` with the
metadata in the matching root HTML files, writing ignored output under
`generated/share-pages/`. Vercel runs this before minification and rewrites the
clean URLs to those generated pages. Run `node tools/build-share-pages.js` after
changing the homepage or either preview source when testing these routes locally.

An early `history.replaceState` selects the normal homepage hash without another
page request. Keep the canonical at `https://charleswilke.com/`, since these are
alternate entries into the same page. Do not restore meta-refresh or JavaScript
redirects. The custom OG/Twitter URLs and artwork remain specific to each share.

Space Toots uses `https://charleswilke.com/spacetoots/` as its canonical URL;
its sitemap entry, social URLs, and redirects from alternate game paths agree.
The old `/snuggles-weight.html` tracker was deleted without a replacement and
intentionally remains a 404; do not redirect it to unrelated homepage content.

## Ongoing Search Console Checks

Include all three properties in each requested check:

| Site | Property to use | Sitemap |
|---|---|---|
| Charles Wilke | `sc-domain:charleswilke.com` | `https://charleswilke.com/sitemap.xml` |
| Haus of Toots | `sc-domain:hausoftoots.com` | `https://hausoftoots.com/sitemap.xml` |
| Fellow Vector | `https://fellowvector.com/` (verified URL-prefix property) | `https://fellowvector.com/sitemap-index.xml` |

The Fellow Vector domain property `sc-domain:fellowvector.com` remains unverified;
use the verified URL-prefix property. Preserve its ownership meta tag in
`src/layouts/BaseLayout.astro` in the Fellow Vector repository.

Compare clicks, impressions, average position, queries, and landing pages with
the previous check. Also record index coverage, sitemap fetch/discovery, HTTPS,
and pending fix validations. Record each report's date range or last-update date
separately from the date of the check. Missing or processing data is pending,
not zero. Inspect representative excluded URLs before treating a stale summary
as a current problem. These notes extend the requested checks; they do not
create a schedule.

### October 15, 2026 Baseline

Charles Wilke and Haus performance reports covered October 11–13:

| Site | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| Charles Wilke | 0 | 6 | 14.2 |
| Haus of Toots | 27 | 107 | 6.7 |
| Fellow Vector | Not recorded | Not recorded | Not recorded |

- Charles Wilke: index summary dated October 11 showed 10 indexed and 95
  excluded URLs. Two sampled essays from the 61 "crawled, currently not indexed"
  examples were already indexed in URL Inspection; one also confirmed the dotcom
  URL as Google's selected canonical. Sitemap: success, 112 discovered URLs,
  last read October 14. HTTPS: 8 URLs, no critical issues, updated October 14.
  Redirect-error validation for `/junkyard-cabaret` and `/l.ai.bor`, and canonical
  validation for `/spacetoots/`, both showed "Validation started" on October 15.
  Fixes were deployed through dotcom commit `153d88a` (production READY).
- Haus of Toots: index summary dated October 11 showed 6 indexed and 19 excluded
  URLs. Sitemap: success, 8 discovered URLs, last read October 13.
- Fellow Vector setup handoff, not a repeated browser check: verified the existing
  `https://fellowvector.com/` property using the HTML meta tag in commit `59d7db6`
  (production READY). The submitted sitemap index showed "Sitemap index processed
  successfully", last read October 15, with initially 0 discovered pages.
  Overview showed 3 indexed and 3 not indexed pages; HTTPS showed 3 URLs.
  Underlying coverage/HTTPS report dates were not supplied in the handoff.
- Fellow Vector commit `bde7d5f`: Writing cards and the About sidebar now link to
  `https://charleswilke.com/read/<slug>` instead of Substack. RSS still supplies
  new posts; subscription and archive links remain on Substack. Record this as
  an internal linking change, not evidence of a ranking or traffic effect.

The Fellow Vector setup checklist is maintained at
`/Users/cwilke/Documents/GitHub/fellow-vector-site/docs/SEARCH_CONSOLE.md`.

### October 16, 2026 Check

Live browser review of all three properties. Performance reports were last
updated 5 hours before the check. The comparable window is October 11–14;
the prior Charles Wilke and Haus totals covered October 11–13. These are
expanding cumulative windows, not equal-length period comparisons.

| Site | Clicks | Impressions | Average position |
|---|---:|---:|---:|
| Charles Wilke | 0 → 0 | 6 → 12 | 14.2 → 17.8 |
| Haus of Toots | 27 → 36 | 107 → 126 | 6.7 → 6.5 |
| Fellow Vector | 0 | 1 | 1.0 (one impression only) |

- Charles Wilke name query: `charles wilke` has 2 impressions, 0 clicks,
  average position 15.5. The daily table shows one impression at position 21
  on October 11 and one at position 10 on October 14. The homepage has both
  impressions; `/about`, `/faq.html`, and `/#projections` also appear in the
  filtered page table with one impression each at position 10. This is a
  promising observation, not a stable ranking or evidence of a causal effect
  from recent changes.
- Charles Wilke landing-page highlights across all queries: `/faq.html` has
  5 impressions, homepage 4, and `/read/the-social-siege-of-atomization` 1
  (position 30 for `atomisation of society`). Overall average position worsened
  while visibility broadened; do not equate this with a name-query decline.
- Charles Wilke index summary remains dated October 11: 10 indexed, 95
  excluded (61 crawled/currently not indexed, 15 discovered/currently not
  indexed, 15 redirects, 1 intentional 404, 2 redirect errors, 1 duplicate
  without selected canonical). Yesterday's sampled-essay inspection evidence
  remains relevant; this unchanged summary is not a fresh crawl finding.
  Redirect validation details show 2 pending, 0 failed; canonical validation
  shows 1 pending, 0 failed. Both started October 15 and remain unfinished.
- Charles Wilke sitemap: success, 112 discovered, last read October 16
  (previously October 14). HTTPS: 8 URLs, 0 non-HTTPS, no critical issues,
  report dated October 15.
- Haus queries: `haus of toots` 13 clicks/13 impressions (position 1),
  `house of toots` 4/4 (position 1), `sephora needlepoint canvas` 2/4
  (position 1.5), and `joann needlepoint canvas` 1/1 (position 4).
  `ndlpt` has 21 impressions, no clicks, position 8.9; watch for persistence
  and relevance before changing copy. Landing pages: homepage 26 clicks/86
  impressions, `/village` 6/47, `/just-landed` 4/31, and the www version of
  `/just-landed` 1/12. Page rows use different aggregation from property totals
  and should not be summed to reproduce headline clicks or impressions.
  These dates do not establish the current visibility of `/just-landed` after
  its recent intentional hiding.
- Haus index summary remains dated October 11: 6 indexed, 19 excluded
  (12 redirects, 5 alternate pages with proper canonical, 2 discovered/currently
  not indexed). Sitemap: success, 8 discovered, last read October 13.
  HTTPS: 6 URLs, 0 non-HTTPS, no critical issues, dated October 15.
- Fellow Vector's verified URL-prefix property has older history: July 15–
  October 14 shows 1 click, 72 impressions, CTR 1.4%, position 9.3. The one
  click belongs to `/services/`; homepage has 57 impressions, `/services/` 29,
  and `/writing/` 16. These are historical totals, not traffic generated since
  yesterday's verification. In the matching October 11–14 window, the single
  impression belongs to the homepage; the query table shows no data.
- Fellow Vector sitemap index: success, 5 discovered (up from 0 at setup),
  last read October 15. An older `/sitemap.website.xml` submission remains
  listed as success with 11 discovered, last read April 26, 2025; no submission
  was removed. Index summary dated October 11: 3 indexed, 3 excluded
  (2 404s and 1 alternate page with proper canonical). The 404 examples are
  `/main`, last crawled September 9, and `/m/login`, last crawled April 18.
  Their current HTTP behavior and historical purpose were not verified;
  investigate before proposing redirects. HTTPS: 3 URLs, 0 non-HTTPS, no
  critical issues, dated October 15.

Next check: watch the name-query daily positions, both pending validations,
Fellow Vector sitemap discovery, and fresh coverage dates. No new code fix is
justified solely by the stale exclusion counts. No indexing requests, sitemap
resubmissions, validation restarts, deployments, or schedule changes were made.

Reference: Google's [performance metric definitions](https://support.google.com/webmasters/answer/7042828)
explain property versus page aggregation. Google's [crawling troubleshooting guide](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors)
recommends retaining 404/410 for removed content without a similar replacement,
and redirecting when a clear replacement exists.

### October 21, 2026 Check

Live browser review of all three properties. Performance reports were last
updated 6 hours before the check and cover October 11–19. The October 16 check
covered October 11–14; these are expanding cumulative windows, not equal-length
period comparisons. Fellow Vector was explicitly filtered to October 11–19.

| Site | Clicks (prior → current) | Impressions (prior → current) | Average position (prior → current) |
|---|---:|---:|---:|
| Charles Wilke | 0 → 0 | 12 → 29 | 17.8 → 23.9 |
| Haus of Toots | 36 → 79 | 126 → 301 | 6.5 → 6.9 |
| Fellow Vector | 0 → 0 | 1 → 3 | 1.0 → 3.7 |

- Charles Wilke: `charles wilke` has 3 impressions, 0 clicks, position 13.7.
  Daily impressions occurred October 11 (position 21), October 14 (10), and
  October 18 (10). This remains too small a sample to establish a stable rank.
  Landing pages include `/faq.html` (8 impressions, position 24.6), homepage
  (7, 12.3), `/read/the-social-siege-of-atomization` (5, 35.6), and
  `/before-times.html` (4, 6.5). Several more essays now have impressions.
  The overall position change does not establish a decline for the name query.
- Charles Wilke coverage remains dated October 11: 10 indexed, 95 excluded,
  with the same six reasons and counts. URL Inspection of
  `/read/the-social-siege-of-atomization` confirms "URL is on Google" and
  "Page is indexed", successful fetch, indexing allowed, and the inspected
  dotcom URL as Google's selected canonical; last crawl October 13.
  Redirect validation remains started October 15, 2 pending/0 failed;
  canonical validation remains started October 15, 1 pending/0 failed.
- Charles Wilke sitemap: success, 113 discovered (previously 112), last read
  October 20. HTTPS: 9 URLs (previously 8), 0 non-HTTPS, no critical issues,
  report dated October 20.
- Haus: 43 additional clicks and 175 additional impressions in October 15–19.
  `haus of toots` has 23 clicks/27 impressions, `house of toots` 7/9, and
  `hausoftoots` 4/4, all at position 1. `joann needlepoint canvas` has 4/4
  (position 1.8), `sephora needlepoint canvas` 2/7 (1.3), and `ndlpt` 0/47
  (9.3). Homepage has 55 clicks/201 impressions, `/village` 14/131,
  `/just-landed` 10/92, and its www variant 1/12. Page-level totals use
  different aggregation and should not be summed to reproduce property totals.
  Cumulative `/just-landed` results do not establish its current indexing state.
- Haus coverage remains dated October 11: 6 indexed, 19 excluded (12 redirects,
  5 proper canonical alternates, 2 discovered/currently not indexed). Sitemap:
  success, 7 discovered (previously 8), last read October 19; the discovery
  decrease alone does not establish an indexing loss. HTTPS: 6 URLs,
  0 non-HTTPS, no critical issues, dated October 20.
- Fellow Vector: all 3 recent impressions belong to the homepage; query table
  shows no data. Its default July 20–October 19 report has 1 click,
  73 impressions, CTR 1.4%, position 9.2; this includes historical traffic and
  is a different window from the previous July 15–October 14 report.
  Coverage remains dated October 11: 3 indexed, 3 excluded (2 404s and 1
  proper canonical alternate); crawled/currently not indexed shows 0.
  Sitemap index: success, 5 discovered, last read October 20. The older
  `/sitemap.website.xml` remains listed with 11 discovered and April 26, 2025
  last read. HTTPS: 3 URLs, 0 non-HTTPS, no critical issues, dated October 20.

Continue watching fresh coverage dates, the pending validations, name-query
impressions, and Fellow Vector visibility. The stale coverage counts alone do
not justify a new code fix. No indexing requests, sitemap resubmissions,
validation restarts, deployments, or schedule changes were made.

### October 22, 2026 Check

Live browser review of all three verified properties. Performance reports were
last updated 4 hours before the check and cover October 11–20. The October 21
check covered October 11–19, so the changes below add one day to cumulative
windows rather than comparing equal-length periods. Fellow Vector was explicitly
filtered to October 11–20.

| Site | Clicks (prior → current) | Impressions (prior → current) | Average position (prior → current) |
|---|---:|---:|---:|
| Charles Wilke | 0 → 0 | 29 → 32 | 23.9 → 22.7 |
| Haus of Toots | 79 → 89 | 301 → 330 | 6.9 → 6.8 |
| Fellow Vector | 0 → 0 | 3 → 3 | 3.7 → 3.7 |

- Charles Wilke coverage has advanced to October 15: **72 indexed** (previously
  10), 55 excluded (previously 95). Crawled/currently not indexed fell from 61
  to 0; discovered/currently not indexed rose from 15 to 37. Other exclusions:
  14 redirects (previously 15), 1 intentional 404, 2 redirect errors, and 1
  duplicate without selected canonical. The report's known-URL population has
  also grown, so do not treat changes in the reason counts as a one-for-one
  movement of the same URLs. This is a substantial indexing improvement; it
  does not yet demonstrate a corresponding traffic increase.
- Charles Wilke query `charles wilke` remains at 3 impressions, 0 clicks,
  position 13.7. Landing pages: `/faq.html` 9 impressions (position 23.7),
  homepage 7 (12.3), `/read/the-social-siege-of-atomization` 6 (31.5), and
  `/before-times.html` 4 (6.5). The name-query sample is still too small to
  establish a stable rank.
- Charles Wilke redirect validation remains started October 15, with 2
  pending and 0 failed. `/junkyard-cabaret` and `/l.ai.bor` still show October
  11 last crawls. Canonical validation also remains started October 15, with
  1 pending and 0 failed; `/spacetoots/` still shows an October 1 last crawl.
  These validation examples do not represent a fresh post-fix failure.
  Sitemap: success, 113 discovered, last read October 22 (previously October
  20). HTTPS: 9 URLs, 0 non-HTTPS, no critical issues, dated October 21.
- Haus gained 10 clicks and 29 impressions in the newly included October 20
  data. `haus of toots` has 29 clicks/33 impressions, `house of toots` 8/10,
  and `hausoftoots` 4/4, all at position 1. `joann needlepoint canvas` remains
  4/4 (position 1.8), `sephora needlepoint canvas` 2/7 (1.3), and `ndlpt`
  has 0/49 (9.2). Homepage has 63 clicks/220 impressions, `/village` 15/147,
  `/just-landed` 11/107, and its www variant 1/12. Page rows use different
  aggregation from property totals and should not be summed to reproduce them.
  These cumulative results precede the October 21 redirect change and do not
  establish the current state of `/just-landed`.
- Haus coverage is now dated October 15, with counts unchanged: 6 indexed,
  19 excluded (12 redirects, 5 proper canonical alternates, 2 discovered/
  currently not indexed). Sitemap: success, 7 discovered, last read October
  19. HTTPS: 6 URLs, 0 non-HTTPS, no critical issues, dated October 21.
- Fellow Vector coverage has advanced to October 15: 4 indexed (previously
  3), 2 excluded (previously 3). Exclusions are 1 404 (previously 2) and 1
  proper canonical alternate; crawled/currently not indexed remains 0.
  All 3 recent impressions still belong to the homepage; the query table
  shows no data. Its default July 21–October 20 report has 1 click, 72
  impressions, CTR 1.4%, position 9.3; this rolling historical window is
  separate from the comparable October 11–20 totals above. Sitemap index:
  success, 5 discovered, last read October 20. The older
  `/sitemap.website.xml` remains listed with 11 discovered and April 26, 2025
  last read. HTTPS: 3 URLs, 0 non-HTTPS, no critical issues, dated October 21.

Continue watching the remaining discovered URLs, pending validations, and
whether the larger indexed essay archive begins to generate more impressions.
No new site fix is indicated by tonight's reports. No indexing requests,
sitemap resubmissions, validation restarts, deployments, or schedule changes
were made.

### October 23, 2026 Check

Live browser review of all three verified properties. Performance reports were
last updated 5.5 hours before the check and cover October 11–21. The October 22
check covered October 11–20, so these are expanding cumulative windows with one
additional day, not equal-length period comparisons. Fellow Vector was explicitly
filtered to October 11–21.

| Site | Clicks (prior → current) | Impressions (prior → current) | Average position (prior → current) |
|---|---:|---:|---:|
| Charles Wilke | 0 → 0 | 32 → 32 | 22.7 → 22.7 |
| Haus of Toots | 89 → 97 | 330 → 357 | 6.8 → 6.9 |
| Fellow Vector | 0 → 0 | 3 → 3 | 3.7 → 3.7 |

- Charles Wilke: no additional impressions or clicks in the newly reported
  October 21 data. `charles wilke` remains at 3 impressions, 0 clicks,
  position 13.7. Leading landing pages are unchanged: `/faq.html` 9 impressions
  (position 23.7), homepage 7 (12.3), `/read/the-social-siege-of-atomization`
  6 (31.5), and `/before-times.html` 4 (6.5). The query sample remains too
  small to establish a stable ranking.
- Charles Wilke coverage remains dated October 15: 72 indexed, 55 excluded
  (37 discovered/currently not indexed, 14 redirects, 1 intentional 404,
  2 redirect errors, 1 duplicate without selected canonical). Crawled/currently
  not indexed remains 0. Redirect validation, started October 15, still shows
  2 pending and 0 failed; `/junkyard-cabaret` and `/l.ai.bor` retain October 11
  last crawls. Canonical validation, also started October 15, remains at
  1 pending and 0 failed, with `/spacetoots/` last crawled October 1. These
  unchanged examples do not establish a post-fix failure. Sitemap: success,
  113 discovered, last read October 22. HTTPS: 9 URLs, 0 non-HTTPS, no critical
  issues, report advanced to October 22.
- Haus gained 8 clicks and 27 impressions in the newly included October 21
  data; cumulative CTR is 27.2%. `haus of toots` has 29 clicks/33 impressions,
  `house of toots` 10/12, and `hausoftoots` 4/4, all at position 1.
  `joann needlepoint canvas` has 5/5 (position 1.6), `sephora needlepoint
  canvas` 2/9 (1.4), and `ndlpt` 0/54 (9.1). Homepage has 69 clicks/241
  impressions, `/village` 15/156, `/just-landed` 13/118, and its www variant
  1/12. Page rows use different aggregation from property totals and should
  not be summed to reproduce them. Cumulative `/just-landed` traffic through
  the redirect-change date does not establish its current indexing state.
- Haus coverage remains dated October 15: 6 indexed, 19 excluded (12
  redirects, 5 proper canonical alternates, 2 discovered/currently not
  indexed). Sitemap: success, 7 discovered, last read advanced from October
  19 to October 23. HTTPS: 6 URLs, 0 non-HTTPS, no critical issues, dated
  October 22.
- Fellow Vector coverage remains dated October 15: 4 indexed, 2 excluded
  (1 404 and 1 proper canonical alternate), with crawled/currently not indexed
  at 0. All 3 recent impressions belong to the homepage; the recent query
  table still shows no data. The default July 22–October
  21 report has 1 click, 72 impressions, CTR 1.4%, position 9.3; this rolling
  historical window is separate from the comparable October 11–21 totals.
  Sitemap index: success, 5 discovered, last read October 20. The older
  `/sitemap.website.xml` remains successful with 11 discovered and April 26,
  2025 last read. HTTPS: 3 URLs, 0 non-HTTPS, no critical issues, dated
  October 22.

Continue watching fresh coverage dates, remaining discovered URLs, the two
pending validations, and whether the indexed essay archive earns more search
impressions. No new site fix is indicated tonight. No indexing requests,
sitemap resubmissions, validation restarts, deployments, or schedule changes
were made.

### October 27, 2026 Check

Live browser review of all three verified properties. Performance reports cover
October 11–25, compared with October 11–21 at the October 23 check. These are
expanding cumulative windows; the differences add October 22–25 rather than
compare equal-length periods. Charles Wilke and Fellow Vector reports were last
updated 3.5 hours before review; Haus was updated 4 hours before review. Fellow
Vector was explicitly filtered to October 11–25.

| Site | Clicks (prior → current) | Impressions (prior → current) | Average position (prior → current) |
|---|---:|---:|---:|
| Charles Wilke | 0 → 0 | 32 → 41 | 22.7 → 19.1 |
| Haus of Toots | 97 → 131 | 357 → 483 | 6.9 → 7.6 |
| Fellow Vector | 0 → 0 | 3 → 6 | 3.7 → 5.5 |

- Charles Wilke gained 9 impressions in the newly included four days. The
  `charles wilke` query has 4 impressions, 0 clicks, position 13.5 (previously
  3 impressions at 13.7); the additional impression occurred October 22 at
  position 13. This remains too small a sample to establish a stable ranking.
  Leading landing pages: homepage 14 impressions/position 9.0, `/faq.html`
  13/18.5, `/read/the-social-siege-of-atomization` 6/31.5, and
  `/before-times.html` 5/6.2. Queries also include `generative ai facts` and
  `generative ai hype or truly transformative`, each with one impression.
- Charles Wilke coverage advanced from October 15 to **October 22**:
  **76 indexed** (previously 72), 53 excluded (previously 55). Exclusions:
  37 discovered/currently not indexed, 11 redirects (previously 14), 1
  intentional 404, 2 redirect errors, 1 duplicate where Google selected a
  different canonical, and 1 crawled/currently not indexed. Changes in counts
  do not establish one-for-one movement of the same URLs.
- The original "Duplicate without user-selected canonical" validation now
  shows **Passed**, with 0 affected URLs (previously 1 pending). Space Toots
  appears in a different exclusion: URL Inspection of `/spacetoots/` shows
  successful fetch, crawling/indexing allowed, and the correct user-declared
  slash canonical, but Google selected `https://charleswilke.com/spacetoots`
  without the trailing slash. Last crawl: October 18, 11:22:39 PM as displayed
  by Search Console. Live HTTP checks confirm the non-slash URL returns 308
  to `/spacetoots/`, the destination returns 200, and its canonical tag points
  to itself. No contradictory live configuration was found; monitor Google's
  canonical selection after another crawl rather than changing the URL again.
- The crawled/currently not indexed example is
  `/read/scattered-thunderstorms`. URL Inspection confirms that status, last
  crawled October 20, 3:07:28 PM as displayed, with successful fetch, crawling
  and indexing allowed, and the inspected URL as Google's selected canonical.
  Its sitemap field says "Temporary processing error"; this is separate from
  the successful property sitemap report and does not establish a live fetch
  failure. No indexing request was submitted.
- Charles Wilke redirect validation remains started October 15, with 2
  pending and 0 failed. `/junkyard-cabaret` and `/l.ai.bor` retain October 11
  last crawls. Sitemap: success, **116 discovered** (previously 113), last read
  October 26. HTTPS: 9 URLs, 0 non-HTTPS, no critical issues, dated October 26.
- Haus gained **34 clicks and 126 impressions** in October 22–25; cumulative
  CTR is 27.1%. `haus of toots` has 34 clicks/39 impressions, `house of toots`
  13/15, and `hausoftoots` 7/7, all at position 1. `joann needlepoint canvas`
  has 8/11 (position 1.8), `sephora needlepoint canvas` 3/13 (1.6), and
  `ndlpt` 0/67 (9.0). Landing pages: homepage 90 clicks/325 impressions,
  `/village` 20/207, `/just-landed` 18/165, `/about` 3/108, and the www
  `/just-landed` variant 1/12. Page rows use different aggregation from
  property totals and should not be summed to reproduce them.
- Haus coverage advanced to October 22 with counts unchanged: 6 indexed,
  19 excluded (12 redirects, 5 proper canonical alternates, 2 discovered/
  currently not indexed). Inspection of `/just-landed` still reports indexed
  with itself as canonical, but the last crawl was **October 12**, before the
  October 21 redirect change. A live HTTP check confirms a 307 redirect to
  the homepage, followed by 200. The older inspection record does not show
  Google has recrawled that redirect yet. Sitemap: success, 7 discovered,
  last read October 27. HTTPS: 6 URLs, 0 non-HTTPS, no critical issues, dated
  October 26.
- Fellow Vector has 6 recent impressions: homepage 4 and `/about/` 2; no
  clicks and no query-table data. The default July 26–October 25 report has
  1 click, 75 impressions, CTR 1.3%, position 9.2; these rolling historical
  totals are separate from the comparable recent window above. Coverage
  advanced to October 22: 4 indexed (unchanged), 3 excluded (previously 2):
  1 404, 1 proper canonical alternate, and 1 newly discovered/currently not
  indexed URL. The new example is `/book/`, first detected October 19, with
  no recorded crawl. Live HTTP check: 200, self-referencing canonical, no
  robots meta tag found. Crawled/currently not indexed remains 0.
- Fellow Vector sitemap index: success, 5 discovered, last read October 25
  (previously October 20). The older `/sitemap.website.xml` remains successful
  with 11 discovered and April 26, 2025 last read. HTTPS: 3 URLs, 0 non-HTTPS,
  no critical issues, dated October 26.

Next check: watch Space Toots' Google-selected canonical, the two pending
redirect validations, `/read/scattered-thunderstorms`, Fellow Vector's `/book/`,
and a post-change crawl of Haus `/just-landed`. The current evidence does not
indicate a new site code fix. No indexing requests, sitemap resubmissions,
validation restarts, deployments, or schedule changes were made.

## Pre-existing Optimizations Worth Maintaining

These were already in place on charleswilke.com and should be standard practice:

- **`loading="lazy"` + `decoding="async"`** on below-fold images
- **`fetchpriority="high"`** on the hero/above-fold image
- **`width` and `height` attributes** on all `<img>` tags (prevents CLS)
- **Font `preconnect`** to `fonts.googleapis.com` and `fonts.gstatic.com`
- **`display=swap`** in Google Fonts URL
- **Cache-Control headers** on API responses (`s-maxage`, `stale-while-revalidate`)
- **`requestIdleCallback`** for non-critical initialization

## What NOT to Optimize

- **Favicons** — keep as `.ico` / `.png` / `.gif` for maximum browser compatibility
- **Images where WebP is larger** — always compare sizes after conversion
- **SVGs** — already vector, no format conversion needed
- **Audio/video** — different optimization domain entirely
