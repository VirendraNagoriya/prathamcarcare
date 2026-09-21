<?php
/**
 * Non-destructive migration: adds next_service_date to invoices + reminder_log table.
 * Usage:  php db/migrate_reminder.php
 */
declare(strict_types=1);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$db   = 'pratham_care';

$pdo = new PDO(
    "mysql:host={$host};dbname={$db};charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$col = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = {$pdo->quote($db)} AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'next_service_date'"
)->fetchColumn();

if ((int) $col === 0) {
    $pdo->exec('ALTER TABLE invoices ADD COLUMN next_service_date DATE DEFAULT NULL AFTER next_service_km');
    echo "Added invoices.next_service_date\n";
} else {
    echo "invoices.next_service_date already exists\n";
}

$tbl = $pdo->query(
    "SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = {$pdo->quote($db)} AND TABLE_NAME = 'reminder_log'"
)->fetchColumn();

if ((int) $tbl === 0) {
    $pdo->exec(
        'CREATE TABLE reminder_log (
           id INT AUTO_INCREMENT PRIMARY KEY,
           invoice_id INT NOT NULL,
           vehicle_id INT NOT NULL,
           sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
           FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
           INDEX idx_invoice (invoice_id)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    echo "Created reminder_log\n";
} else {
    echo "reminder_log already exists\n";
}

echo "Migration done.\n";