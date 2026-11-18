package com.mishiko.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "preferencias_mascota")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciasMascota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_mascota", length = 50)
    @Builder.Default
    private String nombreMascota = "Michi";

    @Column(name = "color_pelaje", length = 20)
    @Builder.Default
    private String colorPelaje = "naranja";

    @Column(name = "voz_seleccionada", length = 100)
    private String vozSeleccionada;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal volumen = new BigDecimal("1.0");

    @Column(name = "voz_activa")
    @Builder.Default
    private Boolean vozActiva = true;

    @Column(name = "mostrar_mascota")
    @Builder.Default
    private Boolean mostrarMascota = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
