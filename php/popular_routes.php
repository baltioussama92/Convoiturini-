<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_method('GET');

$limit = min(max((int)($_GET['limit'] ?? 6), 1), 20);
$statement = $pdo->prepare(
    'SELECT start_name, end_name, COUNT(*) AS ride_count,
            MIN(price) AS starting_price
     FROM rides
     WHERE status = "active" AND ride_date >= CURDATE()
     GROUP BY start_name, end_name
     ORDER BY ride_count DESC, starting_price ASC
     LIMIT :limit'
);
$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
$statement->execute();
respond(['ok' => true, 'routes' => $statement->fetchAll()]);
