# Substack feed and archive

The current site uses Vercel's `/api/substack-feed`, not the retired PHP endpoint
or its cron-based cache warmer.

- The homepage requests summaries for the latest 19 posts.
- Full article requests resolve from the permanent repository archive first,
  then the current RSS feed for a newly published, unsaved post.
- API responses use a 15-minute browser cache with stale response allowances.
- The homepage maintains a 30-minute session summary cache.
- `cache_substack_feed.json` is the latest 19 full articles for offline fallback;
  it is refreshed by the archive sync and is not the permanent archive.
- `articles/archive.json` retains older records permanently.

See [ARTICLE_ARCHIVE.md](ARTICLE_ARCHIVE.md) for importing, building, scheduled
retention, reader links, search metadata, and regression checks.
