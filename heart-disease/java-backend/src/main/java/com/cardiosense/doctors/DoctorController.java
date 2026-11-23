package com.cardiosense.doctors;

import com.cardiosense.auth.AuthService;
import com.cardiosense.doctors.DoctorService.BookingResponse;
import com.cardiosense.doctors.DoctorService.DoctorResponse;
import com.cardiosense.doctors.DoctorService.InsuranceResponse;
import com.cardiosense.doctors.DoctorService.SlotResponse;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    private final DoctorService doctors;
    private final AuthService auth;

    public DoctorController(DoctorService doctors, AuthService auth) {
        this.doctors = doctors;
        this.auth = auth;
    }

    record SlotCreate(@NotNull Instant startsAt, @NotNull Instant endsAt) { }
    record BookingCreate(@NotBlank String slotId, @NotBlank String insurance) { }
    record Recommendation(@JsonUnwrapped DoctorResponse doctor, InsuranceResponse insuranceMatch) { }

    @GetMapping("/me")
    DoctorResponse profile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return doctors.profile(auth.currentUser(authorization));
    }

    @PutMapping("/me")
    DoctorResponse update(@RequestHeader(value = "Authorization", required = false) String authorization,
                          @RequestBody JsonNode body) {
        return doctors.updateProfile(auth.currentUser(authorization), body);
    }

    @GetMapping("/me/slots")
    List<SlotResponse> mySlots(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return doctors.mySlots(auth.currentUser(authorization));
    }

    @PostMapping("/me/slots")
    ResponseEntity<SlotResponse> createSlot(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody SlotCreate body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(doctors.createSlot(auth.currentUser(authorization), body.startsAt(), body.endsAt()));
    }

    @DeleteMapping("/me/slots/{slotId}")
    ResponseEntity<Void> deleteSlot(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable String slotId) {
        doctors.deleteSlot(auth.currentUser(authorization), slotId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    List<DoctorResponse> list(@RequestParam(required = false) String specialty,
                              @RequestParam(required = false) String insurance,
                              @RequestParam(name = "accepting_only", defaultValue = "true") boolean acceptingOnly) {
        return doctors.list(specialty, insurance, acceptingOnly);
    }

    @GetMapping("/recommendations")
    List<Recommendation> recommendations(@RequestParam String insurance,
                                         @RequestParam(required = false) String specialty) {
        if (insurance.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "insurance is required");
        }
        return doctors.list(specialty, insurance, true).stream()
                .map(doctor -> new Recommendation(doctor, doctors.insurance(doctor.id(), insurance))).toList();
    }

    @GetMapping("/{doctorId}/insurance")
    InsuranceResponse insurance(@PathVariable String doctorId, @RequestParam String insurance) {
        return doctors.insurance(doctorId, insurance);
    }

    @GetMapping("/{doctorId}/slots")
    List<SlotResponse> availableSlots(@PathVariable String doctorId) {
        return doctors.availableSlots(doctorId);
    }

    @PostMapping("/{doctorId}/bookings")
    ResponseEntity<BookingResponse> book(@RequestHeader(value = "Authorization", required = false) String authorization,
                                         @PathVariable String doctorId, @Valid @RequestBody BookingCreate body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(doctors.book(auth.currentUser(authorization), doctorId, body.slotId(), body.insurance()));
    }

    @GetMapping("/{doctorId}")
    DoctorResponse getDoctor(@PathVariable String doctorId) {
        return doctors.getDoctor(doctorId);
    }
}
