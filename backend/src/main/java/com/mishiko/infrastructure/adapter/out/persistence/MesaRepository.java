package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Mesa;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MesaRepository extends JpaRepository<Mesa, Long> {

    List<Mesa> findByRestauranteId(Long restauranteId);

    Optional<Mesa> findByRestauranteIdAndNumero(Long restauranteId, Integer numero);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Mesa m WHERE m.id = :id")
    Optional<Mesa> buscarParaCrearPedido(@Param("id") Long id);
}
