<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class CatalogController
{
    public function list(): void
    {
        $rows = db()->query(
            'SELECT id, name, price, sort_order FROM catalog WHERE active = 1 ORDER BY sort_order, name'
        )->fetchAll();
        json_response(['items' => $rows]);
    }

    public function create(): void
    {
        $body = read_json_body();

        $name  = trim((string) ($body['name'] ?? ''));
        $price = (float) ($body['price'] ?? 0);

        if ($name === '') json_error('name is required', 422);
        if (mb_strlen($name) > 255) json_error('name is too long', 422);
        if ($price < 0) json_error('price cannot be negative', 422);
        if ($price > 999999999) json_error('price is too large', 422);

        $pdo = db();
        $stmt = $pdo->prepare('SELECT id FROM catalog WHERE name = :name');
        $stmt->execute([':name' => $name]);
        $existing = $stmt->fetch();

        if ($existing) {
            $upd = $pdo->prepare(
                'UPDATE catalog SET price = :price, active = 1 WHERE id = :id'
            );
            $upd->execute([':price' => round($price, 2), ':id' => $existing['id']]);
            json_response(['ok' => true, 'id' => (int) $existing['id']]);
        }

        $max = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) FROM catalog')->fetchColumn();

        $ins = $pdo->prepare(
            'INSERT INTO catalog (name, price, sort_order) VALUES (:name, :price, :sort)'
        );
        $ins->execute([':name' => $name, ':price' => round($price, 2), ':sort' => $max + 1]);

        json_response(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
    }

    public function update(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid item id', 422);

        $body = read_json_body();
        $pdo  = db();

        $item = $pdo->prepare('SELECT id FROM catalog WHERE id = :id');
        $item->execute([':id' => $id]);
        if (!$item->fetch()) json_error('Item not found', 404);

        $fields   = [];
        $bindings = [':id' => $id];

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            if ($name === '') json_error('name cannot be empty', 422);
            $fields[]   = 'name = :name';
            $bindings[':name'] = $name;
        }
        if (array_key_exists('price', $body)) {
            $price = (float) $body['price'];
            if ($price < 0) json_error('price cannot be negative', 422);
            $fields[]   = 'price = :price';
            $bindings[':price'] = round($price, 2);
        }
        if (array_key_exists('active', $body)) {
            $fields[]   = 'active = :active';
            $bindings[':active'] = $body['active'] ? 1 : 0;
        }

        if (empty($fields)) json_error('No fields to update', 422);

        $sql = 'UPDATE catalog SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $pdo->prepare($sql)->execute($bindings);

        json_response(['ok' => true]);
    }

    public function delete(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid item id', 422);

        $pdo = db();
        $item = $pdo->prepare('SELECT id FROM catalog WHERE id = :id');
        $item->execute([':id' => $id]);
        if (!$item->fetch()) json_error('Item not found', 404);

        // Soft delete: keeps historical invoice line items intact
        $pdo->prepare('UPDATE catalog SET active = 0 WHERE id = :id')->execute([':id' => $id]);

        json_response(['ok' => true]);
    }
}