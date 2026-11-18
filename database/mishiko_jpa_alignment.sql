-- Execute once after mishiko_schema.sql and mishiko_data.sql on MySQL 8.
-- Align the original schema with the Spring Boot JPA mappings.
USE mishiko_db;
ALTER TABLE categorias RENAME COLUMN orden TO orden_display,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE productos RENAME COLUMN orden TO orden_display,
    ADD tiempo_preparacion INT, ADD alergenos VARCHAR(100);
ALTER TABLE mesas RENAME COLUMN activa TO disponible, RENAME COLUMN qr_code TO codigo_qr,
    ADD capacidad INT NOT NULL DEFAULT 4,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE restaurantes ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE roles ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE usuarios RENAME COLUMN role_id TO rol_id;
ALTER TABLE usuarios ADD foto_url VARCHAR(500),
    ADD restaurante_id BIGINT, ADD FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id);
RENAME TABLE detalle_pedido TO detalles_pedido;
ALTER TABLE pedidos DROP CHECK chk_pedidos_impuesto, RENAME COLUMN impuesto TO igv;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_igv CHECK (igv >= 0);
ALTER TABLE estados_pedido RENAME COLUMN estado TO estado_nuevo,
    ADD estado_anterior ENUM('PENDIENTE','CONFIRMADO','EN_PREPARACION','LISTO','ENTREGADO','CANCELADO');
ALTER TABLE comprobantes DROP CHECK chk_comprobantes_impuesto, RENAME COLUMN impuesto TO igv;
ALTER TABLE comprobantes ADD CONSTRAINT chk_comprobantes_igv CHECK (igv >= 0), MODIFY restaurante_id BIGINT NULL,
    ADD tipo_comprobante VARCHAR(20), ADD nombre_cliente VARCHAR(150),
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE notificaciones MODIFY pedido_id BIGINT NULL,
    ADD referencia_id BIGINT, ADD referencia_tipo VARCHAR(50),
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE roles DROP CHECK chk_roles_nombre,
    MODIFY nombre ENUM('ADMIN','PERSONAL','COCINA','CLIENTE') NOT NULL;
