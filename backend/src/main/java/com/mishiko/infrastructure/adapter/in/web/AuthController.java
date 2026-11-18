package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.application.usecase.AuthUseCase;
import com.mishiko.domain.model.Usuario;
import com.mishiko.infrastructure.adapter.in.web.dto.AuthRequest;
import com.mishiko.infrastructure.adapter.in.web.dto.AuthResponse;
import com.mishiko.infrastructure.adapter.in.web.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthUseCase authUseCase;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authUseCase.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authUseCase.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autenticado"));
        }
        Usuario usuario = authUseCase.getUsuarioByEmail(auth.getName());
        return ResponseEntity.ok(Map.of(
            "id", usuario.getId(),
            "nombre", usuario.getNombre(),
            "apellido", usuario.getApellido() != null ? usuario.getApellido() : "",
            "email", usuario.getEmail(),
            "rol", usuario.getRol().getNombre().name(),
            "activo", usuario.getActivo()
        ));
    }
}
