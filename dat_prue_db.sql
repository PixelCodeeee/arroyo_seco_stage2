USE arroyo_seco;

-- ─────────────────────────────────────────────
-- ALTER TABLES (por si no se han ejecutado)
-- ─────────────────────────────────────────────
ALTER TABLE oferente
ADD COLUMN IF NOT EXISTS mp_estado ENUM('pendiente','activo','rechazado') DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS mp_user_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS mp_access_token TEXT NULL,
ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT NULL;

ALTER TABLE pedido
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS id_oferente INT NULL;

-- ─────────────────────────────────────────────
-- 1. USUARIOS
-- ─────────────────────────────────────────────
INSERT INTO usuario (correo, contrasena_hash, nombre, rol) VALUES
('admin@arroyoseco.mx',       '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Admin Sistema',      'admin'),
('carlos.mendoza@gmail.com',  '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Carlos Mendoza',     'oferente'),
('lucia.ramirez@gmail.com',   '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Lucía Ramírez',      'oferente'),
('sofia.torres@gmail.com',    '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Sofía Torres',       'oferente'),
('juan.perez@gmail.com',      '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Juan Pérez',         'turista'),
('maria.lopez@gmail.com',     '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'María López',        'turista'),
('roberto.garcia@gmail.com',  '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Roberto García',     'turista'),
('ana.hernandez@gmail.com',   '$2b$10$xKp8Q1ZvYmN3Lw7Rk9TuOeH5JdF2GcA4BnM6PqW8SvX0YtI1UeZ3', 'Ana Hernández',      'turista');

-- ─────────────────────────────────────────────
-- 2. CÓDIGOS 2FA 
-- ─────────────────────────────────────────────
INSERT INTO codigo_2fa (id_usuario, codigo, fecha_expiracion, usado) VALUES
(5, '482910', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE),
(6, '731205', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE);

-- ─────────────────────────────────────────────
-- 3. CATEGORÍAS
-- ─────────────────────────────────────────────
INSERT INTO categoria (nombre, tipo) VALUES
('Platillos Típicos',     'gastronomica'),
('Bebidas Artesanales',   'gastronomica'),
('Postres y Dulces',      'gastronomica'),
('Textiles',              'artesanal'),
('Cerámica',              'artesanal'),
('Joyería',               'artesanal'),
('Madera Tallada',        'artesanal'),
('Conservas y Mermeladas','artesanal');

-- ─────────────────────────────────────────────
-- 4. OFERENTES (mp_* vacíos como pediste)
-- ─────────────────────────────────────────────
INSERT INTO oferente (id_usuario, nombre_negocio, direccion, tipo, estado, horario_disponibilidad, imagen, telefono, mp_estado, mp_user_id, mp_access_token, mp_refresh_token) VALUES
(2, 'El Fogón de Carlos',    'Calle Hidalgo #45, Arroyo Seco',       'restaurante', 'aprobado', '{"lunes":"09:00-20:00","martes":"09:00-20:00","miercoles":"09:00-20:00","jueves":"09:00-20:00","viernes":"09:00-22:00","sabado":"08:00-22:00","domingo":"08:00-18:00"}', 'fogon_carlos.jpg',   '4421234567', 'pendiente', NULL, NULL, NULL),
(3, 'Artesanías Lucía',      'Av. Juárez #12, Arroyo Seco',          'artesanal',   'aprobado', '{"lunes":"10:00-18:00","martes":"10:00-18:00","miercoles":"10:00-18:00","jueves":"10:00-18:00","viernes":"10:00-19:00","sabado":"09:00-19:00","domingo":"cerrado"}',   'artesanias_lucia.jpg','4427654321', 'pendiente', NULL, NULL, NULL),
(4, 'La Cocina de Sofía',    'Blvd. Revolución #88, Arroyo Seco',    'restaurante', 'aprobado', '{"lunes":"08:00-21:00","martes":"08:00-21:00","miercoles":"08:00-21:00","jueves":"08:00-21:00","viernes":"08:00-22:00","sabado":"07:00-22:00","domingo":"07:00-20:00"}', 'cocina_sofia.jpg',   '4429876543', 'pendiente', NULL, NULL, NULL);

-- ─────────────────────────────────────────────
-- 5. SERVICIOS DE RESTAURANTE
-- ─────────────────────────────────────────────
INSERT INTO servicio_restaurante (id_oferente, nombre, descripcion, rango_precio, capacidad, estatus, imagenes) VALUES
(1, 'Desayuno Tradicional',  'Desayuno con platillos típicos de la región, incluye café de olla y pan artesanal.', '$80-$150',  20, TRUE, '["desayuno1.jpg","desayuno2.jpg"]'),
(1, 'Comida Corrida',        'Menú del día con sopa, guisado, arroz, frijoles y postre.',                          '$100-$180', 30, TRUE, '["comida1.jpg"]'),
(3, 'Brunch Familiar',       'Brunch con opciones veganas y tradicionales, ideal para familias.',                  '$120-$200', 25, TRUE, '["brunch1.jpg","brunch2.jpg"]'),
(3, 'Cena Romántica',        'Mesa especial para 2 personas con decoración y menú especial.',                     '$350-$500', 2,  TRUE, '["cena1.jpg"]');

-- ─────────────────────────────────────────────
-- 6. PRODUCTOS
-- ─────────────────────────────────────────────
INSERT INTO producto (id_oferente, id_categoria, nombre, descripcion, precio, inventario, imagenes, estatus) VALUES
-- Fogón de Carlos (restaurante → vende productos también)
(1, 3, 'Mermelada de Guayaba',   'Mermelada artesanal hecha con guayabas de la región, sin conservadores.', 85.00,  30, '["mermelada_guayaba.jpg"]', TRUE),
(1, 2, 'Café de Olla 500g',      'Café molido preparado con canela y piloncillo, receta tradicional.',      120.00, 20, '["cafe_olla.jpg"]',         TRUE),
(1, 3, 'Cajeta Artesanal',       'Cajeta de leche de cabra, elaborada de forma tradicional.',               95.00,  15, '["cajeta.jpg"]',            TRUE),
-- Artesanías Lucía
(2, 4, 'Rebozo de Lana',         'Rebozo tejido a mano con lana natural, colores tradicionales queretanos.', 650.00, 8,  '["rebozo.jpg"]',            TRUE),
(2, 5, 'Tazón de Barro',         'Tazón decorativo de barro negro con diseños prehispánicos.',               180.00, 25, '["tazon_barro.jpg"]',       TRUE),
(2, 6, 'Aretes de Plata',        'Aretes de plata 925 con incrustaciones de obsidiana.',                    320.00, 12, '["aretes_plata.jpg"]',      TRUE),
(2, 7, 'Figura de Madera',       'Figura tallada a mano en madera de mezquite, diseño de águila.',          450.00, 5,  '["figura_madera.jpg"]',     TRUE),
-- La Cocina de Sofía
(3, 1, 'Enchiladas Queretanas',  'Porción de enchiladas con salsa roja, crema y queso fresco.',              95.00,  50, '["enchiladas.jpg"]',        TRUE),
(3, 2, 'Agua de Jamaica 1L',     'Agua fresca de jamaica con un toque de limón y menta.',                    45.00,  40, '["agua_jamaica.jpg"]',      TRUE),
(3, 3, 'Chongos Zamoranos',      'Postre tradicional de leche cuajada con azúcar y canela.',                 65.00,  20, '["chongos.jpg"]',           TRUE);

-- ─────────────────────────────────────────────
-- 7. PEDIDOS
-- ─────────────────────────────────────────────
INSERT INTO pedido (id_usuario, monto_total, estado, metodo_pago, payment_id, id_oferente) VALUES
(5, 205.00, 'completado', 'mercadopago', 'MP-TEST-001', 1),
(6, 830.00, 'completado', 'mercadopago', 'MP-TEST-002', 2),
(7, 140.00, 'pagado',     'mercadopago', 'MP-TEST-003', 3),
(8, 95.00,  'pendiente',  NULL,           NULL,          1),
(5, 320.00, 'completado', 'mercadopago', 'MP-TEST-004', 2);

-- ─────────────────────────────────────────────
-- 8. ITEMS DE PEDIDO
-- ─────────────────────────────────────────────
INSERT INTO item_pedido (id_pedido, id_producto, cantidad, precio_compra) VALUES
(1, 1, 1, 85.00),   -- Mermelada
(1, 2, 1, 120.00),  -- Café
(2, 4, 1, 650.00),  -- Rebozo
(2, 5, 1, 180.00),  -- Tazón
(3, 8, 1, 95.00),   -- Enchiladas
(3, 9, 1, 45.00),   -- Agua Jamaica
(4, 1, 1, 85.00),   -- Mermelada (pendiente)
(5, 6, 1, 320.00);  -- Aretes

-- ─────────────────────────────────────────────
-- 9. CARRITO (usuarios con productos en carrito)
-- ─────────────────────────────────────────────
INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES
(5, 3,  1),  -- Juan → Cajeta
(5, 7,  1),  -- Juan → Figura de madera
(6, 10, 2),  -- María → Chongos x2
(7, 4,  1),  -- Roberto → Rebozo
(8, 8,  1),  -- Ana → Enchiladas
(8, 9,  2);  -- Ana → Agua Jamaica x2

-- ─────────────────────────────────────────────
-- 10. RESERVAS
-- ─────────────────────────────────────────────
INSERT INTO reserva (id_usuario, id_servicio, fecha, hora, numero_personas, estado, notas) VALUES
(5, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY),  '09:00:00', 2, 'confirmada', 'Mesa junto a la ventana por favor'),
(6, 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY),  '11:00:00', 4, 'confirmada', 'Celebración de cumpleaños'),
(7, 4, DATE_ADD(CURDATE(), INTERVAL 5 DAY),  '20:00:00', 2, 'pendiente',  'Aniversario, flores si es posible'),
(8, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY),  '14:00:00', 3, 'confirmada', NULL),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '10:00:00', 5, 'pendiente',  'Reunión familiar');

SELECT 'Datos de prueba insertados correctamente ' AS status;