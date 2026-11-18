package com.mishiko.infrastructure.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CrearPedidoRequest {

    @NotNull(message = "El ID de la mesa es requerido")
    private Long mesaId;

    @NotNull(message = "El ID del restaurante es requerido")
    private Long restauranteId;

    private String nombreCliente;

    private String observaciones;

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<ItemPedidoRequest> items;
}
