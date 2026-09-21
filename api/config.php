<?php
/**
 * Backend configuration.
 * Copy/rename to config.php and fill in the values for your environment.
 */
declare(strict_types=1);

// ---------------------------------------------------------------------------
// ENVIRONMENT — 'local' (XAMPP dev) | 'production' (Hostinger server).
// On the server, set the line below to 'production' BEFORE going live:
//        $APP_ENV = 'production';
// (The APP_ENV file / environment variable still work as an alternative.)
// ---------------------------------------------------------------------------
$APP_ENV = 'local'; // <<< CHANGE TO 'production' ON THE SERVER

$env = getenv('APP_ENV');
if ($env === false || $env === '') {
    $env = file_exists(__DIR__ . '/APP_ENV') ? trim((string) file_get_contents(__DIR__ . '/APP_ENV')) : $APP_ENV;
}
$env = in_array($env, ['local', 'production'], true) ? $env : 'local';
define('APP_ENV', $env);

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

// Gitignored server-local overrides. If api/config.local.php exists on the
// server (copy of config.local.example.php with real credentials), it fully
// overrides the blocks above — so config.php contains NO secrets and is safe
// for auto-deploy (GitHub → FTP) to overwrite on every push.
$localOverrides = [];
if (file_exists(__DIR__ . '/config.local.php')) {
    $localOverrides = (array) require __DIR__ . '/config.local.php';
}

if (isset($localOverrides['env'])) {
    $env = in_array($localOverrides['env'], ['local', 'production'], true) ? $localOverrides['env'] : $env;
}

foreach (['local', 'production'] as $scope) {
    if (!empty($localOverrides[$scope]) && is_array($localOverrides[$scope])) {
        $config[$scope] = array_merge($config[$scope], $localOverrides[$scope]);
    }
}

define('DB_HOST', $config[APP_ENV]['db_host']);
define('DB_NAME', $config[APP_ENV]['db_name']);
define('DB_USER', $config[APP_ENV]['db_user']);
define('DB_PASS', $config[APP_ENV]['db_pass']);
define('ALLOWED_ORIGINS', $config[APP_ENV]['allowed_origins']);