package com.cardiosense.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.servlet.DispatcherType;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;

    @Test
    void registerAcceptsSnakeCaseAndReturnsExpectedUserShape() throws Exception {
        when(auth.register(any())).thenReturn(new User("123", "person@example.com", "private-hash",
                "patient", true, true, "Pat", "Smith", Instant.now(), null));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"person@example.com","password":"StrongPass123","role":"patient",
                                 "first_name":"Pat","last_name":"Smith"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.first_name").value("Pat"))
                .andExpect(jsonPath("$.is_active").value(true))
                .andExpect(jsonPath("$.is_verified").value(true))
                .andExpect(jsonPath("$.hashed_password").doesNotExist());
    }

    @Test
    void invalidRegistrationAndMissingBearerAreRejected() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"))
                .when(auth).currentUser(null);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"bad","password":"short","role":"admin","first_name":"A","last_name":"B"}
                                """))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Not authenticated"));
    }

    @Test
    void routesOutsideThisSliceAreNotExposed() throws Exception {
        mvc.perform(get("/api/predictions")).andExpect(status().isForbidden());
    }

    @Test
    void errorDispatchesReachTheErrorHandler() throws Exception {
        mvc.perform(get("/unsupported").with(request -> {
                    request.setDispatcherType(DispatcherType.ERROR);
                    return request;
                }))
                .andExpect(status().isNotFound());
    }
}
