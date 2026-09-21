<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class AuthController
{
    public function login(): void
    {
        check_login_rate_limit();

        $body = read_json_body();
        $pin = (string) ($body['pin'] ?? '');

        if ($pin === '') {
            json_error('PIN is required', 422);
        }

        $row = settings_row();

        if (!password_verify($pin, $row['pin_hash'])) {
            record_failed_login();
            json_error('Invalid PIN', 401);
        }

        clear_login_attempts();
        $_SESSION['authed'] = true;
        session_regenerate_id(true);

        $this->me();
    }

    public function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        json_response(['ok' => true]);
    }

    public function me(): void
    {
        if (!($_SESSION['authed'] ?? false)) {
            json_response(['authed' => false], 401);
        }
        json_response(['authed' => true]);
    }
}