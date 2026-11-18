package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.PreferenciasMascota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PreferenciasMascotaRepository extends JpaRepository<PreferenciasMascota, Long> {

    Optional<PreferenciasMascota> findByUsuarioId(Long usuarioId);
}
