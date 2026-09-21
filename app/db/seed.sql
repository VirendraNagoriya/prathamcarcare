-- 34 native diagnostic operations & mechanical consumables (per spec section 3)
-- Prices default to 0.00; launch app → Products screen to set rates.

INSERT INTO catalog (name, price, sort_order) VALUES
('Engine Oil', 0.00, 1),
('Oil Filter', 0.00, 2),
('Oil Flush', 0.00, 3),
('Oil Treatment', 0.00, 4),
('Coolant', 0.00, 5),
('Gear Oil', 0.00, 6),
('Throttle Body Cleaning', 0.00, 7),
('Injector Cleaning', 0.00, 8),
('Brake Oil', 0.00, 9),
('Brake Cleaning', 0.00, 10),
('Brake Pad', 0.00, 11),
('Brake Liner', 0.00, 12),
('Brake Wheel Cylinder', 0.00, 13),
('Disk Cutting', 0.00, 14),
('Drum Cutting', 0.00, 15),
('Servicing', 0.00, 16),
('Washing & Cleaning', 0.00, 17),
('Brake Booster', 0.00, 18),
('Master Cylinder', 0.00, 19),
('Clutch Set', 0.00, 20),
('Clutch Bearing', 0.00, 21),
('Fly Wheel', 0.00, 22),
('Clutch Labor Charge', 0.00, 23),
('Head Repairing', 0.00, 24),
('Block Repairing', 0.00, 25),
('Piston Ring', 0.00, 26),
('Head Gasket', 0.00, 27),
('Packing Set', 0.00, 28),
('Oil Seal', 0.00, 29),
('Oil Pump', 0.00, 30),
('Water Pump', 0.00, 31),
('Boss Pump', 0.00, 32),
('Wheel Bearing', 0.00, 33),
('Head Light', 0.00, 34);

-- Default settings row (id = 1). Default PIN is 1234 (bcrypt).
-- Change the PIN from inside the app (Old PIN + New PIN) or replace pin_hash below
-- with output of: php -r "echo password_hash('YOURPIN', PASSWORD_DEFAULT);"
INSERT INTO settings (id, app_name, shop_phone, google_place_id, pin_hash)
VALUES (1, 'Pratham Car Care', '9011560540', 'YOUR_PLACE_ID', '$2y$10$8Y.p4HUimBRlTQ30.I6mZuEJ7LEKrsK.awxkGRUAKcMzbInbvYRUy')
ON DUPLICATE KEY UPDATE id = id;