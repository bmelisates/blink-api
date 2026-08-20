package com.workintech.twitter_api.config;

import com.workintech.twitter_api.security.JwtAuthenticationEntryPoint;
import com.workintech.twitter_api.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// SecurityConfig -> Spring Security ile ilgili ayarları yaptığımız sınıf.
@Configuration // İçindeki Bean'leri Spring container'a ekle demiş oluyoruz.
@EnableWebSecurity // Bu uygulamada Spring Security'nin web güvenliği mekanizmasını kullan.
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    // Gelen HTTP request'leri bir filter zincirinden geçirir
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // "Uygulamamız authentication bilgisini server-side session/cookie tabanlı bir oturum üzerinden değil,
                // JWT üzerinden taşıdığı için bu API tasarımında CSRF korumasını devre dışı bıraktık..
                .csrf(csrf -> csrf.disable())

                // Frontend'in backend'e erişmesine izin veriyoruz.
                .cors(cors -> {
                })

                // Hangi endpoint'lerin authentication gerektirdiğini belirliyoruz.
                .authorizeHttpRequests(auth -> auth

                        // Login ve register herkes tarafından kullanılabilir.
                        .requestMatchers(
                                "/auth/login",
                                "/users/register",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Tweetleri okumak herkes için açık.
                        .requestMatchers(HttpMethod.GET, "/tweets/**").permitAll()

                        // Kullanıcı silme işlemini authentication gerektirir (kendi hesabını silebilir, ADMIN herkesi silebilir).
                        .requestMatchers(HttpMethod.DELETE, "/users/**").authenticated()

                        // Geri kalan bütün requestler authentication gerektirir.
                        .anyRequest().authenticated()
                )

                // Authentication başarısız olduğunda 401 döndür.
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )

                // JWT kullandığımız için session tutmuyoruz.
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Username/password authentication için provider.
                .authenticationProvider(authenticationProvider())

                // JWT filter'ımızı Spring Security filter zincirine ekliyoruz.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    // Şifreleri hashlemek ve doğrulamak için kullanılır.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Spring Security'ye kullanıcıyı nereden bulacağını
    // ve password'ü nasıl kontrol edeceğini söylüyoruz.
    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    // Login sırasında authentication işlemini yöneten nesne.
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {

        return config.getAuthenticationManager();
    }
}