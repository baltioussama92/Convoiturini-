<?php
declare(strict_types=1);

session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

function input_data(): array
{
    $raw = file_get_contents('php://input');
    if ($raw !== false && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    return $_POST;
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    $escape = function ($value) use (&$escape) {
        if (is_string($value)) {
            return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }
        if (is_array($value)) {
            return array_map($escape, $value);
        }
        return $value;
    };
    echo json_encode($escape($payload), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        respond(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function require_csrf(array $data): void
{
    $provided = (string)($data['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals(csrf_token(), $provided)) {
        respond(['ok' => false, 'error' => 'invalid_csrf_token'], 419);
    }
}

function current_user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function require_auth(): int
{
    $userId = current_user_id();
    if ($userId === null) {
        respond(['ok' => false, 'error' => 'authentication_required'], 401);
    }

    return $userId;
}

function string_field(array $data, string $key, int $maxLength = 255): string
{
    $value = trim((string)($data[$key] ?? ''));
    if ($value === '' || strlen($value) > $maxLength) {
        respond(['ok' => false, 'error' => 'invalid_' . $key], 422);
    }

    return $value;
}

function valid_phone(string $phone): bool
{
    return (bool)preg_match('/^(?:\+216\s?)?\d{8}$/', $phone);
}

function valid_date(string $date): bool
{
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed !== false && $parsed->format('Y-m-d') === $date
        && $parsed >= new DateTimeImmutable('today');
}

function numeric_field(array $data, string $key, float $min, float $max): float
{
    if (!isset($data[$key]) || !is_numeric($data[$key])) {
        respond(['ok' => false, 'error' => 'invalid_' . $key], 422);
    }

    $value = (float)$data[$key];
    if ($value < $min || $value > $max) {
        respond(['ok' => false, 'error' => 'invalid_' . $key], 422);
    }

    return $value;
}

function route_points(array $value): array
{
    if (count($value) < 2 || count($value) > 500) {
        respond(['ok' => false, 'error' => 'invalid_route_points'], 422);
    }

    $points = [];
    foreach (array_values($value) as $index => $point) {
        if (!is_array($point) || !isset($point['lat'], $point['lng'])
            || !is_numeric($point['lat']) || !is_numeric($point['lng'])) {
            respond(['ok' => false, 'error' => 'invalid_route_point'], 422);
        }

        $lat = (float)$point['lat'];
        $lng = (float)$point['lng'];
        if ($lat < 29.8 || $lat > 37.7 || $lng < 7.3 || $lng > 11.8) {
            respond(['ok' => false, 'error' => 'route_point_outside_tunisia'], 422);
        }
        $points[] = ['order' => $index + 1, 'lat' => $lat, 'lng' => $lng];
    }

    return $points;
}
