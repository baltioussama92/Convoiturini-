<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('POST');
$userId = require_auth();
$data = input_data();
require_csrf($data);
$rideId = filter_var($data['ride_id'] ?? null, FILTER_VALIDATE_INT);
if (!$rideId || $rideId < 1) {
    respond(['ok' => false, 'error' => 'invalid_ride_id'], 422);
}

$ownerStatement = $pdo->prepare('SELECT user_id FROM rides WHERE id = :id LIMIT 1');
$ownerStatement->execute(['id' => $rideId]);
$owner = $ownerStatement->fetch();
if (!$owner) {
    respond(['ok' => false, 'error' => 'ride_not_found'], 404);
}
if ((int)$owner['user_id'] !== $userId) {
    respond(['ok' => false, 'error' => 'forbidden'], 403);
}
$statement = $pdo->prepare('DELETE FROM rides WHERE id = :id');
$statement->execute(['id' => $rideId]);
respond(['ok' => true]);
