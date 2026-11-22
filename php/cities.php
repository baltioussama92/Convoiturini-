<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('GET');
$query = trim((string)($_GET['q'] ?? ''));
$lang = $_GET['lang'] ?? 'fr';
$lang = in_array($lang, ['fr', 'ar'], true) ? $lang : 'fr';

if ($query === '') {
    $statement = $pdo->query(
        'SELECT name_fr, name_ar, lat, lng
         FROM cities
         ORDER BY name_fr'
    );
    respond(['ok' => true, 'cities' => $statement->fetchAll()]);
}

$statement = $pdo->prepare(
    'SELECT name_fr, name_ar, lat, lng
     FROM cities
     WHERE name_fr LIKE :query OR name_ar LIKE :query
     ORDER BY name_fr
     LIMIT 5'
);
$statement->execute(['query' => '%' . $query . '%']);
respond(['ok' => true, 'cities' => $statement->fetchAll(), 'lang' => $lang]);
