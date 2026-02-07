<?php
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Basic origin check - only allow requests from the same domain
$allowedOrigins = ['https://charleswilke.com', 'http://charleswilke.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && !in_array($origin, $allowedOrigins)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

// Simple rate limiting via session
session_start();
$now = time();
$cooldown = 60; // 1 minute between submissions
if (isset($_SESSION['last_email_time']) && ($now - $_SESSION['last_email_time']) < $cooldown) {
    echo json_encode(['success' => false, 'message' => 'Please wait a minute before sending another message.']);
    exit;
}

// Get form data
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$message = $_POST['message'] ?? '';

// Validate inputs
if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address']);
    exit;
}

// Sanitize inputs to prevent header injection
$name = str_replace(["\r", "\n", "%0a", "%0d"], '', $name);
$email = str_replace(["\r", "\n", "%0a", "%0d"], '', $email);

// Email settings
$to = "cwilke.inquiry@gmail.com";
$subject = "New Contact Form Submission from $name";
$fromDomain = 'no-reply@charleswilke.com';
$headers = "From: $fromDomain\r\n"; // Use domain sender to avoid spoofing
$headers .= "Reply-To: $email\r\n"; // Keep user's email for replies
$headers .= "X-Mailer: PHP/" . phpversion();

// Format message
$emailBody = "Name: $name\n";
$emailBody .= "Email: $email\n\n";
$emailBody .= "Message:\n$message";

// Send email
$mailSent = mail($to, $subject, $emailBody, $headers);

if ($mailSent) {
    $_SESSION['last_email_time'] = $now;
    echo json_encode(['success' => true, 'message' => 'Thank you for your message. I will get back to you soon!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Sorry, there was an error sending your message. Please try again later.']);
}
?>
