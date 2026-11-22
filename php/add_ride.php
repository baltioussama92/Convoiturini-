<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('POST');
$userId = require_auth();
$data = input_data();
require_csrf($data);

$title = string_field($data, 'title', 100);
$titleLength = function_exists('mb_strlen') ? mb_strlen($title) : strlen($title);
if ($titleLength < 3 || preg_match('/[<>\"]/', $title) || strip_tags($title) !== $title) {
    respond(['ok' => false, 'error' => 'invalid_title'], 422);
}
$startName = string_field($data, 'start_name', 120);
$endName = string_field($data, 'end_name', 120);
$rideDate = string_field($data, 'ride_date', 10);
$rideTime = string_field($data, 'ride_time', 8);
$phone = string_field($data, 'phone', 20);
$seatsTotal = integer_field($data, 'seats_total', 1, 8);
$seatsLeft = isset($data['seats_left']) ? integer_field($data, 'seats_left', 0, $seatsTotal) : $seatsTotal;
if ($seatsLeft !== $seatsTotal) {
    respond(['ok' => false, 'error' => 'seats_left_must_equal_total'], 422);
}
$price = decimal_field($data, 'price', 0, 9999.99);
$startLat = numeric_field($data, 'start_lat', 29.8, 37.7);
$startLng = numeric_field($data, 'start_lng', 7.3, 11.8);
$endLat = numeric_field($data, 'end_lat', 29.8, 37.7);
$endLng = numeric_field($data, 'end_lng', 7.3, 11.8);
$distance = numeric_field($data, 'distance_km', 0.1, 2000);
$duration = integer_field($data, 'duration_min', 1, 3000);
$genderAllowed = (string)($data['gender_allowed'] ?? 'both');
$isRecurring = !empty($data['is_recurring']) ? 1 : 0;
$points = route_points($data['route_points'] ?? []);

$publishKey = trim((string)($data['publish_key'] ?? ''));
if ($publishKey === '' || strlen($publishKey) > 100) {
    respond(['ok' => false, 'error' => 'invalid_publish_key'], 422);
}
$payloadForHash = $data;
unset($payloadForHash['csrf_token'], $payloadForHash['publish_key']);
$payloadHash = hash('sha256', json_encode($payloadForHash));
$lastPublish = $_SESSION['last_ride_publish'] ?? null;
if (is_array($lastPublish)
    && ($lastPublish['hash'] ?? '') === $payloadHash
    && time() - (int)($lastPublish['time'] ?? 0) < 30) {
    respond(['ok' => true, 'ride_id' => (int)$lastPublish['ride_id'], 'duplicate' => true], 200);
}

if (!valid_date($rideDate) || !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/', $rideTime)) {
    respond(['ok' => false, 'error' => 'invalid_schedule'], 422);
}
if ($rideDate === (new DateTimeImmutable('today'))->format('Y-m-d')
    && strtotime($rideDate . ' ' . substr($rideTime, 0, 5)) <= time()) {
    respond(['ok' => false, 'error' => 'ride_time_in_the_past'], 422);
}
if (abs($startLat - $endLat) < 0.000001 && abs($startLng - $endLng) < 0.000001) {
    respond(['ok' => false, 'error' => 'start_destination_must_differ'], 422);
}
if (!valid_phone($phone)) {
    respond(['ok' => false, 'error' => 'invalid_phone'], 422);
}
if (count($points) < 30 || count($points) > 40) {
    respond(['ok' => false, 'error' => 'route_points_must_be_30_to_40'], 422);
}
if (abs($points[0]['lat'] - $startLat) > 0.01 || abs($points[0]['lng'] - $startLng) > 0.01
    || abs($points[count($points) - 1]['lat'] - $endLat) > 0.01
    || abs($points[count($points) - 1]['lng'] - $endLng) > 0.01) {
    respond(['ok' => false, 'error' => 'route_points_do_not_match_locations'], 422);
}
if (!in_array($genderAllowed, ['male', 'female', 'both'], true)) {
    respond(['ok' => false, 'error' => 'invalid_gender_allowed'], 422);
}
if (preg_match('/[<>\"]/', $startName) || preg_match('/[<>\"]/', $endName)) {
    respond(['ok' => false, 'error' => 'invalid_location_name'], 422);
}

$pdo->beginTransaction();
try {
    $rideStatement = $pdo->prepare(
        'INSERT INTO rides
         (user_id, title, start_name, start_lat, start_lng, end_name, end_lat, end_lng,
          ride_date, ride_time, seats_total, seats_left, price, gender_allowed, phone,
          distance_km, duration_min, is_recurring, status)
         VALUES
         (:user_id, :title, :start_name, :start_lat, :start_lng, :end_name, :end_lat, :end_lng,
          :ride_date, :ride_time, :seats_total, :seats_left, :price, :gender_allowed, :phone,
          :distance_km, :duration_min, :is_recurring, :status)'
    );
    $rideStatement->execute([
        'user_id' => $userId, 'title' => $title, 'start_name' => $startName,
        'start_lat' => $startLat, 'start_lng' => $startLng, 'end_name' => $endName,
        'end_lat' => $endLat, 'end_lng' => $endLng, 'ride_date' => $rideDate,
        'ride_time' => $rideTime, 'seats_total' => $seatsTotal, 'seats_left' => $seatsLeft,
        'price' => $price, 'gender_allowed' => $genderAllowed, 'phone' => normalize_phone($phone),
        'distance_km' => $distance, 'duration_min' => $duration,
        'is_recurring' => $isRecurring, 'status' => $seatsLeft > 0 ? 'active' : 'full',
    ]);
    $rideId = (int)$pdo->lastInsertId();
    $pointStatement = $pdo->prepare(
        'INSERT INTO ride_points (ride_id, point_order, lat, lng)
         VALUES (:ride_id, :point_order, :lat, :lng)'
    );
    foreach ($points as $point) {
        $pointStatement->execute([
            'ride_id' => $rideId, 'point_order' => $point['order'],
            'lat' => $point['lat'], 'lng' => $point['lng'],
        ]);
    }
    $pdo->commit();
} catch (Throwable $exception) {
    $pdo->rollBack();
    throw $exception;
}

$_SESSION['last_ride_publish'] = [
    'hash' => $payloadHash,
    'time' => time(),
    'ride_id' => $rideId,
];

respond(['ok' => true, 'ride_id' => $rideId], 201);
