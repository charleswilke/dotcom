<?php
header('Content-Type: application/json');

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

// Email settings
$to = "your-email@example.com"; // Replace with your email address
$subject = "New Contact Form Submission from $name";
$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Format message
$emailBody = "Name: $name\n";
$emailBody .= "Email: $email\n\n";
$emailBody .= "Message:\n$message";

// Send email
$mailSent = mail($to, $subject, $emailBody, $headers);

if ($mailSent) {
    echo json_encode(['success' => true, 'message' => 'Thank you for your message. I will get back to you soon!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Sorry, there was an error sending your message. Please try again later.']);
}
?> 