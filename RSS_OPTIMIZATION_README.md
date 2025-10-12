# RSS Feed Cache Optimization Setup

## What Was Done

### 1. PHP Endpoint Optimizations (`substack_feed.php`)
- **Extended cache TTL** from 30 minutes to 1 hour
- **Added proper HTTP cache headers** with `Cache-Control` and `ETag` support
- **Implemented gzip compression** for faster data transfer
- **Optimized cURL settings** with HTTP/2 support and compression
- **Added 304 Not Modified responses** for unchanged content

### 2. JavaScript Fallback Optimization (`index.html`)
- **Reduced API calls** from 4 attempts to 2 (removed redundant rss2json calls)
- **Removed nocache parameter** to leverage server caching
- **Added proper fetch headers** for compression and caching
- **Streamlined error handling**

### 3. Cache Warming Script (`warm_cache.php`)
- **Proactive cache warming** to ensure fresh content for visitors
- **Comprehensive logging** for monitoring
- **Error handling and validation**

## Setup Instructions

### 1. Test the Optimizations
```bash
# Test the RSS endpoint
curl -H "Accept-Encoding: gzip" "https://charleswilke.com/substack_feed.php?limit=200"

# Test cache warming script
php warm_cache.php
```

### 2. Set Up Cron Job (Recommended)
Add this to your crontab to warm the cache every 30 minutes:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your site):
*/30 * * * * /usr/bin/php /path/to/your/site/warm_cache.php >/dev/null 2>&1
```

### 3. Alternative: Manual Cache Warming
If cron isn't available, you can use external monitoring services like:
- **UptimeRobot**: Set up HTTP monitoring to hit your RSS endpoint every 30 minutes
- **Pingdom**: Similar monitoring service
- **GitHub Actions**: Use scheduled workflows to warm cache

Example GitHub Action (`.github/workflows/warm-cache.yml`):
```yaml
name: Warm RSS Cache
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Warm Cache
        run: curl -s "https://charleswilke.com/substack_feed.php?limit=200" > /dev/null
```

## Expected Performance Improvements

### Before Optimization:
- **First-time visitors**: 3-8 seconds (cold cache + multiple API calls)
- **Return visitors**: 2-4 seconds (browser cache helps slightly)

### After Optimization:
- **First-time visitors**: 200-500ms (warm cache + compression)
- **Return visitors**: 50-200ms (browser cache + ETag support)
- **Subsequent requests**: <100ms (304 Not Modified responses)

## Monitoring

Check the cache warming logs by running:
```bash
php warm_cache.php
```

Look for:
- `[SUCCESS]` messages indicating successful cache warming
- Cache file age should be < 30 minutes
- Item count should match your expected RSS feed size

## Troubleshooting

### Cache Not Working
1. Check file permissions on the web directory
2. Verify PHP can write to the directory: `ls -la cache_substack_feed.json`
3. Check server error logs for PHP errors

### Cron Job Not Running
1. Verify cron service is running: `systemctl status cron`
2. Check cron logs: `grep warm_cache /var/log/syslog`
3. Test the script manually: `php warm_cache.php`

### Still Slow Loading
1. Check network latency to Substack: `curl -w "%{time_total}" https://charleswilke.substack.com/feed`
2. Verify gzip compression is working: `curl -H "Accept-Encoding: gzip" -v https://charleswilke.com/substack_feed.php`
3. Consider implementing a static JSON file approach for maximum speed
