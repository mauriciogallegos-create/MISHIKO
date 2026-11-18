package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByRestauranteIdAndDisponibleTrue(Long restauranteId);

    List<Producto> findByCategoriaId(Long categoriaId);

    List<Producto> findByRestauranteIdAndNombreContainingIgnoreCase(Long restauranteId, String nombre);

    List<Producto> findByRestauranteId(Long restauranteId);

    List<Producto> findByRestauranteIdAndCategoriaActivaTrueOrderByOrdenDisplayAscIdAsc(Long restauranteId);
}
