package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.ProductoUseCase;
import com.mishiko.infrastructure.adapter.in.web.dto.ProductoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.mishiko.infrastructure.adapter.in.web.dto.CategoriaResponse;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para administración de productos (ADMIN).
 * Las rutas de lectura pública están en ProductoController.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductoController {

    private final ProductoUseCase productoUseCase;

    public record CrearCategoria(@NotNull Long restauranteId, @NotBlank @Size(max = 100) String nombre) {}

    @PostMapping("/categorias")
    public ResponseEntity<CategoriaResponse> crearCategoria(@Valid @RequestBody CrearCategoria request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productoUseCase.crearCategoria(request.restauranteId(), request.nombre()));
    }

    @PostMapping("/productos")
    public ResponseEntity<ProductoResponse> crearProducto(@RequestBody Map<String, Object> body) {
        ProductoResponse p = productoUseCase.crearProducto(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(p);
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<ProductoResponse> actualizarProducto(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(productoUseCase.actualizarProducto(id, body));
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoUseCase.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/productos")
    public ResponseEntity<List<ProductoResponse>> getAllProductos(
            @RequestParam(defaultValue = "1") Long restauranteId) {
        return ResponseEntity.ok(productoUseCase.getTodosProductos(restauranteId));
    }
}
