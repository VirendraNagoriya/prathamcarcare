<?php
/**
 * Dev-only router for PHP's built-in server.
 * Run from backend/:   php -S localhost:8080 dev_router.php
 * Production uses Apache (.htaccess) instead.
 */
declare(strict_types=1);

$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/public/api/index.php';
    return true;
}

return false;