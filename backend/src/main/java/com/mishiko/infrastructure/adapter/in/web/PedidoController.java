package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.PedidoUseCase;
import com.mishiko.infrastructure.adapter.in.web.dto.ActualizarEstadoRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.CrearPedidoRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.PedidoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoUseCase pedidoUseCase;

    // ── Rutas públicas (cliente) ───────────────────────────────────────────────

    @PostMapping("/pedidos")
    public ResponseEntity<PedidoResponse> crearPedido(@Valid @RequestBody CrearPedidoRequest request) {
        PedidoResponse response = pedidoUseCase.crearPedido(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pedidos/{id}")
    public ResponseEntity<PedidoResponse> getPedidoById(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoUseCase.getPedidoById(id));
    }

    @GetMapping("/pedidos/numero/{numeroPedido}")
    public ResponseEntity<PedidoResponse> getPedidoByNumero(@PathVariable String numeroPedido) {
        return ResponseEntity.ok(pedidoUseCase.getPedidoByNumero(numeroPedido));
    }

    // ── Cambiar estado (personal/cocina/admin) ────────────────────────────────

    @PutMapping("/pedidos/{id}/estado")
    public ResponseEntity<PedidoResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : "sistema";
        return ResponseEntity.ok(pedidoUseCase.actualizarEstado(id, request, email));
    }

    // ── Admin: todos los pedidos del restaurante ──────────────────────────────

    @GetMapping("/admin/pedidos")
    public ResponseEntity<List<PedidoResponse>> getPedidosByRestaurante(
            @RequestParam(defaultValue = "1") Long restauranteId) {
        return ResponseEntity.ok(pedidoUseCase.getPedidosByRestaurante(restauranteId));
    }

    // ── Cocina: pedidos activos ───────────────────────────────────────────────

    @GetMapping("/cocina/pedidos")
    public ResponseEntity<List<PedidoResponse>> getPedidosActivos() {
        return ResponseEntity.ok(pedidoUseCase.getPedidosActivos());
    }
}
