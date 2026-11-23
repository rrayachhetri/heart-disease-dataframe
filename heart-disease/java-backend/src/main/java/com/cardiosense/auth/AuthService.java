package com.cardiosense.auth;

import com.cardiosense.doctors.DoctorProfile;
import java.time.Instant;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordHasher passwords;
    private final TokenService tokens;

    public AuthService(UserRepository users, PasswordHasher passwords, TokenService tokens) {
        this.users = users;
        this.passwords = passwords;
        this.tokens = tokens;
    }

    public User register(AuthController.RegisterRequest request) {
        if (users.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }
        User user = new User(UUID.randomUUID().toString(), request.email(), passwords.hash(request.password()),
                request.role(), true, true, request.firstName(), request.lastName(), Instant.now(),
                "doctor".equals(request.role()) ? DoctorProfile.create(request.firstName(), request.lastName()) : null);
        try {
            return users.save(user);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered", ex);
        }
    }

    public AuthController.TokenResponse login(String email, String password) {
        User user = users.findByEmail(email)
                .filter(found -> passwords.matches(password, found.hashedPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!user.active()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account disabled");
        }
        return pair(user);
    }

    public AuthController.TokenResponse refresh(String refreshToken) {
        return pair(userForToken(refreshToken, "refresh"));
    }

    public User userForToken(String token, String type) {
        try {
            String id = tokens.userId(token, type);
            return users.findById(id).filter(User::active)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found or inactive"));
        } catch (TokenService.InvalidTokenException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token", ex);
        }
    }

    public User currentUser(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                || authorization.length() <= 7) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return userForToken(authorization.substring(7), "access");
    }

    private AuthController.TokenResponse pair(User user) {
        return new AuthController.TokenResponse(tokens.access(user), tokens.refresh(user), "bearer");
    }
}
