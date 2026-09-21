<?php
/**
 * Backend configuration (template).
 * Copy this file to the server as public_html/api/config.php and edit the values.
 */
declare(strict_types=1);

// 'local' (XAMPP) | 'production' (Hostinger)
const APP_ENV = 'local';

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