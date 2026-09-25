<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class InvoicesController
{
    public function create(): void
    {
        $body = read_json_body();

        $plateNumber  = trim((string) ($body['plate_number'] ?? ''));
        $ownerName    = trim((string) ($body['owner_name'] ?? ''));
        $ownerPhone   = trim((string) ($body['owner_phone'] ?? ''));
        $kmReading    = (string) ($body['km_reading'] ?? '');
        $nextServiceKm = (string) ($body['next_service_km'] ?? '');
        $nextServiceDate = (string) ($body['next_service_date'] ?? '');
        $items        = $body['items'] ?? [];

        if ($nextServiceDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $nextServiceDate)) {
            json_error('next_service_date must use YYYY-MM-DD format', 422);
        }

        if ($plateNumber === '') json_error('plate_number is required', 422);
        if ($ownerName === '')   json_error('owner_name is required', 422);
        if ($ownerPhone === '')  json_error('owner_phone is required', 422);
        if (!is_array($items) || count($items) === 0) json_error('At least one item is required', 422);
        if (mb_strlen($plateNumber) > 50) json_error('Car number is too long', 422);
        if (mb_strlen($ownerName) > 255)  json_error('Owner name is too long', 422);
        if (mb_strlen($ownerPhone) > 20)  json_error('Mobile number is too long', 422);
        if (count($items) > 50) json_error('Maximum 50 items per invoice', 422);

        // Invoice creation throttle (#10): max 50 per session per hour
        $now = time();
        $window = 3600;
        $maxPerHour = 50;
        $_SESSION['invoice_timestamps'] = array_values(array_filter(
            $_SESSION['invoice_timestamps'] ?? [],
            static fn (int $ts): bool => ($now - $ts) < $window
        ));
        if (count($_SESSION['invoice_timestamps']) >= $maxPerHour) {
            json_error('Invoice creation limit reached (max 50 per hour). Please wait.', 429);
        }

        foreach ($items as $i => $item) {
            $name   = (string) ($item['product_name'] ?? '');
            $qty    = (int) ($item['quantity'] ?? 1);
            $rate   = (float) ($item['unit_rate'] ?? 0);
            $amount = (float) ($item['charged_amount'] ?? 0);
            if ($name === '' || $qty <= 0) {
                json_error("Item " . ($i + 1) . " is invalid", 422);
            }
            // recalculate server-side
            $items[$i]['quantity']       = $qty;
            $items[$i]['unit_rate']      = $rate;
            $items[$i]['charged_amount'] = round($rate * $qty, 2);
        }

        $pdo = db();
        $pdo->beginTransaction();

        try {
            // Upsert vehicle
            $stmt = $pdo->prepare(
                'INSERT INTO vehicles (plate_number, owner_name, owner_phone)
                 VALUES (:pn, :on, :op)
                 ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), owner_phone = VALUES(owner_phone)'
            );
            $stmt->execute([':pn' => $plateNumber, ':on' => $ownerName, ':op' => $ownerPhone]);
            $vehicleId = (int) $pdo->query('SELECT id FROM vehicles WHERE plate_number = ' . $pdo->quote($plateNumber))->fetchColumn();

            $total = 0.0;
            foreach ($items as $item) {
                $total += (float) $item['charged_amount'];
            }

            $stmt = $pdo->prepare(
                'INSERT INTO invoices (vehicle_id, total_amount, km_reading, next_service_km, next_service_date)
                 VALUES (:vid, :total, :km, :nkm, :nsd)'
            );
            $stmt->execute([
                ':vid'  => $vehicleId,
                ':total' => round($total, 2),
                ':km'   => $kmReading ?: null,
                ':nkm'  => $nextServiceKm ?: null,
                ':nsd'  => $nextServiceDate !== '' ? $nextServiceDate : null,
            ]);
            $invoiceId = (int) $pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_rate, charged_amount)
                 VALUES (:iid, :pn, :qty, :rate, :amt)'
            );
            foreach ($items as $item) {
                $stmt->execute([
                    ':iid'  => $invoiceId,
                    ':pn'   => $item['product_name'],
                    ':qty'  => $item['quantity'],
                    ':rate' => $item['unit_rate'],
                    ':amt'  => $item['charged_amount'],
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            log_error('Invoice creation failed: ' . $e->getMessage());
            json_error(APP_ENV === 'production' ? 'Failed to create invoice. Please try again.' : 'Failed to create invoice: ' . $e->getMessage(), 500);
        }

        $_SESSION['invoice_timestamps'][] = $now;

        $billRef = make_bill_ref($plateNumber, $invoiceId);
        json_response([
            'id'         => $invoiceId,
            'bill_ref'   => $billRef,
            'total'      => round($total, 2),
            'vehicle_id' => $vehicleId,
        ], 201);
    }

    public function update(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid invoice id', 422);

        $pdo = db();
        $existing = $pdo->prepare(
            'SELECT inv.id
             FROM invoices inv
             WHERE inv.id = :id'
        );
        $existing->execute([':id' => $id]);
        if (!$existing->fetch()) json_error('Invoice not found', 404);

        $body = read_json_body();

        $plateNumber   = trim((string) ($body['plate_number'] ?? ''));
        $ownerName     = trim((string) ($body['owner_name'] ?? ''));
        $ownerPhone    = trim((string) ($body['owner_phone'] ?? ''));
        $kmReading     = (string) ($body['km_reading'] ?? '');
        $nextServiceKm = (string) ($body['next_service_km'] ?? '');
        $nextServiceDate = (string) ($body['next_service_date'] ?? '');
        $items         = $body['items'] ?? [];

        if ($nextServiceDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $nextServiceDate)) {
            json_error('next_service_date must use YYYY-MM-DD format', 422);
        }

        if ($plateNumber === '') json_error('plate_number is required', 422);
        if ($ownerName === '')   json_error('owner_name is required', 422);
        if ($ownerPhone === '')  json_error('owner_phone is required', 422);
        if (!is_array($items) || count($items) === 0) json_error('At least one item is required', 422);
        if (mb_strlen($plateNumber) > 50) json_error('Car number is too long', 422);
        if (mb_strlen($ownerName) > 255)  json_error('Owner name is too long', 422);
        if (mb_strlen($ownerPhone) > 20)  json_error('Mobile number is too long', 422);
        if (count($items) > 50) json_error('Maximum 50 items per invoice', 422);

        foreach ($items as $i => $item) {
            $name = (string) ($item['product_name'] ?? '');
            $qty  = (int) ($item['quantity'] ?? 1);
            $rate = (float) ($item['unit_rate'] ?? 0);
            if ($name === '' || $qty <= 0) {
                json_error("Item " . ($i + 1) . " is invalid", 422);
            }
            $items[$i]['quantity']       = $qty;
            $items[$i]['unit_rate']      = $rate;
            $items[$i]['charged_amount'] = round($rate * $qty, 2);
        }

        $total = 0.0;
        foreach ($items as $item) {
            $total += (float) $item['charged_amount'];
        }

        $pdo->beginTransaction();
        try {
            // Upsert vehicle (same behaviour as create)
            $stmt = $pdo->prepare(
                'INSERT INTO vehicles (plate_number, owner_name, owner_phone)
                 VALUES (:pn, :on, :op)
                 ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), owner_phone = VALUES(owner_phone)'
            );
            $stmt->execute([':pn' => $plateNumber, ':on' => $ownerName, ':op' => $ownerPhone]);
            $vehicleId = (int) $pdo->query('SELECT id FROM vehicles WHERE plate_number = ' . $pdo->quote($plateNumber))->fetchColumn();

            $stmt = $pdo->prepare(
                'UPDATE invoices
                 SET vehicle_id = :vid, total_amount = :total, km_reading = :km,
                     next_service_km = :nkm, next_service_date = :nsd
                 WHERE id = :id'
            );
            $stmt->execute([
                ':vid'   => $vehicleId,
                ':total' => round($total, 2),
                ':km'    => $kmReading ?: null,
                ':nkm'   => $nextServiceKm ?: null,
                ':nsd'   => $nextServiceDate !== '' ? $nextServiceDate : null,
                ':id'    => $id,
            ]);

            // Replace line items
            $pdo->prepare('DELETE FROM invoice_items WHERE invoice_id = :id')->execute([':id' => $id]);

            $stmt = $pdo->prepare(
                'INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_rate, charged_amount)
                 VALUES (:iid, :pn, :qty, :rate, :amt)'
            );
            foreach ($items as $item) {
                $stmt->execute([
                    ':iid' => $id,
                    ':pn'  => $item['product_name'],
                    ':qty' => $item['quantity'],
                    ':rate'=> $item['unit_rate'],
                    ':amt' => $item['charged_amount'],
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            log_error('Invoice update failed: ' . $e->getMessage());
            json_error(APP_ENV === 'production' ? 'Failed to update invoice. Please try again.' : 'Failed to update invoice: ' . $e->getMessage(), 500);
        }

        json_response([
            'id'         => $id,
            'bill_ref'   => make_bill_ref($plateNumber, $id),
            'total'      => round($total, 2),
            'vehicle_id' => $vehicleId,
        ]);
    }

    public function list(): void
    {
        $q      = trim((string) ($_GET['q'] ?? ''));
        $from   = trim((string) ($_GET['from'] ?? ''));
        $to     = trim((string) ($_GET['to'] ?? ''));
        $month  = trim((string) ($_GET['month'] ?? ''));
        $limit  = (int) ($_GET['limit'] ?? 50);
        $offset = (int) ($_GET['offset'] ?? 0);
        if ($limit < 1) $limit = 50;
        if ($limit > 100) $limit = 100;
        if ($offset < 0) $offset = 0;

        $from =
            'FROM invoices inv
             JOIN vehicles v ON v.id = inv.vehicle_id';

        $where  = '';
        $params = [];

        $conds = [];
        if ($q !== '') {
            $conds[] = '(v.plate_number LIKE :q1 OR v.owner_name LIKE :q2 OR v.owner_phone LIKE :q3)';
            $like    = "%{$q}%";
            $params[':q1'] = $like;
            $params[':q2'] = $like;
            $params[':q3'] = $like;
        }

        if ($month !== '') {
            // Month scope overrides from/to
            if (preg_match('/^\d{4}-\d{2}$/', $month)) {
                $conds[] = 'DATE_FORMAT(inv.created_at, \'%Y-%m\') = :month';
                $params[':month'] = $month;
            }
        } else {
            if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
                $conds[] = 'inv.created_at >= :frm';
                $params[':frm'] = $from . ' 00:00:00';
            }
            if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
                $conds[] = 'inv.created_at <= :to';
                $params[':to'] = $to . ' 23:59:59';
            }
        }

        if ($conds !== []) {
            $where = ' WHERE ' . implode(' AND ', $conds);
        }

        $pdo = db();

        $count = $pdo->prepare('SELECT COUNT(*) ' . $from . $where);
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT inv.id, inv.total_amount, inv.km_reading, inv.next_service_km, inv.next_service_date, inv.created_at,
                    v.plate_number, v.owner_name, v.owner_phone
             ' . $from . $where . '
             ORDER BY inv.created_at DESC, inv.id DESC
             LIMIT :lim OFFSET :off'
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $row['bill_ref'] = make_bill_ref($row['plate_number'], (int) $row['id']);
        }
        unset($row);

        json_response(['invoices' => $rows, 'total' => $total]);
    }

    public function get(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid invoice id', 422);

        $invoice = db()->prepare(
            'SELECT inv.*, v.plate_number, v.owner_name, v.owner_phone
             FROM invoices inv
             JOIN vehicles v ON v.id = inv.vehicle_id
             WHERE inv.id = :id'
        );
        $invoice->execute([':id' => $id]);
        $row = $invoice->fetch();
        if (!$row) json_error('Invoice not found', 404);

        $items = db()->prepare('SELECT * FROM invoice_items WHERE invoice_id = :id ORDER BY id');
        $items->execute([':id' => $id]);
        $row['items']            = $items->fetchAll();
        $row['bill_ref']         = make_bill_ref($row['plate_number'], (int) $row['id']);
        $row['amount_in_words']  = amount_in_words((float) $row['total_amount']);

        json_response($row);
    }
}