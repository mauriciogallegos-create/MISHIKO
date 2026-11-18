package com.mishiko.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_comprobante", nullable = false, unique = true, length = 30)
    private String numeroComprobante;

    @Column(name = "tipo_comprobante", length = 20)
    @Builder.Default
    private String tipoComprobante = "TICKET";

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "estado_pedido", length = 30)
    private String estadoPedido;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "nombre_cliente", length = 150)
    private String nombreCliente;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Pedido pedido;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
