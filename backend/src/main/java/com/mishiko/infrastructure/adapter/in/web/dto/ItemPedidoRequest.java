package com.mishiko.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ItemPedidoRequest {

    @NotNull(message = "El ID del producto es requerido")
    private Long productoId;

    @NotNull(message = "La cantidad es requerida")
    @Min(value = 1, message = "La cantidad mínima es 1")
    private Integer cantidad;

    private String observaciones;
}
