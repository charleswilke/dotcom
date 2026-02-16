# Toots Jam External Scores API (Cloudflare Worker + D1)

This provides the same contract as local `server.js` for:
- `GET /api/scores?limit=10&mode=normal|free_throw`
- `POST /api/scores`

## 1) Prerequisites
- Cloudflare account
- Node.js installed locally

## 2) Create the D1 database
From `cloudflare-api/`:

```powershell
npx wrangler login
npx wrangler d1 create tootsjam-scores
```

Copy the `database_id` value into `cloudflare-api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tootsjam-scores"
database_id = "PASTE_ID_HERE"
```

## 3) Create the table/schema

```powershell
npx wrangler d1 execute tootsjam-scores --file=./schema.sql
```

## 4) Deploy the Worker

```powershell
npx wrangler deploy
```

This prints your Worker URL, usually:
- `https://tootsjam-scores-api.<your-subdomain>.workers.dev`

## 5) Point the game to the Worker
In `tootsjam.html`, set:

```html
<meta name="tootsjam-api-base" content="https://tootsjam-scores-api.<your-subdomain>.workers.dev" />
```

Keep local dev unchanged by leaving the meta value empty when running `npm start`.

## 6) Quick test

```powershell
curl "https://tootsjam-scores-api.<your-subdomain>.workers.dev/api/scores?limit=10"
```

```powershell
curl -X POST "https://tootsjam-scores-api.<your-subdomain>.workers.dev/api/scores" ^
  -H "Content-Type: application/json" ^
  -d "{\"initials\":\"ABC\",\"score\":42,\"mode\":\"normal\",\"startLevel\":1}"
```

## Optional: tighten CORS
In `wrangler.toml`, set:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-site.example"
```

If `ALLOWED_ORIGIN` is empty, the API allows all origins.
