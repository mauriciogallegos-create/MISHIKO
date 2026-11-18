package com.mishiko.application.usecase;

import com.mishiko.domain.model.Mesa;
import com.mishiko.domain.model.Restaurante;
import com.mishiko.infrastructure.adapter.in.web.BadRequestException;
import com.mishiko.infrastructure.adapter.in.web.ResourceNotFoundException;
import com.mishiko.infrastructure.adapter.in.web.dto.MesaResponse;
import com.mishiko.infrastructure.adapter.out.persistence.MesaRepository;
import com.mishiko.infrastructure.adapter.out.persistence.PedidoRepository;
import com.mishiko.infrastructure.adapter.out.persistence.RestauranteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MesaUseCase {

    private final MesaRepository mesaRepository;
    private final RestauranteRepository restauranteRepository;
    private final PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public List<MesaResponse> getMesasByRestaurante(Long restauranteId) {
        return mesaRepository.findByRestauranteIdOrderByNumeroAsc(restauranteId)
                .stream()
                .map(this::toMesaResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MesaResponse getMesaById(Long id) {
        Mesa mesa = mesaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa", id));
        return toMesaResponse(mesa);
    }

    @Transactional
    public MesaResponse crearMesa(Map<String, Object> body) {
        Long restauranteId = Long.parseLong(body.getOrDefault("restauranteId", "1").toString());
        Integer numero = Integer.parseInt(body.get("numero").toString());
        String descripcion = body.containsKey("descripcion") && body.get("descripcion") != null
                ? body.get("descripcion").toString().trim() : null;
        Integer capacidad = body.containsKey("capacidad") && body.get("capacidad") != null
                ? Integer.parseInt(body.get("capacidad").toString()) : 4;
        Boolean disponible = !body.containsKey("disponible") || Boolean.parseBoolean(body.get("disponible").toString());

        Restaurante restaurante = restauranteRepository.findById(restauranteId)
                .filter(r -> Boolean.TRUE.equals(r.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("Restaurante", restauranteId));

        if (mesaRepository.existsByRestauranteIdAndNumero(restauranteId, numero)) {
            throw new BadRequestException("Ya existe una mesa con el número " + numero);
        }

        Mesa mesa = Mesa.builder()
                .numero(numero)
                .descripcion(descripcion)
                .capacidad(capacidad)
                .disponible(disponible)
                .codigoQr("/api/mesas/" + numero + "/qr")
                .restaurante(restaurante)
                .build();

        Mesa saved = mesaRepository.save(mesa);
        log.info("Mesa creada: Mesa #{} (id: {})", saved.getNumero(), saved.getId());
        return toMesaResponse(saved);
    }

    @Transactional
    public MesaResponse actualizarMesa(Long id, Map<String, Object> body) {
        Mesa mesa = mesaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa", id));

        if (body.containsKey("numero")) {
            Integer nuevoNumero = Integer.parseInt(body.get("numero").toString());
            if (mesaRepository.existsByRestauranteIdAndNumeroAndIdNot(
                    mesa.getRestaurante().getId(), nuevoNumero, id)) {
                throw new BadRequestException("Ya existe otra mesa con el número " + nuevoNumero);
            }
            mesa.setNumero(nuevoNumero);
        }

        if (body.containsKey("descripcion")) {
            mesa.setDescripcion(body.get("descripcion") != null
                    ? body.get("descripcion").toString().trim() : null);
        }

        if (body.containsKey("capacidad")) {
            mesa.setCapacidad(Integer.parseInt(body.get("capacidad").toString()));
        }

        if (body.containsKey("disponible")) {
            mesa.setDisponible(Boolean.parseBoolean(body.get("disponible").toString()));
        }

        Mesa saved = mesaRepository.save(mesa);
        return toMesaResponse(saved);
    }

    @Transactional
    public MesaResponse toggleDisponibilidad(Long id) {
        Mesa mesa = mesaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa", id));
        mesa.setDisponible(!Boolean.TRUE.equals(mesa.getDisponible()));
        return toMesaResponse(mesaRepository.save(mesa));
    }

    @Transactional
    public void eliminarMesa(Long id) {
        if (!mesaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Mesa", id);
        }
        if (pedidoRepository.existsByMesaId(id)) {
            throw new BadRequestException("No se puede eliminar la mesa porque tiene pedidos registrados. Puedes marcarla como 'No disponible'.");
        }
        mesaRepository.deleteById(id);
        log.info("Mesa eliminada id: {}", id);
    }

    public MesaResponse toMesaResponse(Mesa m) {
        return MesaResponse.builder()
                .id(m.getId())
                .numero(m.getNumero())
                .descripcion(m.getDescripcion())
                .capacidad(m.getCapacidad())
                .disponible(m.getDisponible())
                .qrUrl("/mesas/" + m.getId() + "/qr")
                .restauranteId(m.getRestaurante() != null ? m.getRestaurante().getId() : null)
                .restauranteNombre(m.getRestaurante() != null ? m.getRestaurante().getNombre() : null)
                .build();
    }
}
