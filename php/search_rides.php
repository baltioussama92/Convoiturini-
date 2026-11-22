<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$fromLat = numeric_field($_GET, 'from_lat', 29.8, 37.7);
$fromLng = numeric_field($_GET, 'from_lng', 7.3, 11.8);
$toLat = numeric_field($_GET, 'to_lat', 29.8, 37.7);
$toLng = numeric_field($_GET, 'to_lng', 7.3, 11.8);
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

$formatCoord = static fn(float $value): string => number_format($value, 6, '.', '');
$fromLatSql = $formatCoord($fromLat);
$fromLngSql = $formatCoord($fromLng);
$toLatSql = $formatCoord($toLat);
$toLngSql = $formatCoord($toLng);
$radiusSql = $formatCoord($radiusKm);
$latDelta = $radiusKm / 111.0;
$fromLngDelta = $radiusKm / (111.0 * max(cos(deg2rad($fromLat)), 0.2));
$toLngDelta = $radiusKm / (111.0 * max(cos(deg2rad($toLat)), 0.2));

$departureDistance = "(6371 * 2 * ASIN(SQRT(POW(SIN(RADIANS(dep.lat - {$fromLatSql}) / 2), 2) + COS(RADIANS({$fromLatSql})) * COS(RADIANS(dep.lat)) * POW(SIN(RADIANS(dep.lng - {$fromLngSql}) / 2), 2))))";
$destinationDistance = "(6371 * 2 * ASIN(SQRT(POW(SIN(RADIANS(dest.lat - {$toLatSql}) / 2), 2) + COS(RADIANS({$toLatSql})) * COS(RADIANS(dest.lat)) * POW(SIN(RADIANS(dest.lng - {$toLngSql}) / 2), 2))))";

$where = [
    "r.status = 'active'",
    'r.ride_date >= CURDATE()',
    'r.seats_left >= :seats',
    "EXISTS (SELECT 1 FROM ride_points dep WHERE dep.ride_id = r.id AND dep.lat BETWEEN " . $formatCoord($fromLat - $latDelta) . " AND " . $formatCoord($fromLat + $latDelta) . " AND dep.lng BETWEEN " . $formatCoord($fromLng - $fromLngDelta) . " AND " . $formatCoord($fromLng + $fromLngDelta) . " AND {$departureDistance} <= {$radiusSql})",
    "EXISTS (SELECT 1 FROM ride_points dest WHERE dest.ride_id = r.id AND dest.lat BETWEEN " . $formatCoord($toLat - $latDelta) . " AND " . $formatCoord($toLat + $latDelta) . " AND dest.lng BETWEEN " . $formatCoord($toLng - $toLngDelta) . " AND " . $formatCoord($toLng + $toLngDelta) . " AND {$destinationDistance} <= {$radiusSql})",
    "(SELECT dep.point_order FROM ride_points dep WHERE dep.ride_id = r.id AND {$departureDistance} <= {$radiusSql} ORDER BY {$departureDistance} ASC LIMIT 1) < (SELECT dest.point_order FROM ride_points dest WHERE dest.ride_id = r.id AND {$destinationDistance} <= {$radiusSql} ORDER BY {$destinationDistance} ASC LIMIT 1)",
];
$params = ['seats' => $seats];

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

$nearestDeparture = "(SELECT dep.point_order FROM ride_points dep WHERE dep.ride_id = r.id AND {$departureDistance} <= {$radiusSql} ORDER BY {$departureDistance} ASC LIMIT 1)";
$nearestDestination = "(SELECT dest.point_order FROM ride_points dest WHERE dest.ride_id = r.id AND {$destinationDistance} <= {$radiusSql} ORDER BY {$destinationDistance} ASC LIMIT 1)";
$query = "SELECT r.*, u.name AS driver_name,
                 {$nearestDeparture} AS nearest_departure_order,
                 {$nearestDestination} AS nearest_destination_order
          FROM rides r JOIN users u ON u.id = r.user_id
          WHERE " . implode(' AND ', $where) . '
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
    $maxOrder = $ride['route_points'] ? (int)max(array_column($ride['route_points'], 'point_order')) : 0;
    $departureOrder = (int)$ride['nearest_departure_order'];
    $destinationOrder = (int)$ride['nearest_destination_order'];
    $ride['match_type'] = $departureOrder === 1
        ? 'starts_here'
        : ($destinationOrder === $maxOrder ? 'ends_here' : 'passes_by');
}
unset($ride);

respond(['ok' => true, 'rides' => $rides, 'radius_km' => $radiusKm]);
