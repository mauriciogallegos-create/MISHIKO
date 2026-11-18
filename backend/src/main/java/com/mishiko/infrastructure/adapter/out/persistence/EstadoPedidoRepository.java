package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstadoPedidoRepository extends JpaRepository<EstadoPedido, Long> {

    List<EstadoPedido> findByPedidoIdOrderByCreatedAtDesc(Long pedidoId);
}
