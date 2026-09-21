<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class RemindersController
{
    /**
     * Vehicles with a next_service_date that is due (past or within next 7 days).
     * Uses each vehicle's latest invoice that carries a next_service_date.
     */
    public function list(): void
    {
        $pdo = db();
        $settingsRow = settings_row($pdo);
        $daysBefore = (int) ($settingsRow['reminder_days_before'] ?? 3);

        $rows = $pdo->query(
            "SELECT inv.id AS invoice_id, inv.next_service_date, inv.created_at,
                    v.id AS vehicle_id, v.plate_number, v.owner_name, v.owner_phone,
                    (SELECT COUNT(*) FROM reminder_log rl WHERE rl.invoice_id = inv.id) AS reminded
             FROM invoices inv
             JOIN vehicles v ON v.id = inv.vehicle_id
             WHERE inv.next_service_date IS NOT NULL
               AND inv.id = (
                   SELECT i2.id FROM invoices i2
                   WHERE i2.vehicle_id = v.id AND i2.next_service_date IS NOT NULL
                   ORDER BY i2.created_at DESC, i2.id DESC
                   LIMIT 1
               )
               AND inv.next_service_date <= DATE_ADD(CURDATE(), INTERVAL {$daysBefore} DAY)
             ORDER BY inv.next_service_date ASC"
        )->fetchAll();

        $today  = new DateTimeImmutable('today');
        $result = [];

        foreach ($rows as &$row) {
            $due = new DateTimeImmutable($row['next_service_date']);
            $row['days'] = (int) $today->diff($due)->format('%R%a');
            $row['status'] = $row['days'] < 0 ? 'overdue' : ($row['days'] === 0 ? 'today' : 'upcoming');
            $result[] = $row;
        }
        unset($row);

        json_response(['reminders' => $result]);
    }

    /**
     * Mark a reminder as sent for an invoice (duplicate-safe).
     */
    public function markSent(array $args): void
    {
        $invoiceId = (int) $args[0];
        if ($invoiceId <= 0) json_error('Invalid invoice id', 422);

        $pdo = db();

        $stmt = $pdo->prepare(
            'SELECT id, vehicle_id FROM invoices WHERE id = :id'
        );
        $stmt->execute([':id' => $invoiceId]);
        $row = $stmt->fetch();
        if (!$row) json_error('Invoice not found', 404);

        $exists = $pdo->prepare('SELECT COUNT(*) FROM reminder_log WHERE invoice_id = :id');
        $exists->execute([':id' => $invoiceId]);

        if ((int) $exists->fetchColumn() === 0) {
            $ins = $pdo->prepare('INSERT INTO reminder_log (invoice_id, vehicle_id) VALUES (:iid, :vid)');
            $ins->execute([':iid' => $invoiceId, ':vid' => $row['vehicle_id']]);
        }

        json_response(['ok' => true, 'reminded' => true]);
    }
}