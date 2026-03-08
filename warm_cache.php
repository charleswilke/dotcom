<?php
/**
 * Cache warming script for RSS feed
 * This script should be run via cron every 30 minutes to keep the cache warm
 * 
 * Usage:
 * php warm_cache.php
 * 
 * Or via cron:
 * 0,30 * * * * /usr/bin/php /path/to/your/site/warm_cache.php >/dev/null 2>&1
 */

// Prevent web access
if (isset($_SERVER['HTTP_HOST'])) {
    http_response_code(403);
    die('Access denied');
}

// Set working directory to script location
chdir(__DIR__);

echo "[" . date('Y-m-d H:i:s') . "] Starting cache warm-up...\n";

// Determine the URL to warm cache
$baseUrl = 'https://charleswilke.com'; // Change this to your domain
if (isset($_SERVER['HTTP_HOST'])) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'];
}

$url = $baseUrl . '/substack_feed.php?limit=19';
echo "[INFO] Warming cache for: $url\n";

// Use cURL if available, otherwise file_get_contents
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'CacheWarmer/1.0',
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false, // For localhost
    ]);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($result === false || $httpCode >= 400) {
        echo "[ERROR] Failed to warm cache: HTTP $httpCode - $error\n";
        exit(1);
    }
} else {
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'CacheWarmer/1.0'
        ]
    ]);
    $result = @file_get_contents($url, false, $context);
    
    if ($result === false) {
        echo "[ERROR] Failed to warm cache using file_get_contents\n";
        exit(1);
    }
}

// Validate the response
$data = json_decode($result, true);
if (!$data || $data['status'] !== 'ok' || !isset($data['items'])) {
    echo "[ERROR] Invalid response from cache endpoint\n";
    exit(1);
}

$itemCount = count($data['items']);
echo "[SUCCESS] Cache warmed successfully - loaded $itemCount items\n";

// Check cache file exists and is recent
$cacheFile = __DIR__ . '/cache_substack_feed.json';
if (file_exists($cacheFile)) {
    $cacheAge = time() - filemtime($cacheFile);
    echo "[INFO] Cache file age: {$cacheAge} seconds\n";
} else {
    echo "[WARNING] Cache file not found at: $cacheFile\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Cache warm-up completed\n";
