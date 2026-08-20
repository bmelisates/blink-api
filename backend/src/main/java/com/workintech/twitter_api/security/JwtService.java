package com.workintech.twitter_api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// JwtService -> JWT oluşturma ve okuma işlemlerini yapar.

@Service
public class JwtService {

    // application.properties içindeki jwt.secret değerini alır.
    @Value("${jwt.secret}")
    private String secretKey;

    // Token süresi (7 gün)
    private static final long EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 gün

    // Secret String'i JWT'nin kullanacağı SecretKey'e çevirir.
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    // Kullanıcının username bilgisini JWT içine koyup imzalı bir token oluşturur.
    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey())
                .compact();
    }

    // JWT'nin içindeki username bilgisini okur.
    public String extractUsername(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}