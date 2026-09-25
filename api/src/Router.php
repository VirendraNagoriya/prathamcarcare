<?php
declare(strict_types=1);

/**
 * Minimal regex-based router: [METHOD, '/pattern/{param}', handler].
 */
final class Router
{
    /** @var array<int, array{0:string,1:string,2:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [$method, $pattern, $handler];
    }

    public function dispatch(string $method, string $path): mixed
    {
        foreach ($this->routes as [$routeMethod, $pattern, $handler]) {
            if ($routeMethod !== $method) {
                continue;
            }
            $regex = preg_replace('#\{[a-z_]+\}#', '([^/]+)', $pattern);
            if (preg_match('#^' . $regex . '$#', $path, $m)) {
                array_shift($m);
                return $handler($m);
            }
        }

        foreach ($this->routes as [$routeMethod, $pattern]) {
            $regex = preg_replace('#\{[a-z_]+\}#', '([^/]+)', $pattern);
            if ($routeMethod !== $method && preg_match('#^' . $regex . '$#', $path)) {
                json_error('Method not allowed', 405);
            }
        }

        json_error('Not found', 404);
    }

    public static function current_path(): string
    {
        $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        // Dev-only 'php -S localhost:8080 dev_router.php': SCRIPT_NAME is the
        // requested path itself (e.g. '/api/login') and there is no install
        // subdirectory, so match routes as-is.
        $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
        if ($script !== '' && $script === $path) {
            $path = rtrim($path, '/');
            return $path === '' ? '/' : $path;
        }

        // Production (Apache/FPM): the app may be installed in a subdirectory
        // (e.g. /prathamcarcare/api/index.php). Routes are registered relative
        // to the app root (/api/...), so strip that prefix before matching.
        $base = (string) preg_replace('#/api/index\.php$#', '', $script);

        if ($base === '' && ($pos = strpos($path, '/api/')) !== false) {
            $base = substr($path, 0, $pos);
        }

        if ($base !== '' && str_starts_with($path, $base)) {
            $path = substr($path, strlen($base));
        }

        $path = rtrim($path, '/');
        return $path === '' ? '/' : $path;
    }
}