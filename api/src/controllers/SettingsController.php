<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

final class SettingsController
{
    public function get(): void
    {
        $row = settings_row();
        unset($row['pin_hash']);
        json_response($row);
    }

    public function update(): void
    {
        require_auth();

        $body = read_json_body();
        $pdo  = db();

        $fields   = [];
        $bindings = [];

        if (array_key_exists('shop_phone', $body)) {
            $phone = (string) $body['shop_phone'];
            if ($phone !== '' && !preg_match('/^(\+91)?[6-9]\d{9}$/', $phone)) {
                json_error('Invalid shop phone number. Use format: 9876543210 or +919876543210', 422);
            }
            $fields[]   = 'shop_phone = :phone';
            $bindings[':phone'] = $phone;
        }
        if (array_key_exists('google_place_id', $body)) {
            $fields[]   = 'google_place_id = :gpid';
            $bindings[':gpid'] = (string) $body['google_place_id'];
        }
        if (array_key_exists('reminder_days_before', $body)) {
            $days = (int) $body['reminder_days_before'];
            if ($days < 1 || $days > 30) {
                json_error('Reminder days must be between 1 and 30', 422);
            }
            $fields[]   = 'reminder_days_before = :rdb';
            $bindings[':rdb'] = $days;
        }

        if (array_key_exists('new_pin', $body) || array_key_exists('pin', $body)) {
            $oldPin = (string) ($body['old_pin'] ?? '');
            $newPin = (string) ($body['new_pin'] ?? $body['pin'] ?? '');

            if ($newPin === '' || strlen($newPin) < 4) {
                json_error('New PIN must be at least 4 characters', 422);
            }
            if ($oldPin === '') {
                json_error('Old PIN is required to change PIN', 422);
            }

            $currentHash = settings_row($pdo)['pin_hash'];
            if (!password_verify($oldPin, $currentHash)) {
                json_error('Old PIN is incorrect', 403);
            }

            $fields[]           = 'pin_hash = :pin_hash';
            $fields[]           = 'pin_changed_at = NOW()';
            $bindings[':pin_hash'] = password_hash($newPin, PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            json_error('No fields to update', 422);
        }

        $sql = 'UPDATE settings SET ' . implode(', ', $fields) . ' WHERE id = 1';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bindings);

        $row = settings_row($pdo);
        unset($row['pin_hash']);
        json_response($row);
    }
}