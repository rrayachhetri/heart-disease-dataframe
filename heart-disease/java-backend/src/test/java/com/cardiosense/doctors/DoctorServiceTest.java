package com.cardiosense.doctors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.cardiosense.auth.User;
import com.cardiosense.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class DoctorServiceTest {
    private UserRepository users;
    private MongoTemplate mongo;
    private DoctorService service;
    private User doctor;
    private User patient;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        mongo = mock(MongoTemplate.class);
        service = new DoctorService(users, mongo);
        DoctorProfile profile = new DoctorProfile("doc", "Alex", "Smith", null, "Cardiology", null, null,
                75, List.of("Blue Cross"), false, true, 0);
        doctor = new User("u1", "doctor@example.com", "hash", "doctor", true, true,
                "Alex", "Smith", Instant.now(), profile);
        patient = new User("u2", "patient@example.com", "hash", "patient", true, true,
                "Pat", "Smith", Instant.now(), null);
    }

    @Test
    void roleAndInsuranceAreEnforced() {
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.profile(patient)).getStatusCode());
        when(users.findByDoctorId("doc")).thenReturn(Optional.of(doctor));
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.book(patient, "doc", "slot", "Aetna")).getStatusCode());
        assertEquals("Blue Cross", service.insurance("doc", "blue-cross").matchedPlan());
        verifyNoInteractions(mongo);
    }

    @Test
    void bookedSlotUsesAtomicConditionalUpdate() {
        when(users.findByDoctorId("doc")).thenReturn(Optional.of(doctor));
        Instant start = Instant.now().plusSeconds(3600);
        when(mongo.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
                eq(AppointmentSlot.class))).thenAnswer(invocation -> {
                    Update update = invocation.getArgument(1);
                    AppointmentSlot.Booking booking = (AppointmentSlot.Booking) ((org.bson.Document)
                            update.getUpdateObject().get("$set")).get("booking");
                    return new AppointmentSlot("slot", "doc", start, start.plusSeconds(1800), booking);
                });
        var result = service.book(patient, "doc", "slot", " Blue Cross ");
        assertEquals("confirmed", result.status());
        assertEquals("Blue Cross", result.insurancePlan());
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).findAndModify(query.capture(), any(Update.class),
                any(FindAndModifyOptions.class), eq(AppointmentSlot.class));
        assertNull(query.getValue().getQueryObject().get("booking"));
        assertTrue(query.getValue().getQueryObject().containsKey("booking"));
    }

    @Test
    void losingConcurrentBookingReturnsConflict() {
        when(users.findByDoctorId("doc")).thenReturn(Optional.of(doctor));
        when(mongo.exists(any(Query.class), eq(AppointmentSlot.class))).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.book(patient, "doc", "slot", "Blue Cross"));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void bookedSlotCannotBeDeleted() {
        when(mongo.exists(any(Query.class), eq(AppointmentSlot.class))).thenReturn(true);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.deleteSlot(doctor, "slot")).getStatusCode());
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).findAndRemove(query.capture(), eq(AppointmentSlot.class));
        assertTrue(query.getValue().getQueryObject().containsKey("booking"));
        assertNull(query.getValue().getQueryObject().get("booking"));
    }

    @Test
    void rejectsInvalidProfileValuesAndPastSlots() throws Exception {
        var body = new ObjectMapper().readTree("{\"npi_number\":\"123\"}");
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, assertThrows(ResponseStatusException.class,
                () -> service.updateProfile(doctor, body)).getStatusCode());
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, assertThrows(ResponseStatusException.class,
                () -> service.createSlot(doctor, Instant.now().minusSeconds(10), Instant.now().plusSeconds(60)))
                .getStatusCode());
        verifyNoInteractions(mongo);
    }
}
