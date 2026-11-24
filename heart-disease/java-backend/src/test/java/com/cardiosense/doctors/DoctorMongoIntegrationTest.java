package com.cardiosense.doctors;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@EnabledIfEnvironmentVariable(named = "RUN_MONGO_INTEGRATION", matches = "true")
class DoctorMongoIntegrationTest {
    private static final String DATABASE = "cardiosense_it_" + UUID.randomUUID().toString().replace("-", "");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired MongoTemplate mongo;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", () -> "mongodb://127.0.0.1:27017/" + DATABASE);
        registry.add("cardiosense.jwt.secret", () -> "integration-test-secret-32-characters-long");
    }

    @AfterAll
    void cleanUp() {
        assertEquals(DATABASE, mongo.getDb().getName());
        mongo.getDb().drop();
    }

    @Test
    void registeredDoctorCanPublishSlotAndOnlyOnePatientBooksIt() throws Exception {
        String doctorToken = registerAndLogin("doctor@example.com", "doctor");
        String patientOne = registerAndLogin("patient1@example.com", "patient");
        String patientTwo = registerAndLogin("patient2@example.com", "patient");

        JsonNode profile = json(mvc.perform(put("/api/doctors/me")
                        .header("Authorization", "Bearer " + doctorToken).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"specialty\":\"Cardiology\",\"accepted_insurance\":[\"Blue Cross\"]}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String doctorId = profile.path("id").asText();
        assertFalse(doctorId.isBlank());
        String graphqlRequest = mapper.writeValueAsString(java.util.Map.of(
                "query", "query($id: ID!) { doctor(id: $id) { id firstName isAcceptingPatients } }",
                "variables", java.util.Map.of("id", doctorId)));
        mvc.perform(post("/graphql").contentType(MediaType.APPLICATION_JSON).content(graphqlRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.doctor.id").value(doctorId))
                .andExpect(jsonPath("$.data.doctor.firstName").value("Test"))
                .andExpect(jsonPath("$.data.doctor.isAcceptingPatients").value(true))
                .andExpect(jsonPath("$.errors").doesNotExist());

        Instant start = Instant.now().plusSeconds(86400).truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        String slotPayload = "{\"starts_at\":\"" + start + "\",\"ends_at\":\"" + start.plusSeconds(1800) + "\"}";
        JsonNode slot = json(mvc.perform(post("/api/doctors/me/slots")
                        .header("Authorization", "Bearer " + doctorToken).contentType(MediaType.APPLICATION_JSON)
                        .content(slotPayload))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String slotId = slot.path("id").asText();
        String slotsQuery = mapper.writeValueAsString(java.util.Map.of(
                "query", "query($id: ID!) { availableSlots(doctorId: $id) { id startsAt endsAt } "
                        + "doctors(insurance: \"Blue Cross\") { id } }",
                "variables", java.util.Map.of("id", doctorId)));
        mvc.perform(post("/graphql").contentType(MediaType.APPLICATION_JSON).content(slotsQuery))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableSlots[0].id").value(slotId))
                .andExpect(jsonPath("$.data.availableSlots[0].startsAt").value(start.toString()))
                .andExpect(jsonPath("$.data.doctors[0].id").value(doctorId))
                .andExpect(jsonPath("$.errors").doesNotExist());
        mvc.perform(post("/api/doctors/me/slots").header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON).content(slotPayload))
                .andExpect(status().isConflict());
        List<Document> indexes = mongo.getCollection("appointment_slots").listIndexes().into(new java.util.ArrayList<>());
        assertTrue(indexes.stream().anyMatch(index -> "doctor_start_unique".equals(index.getString("name"))
                && Boolean.TRUE.equals(index.getBoolean("unique"))));

        CountDownLatch gate = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> first = executor.submit(() -> book(gate, doctorId, slotId, patientOne));
            Future<Integer> second = executor.submit(() -> book(gate, doctorId, slotId, patientTwo));
            gate.countDown();
            assertEquals(List.of(201, 409), java.util.stream.Stream.of(first.get(), second.get()).sorted().toList());
        } finally {
            executor.shutdownNow();
        }
        mvc.perform(get("/api/doctors/{doctorId}/slots", doctorId))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(delete("/api/doctors/me/slots/{slotId}", slotId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isConflict());
    }

    private int book(CountDownLatch gate, String doctorId, String slotId, String token) throws Exception {
        gate.await();
        return mvc.perform(post("/api/doctors/{doctorId}/bookings", doctorId)
                        .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot_id\":\"" + slotId + "\",\"insurance\":\"Blue Cross\"}"))
                .andReturn().getResponse().getStatus();
    }

    private String registerAndLogin(String email, String role) throws Exception {
        String payload = "{\"email\":\"" + email + "\",\"password\":\"StrongPass123\","
                + "\"role\":\"" + role + "\",\"first_name\":\"Test\",\"last_name\":\"User\"}";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated());
        return json(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString())
                .path("access_token").asText();
    }

    private JsonNode json(String body) throws Exception {
        return mapper.readTree(body);
    }
}
