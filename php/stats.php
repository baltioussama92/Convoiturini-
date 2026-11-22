<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_method('GET');

$stats = $pdo->query(
    'SELECT
       COUNT(*) AS rides_published,
       COALESCE(SUM(seats_total), 0) AS seats_shared
     FROM rides
     WHERE status IN ("active", "full", "done")'
)->fetch();
$cityCount = (int)$pdo->query('SELECT COUNT(*) FROM cities')->fetchColumn();

respond([
    'ok' => true,
    'stats' => [
        'rides_published' => (int)$stats['rides_published'],
        'cities_covered' => $cityCount,
        'seats_shared' => (int)$stats['seats_shared'],
    ],
]);
