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
