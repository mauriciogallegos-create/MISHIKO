package com.mishiko.infrastructure.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private Boolean activa;
    private Integer ordenDisplay;
    private Long restauranteId;
    private Long cantidadProductos;
}
