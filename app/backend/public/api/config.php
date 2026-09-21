<?php
/**
 * Backend configuration.
 * Copy/rename to config.php and fill in the values for your environment.
 */
declare(strict_types=1);

$env = getenv('APP_ENV') ?: (file_exists(__DIR__ . '/APP_ENV') ? trim((string) file_get_contents(__DIR__ . '/APP_ENV')) : 'local');

const APP_ENV = 'local'; // 'local' | 'production'

$config = [
    'local' => [
        'db_host' => '127.0.0.1',
        'db_name' => 'pratham_care',
        'db_user' => 'root',
        'db_pass' => '',
        'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
    ],
    'production' => [
        // Hostinger MySQL credentials live here in production.
        // Never put real credentials in config.example.php / git.
        'db_host' => getenv('DB_HOST') ?: 'localhost',
        'db_name' => getenv('DB_NAME') ?: 'u000000000_pratham_care',
        'db_user' => getenv('DB_USER') ?: 'u000000000_pratham',
        'db_pass' => getenv('DB_PASS') ?: '',
        'allowed_origins' => [],
    ],
];

define('DB_HOST', $config[APP_ENV]['db_host']);
define('DB_NAME', $config[APP_ENV]['db_name']);
define('DB_USER', $config[APP_ENV]['db_user']);
define('DB_PASS', $config[APP_ENV]['db_pass']);
define('ALLOWED_ORIGINS', $config[APP_ENV]['allowed_origins']);