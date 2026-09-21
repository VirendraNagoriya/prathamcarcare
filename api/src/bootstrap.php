<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/Router.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CatalogController.php';
require_once __DIR__ . '/controllers/VehiclesController.php';
require_once __DIR__ . '/controllers/InvoicesController.php';
require_once __DIR__ . '/controllers/SettingsController.php';
require_once __DIR__ . '/controllers/RemindersController.php';
require_once __DIR__ . '/controllers/StatsController.php';
require_once __DIR__ . '/controllers/ExpensesController.php';

// ---- CORS (dev: Vite on 5173 talks to this on 8080) ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Hardened sessions (#2, #18, #19) ----
header_remove('X-Powered-By');

ini_set('session.gc_maxlifetime', '1800');  // 30 min server-side cleanup
ini_set('session.use_strict_mode', '1');    // reject unknown/invalid session IDs
ini_set('session.use_only_cookies', '1');   // never accept session ID from URL

if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

    session_name('pratham_session');
    session_set_cookie_params([
        'lifetime' => 0,            // browser-session cookie
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,     // HTTPS-only in production
        'httponly' => true,         // not readable by JS
        'samesite' => 'Lax',        // CSRF mitigation
    ]);
    session_start();
}

// Idle timeout: 30 minutes of inactivity (except login/health)
$path = Router::current_path();
$bypassTimeout = ($path === '/api/login' || $path === '/health');
if (!$bypassTimeout) {
    $idleTimeout = 30 * 60;
    if (isset($_SESSION['last_activity']) && (time() - (int) $_SESSION['last_activity']) > $idleTimeout) {
        $_SESSION = [];
        session_destroy();
        json_error('Session expired. Please log in again.', 401);
    }
    $_SESSION['last_activity'] = time();
}

// ---- Routes ----
$router = new Router();

$auth     = new AuthController();
$catalog  = new CatalogController();
$vehicles = new VehiclesController();
$invoices = new InvoicesController();
$settings  = new SettingsController();
$reminders = new RemindersController();
$stats     = new StatsController();
$expenses  = new ExpensesController();

$router->add('GET',  '/health',         static fn(): never => json_response(['ok' => true]));
$router->add('POST', '/api/login',      [$auth, 'login']);
$router->add('GET',  '/api/me',         [$auth, 'me']);
$router->add('POST', '/api/logout',     [$auth, 'logout']);

$router->add('GET',  '/api/catalog',    static function () use ($catalog): void {
    require_auth();
    $catalog->list();
});
$router->add('POST', '/api/catalog',    static function () use ($catalog): void {
    require_auth();
    $catalog->create();
});
$router->add('PUT',  '/api/catalog/{id}', static function (array $args) use ($catalog): void {
    require_auth();
    $catalog->update($args);
});
$router->add('DELETE', '/api/catalog/{id}', static function (array $args) use ($catalog): void {
    require_auth();
    $catalog->delete($args);
});

$router->add('GET',  '/api/vehicles',   static function () use ($vehicles): void {
    require_auth();
    $vehicles->search();
});
$router->add('GET',  '/api/vehicles/{id}/bills', static function (array $args) use ($vehicles): void {
    require_auth();
    $vehicles->bills($args);
});
$router->add('GET',  '/api/customers', static function () use ($vehicles): void {
    require_auth();
    $vehicles->all([]);
});

$router->add('POST', '/api/invoices',   static function () use ($invoices): void {
    require_auth();
    $invoices->create();
});
$router->add('GET',  '/api/invoices',   static function () use ($invoices): void {
    require_auth();
    $invoices->list();
});
$router->add('GET',  '/api/invoices/{id}', static function (array $args) use ($invoices): void {
    require_auth();
    $invoices->get($args);
});

$router->add('GET',  '/api/settings',   static function () use ($settings): void {
    require_auth();
    $settings->get();
});
$router->add('PUT',  '/api/settings',   static function () use ($settings): void {
    $settings->update();
});

$router->add('GET',  '/api/reminders',   static function () use ($reminders): void {
    require_auth();
    $reminders->list();
});
$router->add('POST', '/api/reminders/{id}/send', static function (array $args) use ($reminders): void {
    require_auth();
    $reminders->markSent($args);
});

$router->add('GET', '/api/stats/today', static function () use ($stats): void {
    require_auth();
    $stats->today();
});
$router->add('GET', '/api/stats/daysheet', static function () use ($stats): void {
    require_auth();
    $stats->daysheet();
});

$router->add('GET', '/api/expenses', static function () use ($expenses): void {
    require_auth();
    $expenses->list();
});
$router->add('POST', '/api/expenses', static function () use ($expenses): void {
    require_auth();
    $expenses->create();
});
$router->add('DELETE', '/api/expenses/{id}', static function (array $args) use ($expenses): void {
    require_auth();
    $expenses->delete($args);
});

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', Router::current_path());