package com.mishiko.application.usecase;

import com.mishiko.domain.model.Rol;
import com.mishiko.domain.model.RolNombre;
import com.mishiko.domain.model.Usuario;
import com.mishiko.infrastructure.adapter.in.web.BadRequestException;
import com.mishiko.infrastructure.adapter.in.web.dto.AuthRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.AuthResponse;
import com.mishiko.infrastructure.adapter.in.web.dto.RegisterRequest;
import com.mishiko.infrastructure.adapter.out.persistence.RolRepository;
import com.mishiko.infrastructure.adapter.out.persistence.UsuarioRepository;
import com.mishiko.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthUseCase {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Ya existe un usuario con el email: " + request.getEmail());
        }

        Rol rolCliente = rolRepository.findByNombre(RolNombre.CLIENTE)
                .orElseThrow(() -> new RuntimeException("Rol CLIENTE no encontrado. Inicialice la base de datos."));

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .rol(rolCliente)
                .activo(true)
                .build();

        usuarioRepository.save(usuario);
        log.info("Usuario registrado con email: {}", request.getEmail());

        String token = jwtTokenProvider.generateTokenFromEmail(
                usuario.getEmail(),
                List.of("ROLE_" + rolCliente.getNombre().name())
        );

        return buildAuthResponse(token, usuario);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtTokenProvider.generateToken(authentication);

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        log.info("Login exitoso para: {}", request.getEmail());
        return buildAuthResponse(token, usuario);
    }

    @Transactional(readOnly = true)
    public Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private AuthResponse buildAuthResponse(String token, Usuario usuario) {
        return AuthResponse.builder()
                .token(token)
                .tipo("Bearer")
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .rol(usuario.getRol().getNombre().name())
                .build();
    }
}
