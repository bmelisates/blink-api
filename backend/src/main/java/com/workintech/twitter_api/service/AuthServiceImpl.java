package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.LoginRequest;
import com.workintech.twitter_api.dto.LoginResponse;
import com.workintech.twitter_api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

// Login işlemini gerçekleştirir.
@Service
public class AuthServiceImpl implements AuthService {

    // Username-password doğru mu kontrolü yapar
    private final AuthenticationManager authenticationManager;
    // JWT token oluşturur
    private final JwtService jwtService;
    // Kullanıcı bilgilerini almak için
    private final UserService userService;

    public AuthServiceImpl(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        // Username + password ile authentication isteği oluştur.
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                );

        // Kullanıcı adı ve şifre doğru mu kontrol et. Yanlışsa burada exception oluşur.
        authenticationManager.authenticate(authenticationToken);

        // Authentication başarılıysa JWT oluştur.
        String token = jwtService.generateToken(
                request.getUsername()
        );

        // Kullanıcı ID'sini al
        Long userId = userService.findEntityByUsername(request.getUsername()).getId();

        // Kullanıcı adını al
        String username = request.getUsername();

        // JWT'yi, userId'yi ve username'i response olarak kullanıcıya gönder.
        return new LoginResponse(token, userId, username);
    }
}