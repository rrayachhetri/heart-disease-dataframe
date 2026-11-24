package com.cardiosense.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.client.RestClient;

@EnabledIfEnvironmentVariable(named = "RUN_MODEL_INTEGRATION", matches = "true")
class ModelServiceIntegrationTest {
    @Test
    void readsDatasetsAndBenchmarksFromLocalPythonService() {
        var client = new ModelServiceClient(new ModelClientConfig()
                .modelRestClient(RestClient.builder(), "http://127.0.0.1:8080"));
        assertFalse(client.datasets().path("datasets").isEmpty());
        var features = new AnalyticsController.Features(55.0, 1.0, 2.0, 120.0, 220.0, 0.0, 1.0,
                150.0, 0.0, 1.0, 1.0, 0.0, 2.0);
        assertEquals(13, client.benchmark(features).path("feature_percentiles").size());
    }
}
