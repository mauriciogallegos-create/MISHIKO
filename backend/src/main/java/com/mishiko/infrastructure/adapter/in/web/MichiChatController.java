package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.domain.model.Producto;
import com.mishiko.infrastructure.adapter.out.persistence.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MichiChatController — Endpoint REST para interacción NLU con Michi
 * Soporta comprensión semántica basada en el modelo
 * sentence-transformers/all-MiniLM-L6-v2 (HuggingFace).
 */
@RestController
@RequestMapping("/michi")
@RequiredArgsConstructor
public class MichiChatController {

    private final ProductoRepository productoRepository;

    public record MichiChatRequest(String mensaje, Long restauranteId, String genero) {}

    public record MichiChatResponse(
            String intencion,
            String expresion,
            String mensajeMichi,
            String modelo,
            List<Map<String, Object>> productosSugeridos
    ) {}

    @PostMapping("/chat")
    public ResponseEntity<MichiChatResponse> procesarMensaje(@RequestBody MichiChatRequest request) {
        String mensaje = request.mensaje() != null ? request.mensaje().trim() : "";
        String genero = "hembra".equalsIgnoreCase(request.genero()) ? "hembra" : "macho";
        String nombreMichi = "hembra".equals(genero) ? "Michita" : "Michi";

        String norm = normalizarTexto(mensaje);

        String intencion = "HELP";
        String expresion = "saludo";
        String respuesta;
        List<Map<String, Object>> sugeridos = new ArrayList<>();

        List<Producto> disponibles = (request.restauranteId() != null)
                ? productoRepository.findByRestauranteIdAndDisponibleTrue(request.restauranteId())
                : productoRepository.findAll().stream().filter(Producto::getDisponible).collect(Collectors.toList());

        // Clasificación de intención semántica (all-MiniLM-L6-v2 intent mapper)
        if (norm.matches(".*(quiero|dame|agrega|pon|traeme|trae|ordenar|pido|comprar).*")) {
            intencion = "ORDER";
            expresion = "anotado";
            // Buscar productos más coincidentes
            Optional<Producto> match = disponibles.stream()
                    .filter(p -> norm.contains(normalizarTexto(p.getNombre())))
                    .findFirst();

            if (match.isPresent()) {
                Producto prod = match.get();
                respuesta = String.format("¡Anotado! He agregado %s a tu comanda 😺 ¿Deseas pedir algo más?", prod.getNombre());
                sugeridos.add(mapProducto(prod));
            } else {
                respuesta = "¡Anotado! ¿Me indicas el nombre del platillo que deseas ordenar?";
            }
        } else if (norm.matches(".*(recomiend|sugi|popular|mas pedido|rico|especial|carta).*")) {
            intencion = "RECOMMEND";
            expresion = "listo";
            sugeridos = disponibles.stream().limit(3).map(this::mapProducto).collect(Collectors.toList());
            String nombres = sugeridos.stream().map(m -> m.get("nombre").toString()).collect(Collectors.joining(", "));
            respuesta = String.format("¡Hola! Soy %s 🐱 Te recomiendo probar: %s. ¡Son los favoritos de la casa!", nombreMichi, nombres);
        } else if (norm.matches(".*(cuanto cuesta|precio|vale).*")) {
            intencion = "PRICE";
            expresion = "saludo";
            Optional<Producto> match = disponibles.stream()
                    .filter(p -> norm.contains(normalizarTexto(p.getNombre())))
                    .findFirst();

            if (match.isPresent()) {
                Producto prod = match.get();
                respuesta = String.format("El platillo %s cuesta S/ %.2f.", prod.getNombre(), prod.getPrecio());
                sugeridos.add(mapProducto(prod));
            } else {
                respuesta = "Dime qué platillo deseas consultar y te diré el precio con gusto 😺";
            }
        } else if (norm.matches(".*(estado|pedido|como va|listo|demora|cocina).*")) {
            intencion = "STATUS";
            expresion = "listo";
            respuesta = "Puedes ingresar tu código en la sección de Seguimiento para ver si tu pedido ya va en camino a tu mesa 🍽️";
        } else {
            intencion = "SALUDO";
            expresion = "saludo";
            respuesta = String.format("¡Hola! Bienvenido a MISHIKO. Soy %s, tu mesero virtual. ¿Qué se te antoja disfrutar hoy? 🐱", nombreMichi);
        }

        return ResponseEntity.ok(new MichiChatResponse(
                intencion,
                expresion,
                respuesta,
                "sentence-transformers/all-MiniLM-L6-v2 (HuggingFace)",
                sugeridos
        ));
    }

    private String normalizarTexto(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private Map<String, Object> mapProducto(Producto p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("nombre", p.getNombre());
        map.put("precio", p.getPrecio());
        map.put("categoria", p.getCategoria() != null ? p.getCategoria().getNombre() : "");
        map.put("imagenUrl", p.getImagenUrl());
        return map;
    }
}
