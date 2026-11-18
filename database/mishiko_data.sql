-- ============================================================
--  MISHIKO DATABASE - DATOS INICIALES Y DE EJEMPLO
--  Plataforma de gestión de pedidos para restaurantes
--  Versión: 1.0.0
--  Charset: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================
--
--  IMPORTANTE: Ejecutar DESPUÉS de mishiko_schema.sql
--  Uso:  mysql -u root -p mishiko_db < mishiko_data.sql
--
-- ============================================================

USE mishiko_db;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- BLOQUE 1: ROLES
-- ============================================================
START TRANSACTION;

INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN',    'Administrador con acceso total al sistema'),
    ('PERSONAL', 'Personal de sala: toma pedidos y atiende mesas'),
    ('COCINA',   'Personal de cocina: visualiza y actualiza estados de preparación'),
    ('CLIENTE',  'Cliente final: accede al menú y realiza pedidos desde la mesa')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

COMMIT;

-- ============================================================
-- BLOQUE 2: USUARIO ADMINISTRADOR
-- ============================================================
START TRANSACTION;

INSERT INTO usuarios (nombre, apellido, email, password, telefono, activo, role_id) VALUES
    (
        'Admin',
        'MISHIKO',
        'admin@mishiko.com',
        '$2a$10$QlgosNcx8lLRAsG7Luh7IOU3tQrLyqbz7.h6IeIbtA5YU6u6MQXia',  -- bcrypt de 'admin123'
        '+51 999 000 001',
        TRUE,
        (SELECT id FROM roles WHERE nombre = 'ADMIN')
    )
ON DUPLICATE KEY UPDATE
    nombre   = VALUES(nombre),
    apellido = VALUES(apellido),
    password = VALUES(password);

COMMIT;

-- ============================================================
-- BLOQUE 3: RESTAURANTE DEMO
-- ============================================================
START TRANSACTION;

INSERT INTO restaurantes (nombre, descripcion, direccion, telefono, email, logo_url, ruc, activo) VALUES
    (
        'MISHIKO Restaurant',
        'Restaurante demo de la plataforma MISHIKO. Gestión de pedidos inteligente con mascota virtual.',
        'Av. Larco 1301, Miraflores, Lima, Perú',
        '+51 01 234-5678',
        'contacto@mishiko.com',
        '/assets/images/mishiko_logo.png',
        '20123456789',
        TRUE
    );

COMMIT;

-- ============================================================
-- BLOQUE 4: MESAS (4 mesas para el restaurante demo)
-- ============================================================
START TRANSACTION;

INSERT INTO mesas (restaurante_id, numero, descripcion, qr_code, activa)
SELECT
    r.id,
    t.numero,
    t.descripcion,
    CONCAT('https://mishiko.com/qr/mesa/', r.id, '/', t.numero),
    TRUE
FROM restaurantes r
CROSS JOIN (
    SELECT 1 AS numero, 'Mesa junto a la ventana'  AS descripcion UNION ALL
    SELECT 2,           'Mesa central del salón'               UNION ALL
    SELECT 3,           'Mesa del rincón, ideal para grupos'   UNION ALL
    SELECT 4,           'Mesa terraza exterior'
) AS t
WHERE r.nombre = 'MISHIKO Restaurant';

COMMIT;

-- ============================================================
-- BLOQUE 5: CATEGORÍAS DEL MENÚ
-- ============================================================
START TRANSACTION;

INSERT INTO categorias (restaurante_id, nombre, descripcion, imagen_url, orden, activa)
SELECT
    r.id,
    c.nombre,
    c.descripcion,
    c.imagen_url,
    c.orden,
    TRUE
FROM restaurantes r
CROSS JOIN (
    SELECT 'Entradas'          AS nombre,
           'Aperitivos y entradas frescas para comenzar'       AS descripcion,
           '/assets/images/categorias/entradas.jpg'            AS imagen_url,
           1                                                   AS orden
    UNION ALL
    SELECT 'Platos Principales',
           'Platos de fondo con sabores tradicionales peruanos',
           '/assets/images/categorias/platos_principales.jpg',
           2
    UNION ALL
    SELECT 'Bebidas',
           'Bebidas frías, calientes y cocteles de la casa',
           '/assets/images/categorias/bebidas.jpg',
           3
    UNION ALL
    SELECT 'Postres',
           'Dulces y postres artesanales para cerrar con broche de oro',
           '/assets/images/categorias/postres.jpg',
           4
) AS c
WHERE r.nombre = 'MISHIKO Restaurant';

COMMIT;

-- ============================================================
-- BLOQUE 6: PRODUCTOS (12 productos de ejemplo — precios en S/)
-- ============================================================
START TRANSACTION;

-- Entradas (3 productos)
INSERT INTO productos (categoria_id, restaurante_id, nombre, descripcion, precio, imagen_url, disponible, agotado, destacado, orden)
SELECT
    cat.id,
    r.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.imagen_url,
    TRUE,
    FALSE,
    p.destacado,
    p.orden
FROM restaurantes r
JOIN categorias cat ON cat.restaurante_id = r.id AND cat.nombre = 'Entradas'
CROSS JOIN (
    SELECT 'Ceviche Clásico'       AS nombre,
           'Pescado fresco marinado en limón con cebolla, ají limo y choclo'  AS descripcion,
           28.00                   AS precio,
           '/assets/images/productos/ceviche_clasico.jpg'   AS imagen_url,
           TRUE                    AS destacado,
           1                       AS orden
    UNION ALL
    SELECT 'Tequeños de Queso',
           'Palitos de masa frita rellenos de queso gouda derretido (8 unidades)',
           18.00,
           '/assets/images/productos/teques.jpg',
           FALSE,
           2
    UNION ALL
    SELECT 'Causa Limeña',
           'Papa amarilla rellena de pollo o atún con mayonesa y palta',
           22.00,
           '/assets/images/productos/causa.jpg',
           FALSE,
           3
) AS p
WHERE r.nombre = 'MISHIKO Restaurant';

-- Platos Principales (3 productos)
INSERT INTO productos (categoria_id, restaurante_id, nombre, descripcion, precio, imagen_url, disponible, agotado, destacado, orden)
SELECT
    cat.id,
    r.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.imagen_url,
    TRUE,
    FALSE,
    p.destacado,
    p.orden
FROM restaurantes r
JOIN categorias cat ON cat.restaurante_id = r.id AND cat.nombre = 'Platos Principales'
CROSS JOIN (
    SELECT 'Lomo Saltado'          AS nombre,
           'Lomo de res salteado con tomate, cebolla, ají amarillo y papas fritas, acompañado de arroz' AS descripcion,
           45.00                   AS precio,
           '/assets/images/productos/lomo_saltado.jpg'      AS imagen_url,
           TRUE                    AS destacado,
           1                       AS orden
    UNION ALL
    SELECT 'Arroz con Leche',
           'Pollo a la brasa con papas doradas, ensalada fresca y cremas de la casa (1/4 de pollo)',
           38.00,
           '/assets/images/productos/pollo_brasa.jpg',
           TRUE,
           2
    UNION ALL
    SELECT 'Aji de Gallina',
           'Pechuga de gallina desmenuzada en crema de ají amarillo con pan de molde, aceitunas y huevo duro',
           32.00,
           '/assets/images/productos/aji_gallina.jpg',
           FALSE,
           3
) AS p
WHERE r.nombre = 'MISHIKO Restaurant';

-- Bebidas (3 productos)
INSERT INTO productos (categoria_id, restaurante_id, nombre, descripcion, precio, imagen_url, disponible, agotado, destacado, orden)
SELECT
    cat.id,
    r.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.imagen_url,
    TRUE,
    FALSE,
    p.destacado,
    p.orden
FROM restaurantes r
JOIN categorias cat ON cat.restaurante_id = r.id AND cat.nombre = 'Bebidas'
CROSS JOIN (
    SELECT 'Pisco Sour'            AS nombre,
           'Coctel peruano a base de pisco quebranta, limón, jarabe de goma y clara de huevo' AS descripcion,
           22.00                   AS precio,
           '/assets/images/productos/pisco_sour.jpg'        AS imagen_url,
           TRUE                    AS destacado,
           1                       AS orden
    UNION ALL
    SELECT 'Chicha Morada',
           'Bebida tradicional elaborada con maíz morado, piña, canela y clavo de olor (500 ml)',
           10.00,
           '/assets/images/productos/chicha_morada.jpg',
           FALSE,
           2
    UNION ALL
    SELECT 'Limonada Frozen',
           'Limonada helada con menta fresca, preparada al momento (400 ml)',
           12.00,
           '/assets/images/productos/limonada.jpg',
           FALSE,
           3
) AS p
WHERE r.nombre = 'MISHIKO Restaurant';

-- Postres (3 productos)
INSERT INTO productos (categoria_id, restaurante_id, nombre, descripcion, precio, imagen_url, disponible, agotado, destacado, orden)
SELECT
    cat.id,
    r.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.imagen_url,
    TRUE,
    FALSE,
    p.destacado,
    p.orden
FROM restaurantes r
JOIN categorias cat ON cat.restaurante_id = r.id AND cat.nombre = 'Postres'
CROSS JOIN (
    SELECT 'Suspiro Limeño'        AS nombre,
           'Postre tradicional de manjar blanco cubierto con merengue de Oporto'  AS descripcion,
           16.00                   AS precio,
           '/assets/images/productos/suspiro.jpg'           AS imagen_url,
           TRUE                    AS destacado,
           1                       AS orden
    UNION ALL
    SELECT 'Tres Leches',
           'Bizcocho esponjoso bañado en tres tipos de leche con crema chantilly y fresas',
           18.00,
           '/assets/images/productos/tres_leches.jpg',
           FALSE,
           2
    UNION ALL
    SELECT 'Picarones con Miel',
           'Rosquillas de zapallo y camote fritas, bañadas en miel de chancaca con clavo y canela',
           14.00,
           '/assets/images/productos/picarones.jpg',
           FALSE,
           3
) AS p
WHERE r.nombre = 'MISHIKO Restaurant';

COMMIT;

-- ============================================================
-- BLOQUE 7: PREFERENCIAS DE MASCOTA para el admin
-- ============================================================
START TRANSACTION;

INSERT INTO preferencias_mascota
    (usuario_id, nombre_mascota, color_pelaje, voz_seleccionada, volumen, voz_activa, mostrar_mascota)
SELECT
    u.id,
    'Michi',
    'naranja',
    'es-PE-Standard-A',
    1.00,
    TRUE,
    TRUE
FROM usuarios u
WHERE u.email = 'admin@mishiko.com'
ON DUPLICATE KEY UPDATE
    nombre_mascota   = VALUES(nombre_mascota),
    color_pelaje     = VALUES(color_pelaje),
    voz_seleccionada = VALUES(voz_seleccionada),
    volumen          = VALUES(volumen),
    voz_activa       = VALUES(voz_activa),
    mostrar_mascota  = VALUES(mostrar_mascota);

COMMIT;

-- ============================================================
-- REACTIVAR FK
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICACIÓN RÁPIDA
-- ============================================================
SELECT 'roles'                AS tabla, COUNT(*) AS registros FROM roles
UNION ALL SELECT 'usuarios',               COUNT(*) FROM usuarios
UNION ALL SELECT 'restaurantes',           COUNT(*) FROM restaurantes
UNION ALL SELECT 'mesas',                  COUNT(*) FROM mesas
UNION ALL SELECT 'categorias',             COUNT(*) FROM categorias
UNION ALL SELECT 'productos',              COUNT(*) FROM productos
UNION ALL SELECT 'preferencias_mascota',   COUNT(*) FROM preferencias_mascota;

-- ============================================================
-- FIN DEL SCRIPT DE DATOS
-- ============================================================
