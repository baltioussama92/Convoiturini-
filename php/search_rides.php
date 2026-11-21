<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$fromLat = numeric_field($_GET, 'from_lat', 30, 38);
$fromLng = numeric_field($_GET, 'from_lng', 7, 12);
$toLat = numeric_field($_GET, 'to_lat', 30, 38);
$toLng = numeric_field($_GET, 'to_lng', 7, 12);
$radiusKm = isset($_GET['radius_km']) ? numeric_field($_GET, 'radius_km', 0.1, 25) : 3.0;
$date = trim((string)($_GET['date'] ?? ''));
$seats = isset($_GET['seats']) ? (int)numeric_field($_GET, 'seats', 1, 8) : 1;
$maxPrice = isset($_GET['max_price']) ? numeric_field($_GET, 'max_price', 0, 9999.99) : null;
$gender = trim((string)($_GET['gender'] ?? ''));

if ($date !== '' && !valid_date($date)) {
    respond(['ok' => false, 'error' => 'invalid_date'], 422);
}
if ($gender !== '' && !in_array($gender, ['male', 'female', 'both'], true)) {
    respond(['ok' => false, 'error' => 'invalid_gender'], 422);
}

$latDelta = $radiusKm / 111.0;
$lngDelta = $radiusKm / (111.0 * max(cos(deg2rad($fromLat)), 0.2));
$toLatDelta = $radiusKm / 111.0;
$toLngDelta = $radiusKm / (111.0 * max(cos(deg2rad($toLat)), 0.2));
$distanceSql = '(6371 * 2 * ASIN(SQRT(
    POW(SIN(RADIANS(rp.lat - :lat) / 2), 2) +
    COS(RADIANS(:lat)) * COS(RADIANS(rp.lat)) *
    POW(SIN(RADIANS(rp.lng - :lng) / 2), 2)
)))';

$where = [
    "r.status = 'active'",
    'r.ride_date >= CURDATE()',
    'r.seats_left >= :seats',
    'EXISTS (
        SELECT 1 FROM ride_points dep
        WHERE dep.ride_id = r.id
          AND dep.lat BETWEEN :from_min_lat AND :from_max_lat
          AND dep.lng BETWEEN :from_min_lng AND :from_max_lng
          AND (6371 * 2 * ASIN(SQRT(
              POW(SIN(RADIANS(dep.lat - :from_lat_distance) / 2), 2) +
              COS(RADIANS(:from_lat_distance)) * COS(RADIANS(dep.lat)) *
              POW(SIN(RADIANS(dep.lng - :from_lng_distance) / 2), 2)
          ))) <= :radius_depart
    )',
    'EXISTS (
        SELECT 1 FROM ride_points dest
        WHERE dest.ride_id = r.id
          AND dest.lat BETWEEN :to_min_lat AND :to_max_lat
          AND dest.lng BETWEEN :to_min_lng AND :to_max_lng
          AND (6371 * 2 * ASIN(SQRT(
              POW(SIN(RADIANS(dest.lat - :to_lat_distance) / 2), 2) +
              COS(RADIANS(:to_lat_distance)) * COS(RADIANS(dest.lat)) *
              POW(SIN(RADIANS(dest.lng - :to_lng_distance) / 2), 2)
          ))) <= :radius_dest
    )',
    '(
        SELECT MIN(dep.point_order) FROM ride_points dep
        WHERE dep.ride_id = r.id AND dep.lat BETWEEN :from_min_order_lat AND :from_max_order_lat
          AND dep.lng BETWEEN :from_min_order_lng AND :from_max_order_lng
    ) < (
        SELECT MIN(dest.point_order) FROM ride_points dest
        WHERE dest.ride_id = r.id AND dest.lat BETWEEN :to_min_order_lat AND :to_max_order_lat
          AND dest.lng BETWEEN :to_min_order_lng AND :to_max_order_lng
    )',
];
$params = [
    'seats' => $seats,
    'from_min_lat' => $fromLat - $latDelta, 'from_max_lat' => $fromLat + $latDelta,
    'from_min_lng' => $fromLng - $lngDelta, 'from_max_lng' => $fromLng + $lngDelta,
    'to_min_lat' => $toLat - $toLatDelta, 'to_max_lat' => $toLat + $toLatDelta,
    'to_min_lng' => $toLng - $toLngDelta, 'to_max_lng' => $toLng + $toLngDelta,
    'from_lat_distance' => $fromLat, 'from_lng_distance' => $fromLng,
    'to_lat_distance' => $toLat, 'to_lng_distance' => $toLng,
    'radius_depart' => $radiusKm, 'radius_dest' => $radiusKm,
    'from_min_order_lat' => $fromLat - $latDelta, 'from_max_order_lat' => $fromLat + $latDelta,
    'from_min_order_lng' => $fromLng - $lngDelta, 'from_max_order_lng' => $fromLng + $lngDelta,
    'to_min_order_lat' => $toLat - $toLatDelta, 'to_max_order_lat' => $toLat + $toLatDelta,
    'to_min_order_lng' => $toLng - $toLngDelta, 'to_max_order_lng' => $toLng + $toLngDelta,
];
if ($date !== '') {
    $where[] = 'r.ride_date = :ride_date';
    $params['ride_date'] = $date;
}
if ($maxPrice !== null) {
    $where[] = 'r.price <= :max_price';
    $params['max_price'] = $maxPrice;
}
if ($gender !== '') {
    $where[] = '(r.gender_allowed = :gender OR r.gender_allowed = "both")';
    $params['gender'] = $gender;
}

$query = 'SELECT r.*, u.name AS driver_name,
                 (
                   SELECT MIN(dep.point_order) FROM ride_points dep
                   WHERE dep.ride_id = r.id
                 ) AS nearest_departure_order,
                 (
                   SELECT MIN(dest.point_order) FROM ride_points dest
                   WHERE dest.ride_id = r.id
                 ) AS nearest_destination_order
          FROM rides r JOIN users u ON u.id = r.user_id
          WHERE ' . implode(' AND ', $where) . '
          ORDER BY r.ride_date, r.ride_time, r.price';
$statement = $pdo->prepare($query);
foreach ($params as $key => $value) {
    $statement->bindValue(':' . $key, $value);
}
$statement->execute();
$rides = $statement->fetchAll();

$pointStatement = $pdo->prepare(
    'SELECT point_order, lat, lng FROM ride_points
     WHERE ride_id = :ride_id ORDER BY point_order'
);
foreach ($rides as &$ride) {
    $pointStatement->execute(['ride_id' => $ride['id']]);
    $ride['route_points'] = $pointStatement->fetchAll();
    $ride['match_type'] = ((int)$ride['nearest_departure_order'] === 1 ? 'starts_here' : 'passes_by');
}
unset($ride);
respond(['ok' => true, 'rides' => $rides, 'radius_km' => $radiusKm]);
