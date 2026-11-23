package com.cardiosense.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceTest {
    private UserRepository users;
    private PasswordHasher passwords;
    private TokenService tokens;
    private AuthService auth;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        passwords = new PasswordHasher();
        tokens = new TokenService("a-test-secret-key-at-least-32-bytes-long", 30, 7);
        auth = new AuthService(users, passwords, tokens);
    }

    @Test
    void registerAndLoginUseStoredHashAndReturnTokens() {
        when(users.findByEmail("person@example.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        User user = auth.register(new AuthController.RegisterRequest(
                "person@example.com", "StrongPass123", "patient", "Pat", "Smith"));
        assertNotEquals("StrongPass123", user.hashedPassword());
        when(users.findByEmail(user.email())).thenReturn(Optional.of(user));
        when(users.findById(user.id())).thenReturn(Optional.of(user));
        var result = auth.login(user.email(), "StrongPass123");
        assertEquals(user.id(), auth.userForToken(result.accessToken(), "access").id());
        assertEquals(user.id(), tokens.userId(result.refreshToken(), "refresh"));
        assertEquals(user.id(), tokens.userId(auth.refresh(result.refreshToken()).accessToken(), "access"));
    }

    @Test
    void duplicateEmailRaceIsReported() {
        when(users.findByEmail("person@example.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenThrow(new DuplicateKeyException("duplicate"));
        var ex = assertThrows(ResponseStatusException.class, () -> auth.register(
                new AuthController.RegisterRequest("person@example.com", "StrongPass123", "patient", "Pat", "Smith")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void registeringDoctorCreatesProfileInSameUserDocument() {
        when(users.findByEmail("doctor@example.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        User user = auth.register(new AuthController.RegisterRequest(
                "doctor@example.com", "StrongPass123", "doctor", "Alex", "Smith"));
        assertNotNull(user.doctor());
        assertNotNull(user.doctor().id());
        assertEquals("Alex", user.doctor().firstName());
        assertTrue(user.doctor().acceptingPatients());
    }

    @Test
    void invalidCredentialsAndWrongTokenTypeAreRejected() {
        User user = new User("123", "person@example.com", passwords.hash("StrongPass123"), "patient",
                true, true, "Pat", "Smith", Instant.now(), null);
        when(users.findByEmail(user.email())).thenReturn(Optional.of(user));
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> auth.login(user.email(), "wrong-password")).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> auth.userForToken(tokens.refresh(user), "access")).getStatusCode());
    }

    @Test
    void inactiveUserCannotUseExistingToken() {
        User user = new User("123", "person@example.com", "unused", "patient",
                false, true, "Pat", "Smith", Instant.now(), null);
        when(users.findById(user.id())).thenReturn(Optional.of(user));
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> auth.userForToken(tokens.access(user), "access")).getStatusCode());
    }

    @Test
    void acceptsBearerSchemeCaseInsensitively() {
        User user = new User("123", "person@example.com", "unused", "patient",
                true, true, "Pat", "Smith", Instant.now(), null);
        when(users.findById(user.id())).thenReturn(Optional.of(user));

        assertEquals(user.id(), auth.currentUser("bEaReR " + tokens.access(user)).id());
    }

    @Test
    void acceptsPythonBcryptPrehashAndHs256Token() {
        String pythonHash = "$2b$10$cDi.p2380N6b4sjEdr0rR.oTuIQUQGrR2ZxqxkiHxnBWq2tdU3elC";
        String pythonJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
                + "eyJzdWIiOiJleGFtcGxlLXVzZXIiLCJyb2xlIjoicGF0aWVudCIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjQxMDI0NDQ4MDB9."
                + "zk1psaKFw1_B8vvyg7GhRwOneAi4DZsKmvemc7c4ZWc";
        assertTrue(passwords.matches("ExamplePass123", pythonHash));
        assertFalse(passwords.matches("wrong-password", pythonHash));
        assertEquals("example-user", tokens.userId(pythonJwt, "access"));
    }
}
