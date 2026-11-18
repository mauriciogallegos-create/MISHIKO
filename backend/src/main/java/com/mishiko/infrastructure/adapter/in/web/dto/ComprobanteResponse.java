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
public class ComprobanteResponse {

    private Long id;
    private String numeroComprobante;
    private String tipoComprobante;
    private String nombreCliente;
    private BigDecimal subtotal;
    private BigDecimal impuesto;
    private BigDecimal total;
    private String metodoPago;
    private String estadoPedido;
    private String pdfUrl;
    private Long pedidoId;
    private String numeroPedido;
    private LocalDateTime createdAt;
}
