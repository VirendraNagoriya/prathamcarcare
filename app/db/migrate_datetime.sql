-- Migrate TIMESTAMP columns to DATETIME (avoids the MySQL 2038 timestamp ceiling).
-- Idempotent: safe to run again. Values are preserved (metadata-only change).
--
-- Run against your *target* database:
--   XAMPP:  C:\xampp\mysql\bin\mysql.exe -u root pratham_care < db\migrate_datetime.sql
--   phpMyAdmin (Hostinger): open your DB, Import tab, choose this file.

ALTER TABLE vehicles MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE invoices MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE login_attempts MODIFY attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE reminder_log MODIFY sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE expenses MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;