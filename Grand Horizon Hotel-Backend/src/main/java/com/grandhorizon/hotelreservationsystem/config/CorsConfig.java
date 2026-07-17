package com.grandhorizon.hotelreservationsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Global CORS policy for the React (Vite) frontend running on localhost.
 * This is registered as a {@link CorsConfigurationSource} bean and wired
 * into {@link SecurityConfig}'s {@code .cors(...)} call rather than left as
 * a plain {@code WebMvcConfigurer} bean or scattered {@code @CrossOrigin}
 * annotations - Spring Security's authentication filters run ahead of
 * Spring MVC's own CORS handling, so without this the security filter
 * chain would reject the browser's preflight {@code OPTIONS} request (or
 * the real request's missing {@code Access-Control-Allow-Origin} header)
 * before it ever reached a controller, regardless of any
 * {@code @CrossOrigin} annotation present there.
 * <p>
 * Origin patterns (not a fixed origin list) are used deliberately: Vite
 * falls back to 5174, 5175, etc. whenever port 5173 is already taken by
 * another dev server process, and a hardcoded single origin would then
 * have every request rejected with a 403 that browsers surface as an
 * opaque network failure rather than a readable CORS error.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        // Lets the frontend's invoice-download code read the filename Spring
        // sets on Content-Disposition - browsers hide non-"safe" response
        // headers from fetch()/XHR unless explicitly exposed here.
        configuration.setExposedHeaders(List.of("Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
