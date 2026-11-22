package com.mishiko.infrastructure.config;

import com.mishiko.infrastructure.security.JwtAuthenticationFilter;
import com.mishiko.infrastructure.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig::disable))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/auth/**", "/api/auth/**", "/h2-console/**", "/api/h2-console/**", "/mascota/**", "/api/mascota/**", "/michi/**", "/api/michi/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/*.html", "/*/*.html", "/css/**", "/js/**", "/assets/**", "/uploads/**", "/src/**",
                        "/api/*.html", "/api/*/*.html", "/api/css/**", "/api/js/**", "/api/assets/**", "/api/uploads/**", "/api/src/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/menu/**", "/api/menu/**", "/mesas", "/api/mesas", "/mesas/**", "/api/mesas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/productos/**", "/api/productos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/categorias/**", "/api/categorias/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/pedidos", "/api/pedidos").permitAll()
                .requestMatchers(HttpMethod.GET, "/pedidos/numero/**", "/api/pedidos/numero/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/pedidos/{id}", "/api/pedidos/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/comprobantes/**", "/api/comprobantes/**").permitAll()
                // Swagger UI
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                // Rutas de administración
                .requestMatchers("/admin/**", "/api/admin/**").hasAnyRole("ADMIN")
                // Rutas de cocina
                .requestMatchers("/cocina/**", "/api/cocina/**").hasAnyRole("COCINA", "ADMIN")
                // Actualización de estado de pedido
                .requestMatchers(HttpMethod.PUT, "/pedidos/*/estado", "/api/pedidos/*/estado").hasAnyRole("PERSONAL", "COCINA", "ADMIN")
                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
