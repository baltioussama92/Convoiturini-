<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_method('GET');
$userId = require_auth();

$statement = $pdo->prepare(
    'SELECT r.id, r.title, r.start_name, r.end_name, r.ride_date, r.ride_time,
            r.seats_total, r.seats_left, r.price, r.status, r.created_at
     FROM rides r
     WHERE r.user_id = :user_id
     ORDER BY r.ride_date DESC, r.ride_time DESC'
);
$statement->execute(['user_id' => $userId]);
respond(['ok' => true, 'rides' => $statement->fetchAll()]);
