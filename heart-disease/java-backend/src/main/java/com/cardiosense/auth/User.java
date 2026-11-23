package com.cardiosense.auth;

import com.cardiosense.doctors.DoctorProfile;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public record User(
        @Id String id,
        @Indexed(unique = true) String email,
        String hashedPassword,
        String role,
        boolean active,
        boolean verified,
        String firstName,
        String lastName,
        Instant createdAt,
        DoctorProfile doctor) {
}
