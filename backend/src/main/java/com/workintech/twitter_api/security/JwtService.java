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

    // Değişmeyen kullanıcı ID'si ve oturum sürümü.
    public String generateToken(Long userId, long tokenVersion) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "access-v2")
                .claim("tokenVersion", tokenVersion)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey())
                .compact();
    }

    public record TokenIdentity(Long userId, long tokenVersion) { }

    public TokenIdentity extractIdentity(String token) {

        var claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long version = claims.get("tokenVersion", Long.class);
        if (!"access-v2".equals(claims.get("type")) || version == null || version < 0
                || claims.getExpiration() == null) {
            throw new io.jsonwebtoken.JwtException("Invalid access token");
        }
        Long userId = Long.valueOf(claims.getSubject());
        if (userId <= 0) throw new io.jsonwebtoken.JwtException("Invalid user ID");
        return new TokenIdentity(userId, version);
    }
}
