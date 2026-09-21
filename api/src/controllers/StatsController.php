<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class StatsController
{
    public function today(): void
    {
        $sheet = $this->sheetFor(date('Y-m-d'));
        json_response([
            'date'        => $sheet['date'],
            'bills'       => $sheet['bills'],
            'total'       => $sheet['billed_total'],
            'expenses'    => $sheet['expense_total'],
            'net'         => $sheet['net'],
        ]);
    }

    public function daysheet(): void
    {
        $date = trim((string) ($_GET['date'] ?? date('Y-m-d')));
        if ($date === '') $date = date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            json_error('date must use YYYY-MM-DD format', 422);
        }
        json_response($this->sheetFor($date));
    }

    private function sheetFor(string $date): array
    {
        $pdo = db();

        $billsRow = $pdo->prepare(
            'SELECT COUNT(*) AS bills, COALESCE(SUM(total_amount), 0) AS total
             FROM invoices WHERE DATE(created_at) = :d'
        );
        $billsRow->execute([':d' => $date]);
        $b = $billsRow->fetch();

        $items = $pdo->prepare(
            'SELECT it.product_name, SUM(it.quantity) AS qty, SUM(it.charged_amount) AS total
             FROM invoice_items it
             JOIN invoices inv ON inv.id = it.invoice_id
             WHERE DATE(inv.created_at) = :d
             GROUP BY it.product_name
             ORDER BY total DESC'
        );
        $items->execute([':d' => $date]);

        $expenses = $pdo->prepare(
            'SELECT id, description, category, amount, expense_date
             FROM expenses WHERE expense_date = :d
             ORDER BY id DESC'
        );
        $expenses->execute([':d' => $date]);
        $expRows = $expenses->fetchAll();

        $expenseTotal = array_sum(array_map(static fn (array $e): float => (float) $e['amount'], $expRows));

        return [
            'date'          => $date,
            'bills'         => (int) $b['bills'],
            'billed_total'  => round((float) $b['total'], 2),
            'items'         => $items->fetchAll(),
            'expenses'      => $expRows,
            'expense_total' => round($expenseTotal, 2),
            'net'           => round((float) $b['total'] - $expenseTotal, 2),
        ];
    }
}