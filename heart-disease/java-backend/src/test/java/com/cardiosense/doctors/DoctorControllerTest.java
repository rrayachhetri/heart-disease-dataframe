package com.cardiosense.doctors;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cardiosense.auth.AuthService;
import com.cardiosense.auth.SecurityConfig;
import com.cardiosense.auth.User;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(DoctorController.class)
@Import(SecurityConfig.class)
class DoctorControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean DoctorService doctors;
    @MockitoBean AuthService auth;

    @Test
    void recommendationsPreserveFlatRestResponse() throws Exception {
        var doctor = new DoctorService.DoctorResponse("doc", "user", "Alex", "Smith", null,
                "Cardiology", null, null, 75, List.of("Blue Cross"), false, true, 0);
        var insurance = new DoctorService.InsuranceResponse("doc", "Blue Cross", true,
                "Blue Cross", "doctor_declared_network", "Declared by doctor");
        when(doctors.list("Cardiology", "Blue Cross", true)).thenReturn(List.of(doctor));
        when(doctors.insurance(doctor, "Blue Cross")).thenReturn(insurance);
        mvc.perform(get("/api/doctors/recommendations").param("insurance", "Blue Cross")
                        .param("specialty", "Cardiology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("doc"))
                .andExpect(jsonPath("$[0].is_accepting_patients").value(true))
                .andExpect(jsonPath("$[0].insurance_match.in_network").value(true));
    }

    @Test
    void bookingRequiresAuthentication() throws Exception {
        when(auth.currentUser(null)).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        mvc.perform(post("/api/doctors/doc/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot_id\":\"slot\",\"insurance\":\"Blue Cross\"}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(doctors);
    }

    @Test
    void slotPayloadUsesSnakeCase() throws Exception {
        var doctor = new User("user", "d@example.com", "hash", "doctor", true, true,
                "Alex", "Smith", Instant.now(), DoctorProfile.create("Alex", "Smith"));
        Instant start = Instant.parse("2035-01-01T10:00:00Z");
        when(auth.currentUser("Bearer test")).thenReturn(doctor);
        when(doctors.createSlot(doctor, start, start.plusSeconds(1800)))
                .thenReturn(new DoctorService.SlotResponse("slot", "doc", start, start.plusSeconds(1800)));
        mvc.perform(post("/api/doctors/me/slots").header("Authorization", "Bearer test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"starts_at\":\"2035-01-01T10:00:00Z\",\"ends_at\":\"2035-01-01T10:30:00Z\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doctor_id").value("doc"))
                .andExpect(jsonPath("$.starts_at").value("2035-01-01T10:00:00Z"));
    }
}
