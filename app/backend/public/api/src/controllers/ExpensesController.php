<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class ExpensesController
{
    private const CATEGORIES = ['Parts Purchased', 'Consumables', 'Wages', 'Rent', 'Electricity', 'Other'];

    public function list(): void
    {
        $month = trim((string) ($_GET['month'] ?? ''));
        $date  = trim((string) ($_GET['date'] ?? ''));

        $pdo = db();

        if ($month !== '') {
            if (!preg_match('/^\d{4}-\d{2}$/', $month)) json_error('month must use YYYY-MM format', 422);
            $rows = $pdo->prepare(
                'SELECT id, description, category, amount, expense_date
                 FROM expenses WHERE DATE_FORMAT(expense_date, "%Y-%m") = :m
                 ORDER BY expense_date DESC, id DESC'
            );
            $rows->execute([':m' => $month]);
        } else {
            if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                json_error('date must use YYYY-MM-DD format', 422);
            }
            if ($date === '') $date = date('Y-m-d');
            $rows = $pdo->prepare(
                'SELECT id, description, category, amount, expense_date
                 FROM expenses WHERE expense_date = :d ORDER BY id DESC'
            );
            $rows->execute([':d' => $date]);
        }

        $list = $rows->fetchAll();
        $total = array_sum(array_map(static fn (array $e): float => (float) $e['amount'], $list));

        json_response([
            'items'     => $list,
            'total'     => round($total, 2),
            'categories'=> self::CATEGORIES,
        ]);
    }

    public function create(): void
    {
        $body = read_json_body();

        $description = trim((string) ($body['description'] ?? ''));
        $category    = trim((string) ($body['category'] ?? 'Other'));
        $amount      = (float) ($body['amount'] ?? 0);
        $date        = trim((string) ($body['expense_date'] ?? date('Y-m-d')));

        if ($description === '') json_error('description is required', 422);
        if (mb_strlen($description) > 255) json_error('description is too long', 422);
        if ($amount <= 0) json_error('amount must be greater than 0', 422);
        if (!in_array($category, self::CATEGORIES, true)) json_error('Invalid category', 422);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) json_error('expense_date must use YYYY-MM-DD format', 422);

        $stmt = db()->prepare(
            'INSERT INTO expenses (description, category, amount, expense_date) VALUES (:d, :c, :a, :ed)'
        );
        $stmt->execute([
            ':d'  => $description,
            ':c'  => $category,
            ':a'  => round($amount, 2),
            ':ed' => $date,
        ]);

        json_response(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }

    public function delete(array $args): void
    {
        $id = (int) $args[0];
        if ($id <= 0) json_error('Invalid expense id', 422);

        $stmt = db()->prepare('DELETE FROM expenses WHERE id = :id');
        $stmt->execute([':id' => $id]);

        json_response(['ok' => true]);
    }
}