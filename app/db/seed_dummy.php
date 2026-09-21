<?php
/**
 * Development helper: seeds a few dummy customers with multiple bills
 * (bills spaced ~3 months apart) so the customer bill list can be tested.
 * Idempotent: skips vehicles whose plate number already exists.
 * Usage:  php db/seed_dummy.php
 */
declare(strict_types=1);

$host = getenv('DB_HOST') ?: '127.0.0.1';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$db   = 'pratham_care';

$pdo = new PDO(
    "mysql:host={$host};dbname={$db};charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$dummy = [
    [
        'plate' => 'MH12-AB-1234',
        'owner' => 'Ramesh Patil',
        'phone' => '9822011234',
        'bills' => [
            ['months_ago' => 3, 'km' => '18000', 'next_km' => '23000', 'next_date' => date('Y-m-d', strtotime('-1 month')), 'items' => [['Engine Oil', 1, 1500], ['Oil Filter', 1, 350], ['Servicing', 1, 800]]],
            ['months_ago' => 0, 'km' => '23500', 'next_km' => '28500', 'next_date' => date('Y-m-d', strtotime('+3 months')), 'items' => [['Engine Oil', 1, 1600], ['Oil Filter', 1, 400], ['Brake Pad', 1, 2200], ['Servicing', 1, 800]]],
        ],
    ],
    [
        'plate' => 'MH14-XX-9901',
        'owner' => 'Sunil Deshmukh',
        'phone' => '9890012345',
        'bills' => [
            ['months_ago' => 3, 'km' => '30000', 'next_km' => '35000', 'next_date' => date('Y-m-d', strtotime('-1 month')), 'items' => [['Coolant', 1, 900], ['Servicing', 1, 600]]],
            ['months_ago' => 0, 'km' => '35200', 'next_km' => '40200', 'next_date' => date('Y-m-d', strtotime('+2 months')), 'items' => [['Engine Oil', 1, 1500], ['Oil Flush', 1, 700], ['Air Filter', 1, 450], ['Servicing', 1, 600]]],
        ],
    ],
    [
        'plate' => 'MH-12-CB-5555',
        'owner' => 'Anita Jadhav',
        'phone' => '9765098765',
        'bills' => [
            ['months_ago' => 0, 'km' => '5000', 'next_km' => '10000', 'next_date' => date('Y-m-d', strtotime('+3 months')), 'items' => [['Washing & Cleaning', 1, 250], ['Servicing', 1, 700]]],
        ],
    ],
];

// Reminder demo customers: one bill each with a due/overdue service date
// (overdue, due today, upcoming within the 3-day window, and one already reminded)
$reminders = [
    ['plate' => 'MH-12-DD-2001', 'owner' => 'Vikram Shinde',  'phone' => '9922013456', 'days_ago' => 5,  'next_offset' => -5, 'reminded' => false],
    ['plate' => 'MH-12-DD-2002', 'owner' => 'Kavita Pawar',   'phone' => '9850011223', 'days_ago' => 7,  'next_offset' => 0,  'reminded' => false],
    ['plate' => 'MH-12-DD-2003', 'owner' => 'Arjun More',     'phone' => '9833004455', 'days_ago' => 6,  'next_offset' => 2,  'reminded' => false],
    ['plate' => 'MH-12-DD-2004', 'owner' => 'Farhan Shaikh',  'phone' => '9700088776', 'days_ago' => 10, 'next_offset' => -3, 'reminded' => true],
];

$added = 0;

$check = $pdo->prepare('SELECT COUNT(*) FROM vehicles WHERE plate_number = :pn');
$insV  = $pdo->prepare('INSERT INTO vehicles (plate_number, owner_name, owner_phone) VALUES (:pn, :on, :op)');
$insI  = $pdo->prepare(
    'INSERT INTO invoices (vehicle_id, total_amount, km_reading, next_service_km, next_service_date, created_at)
     VALUES (:vid, :total, :km, :nkm, :nsd, :created)'
);
$insItem = $pdo->prepare(
    'INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_rate, charged_amount)
     VALUES (:iid, :pn, 1, :rate, :rate)'
);

foreach ($dummy as $c) {
    $check->execute([':pn' => $c['plate']]);
    if ((int) $check->fetchColumn() > 0) {
        echo "skip {$c['plate']} (already exists)\n";
        continue;
    }

    $insV->execute([':pn' => $c['plate'], ':on' => $c['owner'], ':op' => $c['phone']]);
    $vid = (int) $pdo->lastInsertId();

    foreach ($c['bills'] as $bill) {
        $total = array_sum(array_map(static fn (array $it): float => $it[2], $bill['items']));
        $insI->execute([
            ':vid' => $vid,
            ':total' => round($total, 2),
            ':km' => $bill['km'],
            ':nkm' => $bill['next_km'],
            ':nsd' => $bill['next_date'],
            ':created' => date('Y-m-d H:i:s', strtotime("-{$bill['months_ago']} months")),
        ]);
        $iid = (int) $pdo->lastInsertId();
        foreach ($bill['items'] as [$name, $qty, $rate]) {
            $insItem->execute([
                ':iid' => $iid,
                ':pn' => $name,
                ':rate' => $rate,
            ]);
        }
    }

    echo "added {$c['plate']} — {$c['owner']}: " . count($c['bills']) . " bill(s)\n";
    $added++;
}

$insLog = $pdo->prepare('INSERT INTO reminder_log (invoice_id, vehicle_id) VALUES (:iid, :vid)');

foreach ($reminders as $r) {
    $check->execute([':pn' => $r['plate']]);
    if ((int) $check->fetchColumn() > 0) {
        echo "skip {$r['plate']} (already exists)\n";
        continue;
    }

    $insV->execute([':pn' => $r['plate'], ':on' => $r['owner'], ':op' => $r['phone']]);
    $vid = (int) $pdo->lastInsertId();

    $nextDate = date('Y-m-d', strtotime("{$r['next_offset']} days"));
    $items = [['Engine Oil', 1, 1500], ['Servicing', 1, 700]];
    $total = array_sum(array_map(static fn (array $it): float => $it[2], $items));

    $insI->execute([
        ':vid' => $vid,
        ':total' => round($total, 2),
        ':km' => '22000',
        ':nkm' => '27000',
        ':nsd' => $nextDate,
        ':created' => date('Y-m-d H:i:s', strtotime("-{$r['days_ago']} days")),
    ]);
    $iid = (int) $pdo->lastInsertId();

    foreach ($items as [$name, $qty, $rate]) {
        $insItem->execute([':iid' => $iid, ':pn' => $name, ':rate' => $rate]);
    }

    if ($r['reminded']) {
        $insLog->execute([':iid' => $iid, ':vid' => $vid]);
    }

    echo "added reminder demo {$r['plate']} — {$r['owner']}: service due $nextDate" . ($r['reminded'] ? ' (reminded)' : '') . "\n";
    $added++;
}

echo $added > 0 ? "Dummy data seeded OK.\n" : "No new dummy data to add.\n";