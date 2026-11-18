package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    Optional<Comprobante> findByPedidoId(Long pedidoId);

    Optional<Comprobante> findByNumeroComprobante(String numeroComprobante);

    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(c.numeroComprobante, 5) AS long)), 0) FROM Comprobante c WHERE c.numeroComprobante LIKE 'COMP%'")
    Long findMaxNumeroComprobante();
}
