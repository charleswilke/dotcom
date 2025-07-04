<?php
header('Content-Type: application/json');
$data_file = 'snuggles_weight_data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    // Delete entry
    if (isset($input['delete']) && isset($input['date']) && isset($input['weight'])) {
        $data = file_exists($data_file) ? json_decode(file_get_contents($data_file), true) : [];
        $newData = array_filter($data, function($entry) use ($input) {
            return !($entry['date'] === $input['date'] && floatval($entry['weight']) == floatval($input['weight']));
        });
        $newData = array_values($newData); // reindex
        file_put_contents($data_file, json_encode($newData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        exit;
    }
    // Add entry
    if (!isset($input['date']) || !isset($input['weight'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing date or weight']);
        exit;
    }
    $entry = [
        'date' => $input['date'],
        'weight' => floatval($input['weight']),
        'notes' => isset($input['notes']) ? $input['notes'] : ''
    ];
    $data = file_exists($data_file) ? json_decode(file_get_contents($data_file), true) : [];
    $data[] = $entry;
    file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($data_file)) {
        $data = file_get_contents($data_file);
        echo $data;
    } else {
        echo json_encode([]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']); 