<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('POST');
$userId = require_auth();
$data = input_data();
require_csrf($data);

$title = string_field($data, 'title', 180);
$startName = string_field($data, 'start_name', 120);
$endName = string_field($data, 'end_name', 120);
$rideDate = string_field($data, 'ride_date', 10);
$rideTime = string_field($data, 'ride_time', 8);
$phone = string_field($data, 'phone', 20);
$seatsTotal = (int)numeric_field($data, 'seats_total', 1, 8);
$seatsLeft = isset($data['seats_left']) ? (int)numeric_field($data, 'seats_left', 0, $seatsTotal) : $seatsTotal;
$price = numeric_field($data, 'price', 0, 9999.99);
$startLat = numeric_field($data, 'start_lat', 30, 38);
$startLng = numeric_field($data, 'start_lng', 7, 12);
$endLat = numeric_field($data, 'end_lat', 30, 38);
$endLng = numeric_field($data, 'end_lng', 7, 12);
$distance = numeric_field($data, 'distance_km', 0, 2000);
$duration = (int)numeric_field($data, 'duration_min', 0, 3000);
$genderAllowed = (string)($data['gender_allowed'] ?? 'both');
$isRecurring = !empty($data['is_recurring']) ? 1 : 0;
$points = route_points($data['route_points'] ?? []);

if (!valid_date($rideDate) || !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $rideTime)) {
    respond(['ok' => false, 'error' => 'invalid_schedule'], 422);
}
if (!valid_phone($phone)) {
    respond(['ok' => false, 'error' => 'invalid_phone'], 422);
}
if (!in_array($genderAllowed, ['male', 'female', 'both'], true)) {
    respond(['ok' => false, 'error' => 'invalid_gender_allowed'], 422);
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
        'price' => $price, 'gender_allowed' => $genderAllowed, 'phone' => $phone,
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

respond(['ok' => true, 'ride_id' => $rideId], 201);
