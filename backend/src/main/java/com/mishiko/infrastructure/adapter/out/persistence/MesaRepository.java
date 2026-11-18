package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MesaRepository extends JpaRepository<Mesa, Long> {

    List<Mesa> findByRestauranteId(Long restauranteId);

    Optional<Mesa> findByRestauranteIdAndNumero(Long restauranteId, Integer numero);
}
