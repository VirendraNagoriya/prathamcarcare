<?php
/**
 * Local development helper (XAMPP): creates/resets the pratham_care database.
 * Usage:  php db/reset_db.php
 * It will DROP and recreate pratham_care — destructive, dev only.
 */
declare(strict_types=1);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$db   = 'pratham_care';

$pdo = new PDO(
    "mysql:host={$host};charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec("DROP DATABASE IF EXISTS `{$db}`");

foreach (['schema.sql', 'seed.sql'] as $file) {
    $sql = (string) file_get_contents(__DIR__ . '/' . $file);
    if ($sql === '') {
        throw new RuntimeException("Could not read {$file}");
    }
    $pdo->exec($sql);
}

$count = (int) $pdo->query('SELECT COUNT(*) FROM `pratham_care`.catalog')->fetchColumn();
$done  = (int) $pdo->query('SELECT COUNT(*) FROM `pratham_care`.settings WHERE id = 1')->fetchColumn();
echo "pratham_care reset OK. catalog rows: {$count}, settings rows: {$done}\n";