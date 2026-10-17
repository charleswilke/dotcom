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
