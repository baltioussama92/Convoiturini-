<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_method('GET');
$userId = require_auth();

$statement = $pdo->prepare(
    'SELECT id, name, phone, email, gender, created_at
     FROM users WHERE id = :id LIMIT 1'
);
$statement->execute(['id' => $userId]);
$user = $statement->fetch();
if (!$user) {
    respond(['ok' => false, 'error' => 'user_not_found'], 404);
}
respond(['ok' => true, 'user' => $user]);
