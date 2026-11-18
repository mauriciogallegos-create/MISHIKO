package com.mishiko.application.usecase;

import com.mishiko.domain.model.*;
import com.mishiko.infrastructure.adapter.in.web.BadRequestException;
import com.mishiko.infrastructure.adapter.in.web.ResourceNotFoundException;
import com.mishiko.infrastructure.adapter.in.web.dto.ActualizarEstadoRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.CrearPedidoRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.PedidoResponse;
import com.mishiko.infrastructure.adapter.out.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoUseCase {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final MesaRepository mesaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstadoPedidoRepository estadoPedidoRepository;

    @Transactional
    public PedidoResponse crearPedido(CrearPedidoRequest request) {
        Mesa mesa = mesaRepository.buscarParaCrearPedido(request.getMesaId())
                .orElseThrow(() -> new ResourceNotFoundException("Mesa", request.getMesaId()));

        if (!mesa.getRestaurante().getId().equals(request.getRestauranteId())) {
            throw new BadRequestException("La mesa no está disponible para este restaurante");
        }
        if (request.getSolicitudId() != null) {
            var existente = pedidoRepository.findByMesaIdAndSolicitudId(mesa.getId(), request.getSolicitudId());
            if (existente.isPresent()) {
                return toPedidoResponse(existente.get());
            }
        }
        if (!mesa.getDisponible()) {
            throw new BadRequestException("La mesa no está disponible para este restaurante");
        }

        BigDecimal subtotal = BigDecimal.ZERO;

        Pedido pedido = Pedido.builder()
                .numeroPedido("TMP" + UUID.randomUUID().toString().replace("-", "").substring(0, 17))
                .solicitudId(request.getSolicitudId())
                .estado(EstadoPedidoEnum.PENDIENTE)
                .nombreCliente(request.getNombreCliente())
                .observaciones(request.getObservaciones())
                .mesa(mesa)
                .restaurante(mesa.getRestaurante())
                .build();

        // Procesar items
        for (var item : request.getItems()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", item.getProductoId()));

            if (!producto.getRestaurante().getId().equals(request.getRestauranteId())) {
                throw new BadRequestException("El producto no pertenece al restaurante del pedido");
            }
            if (!producto.getDisponible()) {
                throw new BadRequestException("El producto '" + producto.getNombre() + "' no está disponible");
            }

            BigDecimal itemSubtotal = producto.getPrecio()
                    .multiply(BigDecimal.valueOf(item.getCantidad()))
                    .setScale(2, RoundingMode.HALF_UP);

            DetallePedido detalle = DetallePedido.builder()
                    .producto(producto)
                    .cantidad(item.getCantidad())
                    .precioUnitario(producto.getPrecio())
                    .subtotal(itemSubtotal)
                    .observaciones(item.getObservaciones())
                    .pedido(pedido)
                    .build();

            pedido.getDetalles().add(detalle);
            subtotal = subtotal.add(itemSubtotal);
        }

        BigDecimal igv = subtotal.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(igv).setScale(2, RoundingMode.HALF_UP);

        pedido.setSubtotal(subtotal);
        pedido.setIgv(igv);
        pedido.setTotal(total);

        // Registrar estado inicial
        EstadoPedido estadoInicial = EstadoPedido.builder()
                .estadoNuevo(EstadoPedidoEnum.PENDIENTE)
                .observacion("Pedido creado")
                .pedido(pedido)
                .build();
        pedido.getHistorialEstados().add(estadoInicial);

        Pedido saved = pedidoRepository.save(pedido);
        // El identificador asignado por MySQL evita colisiones entre mesas concurrentes.
        saved.setNumeroPedido("PED-" + Long.toUnsignedString(saved.getId(), 36).toUpperCase(Locale.ROOT));
        log.info("Pedido creado: {} para mesa {}", saved.getNumeroPedido(), mesa.getNumero());
        return toPedidoResponse(saved);
    }

    @Transactional(readOnly = true)
    public PedidoResponse getPedidoById(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
        return toPedidoResponse(pedido);
    }

    @Transactional(readOnly = true)
    public PedidoResponse getPedidoByNumero(String numeroPedido) {
        Pedido pedido = pedidoRepository.findByNumeroPedido(numeroPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con número: " + numeroPedido));
        return toPedidoResponse(pedido);
    }

    @Transactional
    public PedidoResponse actualizarEstado(Long id, ActualizarEstadoRequest request, String emailUsuario) {
        Pedido pedido = pedidoRepository.buscarParaActualizarEstado(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));

        EstadoPedidoEnum nuevoEstado;
        try {
            nuevoEstado = EstadoPedidoEnum.valueOf(request.getEstado().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Estado inválido: " + request.getEstado());
        }

        EstadoPedidoEnum estadoAnterior = pedido.getEstado();
        if (estadoAnterior == nuevoEstado) {
            return toPedidoResponse(pedido);
        }
        if (!estadoAnterior.permiteTransicionA(nuevoEstado)) {
            throw new BadRequestException("El pedido no puede pasar de " + estadoAnterior + " a " + nuevoEstado);
        }
        pedido.setEstado(nuevoEstado);

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElse(null);

        EstadoPedido historial = EstadoPedido.builder()
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(nuevoEstado)
                .observacion(request.getObservacion())
                .pedido(pedido)
                .usuario(usuario)
                .build();
        pedido.getHistorialEstados().add(historial);

        Pedido saved = pedidoRepository.save(pedido);
        log.info("Pedido {} actualizado de {} a {}", pedido.getNumeroPedido(), estadoAnterior, nuevoEstado);
        return toPedidoResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> getPedidosByRestaurante(Long restauranteId) {
        return pedidoRepository.findByRestauranteIdOrderByCreatedAtDesc(restauranteId)
                .stream()
                .map(this::toPedidoResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> getPedidosActivos() {
        List<EstadoPedidoEnum> estadosActivos = Arrays.asList(
                EstadoPedidoEnum.PENDIENTE,
                EstadoPedidoEnum.CONFIRMADO,
                EstadoPedidoEnum.EN_PREPARACION,
                EstadoPedidoEnum.LISTO
        );
        return pedidoRepository.findByEstadoIn(estadosActivos)
                .stream()
                .map(this::toPedidoResponse)
                .collect(Collectors.toList());
    }

    public PedidoResponse toPedidoResponse(Pedido p) {
        List<PedidoResponse.DetallePedidoResponse> detalles = p.getDetalles().stream()
                .map(d -> PedidoResponse.DetallePedidoResponse.builder()
                        .id(d.getId())
                        .productoId(d.getProducto().getId())
                        .productoNombre(d.getProducto().getNombre())
                        .productoImagenUrl(d.getProducto().getImagenUrl())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .observaciones(d.getObservaciones())
                        .build())
                .collect(Collectors.toList());

        return PedidoResponse.builder()
                .id(p.getId())
                .numeroPedido(p.getNumeroPedido())
                .estado(p.getEstado().name())
                .nombreCliente(p.getNombreCliente())
                .observaciones(p.getObservaciones())
                .mesaId(p.getMesa() != null ? p.getMesa().getId() : null)
                .mesaNumero(p.getMesa() != null ? p.getMesa().getNumero() : null)
                .restauranteId(p.getRestaurante() != null ? p.getRestaurante().getId() : null)
                .subtotal(p.getSubtotal())
                .igv(p.getIgv())
                .total(p.getTotal())
                .detalles(detalles)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
