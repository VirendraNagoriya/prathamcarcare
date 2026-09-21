<?php
/**
 * One-time database installer for Hostinger.
 *
 * How to use:
 *   1. Upload this file to public_html/ so it sits NEXT TO the api/ folder (it reads
 *      api/config.php for the database credentials).
 *   2. Make sure public_html/api/config.php has APP_ENV = 'production' and your real
 *      Hostinger DB credentials (DB_NAME / DB_USER / DB_PASS).
 *   3. Open  https://yourdomain.com/install.php  once in a browser.
 *
 * It creates the tables + seed data (the same as db/schema.sql + db/seed.sql) in the
 * database named in api/config.php. It REFUSES to run if the database already has any
 * tables (nothing is ever dropped) and it deletes itself after a successful install.
 */
declare(strict_types=1);

function out(string $s): void
{
    echo htmlspecialchars($s) . "<br>\n";
}

$configFile = __DIR__ . '/api/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo 'install.php must be placed next to the api/ folder (upload it into public_html/). api/config.php was not found.';
    exit;
}
require_once $configFile;

if (APP_ENV !== 'production') {
    http_response_code(500);
    out('api/config.php is not in production mode yet.');
    out('Create api/config.local.php (copy api/config.local.example.php) and set  \'env\' => \'production\'  with your real DB credentials, then reload this page.');
    exit;
}

$placeholder = strpos(DB_USER, 'u000000000') !== false || strpos(DB_USER, 'placeholder') !== false;
if ($placeholder || DB_NAME === '' || DB_USER === '' || DB_PASS === '') {
    http_response_code(500);
    out('api/config.php is not ready yet.');
    out('Fill in your real Hostinger DB credentials (db_name, db_user, db_pass) in api/config.local.php, then reload this page.');
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    out('Could not connect to the MySQL database.');
    out('MySQL error: ' . $e->getMessage());
    out('Check db_host, db_name, db_user, db_pass in api/config.php.');
    exit;
}

$exists = (int) $pdo
    ->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ' . $pdo->quote(DB_NAME))
    ->fetchColumn();

if ($exists > 0) {
    out('The database "' . DB_NAME . '" already has tables — doing nothing. Nothing was changed or deleted.');
    out('If your app is already working, just delete this file. If the tables are incomplete, drop them in phpMyAdmin first, then reload this page.');
    exit;
}

$SCHEMA = <<<'SQL'
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  km_reading VARCHAR(20) DEFAULT NULL,
  next_service_km VARCHAR(20) DEFAULT NULL,
  next_service_date DATE DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_rate DECIMAL(10,2) NOT NULL,
  charged_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT NOT NULL PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL DEFAULT 'Pratham Car Care',
  shop_phone VARCHAR(20) NOT NULL DEFAULT '',
  google_place_id VARCHAR(255) NOT NULL DEFAULT '',
  reminder_days_before INT NOT NULL DEFAULT 3,
  pin_hash VARCHAR(255) NOT NULL,
  pin_changed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reminder_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

$SEED = <<<'SQL'
INSERT INTO catalog (name, price, sort_order) VALUES
('Engine Oil', 0.00, 1),
('Oil Filter', 0.00, 2),
('Oil Flush', 0.00, 3),
('Oil Treatment', 0.00, 4),
('Coolant', 0.00, 5),
('Gear Oil', 0.00, 6),
('Throttle Body Cleaning', 0.00, 7),
('Injector Cleaning', 0.00, 8),
('Brake Oil', 0.00, 9),
('Brake Cleaning', 0.00, 10),
('Brake Pad', 0.00, 11),
('Brake Liner', 0.00, 12),
('Brake Wheel Cylinder', 0.00, 13),
('Disk Cutting', 0.00, 14),
('Drum Cutting', 0.00, 15),
('Servicing', 0.00, 16),
('Washing & Cleaning', 0.00, 17),
('Brake Booster', 0.00, 18),
('Master Cylinder', 0.00, 19),
('Clutch Set', 0.00, 20),
('Clutch Bearing', 0.00, 21),
('Fly Wheel', 0.00, 22),
('Clutch Labor Charge', 0.00, 23),
('Head Repairing', 0.00, 24),
('Block Repairing', 0.00, 25),
('Piston Ring', 0.00, 26),
('Head Gasket', 0.00, 27),
('Packing Set', 0.00, 28),
('Oil Seal', 0.00, 29),
('Oil Pump', 0.00, 30),
('Water Pump', 0.00, 31),
('Boss Pump', 0.00, 32),
('Wheel Bearing', 0.00, 33),
('Head Light', 0.00, 34);

INSERT INTO settings (id, app_name, shop_phone, google_place_id, pin_hash)
VALUES (1, 'Pratham Car Care', '9011560540', 'YOUR_PLACE_ID', '$2y$10$8Y.p4HUimBRlTQ30.I6mZuEJ7LEKrsK.awxkGRUAKcMzbInbvYRUy')
ON DUPLICATE KEY UPDATE id = id;
SQL;

function exec_script(PDO $pdo, string $sql): void
{
    $stmts = [];
    $buffer = '';
    foreach (preg_split('/\R/', $sql) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '--')) {
            continue;
        }
        $buffer .= $line . "\n";
        if (str_ends_with($buffer, ";\n")) {
            $stmts[] = rtrim($buffer, ";\n");
            $buffer = '';
        }
    }
    if (trim($buffer) !== '') {
        $stmts[] = trim($buffer);
    }
    foreach ($stmts as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '') {
            continue;
        }
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            http_response_code(500);
            out('Failed while running: ' . $stmt);
            out('MySQL error: ' . $e->getMessage());
            exit;
        }
    }
}

try {
    exec_script($pdo, $SCHEMA);
    exec_script($pdo, $SEED);
} catch (Throwable $e) {
    http_response_code(500);
    out('Setup failed unexpectedly: ' . $e->getMessage());
    exit;
}

$tables = (int) $pdo
    ->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ' . $pdo->quote(DB_NAME))
    ->fetchColumn();
$catalog = (int) $pdo->query('SELECT COUNT(*) FROM catalog')->fetchColumn();
$settings = (int) $pdo->query('SELECT COUNT(*) FROM settings WHERE id = 1')->fetchColumn();

echo '<h3>Pratham Car Care — database install</h3>';
if ($tables >= 8 && $catalog === 34 && $settings === 1) {
    out('Database "' . DB_NAME . '" installed successfully.');
    out("- Tables created: {$tables}");
    out("- Catalog items seeded: {$catalog}");
    out('- Settings row created (app name, shop phone, default PIN 1234).');
    out('Your app is ready. Log in at the site root with PIN 1234, then set your prices in Products.');
} else {
    http_response_code(500);
    out('Install finished but verification did not match expectations.');
    out("Tables: {$tables} (expected 8), catalog: {$catalog} (expected 34), settings: {$settings} (expected 1).");
    out('Please drop the database tables in phpMyAdmin and reload this page to retry.');
    exit;
}

// Outer $pdo is destroyed before unlink() so MySQL has no open file handles on this script.
$pdo = null;

if (@unlink(__FILE__)) {
    out('<b>install.php has deleted itself. Nothing more to do.</b>');
} else {
    out('<b>install.php could not delete itself — please remove it from public_html/ via File Manager.</b>');
}