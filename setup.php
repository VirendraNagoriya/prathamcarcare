<?php
declare(strict_types=1);
/**
 * Browser setup page — writes api/config.local.php with your database
 * credentials (pure PHP, no file editing). DELETE THIS FILE after setup.
 *
 * 1. Open  https://tequera.com/prathamcarcare/setup.php
 * 2. Enter the Hostinger MySQL details and submit.
 *    It tests the connection first; only saves if the login works.
 * 3. Continue to /install to create the tables, then delete setup.php.
 *
 * It refuses to run once api/config.local.php exists (delete that file first
 * if you ever need to reconfigure).
 */
require_once __DIR__ . '/api/config.php';

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

$configLocal = __DIR__ . '/api/config.local.php';
$already     = is_file($configLocal);
$errors      = [];
$saved       = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$already) {
    $dbHost = trim((string) ($_POST['db_host'] ?? 'localhost')) ?: 'localhost';
    $dbName = trim((string) ($_POST['db_name'] ?? ''));
    $dbUser = trim((string) ($_POST['db_user'] ?? ''));
    $dbPass = (string) ($_POST['db_pass'] ?? '');

    if ($dbName === '' || $dbUser === '') {
        $errors[] = 'Database name and username are required.';
    } else {
        try {
            new PDO(
                'mysql:host=' . $dbHost . ';dbname=' . $dbName . ';charset=utf8mb4',
                $dbUser,
                $dbPass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            $php = "<?php\n"
                 . "// Written by setup.php - server-local credentials. GITIGNORED, kept out of deploys.\n"
                 . "return [\n"
                 . "    'env' => 'production',\n"
                 . "    'production' => [\n"
                 . "        'db_host' => " . var_export($dbHost, true) . ",\n"
                 . "        'db_name' => " . var_export($dbName, true) . ",\n"
                 . "        'db_user' => " . var_export($dbUser, true) . ",\n"
                 . "        'db_pass' => " . var_export($dbPass, true) . ",\n"
                 . "    ],\n"
                 . "];\n";

            if (@file_put_contents($configLocal, $php) === false) {
                $errors[] = 'Connected to MySQL, but could not write api/config.local.php. Make the api/ folder writable (permission 755 or 775) and retry.';
            } else {
                $saved = true;
            }
        } catch (PDOException $ex) {
            $errors[] = 'MySQL connection failed: ' . $ex->getMessage();
        }
    }
}
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pratham Car Care — Database Setup</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f1f5f9; margin:0; padding:24px; color:#0f172a; }
  .card { max-width:520px; margin:40px auto; background:#fff; border-radius:14px; padding:28px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
  h1 { font-size:20px; margin:0 0 4px; color:#002e5d; }
  p.sub { margin:0 0 20px; color:#64748b; font-size:14px; }
  label { display:block; font-size:13px; font-weight:600; margin:14px 0 6px; }
  input { width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; }
  button { margin-top:20px; width:100%; padding:12px; border:0; border-radius:8px; background:#002e5d; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  .err { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:12px; border-radius:8px; font-size:14px; margin-bottom:8px; }
  .ok { background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:14px; border-radius:8px; font-size:14px; }
  .ok a { color:#166534; font-weight:700; }
  code { background:#f1f5f9; padding:1px 5px; border-radius:4px; }
</style>
</head>
<body>
<div class="card">
<?php if ($already): ?>
  <h1>Already configured</h1>
  <p class="sub"><code>api/config.local.php</code> already exists, so setup is locked.</p>
  <div class="ok">If you need to reconfigure: delete <code>api/config.local.php</code> (and this <code>setup.php</code>), then reload.</div>
<?php elseif ($saved): ?>
  <h1>Database saved ✅</h1>
  <p class="sub">Credentials were tested and written to <code>api/config.local.php</code>.</p>
  <div class="ok">Next: open <a href="./install">/prathamcarcare/install</a> to create the tables, then <b>delete <code>setup.php</code></b>.</div>
<?php else: ?>
  <h1>Database setup</h1>
  <p class="sub">Enter your Hostinger MySQL details. The connection is tested before saving.</p>

  <?php foreach ($errors as $msg): ?>
    <div class="err"><?= e($msg) ?></div>
  <?php endforeach; ?>

  <form method="post" autocomplete="off">
    <label for="db_host">Host</label>
    <input id="db_host" name="db_host" value="<?= e((string) ($_POST['db_host'] ?? 'localhost')) ?>" placeholder="localhost">

    <label for="db_name">Database name</label>
    <input id="db_name" name="db_name" value="<?= e((string) ($_POST['db_name'] ?? '')) ?>" placeholder="u765962729_Prathamcarcare" required>

    <label for="db_user">Database user</label>
    <input id="db_user" name="db_user" value="<?= e((string) ($_POST['db_user'] ?? '')) ?>" placeholder="u765962729_Prathamcarcare" required>

    <label for="db_pass">Password</label>
    <input id="db_pass" name="db_pass" type="text" value="" placeholder="database password">

    <button type="submit">Test &amp; save</button>
  </form>
<?php endif; ?>
</div>
</body>
</html>
