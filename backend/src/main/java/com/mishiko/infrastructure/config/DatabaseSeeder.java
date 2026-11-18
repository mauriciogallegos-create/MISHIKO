package com.mishiko.infrastructure.config;

import com.mishiko.domain.model.*;
import com.mishiko.infrastructure.adapter.out.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final RestauranteRepository restauranteRepository;
    private final MesaRepository mesaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasMascotaRepository preferenciasMascotaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Verificando datos iniciales del sistema (H2 Database)...");

        // 1. Roles
        Rol rolAdmin = obtenerOCrearRol(RolNombre.ADMIN, "Administrador del sistema");
        Rol rolPersonal = obtenerOCrearRol(RolNombre.PERSONAL, "Personal de atención");
        Rol rolCocina = obtenerOCrearRol(RolNombre.COCINA, "Personal de cocina");
        Rol rolCliente = obtenerOCrearRol(RolNombre.CLIENTE, "Cliente del restaurante");

        // 2. Restaurante
        Restaurante restaurante = restauranteRepository.findById(1L).orElseGet(() -> {
            Restaurante r = Restaurante.builder()
                    .nombre("MISHIKO")
                    .descripcion("Restaurante tradicional y fusión con atención inteligente")
                    .direccion("Av. La Marina 1234, San Miguel, Lima")
                    .telefono("+51 987 654 321")
                    .email("contacto@mishiko.pe")
                    .logoUrl("assets/logo.png")
                    .activo(true)
                    .build();
            return restauranteRepository.save(r);
        });

        // 3. Usuarios
        if (usuarioRepository.findByEmail("admin@mishiko.com").isEmpty()) {
            Usuario admin = Usuario.builder()
                    .nombre("Admin")
                    .apellido("MISHIKO")
                    .email("admin@mishiko.com")
                    .password(passwordEncoder.encode("admin123"))
                    .telefono("+51 999 000 001")
                    .activo(true)
                    .rol(rolAdmin)
                    .restaurante(restaurante)
                    .build();
            Usuario adminGuardado = usuarioRepository.save(admin);

            PreferenciasMascota pref = PreferenciasMascota.builder()
                    .nombreMascota("Michi")
                    .colorPelaje("naranja")
                    .vozSeleccionada(null)
                    .volumen(new BigDecimal("0.9"))
                    .vozActiva(true)
                    .mostrarMascota(true)
                    .usuario(adminGuardado)
                    .build();
            preferenciasMascotaRepository.save(pref);
            log.info("Usuario administrador creado: admin@mishiko.com / admin123");
        }

        if (usuarioRepository.findByEmail("mesero@mishiko.com").isEmpty()) {
            Usuario mesero = Usuario.builder()
                    .nombre("Carlos")
                    .apellido("Mesero")
                    .email("mesero@mishiko.com")
                    .password(passwordEncoder.encode("admin123"))
                    .telefono("+51 999 000 002")
                    .activo(true)
                    .rol(rolPersonal)
                    .restaurante(restaurante)
                    .build();
            usuarioRepository.save(mesero);
        }

        if (usuarioRepository.findByEmail("cocina@mishiko.com").isEmpty()) {
            Usuario cocinero = Usuario.builder()
                    .nombre("Pedro")
                    .apellido("Chef")
                    .email("cocina@mishiko.com")
                    .password(passwordEncoder.encode("admin123"))
                    .telefono("+51 999 000 003")
                    .activo(true)
                    .rol(rolCocina)
                    .restaurante(restaurante)
                    .build();
            usuarioRepository.save(cocinero);
        }

        // 4. Mesas
        if (mesaRepository.count() == 0) {
            mesaRepository.saveAll(List.of(
                    Mesa.builder().numero(1).descripcion("Salón Principal - Ventana").capacidad(4).disponible(true).restaurante(restaurante).build(),
                    Mesa.builder().numero(2).descripcion("Salón Principal - Centro").capacidad(2).disponible(true).restaurante(restaurante).build(),
                    Mesa.builder().numero(3).descripcion("Terraza").capacidad(6).disponible(true).restaurante(restaurante).build(),
                    Mesa.builder().numero(4).descripcion("Zona VIP").capacidad(4).disponible(true).restaurante(restaurante).build()
            ));
            log.info("4 mesas registradas.");
        }

        // 5. Categorías
        if (categoriaRepository.count() == 0) {
            Categoria catEntradas = categoriaRepository.save(Categoria.builder()
                    .nombre("Entradas")
                    .descripcion("Aperitivos y entradas peruanas tradicionales")
                    .ordenDisplay(1)
                    .activa(true)
                    .restaurante(restaurante)
                    .build());

            Categoria catFondos = categoriaRepository.save(Categoria.builder()
                    .nombre("Platos Principales")
                    .descripcion("Platos de fondo con el auténtico sabor peruano")
                    .ordenDisplay(2)
                    .activa(true)
                    .restaurante(restaurante)
                    .build());

            Categoria catBebidas = categoriaRepository.save(Categoria.builder()
                    .nombre("Bebidas")
                    .descripcion("Refrescos naturales, cócteles y bebidas frías")
                    .ordenDisplay(3)
                    .activa(true)
                    .restaurante(restaurante)
                    .build());

            Categoria catPostres = categoriaRepository.save(Categoria.builder()
                    .nombre("Postres")
                    .descripcion("Postres típicos y dulces artesanales")
                    .ordenDisplay(4)
                    .activa(true)
                    .restaurante(restaurante)
                    .build());

            // 6. Productos
            productoRepository.saveAll(List.of(
                    // Entradas
                    Producto.builder().nombre("Ceviche Clásico").descripcion("Pescado fresco del día marinado en zumo de limón, cebolla morada, ají limo, camote y choclo.").precio(new BigDecimal("28.00")).disponible(true).tiempoPreparacion(15).ordenDisplay(1).categoria(catEntradas).restaurante(restaurante).build(),
                    Producto.builder().nombre("Causa Limeña de Pollo").descripcion("Suave masa de papa amarilla sazonada con ají amarillo y limón, rellena de pechuga de pollo deshilachada y palta.").precio(new BigDecimal("18.00")).disponible(true).tiempoPreparacion(10).ordenDisplay(2).categoria(catEntradas).restaurante(restaurante).build(),
                    Producto.builder().nombre("Papa a la Huancaína").descripcion("Rodajas de papa sancochada bañadas en crema de queso fresco y ají amarillo, acompañadas de huevo duro y aceituna.").precio(new BigDecimal("15.00")).disponible(true).tiempoPreparacion(10).ordenDisplay(3).categoria(catEntradas).restaurante(restaurante).build(),

                    // Fondos
                    Producto.builder().nombre("Lomo Saltado").descripcion("Tiras de lomo fino salteadas al wok con cebolla, tomate y ají amarillo, servidas con papas fritas crocantes y arroz con choclo.").precio(new BigDecimal("38.00")).disponible(true).tiempoPreparacion(20).ordenDisplay(1).categoria(catFondos).restaurante(restaurante).build(),
                    Producto.builder().nombre("Ají de Gallina").descripcion("Pechuga de pollo deshilachada en una crema untuosa de ají amarillo, nueces y leche, servida sobre papas y arroz.").precio(new BigDecimal("26.00")).disponible(true).tiempoPreparacion(15).ordenDisplay(2).categoria(catFondos).restaurante(restaurante).build(),
                    Producto.builder().nombre("Arroz con Mariscos").descripcion("Arroz criollo cocido en caldo concentrado de mariscos con calamares, langostinos, pulpo y conchas de abanico.").precio(new BigDecimal("35.00")).disponible(true).tiempoPreparacion(20).ordenDisplay(3).categoria(catFondos).restaurante(restaurante).build(),
                    Producto.builder().nombre("Seco de Res con Frijoles").descripcion("Carne de res tierna macerada en chicha de jora y culantro, acompañada de frijoles canarios y arroz blanco.").precio(new BigDecimal("32.00")).disponible(true).tiempoPreparacion(25).ordenDisplay(4).categoria(catFondos).restaurante(restaurante).build(),

                    // Bebidas
                    Producto.builder().nombre("Chicha Morada Clásica (1L)").descripcion("Bebida tradicional elaborada con maíz morado hervido con piña, manzana, canela y clavo de olor, con toque de limón.").precio(new BigDecimal("12.00")).disponible(true).tiempoPreparacion(5).ordenDisplay(1).categoria(catBebidas).restaurante(restaurante).build(),
                    Producto.builder().nombre("Limonada Frozen").descripcion("Refrescante limonada batida a punto de nieve con hielo picado.").precio(new BigDecimal("10.00")).disponible(true).tiempoPreparacion(5).ordenDisplay(2).categoria(catBebidas).restaurante(restaurante).build(),
                    Producto.builder().nombre("Pisco Sour Clásico").descripcion("Cóctel emblemático a base de pisco quebranta, zumo de limón recién exprimido, jarabe de goma y clara de huevo.").precio(new BigDecimal("22.00")).disponible(true).tiempoPreparacion(5).ordenDisplay(3).categoria(catBebidas).restaurante(restaurante).build(),

                    // Postres
                    Producto.builder().nombre("Suspiro a la Limeña").descripcion("Tradicional manjar blanco de yemas cubierto con merengue al oporto y espolvoreado con canela molida.").precio(new BigDecimal("14.00")).disponible(true).tiempoPreparacion(5).ordenDisplay(1).categoria(catPostres).restaurante(restaurante).build(),
                    Producto.builder().nombre("Combinado Criollo").descripcion("La combinación perfecta de Mazamorra Morada tradicional y Arroz con Leche cremoso.").precio(new BigDecimal("12.00")).disponible(true).tiempoPreparacion(5).ordenDisplay(2).categoria(catPostres).restaurante(restaurante).build()
            ));
            log.info("12 productos iniciales registrados.");
        }

        log.info("Datos iniciales verificados con éxito en la base de datos.");
    }

    private Rol obtenerOCrearRol(RolNombre nombre, String descripcion) {
        return rolRepository.findByNombre(nombre).orElseGet(() ->
                rolRepository.save(Rol.builder().nombre(nombre).descripcion(descripcion).build())
        );
    }
}
