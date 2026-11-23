package com.cardiosense.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final SecretKey key;
    private final Duration accessLifetime;
    private final Duration refreshLifetime;

    public TokenService(@Value("${cardiosense.jwt.secret}") String secret,
                        @Value("${cardiosense.jwt.access-minutes}") long accessMinutes,
                        @Value("${cardiosense.jwt.refresh-days}") long refreshDays) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("SECRET_KEY must be at least 32 bytes");
        }
        if (accessMinutes <= 0 || refreshDays <= 0) {
            throw new IllegalArgumentException("Token lifetimes must be positive");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessLifetime = Duration.ofMinutes(accessMinutes);
        this.refreshLifetime = Duration.ofDays(refreshDays);
    }

    public String access(User user) {
        return token(user, "access", accessLifetime);
    }

    public String refresh(User user) {
        return token(user, "refresh", refreshLifetime);
    }

    private String token(User user, String type, Duration lifetime) {
        var builder = Jwts.builder().subject(user.id()).claim("type", type)
                .expiration(Date.from(Instant.now().plus(lifetime)));
        if ("access".equals(type)) {
            builder.claim("role", user.role());
        }
        return builder.signWith(key, Jwts.SIG.HS256).compact();
    }

    public String userId(String token, String expectedType) {
        try {
            var parsed = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            Claims claims = parsed.getPayload();
            if (!"HS256".equals(parsed.getHeader().getAlgorithm())
                    || !expectedType.equals(claims.get("type", String.class))
                    || claims.getSubject() == null || claims.getSubject().isBlank()
                    || claims.getExpiration() == null) {
                throw new InvalidTokenException();
            }
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException(ex);
        }
    }

    public static class InvalidTokenException extends RuntimeException {
        InvalidTokenException() {
        }

        InvalidTokenException(Throwable cause) {
            super(cause);
        }
    }
}
