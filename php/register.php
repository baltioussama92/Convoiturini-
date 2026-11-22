<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

require_method('POST');
$data = input_data();
require_csrf($data);

$name = string_field($data, 'name', 120);
$nameLength = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
if ($nameLength < 2) {
    respond(['ok' => false, 'error' => 'invalid_name'], 422);
}
if (preg_match('/[<>]/', $name) || strip_tags($name) !== $name) {
    respond(['ok' => false, 'error' => 'invalid_name'], 422);
}
$email = filter_var(trim((string)($data['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$phone = string_field($data, 'phone', 20);
$gender = (string)($data['gender'] ?? '');
$password = (string)($data['password'] ?? '');
$passwordConfirm = (string)($data['password_confirm'] ?? '');

if ($email === false || strlen($email) > 190) {
    respond(['ok' => false, 'error' => 'invalid_email'], 422);
}
if (!valid_phone($phone)) {
    respond(['ok' => false, 'error' => 'invalid_phone'], 422);
}
if (!in_array($gender, ['male', 'female'], true)) {
    respond(['ok' => false, 'error' => 'invalid_gender'], 422);
}
if (strlen($password) < 8 || strlen($password) > 72) {
    respond(['ok' => false, 'error' => 'invalid_password'], 422);
}
if (!hash_equals($password, $passwordConfirm)) {
    respond(['ok' => false, 'error' => 'passwords_not_matching'], 422);
}

$statement = $pdo->prepare(
    'INSERT INTO users (name, phone, email, password_hash, gender)
     VALUES (:name, :phone, :email, :password_hash, :gender)'
);
try {
    $statement->execute([
        'name' => $name,
        'phone' => normalize_phone($phone),
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'gender' => $gender,
    ]);
} catch (PDOException $exception) {
    if ((int)$exception->errorInfo[1] === 1062) {
        respond(['ok' => false, 'error' => 'phone_or_email_already_exists'], 409);
    }
    throw $exception;
}

respond(['ok' => true, 'user_id' => (int)$pdo->lastInsertId()], 201);
