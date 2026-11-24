package com.cardiosense.doctors;

import java.util.List;
import java.util.UUID;

public record DoctorProfile(
        String id,
        String firstName,
        String lastName,
        String npiNumber,
        String specialty,
        String bio,
        String phone,
        double consultationFee,
        List<String> acceptedInsurance,
        boolean npiVerified,
        boolean acceptingPatients,
        double rating) {

    public static DoctorProfile create(String firstName, String lastName) {
        return new DoctorProfile(UUID.randomUUID().toString(), firstName, lastName, null,
                null, null, null, 75.0, List.of(), false, true, 0.0);
    }
}
