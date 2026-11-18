package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.MesaUseCase;
import com.mishiko.infrastructure.adapter.in.web.dto.MesaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AdminMesaController {

    private final MesaUseCase mesaUseCase;

    // Endpoint público para consultar mesas del restaurante
    @GetMapping("/mesas")
    public ResponseEntity<List<MesaResponse>> getMesasPublicas(
            @RequestParam(defaultValue = "1") Long restauranteId) {
        return ResponseEntity.ok(mesaUseCase.getMesasByRestaurante(restauranteId));
    }

    // Endpoints de administración (requiere rol ADMIN)
    @GetMapping("/admin/mesas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MesaResponse>> getMesasAdmin(
            @RequestParam(defaultValue = "1") Long restauranteId) {
        return ResponseEntity.ok(mesaUseCase.getMesasByRestaurante(restauranteId));
    }

    @PostMapping("/admin/mesas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MesaResponse> crearMesa(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mesaUseCase.crearMesa(body));
    }

    @PutMapping("/admin/mesas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MesaResponse> actualizarMesa(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(mesaUseCase.actualizarMesa(id, body));
    }

    @PatchMapping("/admin/mesas/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MesaResponse> toggleDisponibilidad(@PathVariable Long id) {
        return ResponseEntity.ok(mesaUseCase.toggleDisponibilidad(id));
    }

    @DeleteMapping("/admin/mesas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarMesa(@PathVariable Long id) {
        mesaUseCase.eliminarMesa(id);
        return ResponseEntity.noContent().build();
    }
}
