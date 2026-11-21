<?php
declare(strict_types=1);

$host = getenv('COVOITURINI_DB_HOST') ?: '127.0.0.1';
$database = getenv('COVOITURINI_DB_NAME') ?: 'covoiturini';
$username = getenv('COVOITURINI_DB_USER') ?: 'root';
$password = getenv('COVOITURINI_DB_PASSWORD') ?: '';

$dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'database_unavailable']);
    exit;
}
