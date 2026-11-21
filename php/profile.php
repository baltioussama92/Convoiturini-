<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$userId = require_auth();

$userStatement = $pdo->prepare(
    'SELECT id, name, email, phone, gender, created_at
     FROM users WHERE id = :id LIMIT 1'
);
$userStatement->execute(['id' => $userId]);
$user = $userStatement->fetch();
if (!$user) {
    respond(['ok' => false, 'error' => 'user_not_found'], 404);
}

$rideStatement = $pdo->prepare(
    'SELECT id, title, start_name, end_name, ride_date, ride_time,
            seats_total, seats_left, price, status, created_at
     FROM rides WHERE user_id = :user_id
     ORDER BY ride_date DESC, ride_time DESC'
);
$rideStatement->execute(['user_id' => $userId]);
$rides = $rideStatement->fetchAll();

respond(['ok' => true, 'user' => $user, 'rides' => $rides]);
