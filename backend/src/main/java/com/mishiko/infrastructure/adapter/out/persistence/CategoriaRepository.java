package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByRestauranteIdAndActivaTrueOrderByOrdenDisplayAsc(Long restauranteId);

    List<Categoria> findByRestauranteIdOrderByOrdenDisplayAscIdAsc(Long restauranteId);

    List<Categoria> findByRestauranteId(Long restauranteId);

    boolean existsByRestauranteIdAndNombreIgnoreCase(Long restauranteId, String nombre);

    boolean existsByRestauranteIdAndNombreIgnoreCaseAndIdNot(Long restauranteId, String nombre, Long id);
}
