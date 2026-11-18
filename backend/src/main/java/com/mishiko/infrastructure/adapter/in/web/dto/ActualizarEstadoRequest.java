package com.mishiko.infrastructure.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActualizarEstadoRequest {

    @NotNull(message = "El estado es requerido")
    private String estado;

    private String observacion;
}
