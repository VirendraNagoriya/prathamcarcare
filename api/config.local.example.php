<?php
/**
 * SERVER-LOCAL overrides — copy this file to api/config.local.php ON THE SERVER
 * and put your real credentials there.
 *
 * config.local.php is GITIGNORED: it never reaches GitHub, and auto-deploy
 * (GitHub → FTP) skips it — so your credentials survive every push and stay
 * private. This example file itself is safe to commit (it has no secrets).
 *
 * Everything under 'production' simply replaces the matching keys in the
 * production block of api/config.php.
 */
return [
    'env' => 'production',
    'production' => [
        'db_host' => 'localhost',
        'db_name' => 'u000000000_placeholder_db',
        'db_user' => 'u000000000_placeholder_user',
        'db_pass' => 'REPLACE_WITH_REAL_PASSWORD',
    ],
];