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
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $path = rtrim((string)$path, '/');
        return $path === '' ? '/' : $path;
    }
}