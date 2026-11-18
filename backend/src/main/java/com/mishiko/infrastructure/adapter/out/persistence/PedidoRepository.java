package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.EstadoPedidoEnum;
import com.mishiko.domain.model.Pedido;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByMesaIdAndEstadoNot(Long mesaId, EstadoPedidoEnum estado);

    List<Pedido> findByRestauranteIdOrderByCreatedAtDesc(Long restauranteId);

    List<Pedido> findByEstadoIn(List<EstadoPedidoEnum> estados);

    long countByRestauranteIdAndCreatedAtBetween(Long restauranteId, LocalDateTime inicio, LocalDateTime fin);

    Optional<Pedido> findByNumeroPedido(String numeroPedido);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Pedido p WHERE p.id = :id")
    Optional<Pedido> buscarParaActualizarEstado(@Param("id") Long id);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(p.numeroPedido, 4) AS long)), 0) FROM Pedido p WHERE p.numeroPedido LIKE 'PED%'")
    Long findMaxNumeroPedido();
}
