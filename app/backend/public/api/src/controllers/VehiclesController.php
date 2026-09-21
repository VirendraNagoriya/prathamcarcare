<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class VehiclesController
{
    public function search(): void
    {
        $q = trim((string) ($_GET['q'] ?? ''));

        if ($q === '') {
            json_response(['vehicles' => []]);
        }

        $stmt = db()->prepare(
            'SELECT v.id, v.plate_number, v.owner_name, v.owner_phone,
                    (SELECT COUNT(*) FROM invoices i WHERE i.vehicle_id = v.id) AS bill_count
             FROM vehicles v
             WHERE v.plate_number LIKE :q1
                OR v.owner_name LIKE :q2
                OR v.owner_phone LIKE :q3
             ORDER BY v.plate_number
             LIMIT 12'
        );
        $like = "%{$q}%";
        $stmt->bindValue(':q1', $like);
        $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like);
        $stmt->execute();

        json_response(['vehicles' => $stmt->fetchAll()]);
    }

    public function all(array $args): void
    {
        unset($args);
        $q      = trim((string) ($_GET['q'] ?? ''));
        $limit  = (int) ($_GET['limit'] ?? 100);
        $offset = (int) ($_GET['offset'] ?? 0);
        if ($limit < 1) $limit = 100;
        if ($limit > 100) $limit = 100;
        if ($offset < 0) $offset = 0;

        $from =
            'FROM vehicles v';

        $where  = '';
        $params = [];
        if ($q !== '') {
            $where = ' WHERE (v.plate_number LIKE :q1 OR v.owner_name LIKE :q2 OR v.owner_phone LIKE :q3)';
            $like  = "%{$q}%";
            $params = [':q1' => $like, ':q2' => $like, ':q3' => $like];
        }

        $pdo = db();

        $count = $pdo->prepare('SELECT COUNT(*) ' . $from . $where);
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT v.id, v.plate_number, v.owner_name, v.owner_phone,
                    (SELECT COUNT(*) FROM invoices i WHERE i.vehicle_id = v.id) AS bill_count
             ' . $from . $where . '
             ORDER BY v.owner_name ASC, v.plate_number ASC
             LIMIT :lim OFFSET :off'
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();

        json_response(['customers' => $stmt->fetchAll(), 'total' => $total]);
    }

    public function bills(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid vehicle id', 422);

        $pdo = db();

        $vehicle = $pdo->prepare(
            'SELECT id, plate_number, owner_name, owner_phone FROM vehicles WHERE id = :id'
        );
        $vehicle->execute([':id' => $id]);
        $v = $vehicle->fetch();
        if (!$v) json_error('Vehicle not found', 404);

        $rows = $pdo->prepare(
            'SELECT inv.id, inv.total_amount, inv.km_reading, inv.next_service_km, inv.next_service_date, inv.created_at
             FROM invoices inv
             WHERE inv.vehicle_id = :vid
             ORDER BY inv.created_at DESC'
        );
        $rows->execute([':vid' => $id]);
        $bills = $rows->fetchAll();

        foreach ($bills as &$b) {
            $b['bill_ref'] = make_bill_ref($v['plate_number'], (int) $b['id']);
        }
        unset($b);

        json_response([
            'vehicle' => $v,
            'bills' => $bills,
        ]);
    }
}