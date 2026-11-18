package com.mishiko.infrastructure.adapter.out.persistence;

import com.mishiko.domain.model.Rol;
import com.mishiko.domain.model.RolNombre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(RolNombre nombre);
}
