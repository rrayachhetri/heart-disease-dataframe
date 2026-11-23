package com.cardiosense.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/me")
                        .permitAll()
                        .requestMatchers("/api/doctors", "/api/doctors/**").permitAll()
                        .requestMatchers("/api/analytics/datasets", "/api/analytics/population-benchmark").permitAll()
                        .requestMatchers("/graphql").permitAll()
                        .anyRequest().denyAll())
                .build();
    }
}
