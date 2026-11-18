package com.mishiko.infrastructure.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String imagenUrl;
    private Boolean disponible;
    private Integer tiempoPreparacion;
    private Integer ordenDisplay;
    private String alergenos;
    private Long categoriaId;
    private String categoriaNombre;
    private Long restauranteId;
    private LocalDateTime createdAt;
}
