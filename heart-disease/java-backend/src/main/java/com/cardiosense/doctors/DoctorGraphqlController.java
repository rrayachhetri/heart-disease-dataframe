package com.cardiosense.doctors;

import java.util.List;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class DoctorGraphqlController {
    private final DoctorService doctors;

    public DoctorGraphqlController(DoctorService doctors) {
        this.doctors = doctors;
    }

    @QueryMapping
    public List<DoctorService.DoctorResponse> doctors(@Argument String specialty, @Argument String insurance,
                                                       @Argument Boolean acceptingOnly) {
        return doctors.list(specialty, insurance, acceptingOnly == null || acceptingOnly);
    }

    @QueryMapping
    public DoctorService.DoctorResponse doctor(@Argument String id) {
        return doctors.getDoctor(id);
    }

    @QueryMapping
    public List<DoctorService.SlotResponse> availableSlots(@Argument String doctorId) {
        return doctors.availableSlots(doctorId);
    }
}
