package com.cardiosense.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final ModelServiceClient model;

    public AnalyticsController(ModelServiceClient model) {
        this.model = model;
    }

    public record Features(@NotNull Double age, @NotNull Double sex, @NotNull Double cp,
                           @NotNull Double trestbps, @NotNull Double chol, @NotNull Double fbs,
                           @NotNull Double restecg, @NotNull Double thalach, @NotNull Double exang,
                           @NotNull Double oldpeak, @NotNull Double slope, @NotNull Double ca,
                           @NotNull Double thal) {
    }

    @GetMapping("/datasets")
    public JsonNode datasets() {
        return model.datasets();
    }

    @PostMapping("/population-benchmark")
    public JsonNode benchmark(@Valid @RequestBody Features features) {
        return model.benchmark(features);
    }
}
