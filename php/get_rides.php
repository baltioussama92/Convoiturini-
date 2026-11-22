<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$date = trim((string)($_GET['date'] ?? ''));
$limit = min(max((int)($_GET['limit'] ?? 50), 1), 100);
$offset = max((int)($_GET['offset'] ?? 0), 0);

$where = ["r.status = 'active'", 'r.ride_date >= CURDATE()'];
$params = [];
if ($date !== '') {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        respond(['ok' => false, 'error' => 'invalid_date'], 422);
    }
    $where[] = 'r.ride_date = :ride_date';
    $params['ride_date'] = $date;
}

$query = 'SELECT r.id, r.title, r.start_name, r.start_lat, r.start_lng,
                 r.end_name, r.end_lat, r.end_lng, r.ride_date, r.ride_time,
                 r.seats_total, r.seats_left, r.price, r.gender_allowed,
                 r.distance_km, r.duration_min, u.name AS driver_name
          FROM rides r JOIN users u ON u.id = r.user_id
          WHERE ' . implode(' AND ', $where) . '
          ORDER BY r.ride_date, r.ride_time, r.price
          LIMIT :limit OFFSET :offset';
$statement = $pdo->prepare($query);
foreach ($params as $key => $value) {
    $statement->bindValue(':' . $key, $value);
}
$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
$statement->bindValue(':offset', $offset, PDO::PARAM_INT);
$statement->execute();
$rides = $statement->fetchAll();

$pointStatement = $pdo->prepare(
    'SELECT point_order, lat, lng FROM ride_points
     WHERE ride_id = :ride_id ORDER BY point_order'
);
foreach ($rides as &$ride) {
    $pointStatement->execute(['ride_id' => $ride['id']]);
    $ride['route_points'] = $pointStatement->fetchAll();
}
unset($ride);
respond(['ok' => true, 'rides' => $rides]);
