<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$rideId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$rideId || $rideId < 1) {
    respond(['ok' => false, 'error' => 'invalid_ride_id'], 422);
}

$statement = $pdo->prepare(
    'SELECT r.*, u.name AS driver_name, u.email AS driver_email, u.gender AS driver_gender
     FROM rides r JOIN users u ON u.id = r.user_id WHERE r.id = :id LIMIT 1'
);
$statement->execute(['id' => $rideId]);
$ride = $statement->fetch();
if (!$ride) {
    respond(['ok' => false, 'error' => 'ride_not_found'], 404);
}

$points = $pdo->prepare(
    'SELECT point_order, lat, lng FROM ride_points
     WHERE ride_id = :ride_id ORDER BY point_order'
);
$points->execute(['ride_id' => $rideId]);
$ride['route_points'] = $points->fetchAll();
respond(['ok' => true, 'ride' => $ride]);
