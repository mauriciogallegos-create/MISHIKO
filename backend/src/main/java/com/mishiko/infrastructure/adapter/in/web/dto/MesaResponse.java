package com.mishiko.infrastructure.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MesaResponse {
    private Long id;
    private Integer numero;
    private String descripcion;
    private Integer capacidad;
    private Boolean disponible;
    private String qrUrl;
    private Long restauranteId;
    private String restauranteNombre;
}
