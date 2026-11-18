package com.mishiko.application.usecase;

import com.mishiko.domain.model.Categoria;
import com.mishiko.domain.model.Producto;
import com.mishiko.domain.model.Restaurante;
import com.mishiko.infrastructure.adapter.in.web.BadRequestException;
import com.mishiko.infrastructure.adapter.in.web.ResourceNotFoundException;
import com.mishiko.infrastructure.adapter.in.web.dto.CategoriaResponse;
import com.mishiko.infrastructure.adapter.in.web.dto.ProductoResponse;
import com.mishiko.infrastructure.adapter.out.persistence.CategoriaRepository;
import com.mishiko.infrastructure.adapter.out.persistence.ProductoRepository;
import com.mishiko.infrastructure.adapter.out.persistence.RestauranteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoUseCase {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final RestauranteRepository restauranteRepository;

    @Transactional(readOnly = true)
    public List<ProductoResponse> getProductosByRestaurante(Long restauranteId) {
        return productoRepository.findByRestauranteIdAndDisponibleTrue(restauranteId)
                .stream()
                .map(this::toProductoResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductoResponse getProductoById(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
        return toProductoResponse(producto);
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> buscarProductos(Long restauranteId, String nombre) {
        return productoRepository
                .findByRestauranteIdAndNombreContainingIgnoreCase(restauranteId, nombre)
                .stream()
                .map(this::toProductoResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> getCategoriasByRestaurante(Long restauranteId) {
        return categoriaRepository
                .findByRestauranteIdAndActivaTrueOrderByOrdenDisplayAsc(restauranteId)
                .stream()
                .map(this::toCategoriaResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> getMenuPorCategoria(Long restauranteId) {
        return productoRepository.findByRestauranteIdAndDisponibleTrue(restauranteId)
                .stream()
                .map(this::toProductoResponse)
                .collect(Collectors.toList());
    }

    public ProductoResponse toProductoResponse(Producto p) {
        return ProductoResponse.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .precio(p.getPrecio())
                .imagenUrl(p.getImagenUrl())
                .disponible(p.getDisponible())
                .tiempoPreparacion(p.getTiempoPreparacion())
                .ordenDisplay(p.getOrdenDisplay())
                .alergenos(p.getAlergenos())
                .categoriaId(p.getCategoria() != null ? p.getCategoria().getId() : null)
                .categoriaNombre(p.getCategoria() != null ? p.getCategoria().getNombre() : null)
                .restauranteId(p.getRestaurante() != null ? p.getRestaurante().getId() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }

    public CategoriaResponse toCategoriaResponse(Categoria c) {
        long cantidadProductos = c.getProductos() != null
                ? c.getProductos().stream().filter(p -> Boolean.TRUE.equals(p.getDisponible())).count()
                : 0;
        return CategoriaResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .descripcion(c.getDescripcion())
                .imagenUrl(c.getImagenUrl())
                .activa(c.getActiva())
                .ordenDisplay(c.getOrdenDisplay())
                .restauranteId(c.getRestaurante() != null ? c.getRestaurante().getId() : null)
                .cantidadProductos(cantidadProductos)
                .build();
    }

    // ── Métodos de administración ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProductoResponse> getTodosProductos(Long restauranteId) {
        return productoRepository.findByRestauranteId(restauranteId)
                .stream().map(this::toProductoResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProductoResponse crearProducto(Map<String, Object> body) {
        Long categoriaId   = Long.parseLong(body.get("categoriaId").toString());
        Long restauranteId = Long.parseLong(body.getOrDefault("restauranteId","1").toString());

        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", categoriaId));
        Restaurante restaurante = restauranteRepository.findById(restauranteId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurante", restauranteId));

        Producto p = Producto.builder()
                .nombre(body.get("nombre").toString())
                .descripcion(body.containsKey("descripcion") ? body.get("descripcion").toString() : null)
                .precio(new BigDecimal(body.get("precio").toString()))
                .imagenUrl(body.containsKey("imagenUrl") && body.get("imagenUrl") != null ? body.get("imagenUrl").toString() : null)
                .disponible(body.containsKey("disponible") ? Boolean.parseBoolean(body.get("disponible").toString()) : true)
                .categoria(categoria)
                .restaurante(restaurante)
                .build();

        return toProductoResponse(productoRepository.save(p));
    }

    @Transactional
    public ProductoResponse actualizarProducto(Long id, Map<String, Object> body) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id));

        if (body.containsKey("nombre"))      p.setNombre(body.get("nombre").toString());
        if (body.containsKey("descripcion")) p.setDescripcion(body.get("descripcion").toString());
        if (body.containsKey("precio"))      p.setPrecio(new BigDecimal(body.get("precio").toString()));
        if (body.containsKey("imagenUrl"))   p.setImagenUrl(body.get("imagenUrl") != null ? body.get("imagenUrl").toString() : null);
        if (body.containsKey("disponible"))  p.setDisponible(Boolean.parseBoolean(body.get("disponible").toString()));
        if (body.containsKey("categoriaId")) {
            Long catId = Long.parseLong(body.get("categoriaId").toString());
            p.setCategoria(categoriaRepository.findById(catId)
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría", catId)));
        }

        return toProductoResponse(productoRepository.save(p));
    }

    @Transactional
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) throw new ResourceNotFoundException("Producto", id);
        productoRepository.deleteById(id);
    }
}
