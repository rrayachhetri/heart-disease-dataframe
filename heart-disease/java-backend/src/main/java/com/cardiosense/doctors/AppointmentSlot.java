package com.cardiosense.doctors;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("appointment_slots")
@CompoundIndex(name = "doctor_start_unique", def = "{'doctorId': 1, 'startsAt': 1}", unique = true)
public record AppointmentSlot(
        @Id String id,
        String doctorId,
        Instant startsAt,
        Instant endsAt,
        Booking booking) {

    public record Booking(String id, String patientId, String insurancePlan, String status, Instant createdAt) {
    }
}
