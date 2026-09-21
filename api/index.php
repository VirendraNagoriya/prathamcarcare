<?php
/**
 * API entry point (production + dev).
 * Production:  public_html/api/index.php  (public/.htaccess rewrites /api/* here)
 * Dev:         php -S localhost:8080 dev_router.php   (dev_router.php routes /api/* here)
 */
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/src/bootstrap.php';