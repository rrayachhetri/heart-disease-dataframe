package com.cardiosense.doctors;

import com.cardiosense.auth.User;
import com.cardiosense.auth.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DoctorService {
    private final UserRepository users;
    private final MongoTemplate mongo;

    public DoctorService(UserRepository users, MongoTemplate mongo) {
        this.users = users;
        this.mongo = mongo;
    }

    public record DoctorResponse(String id, String userId, String firstName, String lastName,
            String npiNumber, String specialty, String bio, String phone, double consultationFee,
            List<String> acceptedInsurance, boolean isNpiVerified, boolean isAcceptingPatients, double rating) {
        static DoctorResponse of(User user) {
            DoctorProfile d = user.doctor();
            return new DoctorResponse(d.id(), user.id(), d.firstName(), d.lastName(), d.npiNumber(),
                    d.specialty(), d.bio(), d.phone(), d.consultationFee(), d.acceptedInsurance(),
                    d.npiVerified(), d.acceptingPatients(), d.rating());
        }
    }

    public record InsuranceResponse(String doctorId, String insurance, boolean inNetwork,
            String matchedPlan, String verificationSource, String note) {
    }

    public record SlotResponse(String id, String doctorId, Instant startsAt, Instant endsAt) {
        static SlotResponse of(AppointmentSlot slot) {
            return new SlotResponse(slot.id(), slot.doctorId(), slot.startsAt(), slot.endsAt());
        }
    }

    public record BookingResponse(String id, String doctorId, String slotId, Instant startsAt,
            Instant endsAt, String insurancePlan, String status) {
        static BookingResponse of(AppointmentSlot slot) {
            return new BookingResponse(slot.booking().id(), slot.doctorId(), slot.id(), slot.startsAt(),
                    slot.endsAt(), slot.booking().insurancePlan(), slot.booking().status());
        }
    }

    public DoctorResponse profile(User user) {
        return DoctorResponse.of(requireDoctor(user));
    }

    public DoctorResponse updateProfile(User user, JsonNode body) {
        requireDoctor(user);
        if (!body.isObject()) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "Expected an object");
        }
        Update update = new Update();
        boolean changed = false;
        Iterator<Map.Entry<String, JsonNode>> fields = body.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String name = entry.getKey();
            JsonNode value = entry.getValue();
            switch (name) {
                case "first_name", "last_name" -> {
                    if (!value.isTextual() || value.asText().isBlank()) {
                        throw error(HttpStatus.UNPROCESSABLE_ENTITY, name + " is required");
                    }
                    String field = "first_name".equals(name) ? "firstName" : "lastName";
                    update.set("doctor." + field, value.asText()).set(field, value.asText());
                    changed = true;
                }
                case "npi_number", "specialty", "bio", "phone" -> {
                    if (!value.isNull() && !value.isTextual()) {
                        throw error(HttpStatus.UNPROCESSABLE_ENTITY, name + " must be a string or null");
                    }
                    String text = value.isNull() ? null : value.asText();
                    String field = "npi_number".equals(name) ? "npiNumber" : name;
                    if ("npi_number".equals(name)) {
                        if (text != null && !text.isEmpty() && !text.matches("[0-9]{10}")) {
                            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "NPI must contain exactly 10 digits");
                        }
                        update.set("doctor.npiVerified", text != null && !text.isEmpty());
                    }
                    update.set("doctor." + field, text);
                    changed = true;
                }
                case "consultation_fee" -> {
                    if (!value.isNumber() || !Double.isFinite(value.doubleValue())) {
                        throw error(HttpStatus.UNPROCESSABLE_ENTITY, "consultation_fee must be a number");
                    }
                    update.set("doctor.consultationFee", value.doubleValue());
                    changed = true;
                }
                case "accepted_insurance" -> {
                    if (!value.isArray()) {
                        throw error(HttpStatus.UNPROCESSABLE_ENTITY, "accepted_insurance must be an array");
                    }
                    List<String> plans = new ArrayList<>();
                    for (JsonNode plan : value) {
                        if (!plan.isTextual()) {
                            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "Insurance plans must be strings");
                        }
                        plans.add(plan.asText());
                    }
                    update.set("doctor.acceptedInsurance", plans);
                    changed = true;
                }
                case "is_accepting_patients" -> {
                    if (!value.isBoolean()) {
                        throw error(HttpStatus.UNPROCESSABLE_ENTITY, "is_accepting_patients must be a boolean");
                    }
                    update.set("doctor.acceptingPatients", value.booleanValue());
                    changed = true;
                }
                default -> { }
            }
        }
        if (!changed) {
            return DoctorResponse.of(user);
        }
        User updated = mongo.findAndModify(Query.query(Criteria.where("_id").is(user.id())
                        .and("role").is("doctor").and("doctor").ne(null)),
                update, FindAndModifyOptions.options().returnNew(true), User.class);
        if (updated == null) {
            throw error(HttpStatus.NOT_FOUND, "Doctor profile not found");
        }
        return DoctorResponse.of(updated);
    }

    public DoctorResponse getDoctor(String id) {
        return DoctorResponse.of(findDoctor(id));
    }

    public List<DoctorResponse> list(String specialty, String insurance, boolean acceptingOnly) {
        return users.findByRoleAndDoctorIsNotNull("doctor").stream()
                .filter(u -> u.doctor() != null)
                .filter(u -> !acceptingOnly || u.doctor().acceptingPatients())
                .filter(u -> specialty == null || (u.doctor().specialty() != null
                        && u.doctor().specialty().toLowerCase(Locale.ROOT).contains(specialty.toLowerCase(Locale.ROOT))))
                .filter(u -> insurance == null || matchingPlan(insurance, u.doctor().acceptedInsurance()) != null)
                .map(DoctorResponse::of).toList();
    }

    public InsuranceResponse insurance(String doctorId, String insurance) {
        if (insurance == null || insurance.isBlank()) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "insurance is required");
        }
        DoctorProfile doctor = findDoctor(doctorId).doctor();
        return insuranceResponse(doctorId, insurance, doctor.acceptedInsurance());
    }

    InsuranceResponse insurance(DoctorResponse doctor, String insurance) {
        return insuranceResponse(doctor.id(), insurance, doctor.acceptedInsurance());
    }

    private InsuranceResponse insuranceResponse(String doctorId, String insurance, List<String> acceptedPlans) {
        if (insurance == null || insurance.isBlank()) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "insurance is required");
        }
        String match = matchingPlan(insurance, acceptedPlans);
        return new InsuranceResponse(doctorId, insurance, match != null, match, "doctor_declared_network",
                match != null ? "Matched against the insurance plans declared in the doctor profile."
                        : "No exact declared-plan match was found; confirm coverage with the payer before booking.");
    }

    public List<SlotResponse> mySlots(User user) {
        String doctorId = requireDoctor(user).doctor().id();
        return mongo.find(Query.query(Criteria.where("doctorId").is(doctorId))
                .with(Sort.by("startsAt")), AppointmentSlot.class).stream().map(SlotResponse::of).toList();
    }

    public SlotResponse createSlot(User user, Instant startsAt, Instant endsAt) {
        String doctorId = requireDoctor(user).doctor().id();
        if (startsAt == null || endsAt == null || !startsAt.isBefore(endsAt)) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "ends_at must be after starts_at");
        }
        if (!startsAt.isAfter(Instant.now())) {
            throw error(HttpStatus.UNPROCESSABLE_ENTITY, "Appointment slots must be in the future");
        }
        AppointmentSlot slot = new AppointmentSlot(UUID.randomUUID().toString(), doctorId, startsAt, endsAt, null);
        try {
            return SlotResponse.of(mongo.insert(slot));
        } catch (DuplicateKeyException ex) {
            throw error(HttpStatus.CONFLICT, "A slot already exists at this start time");
        }
    }

    public void deleteSlot(User user, String slotId) {
        String doctorId = requireDoctor(user).doctor().id();
        Query available = Query.query(Criteria.where("_id").is(slotId).and("doctorId").is(doctorId)
                .and("booking").is(null));
        AppointmentSlot removed = mongo.findAndRemove(available, AppointmentSlot.class);
        if (removed == null) {
            boolean exists = mongo.exists(Query.query(Criteria.where("_id").is(slotId)
                    .and("doctorId").is(doctorId)), AppointmentSlot.class);
            throw error(exists ? HttpStatus.CONFLICT : HttpStatus.NOT_FOUND,
                    exists ? "Booked appointment slots cannot be deleted" : "Appointment slot not found");
        }
    }

    public List<SlotResponse> availableSlots(String doctorId) {
        Query query = Query.query(Criteria.where("doctorId").is(doctorId)
                .and("startsAt").gt(Instant.now()).and("booking").is(null)).with(Sort.by("startsAt"));
        return mongo.find(query, AppointmentSlot.class).stream().map(SlotResponse::of).toList();
    }

    public BookingResponse book(User patient, String doctorId, String slotId, String insurance) {
        if (!"patient".equals(patient.role())) {
            throw error(HttpStatus.FORBIDDEN, "Only patients can book appointments");
        }
        DoctorProfile doctor = findDoctor(doctorId).doctor();
        if (!doctor.acceptingPatients()) {
            throw error(HttpStatus.NOT_FOUND, "Accepting doctor not found");
        }
        if (insurance == null || matchingPlan(insurance, doctor.acceptedInsurance()) == null) {
            throw error(HttpStatus.FORBIDDEN, "This doctor is not in network for the selected insurance");
        }
        Instant now = Instant.now();
        Query query = Query.query(Criteria.where("_id").is(slotId).and("doctorId").is(doctorId)
                .and("startsAt").gt(now).and("booking").is(null));
        AppointmentSlot.Booking booking = new AppointmentSlot.Booking(
                UUID.randomUUID().toString(), patient.id(), insurance.strip(), "confirmed", now);
        AppointmentSlot booked = mongo.findAndModify(query, new Update().set("booking", booking),
                FindAndModifyOptions.options().returnNew(true), AppointmentSlot.class);
        if (booked == null) {
            boolean exists = mongo.exists(Query.query(Criteria.where("_id").is(slotId)
                    .and("doctorId").is(doctorId).and("startsAt").gt(now)), AppointmentSlot.class);
            throw error(exists ? HttpStatus.CONFLICT : HttpStatus.NOT_FOUND,
                    exists ? "This appointment slot is no longer available" : "Appointment slot not found");
        }
        return BookingResponse.of(booked);
    }

    private User requireDoctor(User user) {
        if (!"doctor".equals(user.role())) {
            throw error(HttpStatus.FORBIDDEN, "Only doctors can access this endpoint");
        }
        if (user.doctor() == null) {
            throw error(HttpStatus.NOT_FOUND, "Doctor profile not found");
        }
        return user;
    }

    private User findDoctor(String id) {
        return users.findByDoctorId(id)
                .filter(user -> user.doctor() != null)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    static String matchingPlan(String requested, List<String> plans) {
        String normalized = normalize(requested);
        if (normalized.isEmpty()) {
            return null;
        }
        return plans.stream().filter(plan -> normalize(plan).equals(normalized)).findFirst().orElse(null);
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}
