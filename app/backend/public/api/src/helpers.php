<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        // Align MySQL NOW()/CURDATE() with the app's IST wall-clock.
        // Offset form works on any server (no tz-tables required).
        try {
            $pdo->exec("SET time_zone = '+05:30'");
        } catch (\Throwable $e) {
            // Non-fatal: keep going if the host forbids setting session tz.
        }
    }
    return $pdo;
}

function settings_row(?PDO $pdo = null): array
{
    $pdo = $pdo ?? db();
    $row = $pdo->query('SELECT app_name, shop_phone, google_place_id, reminder_days_before, pin_hash FROM settings WHERE id = 1')->fetch();
    if (!$row) {
        throw new RuntimeException('Missing settings row. Run db/seed.sql first.');
    }
    return $row;
}

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): never
{
    json_response(['error' => $message], $status);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('Invalid JSON body', 400);
    }
    return $data;
}

function require_auth(): void
{
    $authed = $_SESSION['authed'] ?? false;
    if (!$authed) {
        json_error('Unauthorized', 401);
    }
}

function client_ip(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $first = trim(explode(',', $forwarded)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function check_login_rate_limit(): void
{
    $ip     = client_ip();
    $window = 15 * 60;
    $limit  = 5;

    $stmt = db()->prepare(
        'SELECT COUNT(*) FROM login_attempts
         WHERE ip_address = :ip AND attempted_at >= NOW() - INTERVAL :win SECOND'
    );
    $stmt->bindValue(':ip', $ip);
    $stmt->bindValue(':win', $window, PDO::PARAM_INT);
    $stmt->execute();

    if ((int) $stmt->fetchColumn() >= $limit) {
        json_error('Too many failed attempts. Try again in 15 minutes.', 429);
    }
}

function record_failed_login(): void
{
    $stmt = db()->prepare('INSERT INTO login_attempts (ip_address) VALUES (:ip)');
    $stmt->execute([':ip' => client_ip()]);
}

function clear_login_attempts(): void
{
    $stmt = db()->prepare('DELETE FROM login_attempts WHERE ip_address = :ip');
    $stmt->execute([':ip' => client_ip()]);
}

function log_error(string $message): void
{
    $dir = __DIR__ . '/../../logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $file  = $dir . '/error_' . date('Y-m-d') . '.log';
    $entry = date('Y-m-d H:i:s') . ' [' . client_ip() . '] ' . $message . PHP_EOL;
    @file_put_contents($file, $entry, FILE_APPEND | LOCK_EX);
}

function make_bill_ref(string $plateNumber, int $invoiceId): string
{
    $clean  = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $plateNumber));
    $padded = str_pad((string) $invoiceId, 4, '0', STR_PAD_LEFT);
    return $clean . '/' . $padded;
}

function amount_in_words(float $amount): string
{
    $units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
              'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
              'Seventeen', 'Eighteen', 'Nineteen'];
    $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    $two_digits = static function (int $n) use ($units, $tens): string {
        if ($n < 20) return $units[$n];
        return $tens[intdiv($n, 10)] . ($n % 10 ? ' ' . $units[$n % 10] : '');
    };

    $three_digits = static function (int $n) use ($units, $two_digits): string {
        $h = intdiv($n, 100);
        $r = $n % 100;
        $out = '';
        if ($h) $out .= $units[$h] . ' Hundred';
        if ($r) $out .= ($out ? ' ' : '') . $two_digits($r);
        return $out;
    };

    $n = (int) round($amount * 100);
    $paise = $n % 100;
    $whole = intdiv($n, 100);

    $parts = [];
    $crore = intdiv($whole, 10000000);
    $whole %= 10000000;
    $lakh = intdiv($whole, 100000);
    $whole %= 100000;
    $thousand = intdiv($whole, 1000);
    $whole %= 1000;

    if ($crore) $parts[] = $three_digits($crore) . ' Crore';
    if ($lakh)  $parts[] = $two_digits($lakh) . ' Lakh';
    if ($thousand) $parts[] = $two_digits($thousand) . ' Thousand';
    if ($whole)  $parts[] = $three_digits($whole);

    $words = $parts ? implode(' ', $parts) . ' Rupees' : 'Zero Rupees';

    if ($paise) {
        $words .= ' and ' . $two_digits($paise) . ' Paise';
    }

    return ucfirst($words) . ' Only';
}