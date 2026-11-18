-- Execute once after mishiko_jpa_alignment.sql.
USE mishiko_db;

ALTER TABLE pedidos
    ADD solicitud_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
    ADD CONSTRAINT uq_pedido_mesa_solicitud UNIQUE (mesa_id, solicitud_id);
