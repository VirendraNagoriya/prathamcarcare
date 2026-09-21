<?php
/**
 * Backend configuration (template).
 * Copy this file to the server as public_html/api/config.php and edit the values.
 */
declare(strict_types=1);

// `local` (XAMPP) | `production` (Hostinger server).
// On the server, set this to 'production' and fill the DB credentials in the
// production block below. (An `APP_ENV` file / env var can also be used.)
$APP_ENV = 'local'; // <<< CHANGE TO 'production' ON THE SERVER

$env = file_exists(__DIR__ . '/APP_ENV') ? trim((string) file_get_contents(__DIR__ . '/APP_ENV')) : $APP_ENV;
$env = in_array($env, ['local', 'production'], true) ? $env : 'local';
define('APP_ENV', $env);

$config = [
    'local' => [
        'db_host' => '127.0.0.1',
        'db_name' => 'pratham_care',
        'db_user' => 'root',
        'db_pass' => '',
        // Vite dev server origins allowed for CORS
        'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
    ],
    'production' => [
        // Hostinger MySQL credentials (from hPanel → Databases).
        // Note: shared MySQL host is usually 'localhost' when PHP runs on the same server.
        'db_host' => 'localhost',
        'db_name' => 'u000000000_pratham_care',
        'db_user' => 'u000000000_pratham',
        'db_pass' => 'your_db_password',
        'allowed_origins' => [],
    ],
];

define('DB_HOST', $config[APP_ENV]['db_host']);
define('DB_NAME', $config[APP_ENV]['db_name']);
define('DB_USER', $config[APP_ENV]['db_user']);
define('DB_PASS', $config[APP_ENV]['db_pass']);
define('ALLOWED_ORIGINS', $config[APP_ENV]['allowed_origins']);