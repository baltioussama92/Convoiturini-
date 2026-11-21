<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('POST');
$data = input_data();
require_csrf($data);

$now = time();
$attempts = $_SESSION['login_attempts'] ?? ['started' => $now, 'count' => 0];
if ($now - (int)$attempts['started'] > 900) {
    $attempts = ['started' => $now, 'count' => 0];
}
if ((int)$attempts['count'] >= 8) {
    respond(['ok' => false, 'error' => 'too_many_login_attempts'], 429);
}

$identifier = trim((string)($data['identifier'] ?? $data['email'] ?? ''));
$password = (string)($data['password'] ?? '');
if ($identifier === '' || $password === '') {
    respond(['ok' => false, 'error' => 'credentials_required'], 422);
}

$statement = $pdo->prepare(
    'SELECT id, name, email, phone, password_hash, gender
     FROM users WHERE email = :identifier OR phone = :identifier LIMIT 1'
);
$statement->execute(['identifier' => $identifier]);
$user = $statement->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    $attempts['count']++;
    $_SESSION['login_attempts'] = $attempts;
    respond(['ok' => false, 'error' => 'invalid_credentials'], 401);
}

unset($_SESSION['login_attempts']);
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
unset($user['password_hash']);
respond(['ok' => true, 'user' => $user, 'csrf_token' => csrf_token()]);
