<?php
header('Content-Type: application/json');

// Config
$feedUrl = 'https://charleswilke.substack.com/feed';
$archiveApiBase = 'https://charleswilke.substack.com/api/v1/archive';
$limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 100;
$cacheFile = __DIR__ . '/cache_substack_feed.json';
$cacheTtl = 1800; // 30 minutes

// Serve from cache if fresh
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false) {
        echo $cached;
        exit;
    }
}

// Fetch URL helper
function fetch_url($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'SubstackFeedFetcher/1.0 (+charleswilke.com)'
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

try {
    $items = [];

    // 1) Try Substack archive API for deep history (server-side, no CORS issues)
    try {
        $offset = 0;
        $perPage = min(100, $limit);
        while (count($items) < $limit) {
            $apiUrl = $archiveApiBase . '?sort=new&offset=' . $offset . '&limit=' . $perPage;
            $jsonStr = fetch_url($apiUrl);
            $data = json_decode($jsonStr, true);
            if (!is_array($data) || empty($data)) {
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

                $items[] = [
                    'title' => $title,
                    'link' => $link,
                    'pubDate' => $pubDate,
                    'description' => $desc,
                    'content' => $desc,
                    'thumbnail' => $thumb
                ];
                if (count($items) >= $limit) break 2;
            }
            if (count($data) < $perPage) break;
            $offset += $perPage;
        }
    } catch (Exception $e) {
        // ignore and fall back to RSS
    }

    // 2) Fallback to RSS (usually exposes only ~20)
    if (count($items) === 0) {
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
            $items[] = [
                'title' => $title,
                'link' => $link,
                'pubDate' => $pubDate,
                'description' => $description,
                'content' => $content,
                'thumbnail' => $thumb
            ];
            if (count($items) >= $limit) break;
        }
    }

    $payload = json_encode(['status' => 'ok', 'items' => $items]);
    // Cache
    @file_put_contents($cacheFile, $payload);
    echo $payload;
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}


