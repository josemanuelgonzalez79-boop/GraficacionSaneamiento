package com.icap.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .cors(Customizer.withDefaults()) // usa el bean corsConfigurationSource()
      .csrf(csrf -> csrf.disable())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
          // permitir preflight CORS
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

          // deja público el login
          .requestMatchers(
              "/api/v1/sanitationGraphics/validateLogin",
              "/api/v1/sanitationGraphics/**",
              "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
              "/error"
          ).permitAll()
          .anyRequest().permitAll()
      )
      .httpBasic(b -> b.disable())
      .formLogin(f -> f.disable());

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    // como allowCredentials=true, especifica orígenes exactos (no "*")
    config.setAllowedOrigins(List.of(
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://192.168.12.30:4200", //personalizar esto
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.12.30:8080"
    ));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Content-Disposition","X-Total-Count"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L); // cachea la respuesta del preflight (en segundos)

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}