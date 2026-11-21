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

$statement = $pdo->prepare('DELETE FROM rides WHERE id = :id AND user_id = :user_id');
$statement->execute(['id' => $rideId, 'user_id' => $userId]);
if ($statement->rowCount() === 0) {
    respond(['ok' => false, 'error' => 'ride_not_found_or_not_owner'], 404);
}
respond(['ok' => true]);
