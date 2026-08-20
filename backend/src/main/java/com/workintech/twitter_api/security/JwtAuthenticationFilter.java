package com.workintech.twitter_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// Her gelen request'te JWT'yi kontrol eder.
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Request'teki Authorization header'ını al.
        String authHeader = request.getHeader("Authorization");

        // JWT gönderilmemişse request'i devam ettir.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // "Bearer " kısmını çıkar.
        String token = authHeader.substring(7);

        try {

            // JWT'nin içinden username'i çıkar.
            String username = jwtService.extractUsername(token);

            // Username ile DB'den kullanıcıyı bul.
            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            // Kullanıcı için Authentication nesnesi oluştur.
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            // Kullanıcıyı Spring Security'ye tanıt.
            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

        } catch (Exception e) {

            // JWT geçersizse authentication oluşturma.
            // Request yine filter zincirinde devam eder.
        }

        // Request'i devam ettir.
        filterChain.doFilter(request, response);
    }
}