package com.mishiko.infrastructure.adapter.in.web;

import com.mishiko.domain.model.PreferenciasMascota;
import com.mishiko.domain.model.Usuario;
import com.mishiko.infrastructure.adapter.in.web.dto.AuthRequest;
import com.mishiko.infrastructure.adapter.out.persistence.PreferenciasMascotaRepository;
import com.mishiko.infrastructure.adapter.out.persistence.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/mascota")
@RequiredArgsConstructor
public class MascotaController {

    private final PreferenciasMascotaRepository prefRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/preferencias")
    public ResponseEntity<?> getPreferencias() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok(Map.of(
                "nombreMascota", "Michi",
                "colorPelaje", "naranja",
                "vozActiva", true,
                "volumen", 0.9,
                "mostrarMascota", true
            ));
        }
        Usuario usuario = usuarioRepository.findByEmail(auth.getName()).orElse(null);
        if (usuario == null) return ResponseEntity.notFound().build();

        PreferenciasMascota prefs = prefRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> PreferenciasMascota.builder()
                        .usuario(usuario)
                        .nombreMascota("Michi")
                        .colorPelaje("naranja")
                        .vozActiva(true)
                        .volumen(new BigDecimal("0.9"))
                        .mostrarMascota(true)
                        .build());

        return ResponseEntity.ok(Map.of(
            "nombreMascota",  prefs.getNombreMascota(),
            "colorPelaje",    prefs.getColorPelaje(),
            "vozActiva",      prefs.getVozActiva(),
            "volumen",        prefs.getVolumen(),
            "mostrarMascota", prefs.getMostrarMascota()
        ));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<?> guardarPreferencias(@RequestBody Map<String, Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok(Map.of("mensaje", "Preferencias aplicadas localmente"));
        }

        Usuario usuario = usuarioRepository.findByEmail(auth.getName()).orElse(null);
        if (usuario == null) return ResponseEntity.notFound().build();

        PreferenciasMascota prefs = prefRepository.findByUsuarioId(usuario.getId())
                .orElse(PreferenciasMascota.builder().usuario(usuario).build());

        if (body.containsKey("nombreMascota"))  prefs.setNombreMascota(body.get("nombreMascota").toString());
        if (body.containsKey("colorPelaje"))    prefs.setColorPelaje(body.get("colorPelaje").toString());
        if (body.containsKey("vozActiva"))      prefs.setVozActiva(Boolean.parseBoolean(body.get("vozActiva").toString()));
        if (body.containsKey("volumen"))        prefs.setVolumen(new BigDecimal(body.get("volumen").toString()));
        if (body.containsKey("mostrarMascota")) prefs.setMostrarMascota(Boolean.parseBoolean(body.get("mostrarMascota").toString()));

        prefRepository.save(prefs);
        return ResponseEntity.ok(Map.of("mensaje", "Preferencias guardadas correctamente"));
    }
}
