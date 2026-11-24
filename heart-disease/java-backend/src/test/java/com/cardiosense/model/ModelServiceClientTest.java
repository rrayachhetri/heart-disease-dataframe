package com.cardiosense.model;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import java.net.URI;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class ModelServiceClientTest {
    @Test
    void forwardsBenchmarkAndReturnsUpstreamPayload() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:8080");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(once(), requestTo(URI.create("http://localhost:8080/api/analytics/population-benchmark")))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("""
                        {"age":55,"sex":1,"cp":2,"trestbps":120,"chol":220,"fbs":0,"restecg":1,
                         "thalach":150,"exang":0,"oldpeak":1,"slope":1,"ca":0,"thal":2}
                        """))
                .andRespond(withSuccess("{\"feature_percentiles\":[]}", MediaType.APPLICATION_JSON));
        var client = new ModelServiceClient(builder.build());
        var features = new AnalyticsController.Features(55.0, 1.0, 2.0, 120.0, 220.0, 0.0, 1.0,
                150.0, 0.0, 1.0, 1.0, 0.0, 2.0);
        assertTrue(client.benchmark(features).path("feature_percentiles").isArray());
        server.verify();
    }

    @Test
    void reportsDownstreamFailureAndInvalidShape() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:8080");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("http://localhost:8080/api/analytics/datasets"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        server.expect(requestTo("http://localhost:8080/api/analytics/datasets"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        var client = new ModelServiceClient(builder.build());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(ResponseStatusException.class, client::datasets).getStatusCode());
        assertEquals(HttpStatus.BAD_GATEWAY,
                assertThrows(ResponseStatusException.class, client::datasets).getStatusCode());
        server.verify();
    }

    @Test
    void refusesNonLocalModelService() {
        var config = new ModelClientConfig();
        assertThrows(IllegalArgumentException.class,
                () -> config.modelRestClient(RestClient.builder(), "http://example.com:8080"));
        assertThrows(IllegalArgumentException.class,
                () -> config.modelRestClient(RestClient.builder(), "http://localhost:8080@evil.example"));
    }
}
