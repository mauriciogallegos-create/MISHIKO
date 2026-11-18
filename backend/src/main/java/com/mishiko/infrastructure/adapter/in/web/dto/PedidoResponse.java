package com.mishiko.infrastructure.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResponse {

    private Long id;
    private String numeroPedido;
    private String estado;
    private String nombreCliente;
    private String observaciones;
    private Long mesaId;
    private Integer mesaNumero;
    private Long restauranteId;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private BigDecimal total;
    private List<DetallePedidoResponse> detalles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetallePedidoResponse {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private String productoImagenUrl;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
        private String observaciones;
    }
}
