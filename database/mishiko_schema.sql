-- ============================================================
--  MISHIKO DATABASE SCHEMA
--  Plataforma de gestión de pedidos para restaurantes
--  Versión: 1.0.0
--  Charset: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

-- ------------------------------------------------------------
-- Crear base de datos
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS mishiko_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mishiko_db;

-- ------------------------------------------------------------
-- Desactivar verificación de FK durante la carga
-- ------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre),
    CONSTRAINT chk_roles_nombre CHECK (nombre IN ('ADMIN','PERSONAL','COCINA','CLIENTE'))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Roles de acceso del sistema MISHIKO';

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    apellido   VARCHAR(100) DEFAULT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt',
    telefono   VARCHAR(20)  DEFAULT NULL,
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    role_id    BIGINT       NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT fk_usuarios_role FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema (admins, personal, cocina, clientes)';

CREATE INDEX idx_usuarios_email   ON usuarios (email);
CREATE INDEX idx_usuarios_role_id ON usuarios (role_id);
CREATE INDEX idx_usuarios_activo  ON usuarios (activo);

-- ============================================================
-- TABLA: restaurantes
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurantes (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT         DEFAULT NULL,
    direccion   VARCHAR(255) DEFAULT NULL,
    telefono    VARCHAR(30)  DEFAULT NULL,
    email       VARCHAR(150) DEFAULT NULL,
    logo_url    VARCHAR(500) DEFAULT NULL,
    ruc         VARCHAR(20)  DEFAULT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_restaurantes PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Restaurantes registrados en la plataforma MISHIKO';

CREATE INDEX idx_restaurantes_activo ON restaurantes (activo);

-- ============================================================
-- TABLA: mesas
-- ============================================================
CREATE TABLE IF NOT EXISTS mesas (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    restaurante_id  BIGINT       NOT NULL,
    numero          INT          NOT NULL,
    descripcion     VARCHAR(100) DEFAULT NULL,
    qr_code         VARCHAR(500) DEFAULT NULL COMMENT 'URL del código QR',
    activa          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_mesas PRIMARY KEY (id),
    CONSTRAINT uq_mesas_restaurante_numero UNIQUE (restaurante_id, numero),
    CONSTRAINT fk_mesas_restaurante FOREIGN KEY (restaurante_id)
        REFERENCES restaurantes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Mesas físicas de cada restaurante con su código QR';

CREATE INDEX idx_mesas_restaurante_id ON mesas (restaurante_id);
CREATE INDEX idx_mesas_activa         ON mesas (activa);

-- ============================================================
-- TABLA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    restaurante_id  BIGINT       NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255) DEFAULT NULL,
    imagen_url      VARCHAR(500) DEFAULT NULL,
    orden           INT          NOT NULL DEFAULT 0,
    activa          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_categorias PRIMARY KEY (id),
    CONSTRAINT fk_categorias_restaurante FOREIGN KEY (restaurante_id)
        REFERENCES restaurantes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Categorías del menú por restaurante';

CREATE INDEX idx_categorias_restaurante_id ON categorias (restaurante_id);
CREATE INDEX idx_categorias_orden          ON categorias (orden);
CREATE INDEX idx_categorias_activa         ON categorias (activa);

-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    categoria_id    BIGINT         NOT NULL,
    restaurante_id  BIGINT         NOT NULL,
    nombre          VARCHAR(150)   NOT NULL,
    descripcion     TEXT           DEFAULT NULL,
    precio          DECIMAL(10,2)  NOT NULL,
    imagen_url      VARCHAR(500)   DEFAULT NULL,
    disponible      BOOLEAN        NOT NULL DEFAULT TRUE,
    agotado         BOOLEAN        NOT NULL DEFAULT FALSE,
    destacado       BOOLEAN        NOT NULL DEFAULT FALSE,
    orden           INT            NOT NULL DEFAULT 0,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_productos PRIMARY KEY (id),
    CONSTRAINT chk_productos_precio CHECK (precio >= 0),
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_productos_restaurante FOREIGN KEY (restaurante_id)
        REFERENCES restaurantes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Productos del menú por restaurante';

CREATE INDEX idx_productos_categoria_id   ON productos (categoria_id);
CREATE INDEX idx_productos_restaurante_id ON productos (restaurante_id);
CREATE INDEX idx_productos_disponible     ON productos (disponible);
CREATE INDEX idx_productos_destacado      ON productos (destacado);
CREATE INDEX idx_productos_orden          ON productos (orden);

-- ============================================================
-- TABLA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    restaurante_id  BIGINT         NOT NULL,
    mesa_id         BIGINT         NOT NULL,
    usuario_id      BIGINT         DEFAULT NULL COMMENT 'NULL si pedido anónimo',
    numero_pedido   VARCHAR(20)    NOT NULL COMMENT 'Ej: PED-20241109-001',
    estado          ENUM(
                        'PENDIENTE',
                        'CONFIRMADO',
                        'EN_PREPARACION',
                        'LISTO',
                        'ENTREGADO',
                        'CANCELADO'
                    ) NOT NULL DEFAULT 'PENDIENTE',
    subtotal        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    impuesto        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    total           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    observaciones   TEXT           DEFAULT NULL,
    nombre_cliente  VARCHAR(100)   DEFAULT NULL,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT uq_pedidos_numero UNIQUE (numero_pedido),
    CONSTRAINT chk_pedidos_subtotal CHECK (subtotal  >= 0),
    CONSTRAINT chk_pedidos_impuesto CHECK (impuesto >= 0),
    CONSTRAINT chk_pedidos_total    CHECK (total    >= 0),
    CONSTRAINT fk_pedidos_restaurante FOREIGN KEY (restaurante_id)
        REFERENCES restaurantes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_mesa FOREIGN KEY (mesa_id)
        REFERENCES mesas(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Pedidos realizados en cada mesa';

CREATE INDEX idx_pedidos_restaurante_id ON pedidos (restaurante_id);
CREATE INDEX idx_pedidos_mesa_id        ON pedidos (mesa_id);
CREATE INDEX idx_pedidos_usuario_id     ON pedidos (usuario_id);
CREATE INDEX idx_pedidos_estado         ON pedidos (estado);
CREATE INDEX idx_pedidos_numero_pedido  ON pedidos (numero_pedido);
CREATE INDEX idx_pedidos_created_at     ON pedidos (created_at);

-- ============================================================
-- TABLA: detalle_pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    pedido_id       BIGINT         NOT NULL,
    producto_id     BIGINT         NOT NULL,
    cantidad        INT            NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2)  NOT NULL,
    subtotal        DECIMAL(10,2)  NOT NULL,
    observaciones   TEXT           DEFAULT NULL,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_detalle_pedido PRIMARY KEY (id),
    CONSTRAINT chk_detalle_cantidad        CHECK (cantidad        > 0),
    CONSTRAINT chk_detalle_precio_unitario CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_subtotal        CHECK (subtotal        >= 0),
    CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Líneas de detalle de cada pedido';

CREATE INDEX idx_detalle_pedido_pedido_id   ON detalle_pedido (pedido_id);
CREATE INDEX idx_detalle_pedido_producto_id ON detalle_pedido (producto_id);

-- ============================================================
-- TABLA: estados_pedido  (historial de cambios de estado)
-- ============================================================
CREATE TABLE IF NOT EXISTS estados_pedido (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    pedido_id   BIGINT       NOT NULL,
    estado      ENUM(
                    'PENDIENTE',
                    'CONFIRMADO',
                    'EN_PREPARACION',
                    'LISTO',
                    'ENTREGADO',
                    'CANCELADO'
                ) NOT NULL,
    observacion VARCHAR(255) DEFAULT NULL,
    usuario_id  BIGINT       DEFAULT NULL COMMENT 'Usuario que realizó el cambio',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_estados_pedido PRIMARY KEY (id),
    CONSTRAINT fk_estados_pedido_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_estados_pedido_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de cambios de estado por pedido (audit trail)';

CREATE INDEX idx_estados_pedido_pedido_id  ON estados_pedido (pedido_id);
CREATE INDEX idx_estados_pedido_usuario_id ON estados_pedido (usuario_id);
CREATE INDEX idx_estados_pedido_estado     ON estados_pedido (estado);
CREATE INDEX idx_estados_pedido_created_at ON estados_pedido (created_at);

-- ============================================================
-- TABLA: comprobantes
-- ============================================================
CREATE TABLE IF NOT EXISTS comprobantes (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    pedido_id           BIGINT         NOT NULL,
    numero_comprobante  VARCHAR(30)    NOT NULL COMMENT 'Ej: COMP-20241109-001',
    restaurante_id      BIGINT         NOT NULL,
    subtotal            DECIMAL(10,2)  NOT NULL,
    impuesto            DECIMAL(10,2)  NOT NULL,
    total               DECIMAL(10,2)  NOT NULL,
    metodo_pago         VARCHAR(50)    DEFAULT NULL,
    estado_pedido       VARCHAR(50)    DEFAULT NULL,
    pdf_url             VARCHAR(500)   DEFAULT NULL,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_comprobantes PRIMARY KEY (id),
    CONSTRAINT uq_comprobantes_pedido        UNIQUE (pedido_id),
    CONSTRAINT uq_comprobantes_numero        UNIQUE (numero_comprobante),
    CONSTRAINT chk_comprobantes_subtotal     CHECK (subtotal  >= 0),
    CONSTRAINT chk_comprobantes_impuesto     CHECK (impuesto  >= 0),
    CONSTRAINT chk_comprobantes_total        CHECK (total     >= 0),
    CONSTRAINT fk_comprobantes_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_comprobantes_restaurante FOREIGN KEY (restaurante_id)
        REFERENCES restaurantes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Comprobantes/facturas generados por pedido';

CREATE INDEX idx_comprobantes_restaurante_id    ON comprobantes (restaurante_id);
CREATE INDEX idx_comprobantes_numero_comprobante ON comprobantes (numero_comprobante);
CREATE INDEX idx_comprobantes_created_at         ON comprobantes (created_at);

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    pedido_id   BIGINT       NOT NULL,
    usuario_id  BIGINT       DEFAULT NULL,
    tipo        VARCHAR(50)  DEFAULT NULL
                COMMENT 'PEDIDO_RECIBIDO | CONFIRMADO | EN_PREPARACION | LISTO | ENTREGADO',
    titulo      VARCHAR(150) DEFAULT NULL,
    mensaje     TEXT         DEFAULT NULL,
    leida       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Notificaciones en tiempo real del flujo de pedidos';

CREATE INDEX idx_notificaciones_pedido_id  ON notificaciones (pedido_id);
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones (usuario_id);
CREATE INDEX idx_notificaciones_leida      ON notificaciones (leida);
CREATE INDEX idx_notificaciones_tipo       ON notificaciones (tipo);
CREATE INDEX idx_notificaciones_created_at ON notificaciones (created_at);

-- ============================================================
-- TABLA: preferencias_mascota
-- ============================================================
CREATE TABLE IF NOT EXISTS preferencias_mascota (
    id                BIGINT         NOT NULL AUTO_INCREMENT,
    usuario_id        BIGINT         NOT NULL,
    nombre_mascota    VARCHAR(50)    NOT NULL DEFAULT 'Michi',
    color_pelaje      VARCHAR(20)    NOT NULL DEFAULT 'naranja',
    voz_seleccionada  VARCHAR(100)   DEFAULT NULL,
    volumen           DECIMAL(3,2)   NOT NULL DEFAULT 1.00,
    voz_activa        BOOLEAN        NOT NULL DEFAULT TRUE,
    mostrar_mascota   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_preferencias_mascota PRIMARY KEY (id),
    CONSTRAINT uq_preferencias_mascota_usuario UNIQUE (usuario_id),
    CONSTRAINT chk_preferencias_volumen CHECK (volumen BETWEEN 0.00 AND 1.00),
    CONSTRAINT fk_preferencias_mascota_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Personalización de la mascota virtual Michi por usuario';

CREATE INDEX idx_preferencias_mascota_usuario_id ON preferencias_mascota (usuario_id);

-- ------------------------------------------------------------
-- Reactivar verificación de FK
-- ------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
