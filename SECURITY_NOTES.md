# Security maintenance

Run `node --test tests/security.test.js`, `npm audit`, and (in
`games/ChessBlaster`) `npm run check && npm run build:web && npm audit`.
Browser regression tests use the root Playwright dependency and its Chromium browser.
On a fresh checkout, first run `node tools/build-article-archive.js && node tools/build-reader-css.js`
to prepare generated article data and reader styles while keeping source CSS/JS readable.
The complete regression pass is `node --test --test-concurrency=1 tests/*.test.cjs tests/security.test.js`.

The preview server binds to loopback and rejects traversal, external symlinks,
dotfiles and malformed URL encoding while retaining byte-range media seeking.

The guestbook uses a single Redis EVAL for its three-signatures-per-fifteen-minute
limit and bounded append. Its REST token must allow EVAL. Storage command errors
fail closed, calls time out after five seconds, and cross-site/non-JSON writes
are rejected. Existing entries and administrator token names are preserved.

## Deployment

The main site deploys from main as usual. `tools/prepare-security-assets.js`
copies the pinned DOMPurify distribution and regenerates the play allowlist
from audio filenames before minification. Run it locally when adding audio or
updating DOMPurify; commit the generated files too. Update the DOMPurify version
query in index.html when upgrading it. ChessBlaster's published dist files are
unchanged; the dependency updates protect future builds and development.

The build finishes with `tools/stamp-assets.js`, which content-versions local
CSS/JS links across static entries, games and generated share pages after
minification. It also writes `lib/asset-versions.json` for server-rendered article
links. HTML and unversioned code revalidate; only code with a content hash gets
immutable caching. `stamp-code.sh` invokes the same stamper for local use.
Standalone articles use `reader-base.css`, generated conservatively from the
canonical stylesheet by `tools/build-reader-css.js`; edit styles.css, not the
generated subset. Both generated files are ignored by Git and rebuilt on deploy.

The Cloudflare leaderboard is a separate deployment: run `wrangler deploy`
from games/TootsJam/cloudflare-api. This deploys the SCORE_LIMITER binding in
wrangler.toml along with the code. Without the binding, submissions fail closed.
The namespace ID must be unique to this limiter in the Cloudflare account.

## Analytics

GET /api/plays-report now requires `Authorization: Bearer <PLAYS_REPORT_TOKEN>`.
The old query parameter is deliberately rejected. Rotate that token in Vercel
if it has previously been used in URLs or shared bookmarks; remove saved URL
copies. Existing environment variable names are unchanged.

Play writes use one atomic Redis EVAL operation: 60 requests per IP per minute,
1,000 globally per minute, and at most one counted play per IP/track per 30
minutes. IP addresses are HMAC-hashed with the storage token, not stored raw.
Daily counters expire after 400 days; lifetime totals have a bounded set of keys
from the real track catalog. Older pre-existing keys are not deleted or changed.
The KV credential must allow EVAL (the existing full-access REST token does).
These are approximate audience counts: people sharing an IP may be deduplicated.
Rate limits prevent unbounded accepted writes, not all HTTP request costs.

## Remaining trust boundaries

TootsJam remains a casual, client-reported leaderboard. The worker rate limit
(5 submissions per IP per minute, per Cloudflare location) limits spam, but is
not proof of gameplay. A determined person can still fabricate a score within
the accepted range. Preventing this requires server-authoritative gameplay or
server-side replay verification, not a secret embedded in browser JavaScript.

The CSP now enforces source restrictions, but retains unsafe-inline because
existing pages use inline scripts/handlers. It is defense in depth; DOMPurify
is the primary protection for imported article HTML. Images and media permit
HTTPS sources to preserve Substack CDN redirects. Forms, scripts, frames, SVG,
inline styles, event handlers, and unsafe URLs are removed from article content;
native Substack audio/video placeholders are retained and hydrated locally.

No existing analytics or leaderboard data is removed by these changes.
