package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.ProductoUseCase;
import com.mishiko.infrastructure.adapter.in.web.dto.CategoriaResponse;
import com.mishiko.infrastructure.adapter.in.web.dto.ProductoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoUseCase productoUseCase;

    // ── Productos ──────────────────────────────────────────────────────────────

    @GetMapping("/productos")
    public ResponseEntity<List<ProductoResponse>> getProductos(
            @RequestParam(defaultValue = "1") Long restauranteId,
            @RequestParam(required = false) String nombre) {
        List<ProductoResponse> productos = (nombre != null && !nombre.isBlank())
                ? productoUseCase.buscarProductos(restauranteId, nombre)
                : productoUseCase.getProductosByRestaurante(restauranteId);
        return ResponseEntity.ok(productos);
    }

    @GetMapping("/productos/{id}")
    public ResponseEntity<ProductoResponse> getProductoById(@PathVariable Long id) {
        return ResponseEntity.ok(productoUseCase.getProductoById(id));
    }

    // ── Categorías ─────────────────────────────────────────────────────────────

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaResponse>> getCategorias(
            @RequestParam(defaultValue = "1") Long restauranteId) {
        return ResponseEntity.ok(productoUseCase.getCategoriasByRestaurante(restauranteId));
    }

    // ── Menú completo (organizado por categoría) ───────────────────────────────

    @GetMapping("/menu")
    public ResponseEntity<Map<String, Object>> getMenu(
            @RequestParam(defaultValue = "1") Long restauranteId,
            @RequestParam(required = false) Integer mesa) {
        List<CategoriaResponse> categorias = productoUseCase.getCategoriasByRestaurante(restauranteId);
        List<ProductoResponse> productos = productoUseCase.getMenuPorCategoria(restauranteId);
        return ResponseEntity.ok(Map.of(
            "restauranteId", restauranteId,
            "mesa", mesa != null ? mesa : 0,
            "categorias", categorias,
            "productos", productos
        ));
    }
}
