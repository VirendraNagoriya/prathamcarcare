-- Add GST / company-details columns to the existing settings table.
-- Idempotent-friendly: each ADD COLUMN fails silently if already present
-- (MySQL doesn't support IF NOT EXISTS here), so verify each one exists.
--
-- Run against your *target* database:
--   XAMPP:  C:\xampp\mysql\bin\mysql.exe -u root pratham_care < db\migrate_settings.sql
--   phpMyAdmin (Hostinger): open your DB, SQL tab, paste this file's contents.

ALTER TABLE settings ADD COLUMN gst_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER pin_changed_at;
ALTER TABLE settings ADD COLUMN company_name VARCHAR(255) NOT NULL DEFAULT '' AFTER gst_enabled;
ALTER TABLE settings ADD COLUMN company_address VARCHAR(255) NOT NULL DEFAULT '' AFTER company_name;
ALTER TABLE settings ADD COLUMN company_phone VARCHAR(20) NOT NULL DEFAULT '' AFTER company_address;
ALTER TABLE settings ADD COLUMN company_email VARCHAR(255) NOT NULL DEFAULT '' AFTER company_phone;
ALTER TABLE settings ADD COLUMN company_gstin VARCHAR(20) NOT NULL DEFAULT '' AFTER company_email;
ALTER TABLE settings ADD COLUMN company_pan VARCHAR(20) NOT NULL DEFAULT '' AFTER company_gstin;