package com.mishiko.domain.model;

public enum EstadoPedidoEnum {
    PENDIENTE,
    CONFIRMADO,
    EN_PREPARACION,
    LISTO,
    ENTREGADO,
    CANCELADO;

    public boolean permiteTransicionA(EstadoPedidoEnum destino) {
        return switch (this) {
            case PENDIENTE -> destino == CONFIRMADO || destino == CANCELADO;
            case CONFIRMADO -> destino == EN_PREPARACION || destino == CANCELADO;
            case EN_PREPARACION -> destino == LISTO || destino == CANCELADO;
            case LISTO -> destino == ENTREGADO || destino == CANCELADO;
            case ENTREGADO, CANCELADO -> false;
        };
    }
}
