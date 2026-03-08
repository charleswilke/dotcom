<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Config
$feedUrl = 'https://charleswilke.substack.com/feed';
$archiveApiBase = 'https://charleswilke.substack.com/api/v1/archive';
$altFeedUrl = 'https://rss.app/feeds/v1.1/_UNUSED.xml'; // Alternative if main RSS is limited
$limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 100;
$cacheFile = __DIR__ . '/cache_substack_feed_' . $limit . '.json';
$cacheTtl = 1800; // 30 minutes (optimized for freshness vs performance)
$noCache = isset($_GET['nocache']);

// Add proper HTTP caching headers for maximum performance
$cacheAge = 900; // 15 minutes browser cache (shorter for better freshness)
header("Cache-Control: public, max-age={$cacheAge}, stale-while-revalidate=1800, stale-if-error=3600");
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $cacheAge) . ' GMT');
header('Vary: Accept-Encoding'); // Important for compression

// Serve from cache if fresh (unless nocache query present)
if (!$noCache && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false) {
        // Add ETag for better caching
        $etag = '"' . md5($cached . filemtime($cacheFile)) . '"';
        header("ETag: $etag");
        
        // Check if client has cached version
        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
            http_response_code(304);
            exit;
        }
        
        // Add compression if supported
        if (isset($_SERVER['HTTP_ACCEPT_ENCODING']) && strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false) {
            header('Content-Encoding: gzip');
            echo gzencode($cached, 6);
        } else {
            echo $cached;
        }
        exit;
    }
}

// Fetch URL helper - optimized for performance
function fetch_url($url) {
    // Try cURL first if available
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15, // Increased timeout for reliability
            CURLOPT_CONNECTTIMEOUT => 5, // Connection timeout
            CURLOPT_USERAGENT => 'SubstackFeedFetcher/1.0 (+charleswilke.com)',
            CURLOPT_SSL_VERIFYPEER => true, // Enable SSL verification for production
            CURLOPT_SSL_VERIFYHOST => 2, // Enable hostname verification for production
            CURLOPT_ENCODING => '', // Enable all supported compression
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0, // Use HTTP/2 if available
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false || $code >= 400) {
            throw new Exception('Fetch error: ' . ($err ?: ('HTTP ' . $code)));
        }
        return $res;
    }
    
    // Fallback to file_get_contents with stream context
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10,
            'user_agent' => 'SubstackFeedFetcher/1.0 (+charleswilke.com)',
            'follow_location' => 1,
            'max_redirects' => 5
        ]
    ]);
    
    $res = @file_get_contents($url, false, $context);
    if ($res === false) {
        throw new Exception('Fetch error: Unable to retrieve URL');
    }
    return $res;
}

try {
    $items = [];

    // Focus on RSS feed since we know Substack APIs are limited
    // Will get ~20 articles which we'll load all at once

    // 1) Try the original archive API (likely to fail, but worth trying)
    if (count($items) === 0) {
        try {
            $offset = 0;
            $perPage = min(100, $limit);
            while (count($items) < $limit) {
                $apiUrl = $archiveApiBase . '?sort=new&offset=' . $offset . '&limit=' . $perPage;
                error_log("Attempting to fetch: " . $apiUrl);
                $jsonStr = fetch_url($apiUrl);
                $data = json_decode($jsonStr, true);
                error_log("Archive API response: " . substr($jsonStr, 0, 200) . "...");
                if (!is_array($data) || empty($data)) {
                    error_log("Archive API returned empty/invalid data, falling back to RSS");
                    break; // fall back to RSS
                }
                foreach ($data as $post) {
                    $title = isset($post['title']) ? (string)$post['title'] : '';
                    $link = isset($post['canonical_url']) ? (string)$post['canonical_url'] : (isset($post['url']) ? (string)$post['url'] : '');
                    $pubDate = '';
                    if (!empty($post['post_date'])) {
                        $ts = strtotime($post['post_date']);
                        if ($ts) $pubDate = date(DATE_RSS, $ts);
                    }
                    $desc = isset($post['subtitle']) ? (string)$post['subtitle'] : '';
                    $thumb = '';
                    if (!empty($post['cover_image'])) { $thumb = (string)$post['cover_image']; }
                    elseif (!empty($post['social_image'])) { $thumb = (string)$post['social_image']; }

                    // Extract categories/tags if available from API
                    $categories = [];
                    if (!empty($post['tags'])) {
                        $categories = is_array($post['tags']) ? $post['tags'] : [$post['tags']];
                    } elseif (!empty($post['category'])) {
                        $categories = is_array($post['category']) ? $post['category'] : [$post['categories']];
                    } elseif (!empty($post['categories'])) {
                        $categories = is_array($post['categories']) ? $post['categories'] : [$post['categories']];
                    }

                    $items[] = [
                        'title' => $title,
                        'link' => $link,
                        'pubDate' => $pubDate,
                        'description' => $desc,
                        'content' => $desc,
                        'thumbnail' => $thumb,
                        'categories' => $categories
                    ];
                    if (count($items) >= $limit) break 2;
                }
                if (count($data) < $perPage) break;
                $offset += $perPage;
            }
        } catch (Exception $e) {
            error_log("Archive API failed: " . $e->getMessage());
            // ignore and fall back to RSS
        }
    }

    // 2) Main approach: direct RSS parsing (~20 articles)
    if (count($items) === 0) {
        error_log("Using RSS fallback, expecting ~20 items max");
        $xmlString = fetch_url($feedUrl);
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($xmlString);
        if ($xml === false) {
            throw new Exception('Invalid XML');
        }
        $namespaces = $xml->getNamespaces(true);
        foreach ($xml->channel->item as $node) {
            $title = (string)$node->title;
            $link = (string)$node->link;
            $pubDate = (string)$node->pubDate;
            $description = (string)$node->description;
            $content = $description;
            if (isset($namespaces['content'])) {
                $contentNode = $node->children($namespaces['content']);
                if (isset($contentNode->encoded)) {
                    $content = (string)$contentNode->encoded;
                }
            }
            $thumb = '';
            if (preg_match('/<img[^>]+src="([^"]+)"/i', $content, $m)) {
                $thumb = $m[1];
            } elseif (preg_match('/<img[^>]+src="([^"]+)"/i', $description, $m2)) {
                $thumb = $m2[1];
            }
            // Extract categories from RSS feed
            $categories = [];
            if (isset($node->category)) {
                foreach ($node->category as $cat) {
                    $categories[] = (string)$cat;
                }
            }

            $items[] = [
                'title' => $title,
                'link' => $link,
                'pubDate' => $pubDate,
                'description' => $description,
                'content' => $content,
                'thumbnail' => $thumb,
                'categories' => $categories
            ];
            if (count($items) >= $limit) break;
        }
    }

    // Always sort newest-first so spotlight logic is deterministic across sources.
    usort($items, function($a, $b) {
        $aTime = isset($a['pubDate']) ? strtotime($a['pubDate']) : 0;
        $bTime = isset($b['pubDate']) ? strtotime($b['pubDate']) : 0;
        return $bTime <=> $aTime;
    });

    $items = array_slice($items, 0, $limit);
    $payload = json_encode(['status' => 'ok', 'items' => $items], JSON_UNESCAPED_SLASHES);
    
    // Cache the result
    @file_put_contents($cacheFile, $payload, LOCK_EX);
    
    // Add ETag for the new content
    $etag = '"' . md5($payload . time()) . '"';
    header("ETag: $etag");
    
    // Serve compressed if supported
    if (isset($_SERVER['HTTP_ACCEPT_ENCODING']) && strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false) {
        header('Content-Encoding: gzip');
        echo gzencode($payload, 6);
    } else {
        echo $payload;
    }
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}


